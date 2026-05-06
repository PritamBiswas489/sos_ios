/**
 * GoogleFitContext.ios.jsx  (HealthKit version)
 *
 * iOS counterpart to GoogleFitContext.jsx (Android Health Connect).
 * Uses react-native-health (Apple HealthKit) to read heart rate data.
 * Metro resolves this file automatically on iOS builds.
 *
 * Exposes the identical interface as the Android version so all
 * consumers (StressContext, myStressMonitor, etc.) work unchanged:
 *   hrReadings, authorized, loading, error, healthConnectAvailable,
 *   authorize(), refresh(), disconnect(), openPlayStore()
 *
 * Setup required (one-time, outside this file):
 *   1. Add HealthKit capability in Xcode → Signing & Capabilities
 *   2. Add NSHealthShareUsageDescription to ios/.../Info.plist
 *   3. Run `cd ios && pod install`
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {AppState} from 'react-native';
import AppleHealthKit from 'react-native-health';

// ─── Permissions ──────────────────────────────
const HK_PERMISSIONS = {
  permissions: {
    read:  [AppleHealthKit.Constants.Permissions.HeartRate],
    write: [],
  },
};

// ─── Promisified helpers ───────────────────────
function initHK() {
  return new Promise((resolve, reject) => {
    AppleHealthKit.initHealthKit(HK_PERMISSIONS, err => {
      if (err) reject(new Error(typeof err === 'string' ? err : JSON.stringify(err)));
      else resolve();
    });
  });
}

function isHKAvailable() {
  return new Promise((resolve, reject) => {
    AppleHealthKit.isAvailable((err, available) => {
      if (err) reject(new Error(typeof err === 'string' ? err : JSON.stringify(err)));
      else resolve(available);
    });
  });
}

function fetchHRSamples() {
  const now        = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const options    = {
    startDate: oneHourAgo.toISOString(),
    endDate:   now.toISOString(),
    ascending: false,
    limit:     50,
  };
  return new Promise((resolve, reject) => {
    AppleHealthKit.getHeartRateSamples(options, (err, results) => {
      if (err) reject(new Error(typeof err === 'string' ? err : JSON.stringify(err)));
      else resolve(results || []);
    });
  });
}

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

// ─── Provider ─────────────────────────────────
export function GoogleFitProvider({children, refreshIntervalMs = 30_000}) {
  const [state, setState] = useState(DEFAULT_STATE);
  const intervalRef       = useRef(null);
  const appStateRef       = useRef(AppState.currentState);
  const disconnectedRef   = useRef(false);

  const setPartial = useCallback(
    partial => setState(prev => ({...prev, ...partial})),
    [],
  );

  // ── Fetch HR samples from HealthKit ──────────
  const fetchAll = useCallback(async () => {
    setPartial({loading: true, error: null});
    try {
      const raw        = await fetchHRSamples();
      const hrReadings = raw
        .map(r => ({
          value:     Math.round(r.value),
          startDate: r.startDate,
          endDate:   r.endDate,
        }))
        .filter(s => s.value > 30 && s.value < 220)
        .slice(0, 50);

      console.log('[HealthKit] Fetched HR readings:', hrReadings);
      if (disconnectedRef.current) return;
      setPartial({hrReadings, authorized: true, loading: false, error: null});
    } catch (e) {
      if (disconnectedRef.current) return;
      setPartial({loading: false, error: e.message});
    }
  }, [setPartial]);

  // ── Authorize: check availability → init → fetch ──
  const authorize = useCallback(async () => {
    disconnectedRef.current = false;
    setPartial({loading: true, error: null});
    try {
      const available = await isHKAvailable();
      if (!available) {
        setPartial({
          loading:                false,
          healthConnectAvailable: false,
          error:                  'Apple HealthKit is not available on this device.',
        });
        return;
      }
      setPartial({healthConnectAvailable: true});
      await initHK();   // Requests permissions if not yet granted; silent if already granted
      await fetchAll();
    } catch (e) {
      setPartial({loading: false, error: e.message});
    }
  }, [fetchAll, setPartial]);

  // ── Disconnect: reset local state ────────────
  // Note: Apple does not allow revoking HealthKit permissions programmatically.
  // The user must do so via Settings → Health → Data Access.
  const disconnect = useCallback(async () => {
    disconnectedRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState(DEFAULT_STATE);
  }, []);

  // ── openPlayStore: not applicable on iOS ─────
  const openPlayStore = useCallback(() => {}, []);

  // ── Silent restore on mount ───────────────────
  // initHealthKit is idempotent: silent if already authorized, shows sheet on
  // first launch. We then attempt a fetch — if it succeeds we restore state.
  useEffect(() => {
    (async () => {
      try {
        const available = await isHKAvailable();
        if (!available) return;
        // initHealthKit will not re-prompt if the user already responded to the sheet
        await initHK();
        const raw = await fetchHRSamples();
        if (disconnectedRef.current) return;
        const hrReadings = raw
          .map(r => ({value: Math.round(r.value), startDate: r.startDate, endDate: r.endDate}))
          .filter(s => s.value > 30 && s.value < 220)
          .slice(0, 50);
        setPartial({
          hrReadings,
          authorized:             true,
          healthConnectAvailable: true,
          loading:                false,
          error:                  null,
        });
      } catch (e) {
        // Silently ignore — user can tap Connect manually
        console.warn('[HealthKit] Silent restore failed:', e.message);
      }
    })();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Foreground polling (setInterval) ─────────
  useEffect(() => {
    if (!state.authorized) return;
    intervalRef.current = setInterval(fetchAll, refreshIntervalMs);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state.authorized, refreshIntervalMs, fetchAll]);

  // ── Pause polling when app goes to background ─
  // (no background service needed on iOS — HealthKit background delivery
  //  requires AppDelegate setup; interval is simply paused here)
  useEffect(() => {
    if (!state.authorized) return;

    const subscription = AppState.addEventListener('change', nextAppState => {
      const wasActive = appStateRef.current === 'active';
      const isActive  = nextAppState === 'active';

      if (wasActive && !isActive) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else if (!wasActive && isActive) {
        fetchAll();
        intervalRef.current = setInterval(fetchAll, refreshIntervalMs);
      }
      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, [state.authorized, refreshIntervalMs, fetchAll]);

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
