import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { AppState } from 'react-native';
import { getBleManager, destroyBleManager } from './bleManagerSingleton';
import { atob } from 'react-native-quick-base64';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const SAVED_DEVICE_KEY = '@ble_saved_device';
const HR_SERVICE_UUID  = '0000180d-0000-1000-8000-00805f9b34fb';
const HR_CHAR_UUID     = '00002a37-0000-1000-8000-00805f9b34fb';
const SCAN_TIMEOUT_MS  = 15_000;
const MAX_HR_BUFFER    = 60;

// ─────────────────────────────────────────────
// HR Characteristic Parser
// ─────────────────────────────────────────────
function parseHRCharacteristic(base64Value) {
  try {
    const raw   = atob(base64Value);
    const bytes = Array.from(raw).map(c => c.charCodeAt(0));
    const flags = bytes[0];
    const is16  = flags & 0x01;
    return is16 ? bytes[1] + (bytes[2] << 8) : bytes[1];
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Wait for BLE to be powered on
// ─────────────────────────────────────────────
function waitForPoweredOn(mgr, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      sub.remove();
      reject(new Error('BLE adapter timeout — Bluetooth may be off'));
    }, timeoutMs);

    const sub = mgr.onStateChange(state => {
      if (state === 'PoweredOn') {
        clearTimeout(timer);
        sub.remove();
        resolve();
      }
    }, true);
  });
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────
const BleContext = createContext(null);

export function BleProvider({ children }) {
  const manager         = useRef(null);
  const deviceRef       = useRef(null);
  const scanTimer       = useRef(null);
  const destroyed       = useRef(false);
  const connectDeviceRef = useRef(null);
  const hrSubscription  = useRef(null);
  const appStateRef     = useRef(AppState.currentState);

  const [state, setState] = useState({
    currentHR:  null,
    hrBuffer:   [],
    deviceName: null,
    connected:  false,
    scanning:   false,
    error:      null,
  });

  const setPartial = useCallback(
    partial => setState(prev => ({ ...prev, ...partial })),
    [],
  );

  // ── 1. Manager Initialization & Auto-Reconnect ────────────────────────────
  useEffect(() => {
    destroyed.current = false;
    manager.current = getBleManager();

    const autoReconnect = async () => {
      try {
        const saved = await AsyncStorage.getItem(SAVED_DEVICE_KEY);
        if (!saved || destroyed.current || !manager.current) return;

        const { id, name } = JSON.parse(saved);
        if (__DEV__) console.log('[BLE] Auto-reconnecting to:', name, id);

        // Wait for BLE adapter ready before connecting
       try {
          await waitForPoweredOn(manager.current);
        } catch (e) {
          console.warn('[BLE] BLE not ready:', e.message);
          return; // ✅ bail out instead of hanging
        }
        if (destroyed.current || !manager.current) return;

        const device = await manager.current.connectToDevice(id, { autoConnect: false });
        if (destroyed.current || !manager.current) {
          device.cancelConnection().catch(() => {});
          return;
        }
        await connectDeviceRef.current(device);
      } catch (e) {
        if (__DEV__) console.log('[BLE] Auto-reconnect failed:', e.message);
      }
    };

    autoReconnect();

    return () => {
      destroyed.current = true;
      clearTimeout(scanTimer.current);
      hrSubscription.current?.remove();
      hrSubscription.current = null;
      try { manager.current?.stopDeviceScan().catch(() => {}); } catch (_) {}
      manager.current = null;
    };
  }, []);

  // ── 2. iOS Permissions ────────────────────────────────────────────────────
  const requestPermissions = useCallback(async () => {
    if (!manager.current) return false;

    // iOS — check BLE adapter state
    // If user denied Bluetooth in Settings → state is 'Unauthorized'
    const bleState = await manager.current.state();
    if (bleState === 'Unauthorized') {
      setPartial({
        error: 'Bluetooth access denied. Enable it in Settings → Privacy → Bluetooth.',
      });
      return false;
    }
    if (bleState === 'PoweredOff') {
      setPartial({
        error: 'Bluetooth is turned off. Please enable it in Settings.',
      });
      return false;
    }
    return true;
  }, [setPartial]);

  // ── 3. Connection Logic ───────────────────────────────────────────────────
  const connectDevice = useCallback(
    async device => {
      const currentManager = manager.current;
      if (destroyed.current || !currentManager) return;
      const isStale = () => manager.current !== currentManager;

      if (__DEV__) console.log('[BLE] Connecting to:', device.name ?? device.id);

      try {
        // Register disconnect listener BEFORE connecting
        device.onDisconnected(err => {
          if (isStale() || destroyed.current) return;
          hrSubscription.current?.remove();
          hrSubscription.current = null;
          deviceRef.current = null;
          setPartial({
            connected:  false,
            deviceName: null,
            currentHR:  null,
            error: err ? `Disconnected: ${err.message}` : 'Device disconnected',
          });
        });

        // Connect
        const connected = await device.connect({ autoConnect: false });
        if (isStale()) { connected.cancelConnection().catch(() => {}); return; }

        // Discover services
        await connected.discoverAllServicesAndCharacteristics();
        if (isStale() || destroyed.current) return;

        deviceRef.current = connected;

        // Persist device for next auto-reconnect
        try {
          await AsyncStorage.setItem(
            SAVED_DEVICE_KEY,
            JSON.stringify({
              id:   device.id,
              name: device.name ?? device.localName ?? 'HR Device',
            }),
          );
        } catch (_) {}

        setPartial({
          connected:  true,
          scanning:   false,
          deviceName: device.name ?? device.localName ?? 'HR Device',
          error:      null,
        });

        // Subscribe to HR notifications
        hrSubscription.current?.remove();
        hrSubscription.current = connected.monitorCharacteristicForService(
          HR_SERVICE_UUID,
          HR_CHAR_UUID,
          (err, characteristic) => {
            if (isStale() || destroyed.current) return;
            if (err) {
              if (
                !err.message?.includes('cancelled') &&
                !err.message?.includes('destroyed')
              ) {
                setPartial({ error: err.message });
              }
              return;
            }
            const hr = parseHRCharacteristic(characteristic.value);
            if (__DEV__) console.log('[BLE] Received HR:', hr);
            if (hr !== null && hr > 20 && hr < 250) {
              setState(prev => ({
                ...prev,
                currentHR: hr,
                hrBuffer: [
                  ...prev.hrBuffer.slice(-(MAX_HR_BUFFER - 1)),
                  hr,
                ],
              }));
            }
          },
        );
      } catch (e) {
        if (isStale() || destroyed.current || e.message?.includes('destroyed')) return;
        setPartial({ scanning: false, error: e.message });
      }
    },
    [setPartial],
  );

  connectDeviceRef.current = connectDevice;

  // ── 4. AppState — handle background/foreground ────────────────────────────
  // iOS keeps BLE alive natively when app is backgrounded
  // No background service needed — just log state changes
  useEffect(() => {
    if (!state.connected) return;

    const subscription = AppState.addEventListener('change', nextAppState => {
      const wasActive = appStateRef.current === 'active';
      const isActive  = nextAppState === 'active';

      if (wasActive && !isActive) {
        // App going to background
        if (__DEV__) console.log('[BLE] App backgrounded — iOS keeps BLE alive natively');
      } else if (!wasActive && isActive) {
        // App coming to foreground
        if (__DEV__) console.log('[BLE] App foregrounded');
      }

      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, [state.connected]);

  // ── 5. Scan ───────────────────────────────────────────────────────────────
  const startScan = useCallback(async () => {
    console.log('Starting BLE scan...');
    if (state.scanning) return;

    if (!manager.current || destroyed.current) {
      destroyed.current = false;
      manager.current = getBleManager();
    }

    const currentManager = manager.current;

    const ok = await requestPermissions();
    if (!ok) return;

    // Wait for BLE adapter ready
    try {
        await waitForPoweredOn(currentManager);
      } catch (e) {
        console.warn('[BLE] BLE not ready:', e.message);
        setPartial({ scanning: false, error: 'Bluetooth is not available. Please enable it.' });
        return;
      }

    if (manager.current !== currentManager || destroyed.current) return;

    setPartial({ scanning: true, error: null });

    try {
      currentManager.startDeviceScan(
        [HR_SERVICE_UUID],
        { allowDuplicates: false },
        async (error, device) => {
          if (!device && !error) return;
          if (manager.current !== currentManager || destroyed.current) return;

          try {
            if (error) {
              if (error.message?.includes('destroyed')) return;
              setPartial({ scanning: false, error: error.message });
              return;
            }

            if (!device) return;
            if (__DEV__) console.log('[BLE] Found HR device:', device.name ?? device.id);

            try { currentManager.stopDeviceScan(); } catch (_) {}
            clearTimeout(scanTimer.current);

            connectDevice(device).catch(err => {
              if (!destroyed.current && manager.current === currentManager) {
                setPartial({ scanning: false, error: err.message });
              }
            });
          } catch (callbackErr) {
            if (
              !callbackErr?.message?.includes('destroyed') &&
              !destroyed.current &&
              manager.current === currentManager
            ) {
              setPartial({ scanning: false, error: callbackErr.message });
            }
          }
        },
      );
    } catch (e) {
      setPartial({ scanning: false, error: e.message });
      return;
    }

    // Auto-stop scan after timeout
    scanTimer.current = setTimeout(() => {
      if (destroyed.current || manager.current !== currentManager) return;
      try { currentManager.stopDeviceScan(); } catch (_) {}
      setPartial({ scanning: false });
    }, SCAN_TIMEOUT_MS);
  }, [connectDevice, requestPermissions, state.scanning, setPartial]);

  // ── 6. Disconnect ─────────────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    clearTimeout(scanTimer.current);

    hrSubscription.current?.remove();
    hrSubscription.current = null;

    // Clear saved device so auto-reconnect doesn't fire next launch
    AsyncStorage.removeItem(SAVED_DEVICE_KEY).catch(() => {});

    if (manager.current) {
      try { await manager.current.stopDeviceScan(); } catch (_) {}
    }
    if (deviceRef.current) {
      try { await deviceRef.current.cancelConnection(); } catch (_) {}
      deviceRef.current = null;
    }

    setPartial({
      connected:  false,
      deviceName: null,
      currentHR:  null,
      scanning:   false,
      error:      null,
    });
  }, [setPartial]);

  return (
    <BleContext.Provider value={{ ...state, startScan, disconnect }}>
      {children}
    </BleContext.Provider>
  );
}

export function useBle() {
  const ctx = useContext(BleContext);
  if (!ctx) throw new Error('useBle must be used inside BleProvider');
  return ctx;
}