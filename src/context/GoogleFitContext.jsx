/**
 * GoogleFitContext.jsx  (Health Connect version)
 *
 * Replaces react-native-google-fit with react-native-health-connect.
 *
 * Availability logic:
 *   Android 14+ (API 34+) → Built-in, no install needed
 *   Android 9–13 (API 28–33) → Shows "Install Health Connect" Play Store prompt
 *   Android 7–8 (API 24–27) → Shows "Device Not Supported" alert
 *
 * Background:
 *   Uses react-native-background-actions when the app is backgrounded.
 *   A foreground service notification appears only while the app is in the background.
 *   Foreground polling uses a plain setInterval (no notification).
 *
 * Exposes: hrReadings,
 *          authorized, loading, error, healthConnectAvailable,
 *          authorize(), refresh(), openPlayStore()
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {Linking, Alert, Platform, AppState, DeviceEventEmitter} from 'react-native';
import BackgroundService from 'react-native-background-actions';
import {
  getSdkStatus,
  SdkAvailabilityStatus,
  initialize,
  requestPermission,
  getGrantedPermissions,
  revokeAllPermissions,
  readRecords,
} from 'react-native-health-connect';

// ─── Health Connect Play Store URL ────────────
const HC_PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata';

// ─── Permissions ──────────────────────────────
const HC_PERMISSIONS = [
  {accessType: 'read', recordType: 'HeartRate'},
];

// ─── Background service helpers ───────────────
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Runs inside the foreground service when the app is backgrounded.
// Reads heart rate on every interval and emits results to the main thread.
const bgHeartRateTask = async taskData => {
  const {refreshIntervalMs} = taskData;
  await new Promise(async resolve => {
    for (; BackgroundService.isRunning();) {
      try {
        const now        = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const hrResult   = await readRecords('HeartRate', {
          timeRangeFilter: {
            operator:  'between',
            startTime: oneHourAgo.toISOString(),
            endTime:   now.toISOString(),
          },
        });
        const hrReadings = (hrResult?.records || [])
          .flatMap(r => (r.samples || []).map(s => ({
            value:     Math.round(s.beatsPerMinute),
            startDate: r.startTime,
            endDate:   r.endTime,
          })))
          .filter(s => s.value > 30 && s.value < 220)
          .slice(-50);
        DeviceEventEmitter.emit('HR_BG_UPDATE', hrReadings);
      } catch (e) {
        console.warn('[BG] HeartRate read error:', e.message);
      }
      await sleep(refreshIntervalMs);
    }
    resolve();
  });
};

const makeBgOptions = refreshIntervalMs => ({
  taskName:   'HeartRateMonitor',
  taskTitle:  'Health Monitoring Active',
  taskDesc:   'Reading heart rate data in the background',
  taskIcon:   {name: 'ic_launcher', type: 'mipmap'},
  color:      '#AA3CFF',
  parameters: {refreshIntervalMs},
});

// ─── Default State ────────────────────────────
const DEFAULT_STATE = {
  hrReadings:             [],
  authorized:             false,
  loading:                false,
  error:                  null,
  healthConnectAvailable: null, // null=unknown | true=ready | false=unavailable
};

// ─── Context ──────────────────────────────────
const GoogleFitContext = createContext({
  ...DEFAULT_STATE,
  authorize:     async () => {},
  refresh:       async () => {},
  disconnect:    async () => {},
  openPlayStore: () => {},
});

function toISO(date) { return date.toISOString(); }

// ─── Provider ─────────────────────────────────
export function GoogleFitProvider({children, refreshIntervalMs = 30_000}) {
  const [state, setState] = useState(DEFAULT_STATE);
  const intervalRef       = useRef(null);
  const appStateRef       = useRef(AppState.currentState);
  const disconnectedRef   = useRef(false); // prevents in-flight fetchAll from re-authorizing after disconnect

  const setPartial = useCallback(
    partial => setState(prev => ({...prev, ...partial})),
    [],
  );

  // ── Open Play Store to install Health Connect
  const openPlayStore = useCallback(() => {
    Linking.openURL(HC_PLAY_STORE_URL).catch(() => {
      Alert.alert(
        'Cannot Open Play Store',
        'Please search for "Health Connect" in the Google Play Store manually.',
      );
    });
  }, []);

  // ── Check if Health Connect is available on this device
  // Returns true if ready, false + shows appropriate Alert if not
  const checkAvailability = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setPartial({
        healthConnectAvailable: false,
        error: 'Health Connect is Android only.',
      });
      return false;
    }

    try {
      const androidApiLevel = Platform.Version;
      const sdkStatus       = await getSdkStatus();

      if (sdkStatus === SdkAvailabilityStatus.SDK_UNAVAILABLE) {
        // Not installed
        setPartial({
          healthConnectAvailable: false,
          error: 'Health Connect app is not installed. Please install it to connect your health data.',
        });

        return false;
      }

      if (sdkStatus === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
        // Installed but outdated — prompt to update
        setPartial({
          healthConnectAvailable: false,
          error: 'Health Connect needs to be updated.',
        });
        
        return false;
      }

      // SDK_AVAILABLE — safe to initialize
      const isAvailable = await initialize();
      
      if (isAvailable) {
        setPartial({healthConnectAvailable: true});
        return true;
      }

      setPartial({
        healthConnectAvailable: false,
        error: 'Health Connect could not be initialized.',
      });
      return false;
    } catch (e) {
      setPartial({healthConnectAvailable: false, error: e.message});
      return false;
    }
  }, [openPlayStore, setPartial]);

  // ── Fetch all health data
  const fetchAll = useCallback(async () => {
    setPartial({loading: true, error: null});
    try {
      const now        = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // ── Heart Rate (last 1 hour)
      const hrResult   = await readRecords('HeartRate', {
        timeRangeFilter: {operator: 'between', startTime: toISO(oneHourAgo), endTime: toISO(now)},
      });
      const hrReadings = (hrResult?.records || [])
        .flatMap(r => (r.samples || []).map(s => ({
          value:     Math.round(s.beatsPerMinute),
          startDate: r.startTime,
          endDate:   r.endTime,
        })))
        .filter(s => s.value > 30 && s.value < 220)
        .slice(-50);

      console.log('Fetched Heart Rate readings from Health Connect:', hrReadings);

      // Guard: if disconnect() was called while we were awaiting, discard results
      if (disconnectedRef.current) return;

      setPartial({
        hrReadings,
        authorized: true,
        loading:    false,
        error:      null,
      });
    } catch (e) {
      // Swallow errors that arrive after a deliberate disconnect
      if (disconnectedRef.current) return;
      setPartial({loading: false, error: e.message});
    }
  }, [setPartial]);

  // ── Background service start / stop ──────────────────────────────────────
  const startBgService = useCallback(async () => {
    console.log('Starting background service with interval:', refreshIntervalMs);
    if (BackgroundService.isRunning()) return;
    try {
      await BackgroundService.start(bgHeartRateTask, makeBgOptions(refreshIntervalMs));
    } catch (e) {
      console.warn('[BG] Failed to start background service:', e.message);
    }
  }, [refreshIntervalMs]);

  const stopBgService = useCallback(async () => {
    console.log('Stopping background service');
    if (!BackgroundService.isRunning()) return;
    try {
      await BackgroundService.stop();
    } catch (e) {
      console.warn('[BG] Failed to stop background service:', e.message);
    }
  }, []);

  // ── Disconnect: revoke HC permissions and reset all state
  const disconnect = useCallback(async () => {
    // Set flag first so any in-flight fetchAll calls bail out silently
    disconnectedRef.current = true;

    // Stop polling / background service
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    await stopBgService();

    try {
      await revokeAllPermissions();
    } catch (e) {
      console.warn('[HC] revokeAllPermissions error:', e.message);
    }

    setState(DEFAULT_STATE);
  }, [stopBgService]);

  // ── Authorize: availability check → permissions → fetch
  const authorize = useCallback(async () => {
    // Reset disconnect guard so fetchAll can update state again
    disconnectedRef.current = false;
    setPartial({loading: true, error: null});

    // Step 1 — is Health Connect available on this device?
    const available = await checkAvailability();
    if (!available) {
      setPartial({loading: false});
      return; // Alert already shown inside checkAvailability()
    }

    // Step 2 — request permissions
    try {
      await requestPermission(HC_PERMISSIONS);
      // requestPermission only returns newly granted permissions —
      // use getGrantedPermissions() to get the full set including previously granted
      const granted = await getGrantedPermissions();
      console.log('Granted permissions:', granted);
      const hasHR   = granted.some(p => p.recordType === 'HeartRate');
      console.log('Heart Rate permission granted:', hasHR);
      if (!hasHR) {
        setPartial({
          loading: false,
          error: 'Health Connect permissions denied. Tap "Connect" to try again.',
        });
        return;
      }

      // Step 3 — fetch data
      await fetchAll();
    } catch (e) {
      setPartial({loading: false, error: e.message});
    }
  }, [checkAvailability, fetchAll, setPartial]);

  // ── Silent restore on mount: if permission already granted, skip prompt and fetch
  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS !== 'android') return;
        const sdkStatus = await getSdkStatus();
        if (
          sdkStatus !== SdkAvailabilityStatus.SDK_AVAILABLE &&
          sdkStatus !== SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
        ) return;
        const initialized = await initialize();
        if (!initialized) return;
        const granted = await getGrantedPermissions();
        const hasHR   = granted.some(p => p.recordType === 'HeartRate');
        if (hasHR) {
          // Already authorized — restore state and start polling silently
          await fetchAll();
        }
      } catch (e) {
        // Silently ignore — user can tap Connect manually
        console.warn('[HC] Silent restore failed:', e.message);
      }
    })();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopBgService();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Foreground polling (setInterval, no notification)
  useEffect(() => {
    if (!state.authorized) return;
    intervalRef.current = setInterval(fetchAll, refreshIntervalMs);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state.authorized, refreshIntervalMs, fetchAll]);

  // ── Switch between foreground polling and background service based on AppState
  useEffect(() => {
    if (!state.authorized) return;

    const subscription = AppState.addEventListener('change', nextAppState => {
      const wasActive = appStateRef.current === 'active';
      const isActive  = nextAppState === 'active';

      if (wasActive && !isActive) {
        // App going to background — stop interval, start background service
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        startBgService();
      } else if (!wasActive && isActive) {
        // App coming to foreground — stop background service, restart interval
        stopBgService();
        intervalRef.current = setInterval(fetchAll, refreshIntervalMs);
      }

      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, [state.authorized, refreshIntervalMs, fetchAll, startBgService, stopBgService]);

  // ── Listen for heart rate updates emitted by the background task
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('HR_BG_UPDATE', hrReadings => {
      setPartial({hrReadings, authorized: true, loading: false, error: null});
    });
    return () => sub.remove();
  }, [setPartial]);

  return (
    <GoogleFitContext.Provider value={{...state, authorize, refresh: fetchAll, disconnect, openPlayStore}}>
      {children}
    </GoogleFitContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────
export function useGoogleFit() {
  const ctx = useContext(GoogleFitContext);
  if (!ctx) throw new Error('useGoogleFit must be used inside GoogleFitProvider');
  return ctx;
}
