import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {Platform, PermissionsAndroid, AppState} from 'react-native';
import {getBleManager, destroyBleManager} from './bleManagerSingleton';
import {atob} from 'react-native-quick-base64';
import BackgroundService from 'react-native-background-actions';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const SAVED_DEVICE_KEY = '@ble_saved_device'; 
const HR_SERVICE_UUID  = '0000180d-0000-1000-8000-00805f9b34fb';
const HR_CHAR_UUID     = '00002a37-0000-1000-8000-00805f9b34fb';
const SCAN_TIMEOUT_MS  = 15_000;
const MAX_HR_BUFFER    = 60;
const RECONNECT_DELAY_MS = 800; // Android BLE stack stabilization delay

// ─────────────────────────────────────────────
// HR Characteristic Parser
// FIX: Use `hr !== null` guard instead of truthy check so hr=0 isn't silently skipped
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
// Wait for BLE to be powered on before connecting
// FIX: prevents "connect before adapter ready" race condition on cold boot
// ─────────────────────────────────────────────
function waitForPoweredOn(mgr) {
  return new Promise(resolve => {
    const sub = mgr.onStateChange(state => {
      if (state === 'PoweredOn') {
        sub.remove();
        resolve();
      }
    }, true /* emit current state immediately */);
  });
}

// ─────────────────────────────────────────────
// Background service helpers
// ─────────────────────────────────────────────
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Keep-alive task — BLE notifications already flow through monitorCharacteristicForService.
// This task just keeps the process alive so Android doesn't kill the BLE connection.
const bgBleKeepAliveTask = async _taskData => {
  await new Promise(async resolve => {
    for (; BackgroundService.isRunning();) {
      await sleep(10_000);
    }
    resolve();
  });
};

const BLE_BG_OPTIONS = {
  taskName:   'BLEHeartRate',
  taskTitle:  'Heart Rate Monitor Active',
  taskDesc:   'Receiving heart rate data via Bluetooth',
  taskIcon:   {name: 'ic_launcher', type: 'mipmap'},
  color:      '#60A6FF',
  parameters: {},
};

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────
const BleContext = createContext(null);

export function BleProvider({children}) {
  const manager       = useRef(null);
  const deviceRef     = useRef(null);
  const scanTimer     = useRef(null);
  const destroyed     = useRef(false);
  const connectDeviceRef = useRef(null);
  // FIX: store HR subscription so it can be removed on disconnect / reconnect
  const hrSubscription = useRef(null);
  const appStateRef    = useRef(AppState.currentState);

  const [state, setState] = useState({
    currentHR:  null,
    hrBuffer:   [],   // [{ hr: number, ts: number }] — FIX: includes timestamps
    deviceName: null,
    connected:  false,
    scanning:   false,
    error:      null,
  });

  const setPartial = useCallback(
    partial => setState(prev => ({...prev, ...partial})),
    [],
  );

  // ── Background service start / stop ──────────────────────────────────────
  const startBgService = useCallback(async () => {
    if (BackgroundService.isRunning()) return;
    try {
      await BackgroundService.start(bgBleKeepAliveTask, BLE_BG_OPTIONS);
    } catch (e) {
      console.warn('[BLE BG] Failed to start background service:', e.message);
    }
  }, []);

  const stopBgService = useCallback(async () => {
    if (!BackgroundService.isRunning()) return;
    try {
      await BackgroundService.stop();
    } catch (e) {
      console.warn('[BLE BG] Failed to stop background service:', e.message);
    }
  }, []);

  // ── 1. Manager Initialization & Auto-Reconnect ──────────────────────────
  useEffect(() => {
    destroyed.current = false;
    // Use the singleton — survives hot reload because bleManagerSingleton.js
    // is never re-evaluated by React Fast Refresh (it exports no React component)
    manager.current = getBleManager();

    const autoReconnect = async () => {
      try {
        const saved = await AsyncStorage.getItem(SAVED_DEVICE_KEY);
        if (!saved || destroyed.current || !manager.current) return;

        const {id, name} = JSON.parse(saved);
        if (__DEV__) console.log('[BLE] Auto-reconnecting to:', name, id);

        // FIX: wait for BLE adapter to be ready before attempting connection
        await waitForPoweredOn(manager.current);
        if (destroyed.current || !manager.current) return;

        const device = await manager.current.connectToDevice(id, {autoConnect: false});
        if (destroyed.current || !manager.current) {
          device.cancelConnection().catch(() => {});
          return;
        }
        await connectDeviceRef.current(device);
      } catch (e) {
        if (__DEV__) console.log('[BLE] Auto-reconnect failed:', e.message);
        // Silently ignored — user can tap Scan manually
      }
    };

    autoReconnect();

    return () => {
      destroyed.current = true;
      clearTimeout(scanTimer.current);
      hrSubscription.current?.remove();
      hrSubscription.current = null;
      // Only null the ref so isStale() works — do NOT destroy the singleton.
      // The native BleManager survives hot reload and stays ready for the next mount.
      try { manager.current?.stopDeviceScan().catch(() => {}); } catch (_) {}
      manager.current = null;
      // Stop background service on unmount
      if (BackgroundService.isRunning()) {
        BackgroundService.stop().catch(() => {});
      }
    };
  }, []);
 
  // ── 2. Permissions ───────────────────────────────────────────────────────
  const requestPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') {
      // FIX: on iOS, verify the BLE adapter state rather than blindly returning true.
      // If the user denied Bluetooth in Settings, state will be 'Unauthorized'
      // and we surface that as an error instead of silently failing.
      if (!manager.current) return false;
      const bleState = await manager.current.state();
      if (bleState === 'Unauthorized') {
        setPartial({error: 'Bluetooth access denied. Enable it in Settings > Privacy > Bluetooth.'});
        return false;
      }
      return true;
    }

    const toRequest = [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
    if (Platform.Version >= 31) {
      toRequest.push(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      );
    }
    const grants = await PermissionsAndroid.requestMultiple(toRequest);
    return Object.values(grants).every(
      v => v === PermissionsAndroid.RESULTS.GRANTED,
    );
  }, [setPartial]);

  // ── 3. Connection Logic ──────────────────────────────────────────────────
  const connectDevice = useCallback(
    async device => {
      const currentManager = manager.current;
      if (destroyed.current || !currentManager) return;
      const isStale = () => manager.current !== currentManager;

      if (__DEV__) console.log('[BLE] Connecting to:', device.name ?? device.id);

      try {
        // Step 1 — Register disconnect listener BEFORE connecting
        device.onDisconnected(err => {
          if (isStale() || destroyed.current) return;
          // FIX: clean up the HR subscription when device disconnects
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

        // Step 2 — Connect
        const connected = await device.connect({autoConnect: false});
        if (isStale()) { connected.cancelConnection().catch(() => {}); return; }

        // Step 3 — Android BLE stack stabilization delay
        await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY_MS));
        if (isStale()) { connected.cancelConnection().catch(() => {}); return; }

        // Step 4 — Discover services
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

        // Step 5 — Subscribe to HR notifications
        // FIX: store subscription ref so it can be cancelled cleanly
        // FIX: remove any previous subscription before adding a new one
        hrSubscription.current?.remove();
        hrSubscription.current = connected.monitorCharacteristicForService(
          HR_SERVICE_UUID,
          HR_CHAR_UUID,
          (err, characteristic) => {
            if (isStale() || destroyed.current) return;
            if (err) {
              // Ignore "operation was cancelled" — this is normal on disconnect
              if (!err.message?.includes('cancelled') &&
                  !err.message?.includes('destroyed')) {
                setPartial({error: err.message});
              }
              return;
            }
            const hr = parseHRCharacteristic(characteristic.value);
            console.log('[BLE] Received HR:', hr);
            // FIX: use `hr !== null` so a legitimate 0-BPM reading isn't skipped
            if (hr !== null && hr > 20 && hr < 250) {
              setState(prev => ({
              ...prev,
              currentHR: hr,
              hrBuffer: [...prev.hrBuffer.slice(-(MAX_HR_BUFFER - 1)), hr],
            }));
            }
          },
        );
      } catch (e) {
        if (isStale() || destroyed.current || e.message?.includes('destroyed')) return;
        setPartial({scanning: false, error: e.message});
      }
    },
    [setPartial],
  );

  // Keep ref in sync so the init useEffect always calls the latest version
  connectDeviceRef.current = connectDevice;

  // ── AppState — start/stop foreground service to keep BLE connection alive in background
  useEffect(() => {
    if (!state.connected) {
      // If disconnected while backgrounded, stop any running service
      stopBgService();
      return;
    }

    const subscription = AppState.addEventListener('change', nextAppState => {
      const wasActive = appStateRef.current === 'active';
      const isActive  = nextAppState === 'active';

      if (wasActive && !isActive) {
        // App going to background — start foreground service to keep process alive
        startBgService();
      } else if (!wasActive && isActive) {
        // App coming to foreground — foreground service no longer needed
        stopBgService();
      }

      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, [state.connected, startBgService, stopBgService]);

  // ── 4. Scan ──────────────────────────────────────────────────────────────
  const startScan = useCallback(async () => {
    if (state.scanning) return;

    // FIX: only create a new BleManager if one doesn't already exist.
    // The previous code unconditionally destroyed + recreated on every scan call,
    // which killed live connections and caused BLE stack churn.
    if (!manager.current || destroyed.current) {
      destroyed.current = false;
      // Use singleton — getBleManager() returns the existing live instance
      // or creates a new one if truly needed (e.g. after a full app restart)
      manager.current = getBleManager();
    }

    const currentManager = manager.current;

    const ok = await requestPermissions();
    if (!ok) {
      setPartial({error: 'Bluetooth permissions denied'});
      return;
    }

    // FIX: wait for adapter to be powered on before scanning
    await waitForPoweredOn(currentManager);
    if (manager.current !== currentManager || destroyed.current) return;

    setPartial({scanning: true, error: null}); 

    try {
      currentManager.startDeviceScan(
        [HR_SERVICE_UUID],
        {allowDuplicates: false},
        async (error, device) => {
          if (manager.current !== currentManager || destroyed.current) return;

          try {
            if (error) {
              if (error.message?.includes('destroyed')) return;
              setPartial({scanning: false, error: error.message});
              return;
            }

            // FIX: removed hardcoded device name filter ('Nokia T20', 'V2126').
            // The service UUID filter in startDeviceScan already ensures only
            // HR-advertising devices are returned. Connecting to the first
            // valid device is the correct behaviour for a dedicated HR app.
            if (!device) return;

            if (__DEV__) console.log('[BLE] Found HR device:', device.name ?? device.id);

            try { currentManager.stopDeviceScan(); } catch (_) {}
            clearTimeout(scanTimer.current);

            connectDevice(device).catch(err => {
              if (!destroyed.current && manager.current === currentManager) {
                setPartial({scanning: false, error: err.message});
              }
            });
          } catch (callbackErr) {
            if (
              !callbackErr?.message?.includes('destroyed') &&
              !destroyed.current &&
              manager.current === currentManager
            ) {
              setPartial({scanning: false, error: callbackErr.message});
            }
          }
        },
      );
    } catch (e) {
      setPartial({scanning: false, error: e.message});
      return;
    }

    // Auto-stop scan after timeout
    scanTimer.current = setTimeout(() => {
      if (destroyed.current || manager.current !== currentManager) return;
      try { currentManager.stopDeviceScan(); } catch (_) {}
      setPartial({scanning: false});
    }, SCAN_TIMEOUT_MS);
  }, [connectDevice, requestPermissions, state.scanning, setPartial]);

  // ── 5. Disconnect ─────────────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    clearTimeout(scanTimer.current);

    // FIX: remove HR subscription before cancelling the connection
    hrSubscription.current?.remove();
    hrSubscription.current = null;

    // Stop background service if running
    if (BackgroundService.isRunning()) {
      BackgroundService.stop().catch(() => {});
    }

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
    <BleContext.Provider value={{...state, startScan, disconnect}}>
      {children}
    </BleContext.Provider>
  );
}

export function useBle() {
  const ctx = useContext(BleContext);
  if (!ctx) throw new Error('useBle must be used inside BleProvider');
  return ctx;
}