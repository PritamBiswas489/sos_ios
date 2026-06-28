import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { AppState } from 'react-native';
import { getBleManager } from './bleManagerSingleton';
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
// Logging helpers
// ─────────────────────────────────────────────
const log = {
  info:    msg => console.log(`ℹ️  [BLE] ${msg}`),
  success: msg => console.log(`✅ [BLE] ${msg}`),
  warn:    msg => console.warn(`⚠️  [BLE] ${msg}`),
  error:   msg => console.error(`❌ [BLE] ${msg}`),
  scan:    msg => console.log(`🔍 [BLE] ${msg}`),
  connect: msg => console.log(`🔗 [BLE] ${msg}`),
  heart:   msg => console.log(`❤️  [BLE] ${msg}`),
  fg:      msg => console.log(`☀️  [BLE][FG] ${msg}`),
  bg:      msg => console.log(`🌙 [BLE][BG] ${msg}`),
  disco:   msg => console.log(`🔌 [BLE] ${msg}`),
  store:   msg => console.log(`💾 [BLE] ${msg}`),
  shield:  msg => console.log(`🛡️  [BLE] ${msg}`),
  stress:  msg => console.log(`🧠 [BLE][STRESS] ${msg}`),
};

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

function waitForPoweredOn(mgr, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      sub.remove();
      reject(new Error('BLE adapter timeout — Bluetooth may be off'));
    }, timeoutMs);
    const sub = mgr.onStateChange(s => {
      if (s === 'PoweredOn') { clearTimeout(timer); sub.remove(); resolve(); }
    }, true);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  MODULE-LEVEL BLE STATE
//
//  Everything here lives completely outside React's lifecycle.
//  Screen changes, navigation, re-renders, hot reload — none of these
//  can touch the BLE connection or HR stream.
//
//  The only things that stop HR readings:
//    • disconnect() — explicit user action
//    • Real hardware disconnect (device off / out of range)
//
//  ⚠️  iOS REQUIREMENT in Info.plist:
//    <key>UIBackgroundModes</key>
//    <array><string>bluetooth-central</string></array>
// ─────────────────────────────────────────────────────────────────────────────
let _manager          = null;
let _device           = null;
let _hrSub            = null;
let _manualDisconnect = false;
let _isActive         = true;

// ── Module-level HR buffer ────────────────────────────────────────────────────
// SOURCE OF TRUTH for HR data — even in background.
// React state (hrBuffer) is a COPY synced when React is alive.
// StressContext reads THIS directly via _onRawHR → stress + SOS work in background.
let _hrBufferModule = []; // plain numbers, max MAX_HR_BUFFER entries

// ── Callbacks ─────────────────────────────────────────────────────────────────
let _onStateChange = null; // → React setState (foreground only)
let _appStateRef   = null; // → component appStateRef
let _onRawHR       = null; // → StressContext callback (foreground + background)

// ─────────────────────────────────────────────
// Module-level helpers
// ─────────────────────────────────────────────
function getManager() {
  if (!_manager) {
    _manager = getBleManager();
    log.info('BLE manager created (module-level singleton)');
  }
  return _manager;
}

function teardownSubscription() {
  if (_hrSub) {
    _hrSub.remove();
    _hrSub = null;
    log.disco('HR subscription removed');
  }
}

// Called by onDisconnected when a REAL hardware disconnect happens
function handleHardwareDisconnect(errMsg) {
  teardownSubscription();
  _device = null;
  log.disco(`Hardware disconnect — ${errMsg || 'device turned off or out of range'}`);
  _onStateChange?.({
    connected:  false,
    deviceName: null,
    currentHR:  null,
    error:      errMsg ? `Lost connection: ${errMsg}` : 'Device disconnected',
  });
}

// ─────────────────────────────────────────────
// connectDevice (module-level, no hooks)
// ─────────────────────────────────────────────
async function connectDevice(device) {
  if (!_isActive || !_manager) return;
  _manualDisconnect = false;

  log.connect(`Connecting to: ${device.name ?? device.id}`);

  // ── onDisconnected ────────────────────────────────────────────────────────
  //
  //  Case A — manualDisconnect = true → suppress (we called cancelConnection)
  //  Case B — library noise keywords → suppress
  //  Case C/D — real hardware event → handleHardwareDisconnect
  //
  // ─────────────────────────────────────────────────────────────────────────
  device.onDisconnected(err => {
    if (_manualDisconnect) {
      log.shield('onDisconnected suppressed — manual disconnect in progress');
      return;
    }
    const msg = err?.message ?? '';
    if (
      msg.includes('cancelled') ||
      msg.includes('destroyed') ||
      msg.includes('Operation was cancelled')
    ) {
      log.shield(`onDisconnected suppressed — library noise: "${msg}"`);
      return;
    }
    handleHardwareDisconnect(msg || null);
  });

  try {
    const connected = await device.connect({ autoConnect: false });
    if (!_isActive) { connected.cancelConnection().catch(() => {}); return; }

    log.connect('Discovering services & characteristics...');
    await connected.discoverAllServicesAndCharacteristics();
    if (!_isActive) return;

    _device = connected;

    try {
      await AsyncStorage.setItem(
        SAVED_DEVICE_KEY,
        JSON.stringify({ id: device.id, name: device.name ?? device.localName ?? 'HR Device' }),
      );
      log.store(`Saved device: ${device.name ?? device.localName ?? 'HR Device'}`);
    } catch (_) {}

    const deviceName = device.name ?? device.localName ?? 'HR Device';
    _onStateChange?.({ connected: true, scanning: false, deviceName, error: null });
    log.success(`Connected ✓  →  ${deviceName}`);

    // ── Subscribe to HR notifications ─────────────────────────────────────
    //
    //  This callback fires on the native CoreBluetooth thread — foreground AND background.
    //  It pushes into:
    //    1. _hrBufferModule  — module-level array, always current (fg + bg)
    //    2. _onRawHR         — StressContext callback, triggers stress + SOS (fg + bg)
    //    3. React setState   — updates UI when React is alive (foreground only)
    //
    // ─────────────────────────────────────────────────────────────────────
    teardownSubscription();
    _hrSub = connected.monitorCharacteristicForService(
      HR_SERVICE_UUID,
      HR_CHAR_UUID,
      (err, characteristic) => {
        if (!_isActive) return;
        if (err) {
          const msg = err.message ?? '';
          if (msg.includes('cancelled') || msg.includes('destroyed')) return;
          log.error(`HR monitor error: ${msg}`);
          _onStateChange?.({ error: msg });
          return;
        }

        const hr = parseHRCharacteristic(characteristic.value);
        if (hr === null || hr <= 20 || hr >= 250) return;

        const isBackground = _appStateRef?.current !== 'active';
        const mode = isBackground ? '🌙 BG' : '☀️ FG';
        log.heart(`HR = ${hr} bpm  [${mode}]`);

        // 1. Update module-level buffer (always, fg + bg)
        _hrBufferModule = [..._hrBufferModule.slice(-(MAX_HR_BUFFER - 1)), hr];

        // 2. Notify StressContext directly (fg + bg — this triggers SOS in background)
        try {
          _onRawHR?.(_hrBufferModule);
        } catch (callbackErr) {
          log.error(`Stress callback error: ${callbackErr?.message ?? 'Unknown'}`);
        }

        // 3. Update React state for UI (only meaningful in foreground)
        _onStateChange?.({ currentHR: hr, hrBuffer: _hrBufferModule });
      },
    );
    log.success('HR notifications subscribed — survives background & screen changes ✓');

  } catch (e) {
    if (!_isActive || e.message?.includes('destroyed')) return;
    log.error(`Connection failed: ${e.message}`);
    _onStateChange?.({ scanning: false, error: e.message });
  }
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────
const BleContext = createContext(null);

export function BleProvider({ children }) {
  const appStateRef = useRef(AppState.currentState);
  const scanTimer   = useRef(null);

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

  // Wire up module-level callbacks — plain assignments, always current
  _onStateChange = useCallback(partial => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);
  _appStateRef = appStateRef;

  // ── Mount / Unmount ───────────────────────────────────────────────────────
  // Cleanup intentionally does NOT touch BLE connection or subscription.
  // React unmounting ≠ user wanting to disconnect.
  useEffect(() => {
    _isActive = true;
    // Sync module buffer into React state on mount (in case provider remounted)
    if (_hrBufferModule.length > 0) {
      setState(prev => ({
        ...prev,
        hrBuffer:  _hrBufferModule,
        currentHR: _hrBufferModule[_hrBufferModule.length - 1],
      }));
    }
    log.info('BleProvider mounted — native BLE layer unaffected by React lifecycle');
    return () => {
      clearTimeout(scanTimer.current);
      log.info('BleProvider unmounted — BLE connection & HR stream kept alive intentionally');
    };
  }, []);

  // ── AppState ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', nextAppState => {
      const prev        = appStateRef.current;
      const wasActive   = prev === 'active';
      const isNowActive = nextAppState === 'active';

      if (wasActive && !isNowActive) {
        log.bg(`App → background  (${prev} → ${nextAppState})`);
        if (state.connected) log.bg(`HR stream stays alive in background — device: ${state.deviceName} ✓`);
        else log.bg('No active HR connection');
      } else if (!wasActive && isNowActive) {
        log.fg(`App → foreground  (${prev} → ${nextAppState})`);
        if (state.connected) {
          log.fg(`HR stream still running — device: ${state.deviceName} ✓`);
          // Sync module buffer back into React state after returning from background
          if (_hrBufferModule.length > 0) {
            setState(prev => ({
              ...prev,
              hrBuffer:  _hrBufferModule,
              currentHR: _hrBufferModule[_hrBufferModule.length - 1],
            }));
          }
        } else {
          log.fg('No HR device connected');
        }
      }
      appStateRef.current = nextAppState;
    });
    return () => sub.remove();
  }, [state.connected, state.deviceName]);

  // ── Scan ──────────────────────────────────────────────────────────────────
  const startScan = useCallback(async () => {
    if (state.scanning) { log.warn('Scan already in progress'); return; }

    // On iOS, constructing BleManager triggers the Bluetooth permission dialog.
    // Calling getManager() here means the prompt only appears when user taps scan.
    const mgr = getManager();

    // Auto-reconnect on first scan after a fresh launch
    if (!_device) {
      const saved = await AsyncStorage.getItem(SAVED_DEVICE_KEY).catch(() => null);
      if (saved) {
        let parsedSaved;
        try {
          parsedSaved = JSON.parse(saved);
        } catch {
          log.warn('Saved BLE device is invalid JSON; clearing stale value');
          AsyncStorage.removeItem(SAVED_DEVICE_KEY).catch(() => {});
          parsedSaved = null;
        }
        if (!parsedSaved?.id) {
          log.warn('Saved BLE device missing id; skipping auto-reconnect');
        } else {
          const { id, name } = parsedSaved;
          log.info(`Saved device found — attempting auto-reconnect to: ${name} (${id})`);
          try {
            await waitForPoweredOn(mgr);
            const device = await mgr.connectToDevice(id, { autoConnect: false });
            await connectDevice(device);
            log.success(`Auto-reconnected to: ${name} ✓`);
            return;
          } catch (e) {
            log.warn(`Auto-reconnect failed (will scan): ${e.message}`);
          }
        }
      }
    }

    // Permission / adapter checks
    const bleState = await mgr.state();
    log.info(`BLE adapter state: ${bleState}`);
    if (bleState === 'Unauthorized') {
      setPartial({ error: 'Bluetooth access denied. Enable it in Settings → Privacy → Bluetooth.' });
      return;
    }
    if (bleState === 'PoweredOff') {
      setPartial({ error: 'Bluetooth is turned off. Please enable it in Settings.' });
      return;
    }

    try {
      await waitForPoweredOn(mgr);
    } catch (e) {
      setPartial({ scanning: false, error: 'Bluetooth is not available. Please enable it.' });
      return;
    }

    setPartial({ scanning: true, error: null });
    log.scan(`Scanning for HR devices (timeout: ${SCAN_TIMEOUT_MS / 1000}s)...`);

    try {
      mgr.startDeviceScan(
        [HR_SERVICE_UUID],
        { allowDuplicates: false },
        async (error, device) => {
          if (!device && !error) return;
          try {
            if (error) {
              if (error.message?.includes('destroyed')) return;
              setPartial({ scanning: false, error: error.message });
              return;
            }
            if (!device) return;

            log.scan(`Found HR device: ${device.name ?? device.id}`);
            try { mgr.stopDeviceScan(); } catch (_) {}
            clearTimeout(scanTimer.current);

            await connectDevice(device);
          } catch (callbackErr) {
            if (!callbackErr?.message?.includes('destroyed')) {
              setPartial({ scanning: false, error: callbackErr.message });
            }
          }
        },
      );
    } catch (e) {
      setPartial({ scanning: false, error: e.message });
      return;
    }

    scanTimer.current = setTimeout(() => {
      try { mgr.stopDeviceScan(); } catch (_) {}
      log.scan('Scan timed out — no HR device found');
      setPartial({ scanning: false });
    }, SCAN_TIMEOUT_MS);
  }, [state.scanning, setPartial]);

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    log.disco('Manual disconnect — tearing down BLE session');

    _manualDisconnect = true;
    clearTimeout(scanTimer.current);

    // Remove subscription BEFORE cancelling connection so the monitor
    // callback doesn't fire a "cancelled" error during teardown
    teardownSubscription();

    // Clear module-level buffer on disconnect
    _hrBufferModule = [];

    AsyncStorage.removeItem(SAVED_DEVICE_KEY).catch(() => {});
    log.store('Cleared saved device');

    if (_manager) { try { await _manager.stopDeviceScan(); } catch (_) {} }
    if (_device)  { try { await _device.cancelConnection(); } catch (_) {} _device = null; }

    _manualDisconnect = false;

    setPartial({
      connected:  false,
      deviceName: null,
      currentHR:  null,
      hrBuffer:   [],
      scanning:   false,
      error:      null,
    });
    log.success('Disconnected cleanly ✓');
  }, [setPartial]);

  // ── registerStressCallback ────────────────────────────────────────────────
  // StressContext calls this once on mount to receive raw HR buffer updates.
  // The callback fires on EVERY HR reading, foreground AND background.
  // This is what makes stress calculation + SOS trigger work in iOS background.
  const registerStressCallback = useCallback(cb => {
    _onRawHR = cb;
    log.stress('Stress callback registered ✓');
    return () => {
      _onRawHR = null;
      log.stress('Stress callback unregistered');
    };
  }, []);

  return (
    <BleContext.Provider value={{ ...state, startScan, disconnect, registerStressCallback }}>
      {children}
    </BleContext.Provider>
  );
}

export function useBle() {
  const ctx = useContext(BleContext);
  if (!ctx) throw new Error('useBle must be used inside BleProvider');
  return ctx;
}