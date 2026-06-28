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
  info:    (msg) => console.log(`ℹ️  [BLE] ${msg}`),
  success: (msg) => console.log(`✅ [BLE] ${msg}`),
  warn:    (msg) => console.warn(`⚠️  [BLE] ${msg}`),
  error:   (msg) => console.error(`❌ [BLE] ${msg}`),
  scan:    (msg) => console.log(`🔍 [BLE] ${msg}`),
  connect: (msg) => console.log(`🔗 [BLE] ${msg}`),
  heart:   (msg) => console.log(`❤️  [BLE] ${msg}`),
  fg:      (msg) => console.log(`☀️  [BLE][FG] ${msg}`),
  bg:      (msg) => console.log(`🌙 [BLE][BG] ${msg}`),
  disco:   (msg) => console.log(`🔌 [BLE] ${msg}`),
  store:   (msg) => console.log(`💾 [BLE] ${msg}`),
  shield:  (msg) => console.log(`🛡️  [BLE] ${msg}`),
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

// ─────────────────────────────────────────────
// Wait for BLE adapter to be powered on
// ─────────────────────────────────────────────
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
//  The single most important architectural decision in this file:
//  manager, deviceRef, hrSubscription, and the active/destroyed flags all live
//  at MODULE scope — completely outside React's component lifecycle.
//
//  Why this matters:
//  React can unmount and remount BleProvider at any time (navigation, hot
//  reload, parent re-renders). If BLE state lived inside the component, every
//  unmount would tear down the connection and kill the HR stream.
//
//  By living at module scope these objects are never touched by React's
//  cleanup cycle. The HR monitor callback runs on the native thread and
//  delivers readings regardless of what React is doing.
//
//  The only thing that can stop readings is:
//    • disconnect() — explicit user action
//    • A real hardware disconnect (device turned off / out of range)
// ─────────────────────────────────────────────────────────────────────────────
let _manager         = null;   // BleManager singleton
let _device          = null;   // Connected BLEDevice
let _hrSub           = null;   // HR characteristic subscription
let _manualDisconnect = false; // true only while disconnect() is running
let _isActive        = true;   // false only during explicit full teardown

// Callbacks registered by the React component to receive updates
// These are swapped on every render so they always hold fresh setState refs
let _onHR         = null;
let _onStateChange = null;

// ─────────────────────────────────────────────
// Module-level helpers (no React dependency)
// ─────────────────────────────────────────────

function getManager() {
  if (!_manager) {
    _manager = getBleManager();
    log.info('🆕 BLE manager created (module-level singleton)');
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
  log.disco(`⚡ Hardware disconnect — ${errMsg || 'device turned off or out of range'}`);
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
  //  This callback fires for THREE distinct cases:
  //
  //  Case A — manualDisconnect = true
  //    We called cancelConnection() ourselves. Suppress entirely.
  //
  //  Case B — err.message contains library-noise keywords
  //    react-native-ble-plx fires these for internal cancellations that are
  //    NOT real hardware events (background transitions, re-renders, etc).
  //    Suppress entirely.
  //
  //  Case C — err present with a real error message
  //    Genuine hardware disconnect (out of range, device off). Update state.
  //
  //  Case D — err is null (clean disconnect at protocol level)
  //    Some HR devices send a clean GATT disconnect when the strap is removed.
  //    Treat the same as Case C.
  //
  // ─────────────────────────────────────────────────────────────────────────
  device.onDisconnected((err) => {
    // Case A — we triggered it, ignore
    if (_manualDisconnect) {
      log.shield('onDisconnected suppressed — manual disconnect in progress');
      return;
    }

    const msg = err?.message ?? '';

    // Case B — library noise, ignore
    if (
      msg.includes('cancelled') ||
      msg.includes('destroyed') ||
      msg.includes('Operation was cancelled')
    ) {
      log.shield(`onDisconnected suppressed — library noise: "${msg}"`);
      return;
    }

    // Case C / D — real hardware event
    handleHardwareDisconnect(msg || null);
  });

  try {
    const connected = await device.connect({ autoConnect: false });
    if (!_isActive) { connected.cancelConnection().catch(() => {}); return; }

    log.connect('Discovering services & characteristics...');
    await connected.discoverAllServicesAndCharacteristics();
    if (!_isActive) return;

    _device = connected;

    // Persist for auto-reconnect on next launch
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
    //  This subscription is registered on the NATIVE CoreBluetooth layer.
    //  It survives:
    //    ✓ Screen changes / navigation stack changes
    //    ✓ App backgrounding (requires bluetooth-central in Info.plist)
    //    ✓ React component unmount / remount
    //    ✓ Any re-render of BleProvider or its parents
    //
    //  It is ONLY removed by:
    //    • disconnect() — explicit user action
    //    • handleHardwareDisconnect() — real hardware event
    // ─────────────────────────────────────────────────────────────────────
    teardownSubscription(); // clean up any stale sub from a previous session
    _hrSub = connected.monitorCharacteristicForService(
      HR_SERVICE_UUID,
      HR_CHAR_UUID,
      (err, characteristic) => {
        if (!_isActive) return;
        if (err) {
          const msg = err.message ?? '';
          // Filter library-internal noise — NOT real errors
          if (msg.includes('cancelled') || msg.includes('destroyed')) return;
          log.error(`HR monitor error: ${msg}`);
          _onStateChange?.({ error: msg });
          return;
        }
        const hr = parseHRCharacteristic(characteristic.value);
        if (hr !== null && hr > 20 && hr < 250) {
          _onHR?.(hr);
        }
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
  const appStateRef   = useRef(AppState.currentState);
  const scanTimer     = useRef(null);

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

  // ── Wire up module-level callbacks to React state ─────────────────────────
  //
  //  These are plain assignments (not useEffect) so they are always current.
  //  The module-level connectDevice / HR monitor call these refs to push
  //  updates into React state without React needing to be mounted.
  // ─────────────────────────────────────────────────────────────────────────
  _onStateChange = setPartial;

  _onHR = (hr) => {
    const mode = appStateRef.current === 'active' ? '☀️ FG' : '🌙 BG';
    log.heart(`HR = ${hr} bpm  [${mode}]`);
    setState(prev => ({
      ...prev,
      currentHR: hr,
      hrBuffer: [...prev.hrBuffer.slice(-(MAX_HR_BUFFER - 1)), hr],
    }));
  };

  // ── 1. Mount / Unmount ────────────────────────────────────────────────────
  //
  //  Cleanup does NOT touch the BLE connection, subscription, or _isActive.
  //  React unmounting BleProvider (screen change, hot reload) must never
  //  affect the native BLE layer.
  //
  //  Full teardown only happens in disconnect() by explicit user action.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    _isActive = true;
    log.info('BleProvider mounted — native BLE layer unaffected by React lifecycle');

    return () => {
      // ✅ Intentionally NOT setting _isActive = false here.
      //    NOT removing _hrSub.
      //    NOT cancelling the connection.
      //    React unmounting ≠ user wanting to disconnect.
      clearTimeout(scanTimer.current);
      log.info('BleProvider unmounted — BLE connection & HR stream kept alive intentionally');
    };
  }, []);

  // ── 2. AppState — foreground / background logging ─────────────────────────
  //
  //  ⚠️  REQUIRED in Info.plist for background BLE to work:
  //    <key>UIBackgroundModes</key>
  //    <array><string>bluetooth-central</string></array>
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', nextAppState => {
      const prev      = appStateRef.current;
      const wasActive = prev === 'active';
      const isNowActive = nextAppState === 'active';

      if (wasActive && !isNowActive) {
        log.bg(`App → background  (${prev} → ${nextAppState})`);
        if (state.connected) {
          log.bg(`HR stream stays alive in background — device: ${state.deviceName} ✓`);
        } else {
          log.bg('No active HR connection');
        }
      } else if (!wasActive && isNowActive) {
        log.fg(`App → foreground  (${prev} → ${nextAppState})`);
        if (state.connected) {
          log.fg(`HR stream still running — device: ${state.deviceName} ✓`);
        } else {
          log.fg('No HR device connected');
        }
      }
      appStateRef.current = nextAppState;
    });
    return () => sub.remove();
  }, [state.connected, state.deviceName]);

  // ── 3. Scan ───────────────────────────────────────────────────────────────
  const startScan = useCallback(async () => {
    if (state.scanning) {
      log.warn('Scan already in progress — ignoring');
      return;
    }

    // ── Lazy-init ─────────────────────────────────────────────────────────
    //  getManager() creates BleManager only if it doesn't exist yet.
    //  On iOS, constructing BleManager triggers the Bluetooth permission
    //  dialog. Calling it here (inside startScan) means the prompt only
    //  appears when the user explicitly taps the scan button.
    const mgr = getManager();

    // ── Auto-reconnect on first scan after a fresh launch ─────────────────
    //  Only attempts if no device is already connected
    if (!_device) {
      const saved = await AsyncStorage.getItem(SAVED_DEVICE_KEY).catch(() => null);
      if (saved) {
        const { id, name } = JSON.parse(saved);
        log.info(`Saved device found — attempting auto-reconnect to: ${name} (${id})`);
        try {
          await waitForPoweredOn(mgr);
          const device = await mgr.connectToDevice(id, { autoConnect: false });
          await connectDevice(device);
          log.success(`Auto-reconnected to: ${name} ✓`);
          return; // connected — skip scan
        } catch (e) {
          log.warn(`Auto-reconnect failed (will scan): ${e.message}`);
        }
      }
    }

    // ── Permission check ──────────────────────────────────────────────────
    const bleState = await mgr.state();
    log.info(`BLE adapter state: ${bleState}`);
    if (bleState === 'Unauthorized') {
      setPartial({ error: 'Bluetooth access denied. Enable it in Settings → Privacy → Bluetooth.' });
      log.error('Bluetooth unauthorized');
      return;
    }
    if (bleState === 'PoweredOff') {
      setPartial({ error: 'Bluetooth is turned off. Please enable it in Settings.' });
      log.warn('Bluetooth powered off');
      return;
    }

    // ── Wait for adapter ──────────────────────────────────────────────────
    log.scan('Waiting for BLE adapter...');
    try {
      await waitForPoweredOn(mgr);
      log.scan('Adapter ready — starting scan');
    } catch (e) {
      log.error(`BLE not ready: ${e.message}`);
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
              log.error(`Scan error: ${error.message}`);
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
              log.error(`Scan callback error: ${callbackErr.message}`);
              setPartial({ scanning: false, error: callbackErr.message });
            }
          }
        },
      );
    } catch (e) {
      log.error(`startDeviceScan threw: ${e.message}`);
      setPartial({ scanning: false, error: e.message });
      return;
    }

    scanTimer.current = setTimeout(() => {
      try { mgr.stopDeviceScan(); } catch (_) {}
      log.scan('Scan timed out — no HR device found');
      setPartial({ scanning: false });
    }, SCAN_TIMEOUT_MS);
  }, [state.scanning, setPartial]);

  // ── 4. Disconnect ─────────────────────────────────────────────────────────
  //
  //  This is the ONLY place that permanently stops the HR stream.
  //  Everything else (screen changes, background, re-renders) must leave
  //  the connection and subscription fully intact.
  // ─────────────────────────────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    log.disco('Manual disconnect — tearing down BLE session');

    // Tell onDisconnected to suppress its callback — we're the ones
    // calling cancelConnection so we don't want a state update from it
    _manualDisconnect = true;

    clearTimeout(scanTimer.current);

    // Remove subscription BEFORE cancelling connection so the monitor
    // callback doesn't fire a "cancelled" error during teardown
    teardownSubscription();

    AsyncStorage.removeItem(SAVED_DEVICE_KEY).catch(() => {});
    log.store('Cleared saved device');

    if (_manager) {
      try { await _manager.stopDeviceScan(); } catch (_) {}
    }
    if (_device) {
      try { await _device.cancelConnection(); } catch (_) {}
      _device = null;
      log.disco('Connection cancelled');
    }

    _manualDisconnect = false;

    setPartial({
      connected:  false,
      deviceName: null,
      currentHR:  null,
      scanning:   false,
      error:      null,
    });
    log.success('Disconnected cleanly ✓');
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
