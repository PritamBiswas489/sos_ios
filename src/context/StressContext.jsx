/**
 * StressContext.jsx  —  iOS
 *
 * TWO stress calculation paths, both fully working:
 *
 *  PATH A — BLE device (foreground + background)
 *    registerStressCallback() fires on every HR reading from CoreBluetooth
 *    native thread. Computes stress, triggers SOS, saves to DB — all inside
 *    the callback, no React dependency. Sets liveHRBuffer state for UI.
 *
 *  PATH B — Manual HR override (dev tool / foreground only)
 *    manualHROverride state → mergedHRValues → useMemo computeStress → stress
 *    Persistence + SOS handled by a separate useEffect watching stress.score.
 *    This path is React-only (foreground), which is fine for a dev tool.
 *
 *  SINGLE stress output:
 *    mergedHRValues = manualHROverride ? manual array : liveHRBuffer
 *    stress         = useMemo(computeStress(mergedHRValues))
 *    UI always reads `stress` — same for both paths.
 */

import React, {
  createContext, useContext, useState, useEffect,
  useMemo, useCallback, useRef,
} from 'react';
import { useBle } from './BleContext';
import { StressDataService } from '../services/stressData.service';
import { useSocket } from './SocketContext';
import { buildStressRecord } from '../models/stressRecord.model';
import useUserAuth from '../hook/useUserAuth';
import { SOSService } from '../services/sos.service';
import { useOutgoingRequests } from '../hook/useOutgoingRequests';
import { useLocation } from './LocationContext';
import { displayStressUpdateNotification } from '../services/notification.service';

// ── Stress States ─────────────────────────────
export const STRESS_STATE = {
  RELAXED:  { label: 'Relaxed',  color: '#00E5A0', emoji: '😌', level: 0 },
  LOW:      { label: 'Low',      color: '#7EE8A2', emoji: '🙂', level: 1 },
  MODERATE: { label: 'Moderate', color: '#FFD166', emoji: '😐', level: 2 },
  HIGH:     { label: 'High',     color: '#FF8C42', emoji: '😟', level: 3 },
  CRITICAL: { label: 'Critical', color: '#FF3366', emoji: '🆘', level: 4 },
};

// ── Stress Algorithm ──────────────────────────
export function computeStress({
  hrValues = [],
  maxHR = 190,
  restingHR = 60,
}) {
  const empty = {
    score: 0, state: STRESS_STATE.RELAXED, rmssd: 0,
    currentHR: null, avgHR: 0, hrIntensity: 0, hrScore: 0, rmssdScore: 0,
  };

  if (!hrValues.length) return empty;

  const currentHR = hrValues[hrValues.length - 1];
  const avgHR     = hrValues.reduce((a, b) => a + b, 0) / hrValues.length;

  // 🚨 HARD SAFETY OVERRIDES
  if (currentHR >= 180) return { score: 100, state: STRESS_STATE.CRITICAL, rmssd: 0, currentHR, avgHR: Math.round(avgHR), hrIntensity: 100, hrScore: 40, rmssdScore: 40 };
  if (currentHR >= 160) return { score: 90,  state: STRESS_STATE.CRITICAL, rmssd: 0, currentHR, avgHR: Math.round(avgHR), hrIntensity: 90,  hrScore: 38, rmssdScore: 30 };

  // 1. HR INTENSITY (0–40)
  const hrReserve   = maxHR - restingHR;
  const hrIntensity = Math.max(0, (currentHR - restingHR) / hrReserve);
  let hrScore = hrIntensity * 40;
  if (currentHR >= 140) hrScore = Math.max(hrScore, 35);
  else if (currentHR >= 120) hrScore = Math.max(hrScore, 30);
  hrScore = Math.min(40, hrScore);

  // 2. VARIABILITY (STD DEV)
  let rmssd = 0, rmssdScore = 0;
  if (hrValues.length >= 3) {
    const variance = hrValues.reduce((a, b) => a + Math.pow(b - avgHR, 2), 0) / hrValues.length;
    const stdDev   = Math.sqrt(variance);
    rmssd = stdDev;
    if      (stdDev < 2)  rmssdScore = 30;
    else if (stdDev < 5)  rmssdScore = 20;
    else if (stdDev < 10) rmssdScore = 10;
    else                  rmssdScore = 0;
  }

  // 3. TREND (0–20)
  let trendScore = 0;
  if (hrValues.length >= 5) {
    const trend = hrValues[hrValues.length - 1] - hrValues[hrValues.length - 5];
    if      (trend > 25)  trendScore = 20;
    else if (trend > 15)  trendScore = 15;
    else if (trend > 8)   trendScore = 10;
    else if (trend < -10) trendScore = -5;
  }

  // 4. HIGH HR + LOW VARIABILITY BOOST
  if (currentHR > 120 && rmssd < 3) rmssdScore += 10;

  // FINAL SCORE
  const score = Math.max(0, Math.min(100, hrScore + rmssdScore + trendScore));

  // STATE
  let state = STRESS_STATE.RELAXED;
  if      (score >= 80 || currentHR >= 150) state = STRESS_STATE.CRITICAL;
  else if (score >= 60 || currentHR >= 130) state = STRESS_STATE.HIGH;
  else if (score >= 40)                     state = STRESS_STATE.MODERATE;
  else if (score >= 20)                     state = STRESS_STATE.LOW;

  return {
    score: Math.round(score), state,
    rmssd: Math.round(rmssd), currentHR,
    avgHR: Math.round(avgHR),
    hrIntensity: Math.round(hrIntensity * 100),
    hrScore: Math.round(hrScore),
    rmssdScore: Math.round(rmssdScore),
  };
}

// ── Context ───────────────────────────────────
const StressContext = createContext(null);

// ── Provider ──────────────────────────────────
export function StressProvider({ children, criticalThreshold = 76 }) {
  const ble = useBle();
  const { isAuthenticated }            = useUserAuth();
  const { on, emitNoAck, isConnected } = useSocket();
  const { fetchOutgoingRequests }      = useOutgoingRequests();
  const { currentLocation }            = useLocation();

  // ── State ─────────────────────────────────────────────────────────────────
  const [sosArmed, setSosArmed]                             = useState(false);
  const [lastRecordedFallback, setLastRecordedFallback]     = useState(null);
  const [contactsLastHealthData, setContactsLastHealthData] = useState(null);
  const [manualHROverride, setManualHROverride]             = useState(null); // DEV tool

  // liveHRBuffer — set by registerStressCallback (BLE path, fg + bg)
  // manualHROverride — set by setManualHR (manual path, fg only)
  // mergedHRValues picks whichever is active → stress useMemo recomputes
  const [liveHRBuffer, setLiveHRBuffer] = useState([]);

  // ── Refs — always current inside BLE callback (no stale closures) ─────────
  const lastSosTriggerScoreRef  = useRef(0);
  const lastSavedAtRef          = useRef(0);
  const lastSavedFingerprintRef = useRef('');
  const lastNotificationAtRef   = useRef(0);
  const criticalThresholdRef    = useRef(criticalThreshold);
  const currentLocationRef      = useRef(currentLocation);
  const fetchOutgoingRequestsRef = useRef(fetchOutgoingRequests);
  const emitNoAckRef            = useRef(emitNoAck);
  const bleRef                  = useRef(ble);

  useEffect(() => { criticalThresholdRef.current     = criticalThreshold;    }, [criticalThreshold]);
  useEffect(() => { currentLocationRef.current       = currentLocation;      }, [currentLocation]);
  useEffect(() => { fetchOutgoingRequestsRef.current = fetchOutgoingRequests; }, [fetchOutgoingRequests]);
  useEffect(() => { emitNoAckRef.current             = emitNoAck;            }, [emitNoAck]);
  useEffect(() => { bleRef.current                   = ble;                  }, [ble]);

  // ─────────────────────────────────────────────────────────────────────────
  // PATH A — BLE device (foreground + background)
  //
  // registerStressCallback fires on CoreBluetooth native thread every HR reading.
  // Inside: compute stress → SOS → persistence → setLiveHRBuffer (UI).
  // Everything before setLiveHRBuffer runs in background too.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ble.registerStressCallback) return;

    const unregister = ble.registerStressCallback(buffer => {
      // 1. Compute stress from raw buffer — pure JS, no React
      const result = computeStress({ hrValues: buffer });
      console.log(`❤️  [STRESS][BLE] len=${buffer.length} latest=${buffer[buffer.length - 1]} score=${result.score} (${result.state.label})`);

 
    
      // 2. SOS check — rising edge only (fg + bg)
      const inCritical = result.score >= criticalThresholdRef.current && result.score <= 100;

      // Notify while in critical state, throttled to avoid notification spam.
      if (inCritical) {
        const now = Date.now();
        if (now - lastNotificationAtRef.current >= 15_000) {
          lastNotificationAtRef.current = now;
          Promise.resolve()
            .then(() =>
              displayStressUpdateNotification({
                score:      result.score,
                stateLabel: result.state.label,
                source:     'ble',
                currentHR:  result.currentHR,
              }),
            )
            .catch(err => console.log('Stress notification failed:', err));
        }
      }

      if (inCritical && result.score > lastSosTriggerScoreRef.current) {
        lastSosTriggerScoreRef.current = result.score;
        setSosArmed(true);
        console.log(`🆘 [STRESS][BLE] SOS triggered — score: ${result.score}, HR: ${result.currentHR}`);

        // Use cached location — do NOT await getCurrentPosition() in background
        const loc = currentLocationRef.current;
        SOSService.triggerStressSos({
          hr:           result.currentHR,
          stress_score: result.score,
          latitude:     loc?.latitude,
          longitude:    loc?.longitude,
        }, res => {
          if (res.success) fetchOutgoingRequestsRef.current?.();
        });
      }

      if (!inCritical) {
        lastSosTriggerScoreRef.current = 0;
        setSosArmed(false); // UI only — ignored by iOS in background
      }

      // 3. Persistence — throttled 10s, fingerprint dedup (fg + bg)
      if (result.currentHR != null) {
        const now = Date.now();
        if (now - lastSavedAtRef.current >= 10_000) {
          const fingerprint = `ble:${result.currentHR}:${result.score}:${result.rmssd}:${result.avgHR}`;
          if (fingerprint !== lastSavedFingerprintRef.current) {
            lastSavedAtRef.current          = now;
            lastSavedFingerprintRef.current = fingerprint;

            const currentBle = bleRef.current;
            const insertData = buildStressRecord({
              stress:       result,
              activeSource: 'ble',
              bleData: {
                currentHR:  result.currentHR,
                hrBuffer:   buffer,
                latestHR:   result.currentHR,
                avgHR:      result.avgHR,
                minHR:      buffer.length ? Math.min(...buffer) : null,
                maxHR:      buffer.length ? Math.max(...buffer) : null,
                deviceName: currentBle.deviceName,
                connected:  currentBle.connected,
              },
            });

            emitNoAckRef.current?.('contact:healthdata:update', JSON.stringify(insertData));
            StressDataService.insertFromContext(insertData, res => {
              if (__DEV__ && !res.success) console.log('Stress save skipped/failed:', res.error);
            });
          }
        }
      }

      // 4. Update React state for UI — foreground only (iOS ignores in bg)
      setLiveHRBuffer([...buffer]);
    });

    return unregister;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ble.registerStressCallback]);

  // ─────────────────────────────────────────────────────────────────────────
  // MERGED HR VALUES — single source for stress useMemo + hasLiveData
  //
  //  manualHROverride active → use manual array (15 slots for trend/variability)
  //  BLE active              → use liveHRBuffer (updated by callback above)
  //  Neither                 → empty [] → stress = RELAXED / score 0
  // ─────────────────────────────────────────────────────────────────────────
  const bleHRValues = useMemo(() => {
    if (liveHRBuffer.length) return liveHRBuffer;
    return Array.isArray(ble.hrBuffer) ? ble.hrBuffer : [];
  }, [liveHRBuffer, ble.hrBuffer]);

  const manualHRValues = useMemo(
    () => (manualHROverride !== null ? Array(15).fill(manualHROverride) : []),
    [manualHROverride],
  );

  const hasBleLiveData = bleHRValues.length > 0;

  const mergedHRValues = hasBleLiveData
    ? bleHRValues
    : manualHRValues;

  // ─────────────────────────────────────────────────────────────────────────
  // STRESS — single useMemo for BOTH paths
  //
  // BLE path:    liveHRBuffer updated by registerStressCallback → re-render → useMemo runs
  // Manual path: manualHROverride state changes → mergedHRValues changes → useMemo runs
  // ─────────────────────────────────────────────────────────────────────────
  const stress = useMemo(
    () => computeStress({ hrValues: mergedHRValues }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mergedHRValues.join(',')],
  );

  const hasLiveData  = mergedHRValues.length > 0;
  const activeSource = hasBleLiveData ? 'ble' : (manualHROverride !== null ? 'manual' : 'ble');

  // ── BLE DATA BLOCK ────────────────────────────────────────────────────────
  const bleData = useMemo(() => ({
    currentHR:  liveHRBuffer.length ? liveHRBuffer[liveHRBuffer.length - 1] : ble.currentHR,
    hrBuffer:   liveHRBuffer.length ? liveHRBuffer : ble.hrBuffer,
    latestHR:   liveHRBuffer.length ? liveHRBuffer[liveHRBuffer.length - 1] : ble.currentHR,
    avgHR:      liveHRBuffer.length
                  ? Math.round(liveHRBuffer.reduce((a, b) => a + b, 0) / liveHRBuffer.length)
                  : null,
    minHR:      liveHRBuffer.length ? Math.min(...liveHRBuffer) : null,
    maxHR:      liveHRBuffer.length ? Math.max(...liveHRBuffer) : null,
    deviceName: ble.deviceName,
    connected:  ble.connected,
    scanning:   ble.scanning,
    error:      ble.error,
    startScan:  ble.startScan,
    disconnect: ble.disconnect,
  }), [ble, liveHRBuffer]);

  // ─────────────────────────────────────────────────────────────────────────
  // PATH B — Manual HR override SOS + persistence (foreground only, dev tool)
  //
  // BLE path SOS/persistence run inside registerStressCallback (above).
  // Manual path has no BLE callback, so we use a useEffect on stress.score.
  // Guard: only runs when manualHROverride is active.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeSource !== 'manual') return; // BLE path handled in callback

    console.log(`❤️  [STRESS][MANUAL] score=${stress.score} (${stress.state.label})`);

    

    const inCritical = stress.score >= criticalThreshold && stress.score <= 100;

    if (inCritical && stress.score > lastSosTriggerScoreRef.current) {
      lastSosTriggerScoreRef.current = stress.score;
      setSosArmed(true);
      console.log(`🆘 [STRESS][MANUAL] SOS triggered — score: ${stress.score}`);

      SOSService.triggerStressSos({
        hr:           stress.currentHR,
        stress_score: stress.score,
        latitude:     currentLocation?.latitude,
        longitude:    currentLocation?.longitude,
      }, res => {
        if (res.success) fetchOutgoingRequests?.();
      });
       // Notification
    
    }

    if (!inCritical) {
      lastSosTriggerScoreRef.current = 0;
      if (sosArmed) setSosArmed(false);
    }

    // Persistence for manual path
    if (stress.currentHR != null) {
      const now = Date.now();
      if (now - lastSavedAtRef.current >= 10_000) {
        const fingerprint = `manual:${stress.currentHR}:${stress.score}:${stress.rmssd}:${stress.avgHR}`;
        if (fingerprint !== lastSavedFingerprintRef.current) {
          lastSavedAtRef.current          = now;
          lastSavedFingerprintRef.current = fingerprint;

          const insertData = buildStressRecord({
            stress,
            activeSource: 'manual',
            bleData,
          });
          emitNoAck?.('contact:healthdata:update', JSON.stringify(insertData));
          StressDataService.insertFromContext(insertData, res => {
            if (__DEV__ && !res.success) console.log('Stress save skipped/failed:', res.error);
          });
        }
      }
    }

   

  }, [
    stress.score,
    activeSource,
    criticalThreshold,
    currentLocation,
    fetchOutgoingRequests,
    emitNoAck,
    bleData,
    sosArmed,
  ]);

  // ── Last recorded fallback (when no live data) ────────────────────────────
  useEffect(() => {
    if (hasLiveData)      { setLastRecordedFallback(null); return; }
    if (!isAuthenticated) { setLastRecordedFallback(null); return; }

    StressDataService.getLatest(result => {
      if (!result?.success || !result.data) { setLastRecordedFallback(null); return; }
      const latest       = result.data;
      const fallbackState =
        Object.values(STRESS_STATE).find(s => s.label === latest.stress_state) ||
        STRESS_STATE.RELAXED;

      setLastRecordedFallback({
        stress: {
          score:       Number(latest.stress_score ?? 0),
          state:       fallbackState,
          rmssd:       Number(latest.rmssd ?? 0),
          currentHR:   latest.current_hr == null ? null : Number(latest.current_hr),
          avgHR:       latest.avg_hr == null ? null : Number(latest.avg_hr),
          hrIntensity: Number(latest.hr_intensity ?? 0),
          hrScore:     Number(latest.hr_score ?? 0),
          rmssdScore:  Number(latest.rmssd_score ?? 0),
        },
        source:     latest.source,
        recordedAt: latest.created_at,
      });
    });
  }, [hasLiveData, isAuthenticated]);

  const resolvedStress       = hasLiveData ? stress       : (lastRecordedFallback?.stress ?? stress);
  const resolvedActiveSource = hasLiveData ? activeSource : (lastRecordedFallback?.source ?? activeSource);

  // ── SOS actions ───────────────────────────────────────────────────────────
  const sendSos    = useCallback(() => { console.log('SOS manually triggered by user'); }, []);
  const dismissSos = useCallback(() => setSosArmed(false), []);

  // ── Fetch contacts' last health data ─────────────────────────────────────
  const getContactLastHealthData = useCallback(async () => {
    try {
      const response = await new Promise((resolve, reject) => {
        StressDataService.getContactsLastHealthData(result => {
          if (result.success) resolve(result.data);
          else reject(new Error(result.error || 'Unknown error'));
        });
      });
      if (response?.data) {
        const contactStressData = [];
        response.data.forEach(contact => {
          contactStressData[contact.user_id] = {
            stress: {
              score:       Number(contact.stress_score ?? 0),
              state:       Object.values(STRESS_STATE).find(
                             s => s.label.toLowerCase() === (contact.stress_state ?? '').toLowerCase()
                           ) ?? STRESS_STATE.RELAXED,
              rmssd:       Number(contact.rmssd ?? 0),
              currentHR:   contact.current_hr == null ? null : Number(contact.current_hr),
              avgHR:       contact.avg_hr == null ? null : Number(contact.avg_hr),
              hrIntensity: Number(contact.hr_intensity ?? 0),
              hrScore:     Number(contact.hr_score ?? 0),
              rmssdScore:  Number(contact.rmssd_score ?? 0),
            },
            source:     contact.source,
            recordedAt: contact.created_at,
          };
        });
        setContactsLastHealthData(contactStressData);
      }
    } catch (err) {
      console.error('Failed to get contacts last health data:', err.message);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) getContactLastHealthData();
  }, [getContactLastHealthData, isAuthenticated]);

  // ── Socket: contacts' live health updates ─────────────────────────────────
  useEffect(() => {
    if (!isConnected) return;
    const unsubs = [
      on('contact:healthdata:updated', payload => {
        const data = {};
        if (typeof payload === 'string') {
          try { Object.assign(data, JSON.parse(payload)); }
          catch (err) { console.error('Failed to parse healthdata payload:', err.message); return; }
        } else if (typeof payload === 'object' && payload !== null) {
          Object.assign(data, payload);
        } else return;

        if (data?.userId) {
          const h = data.healthData || {};
          setContactsLastHealthData(prev => ({
            ...prev,
            [data.userId]: {
              stress: {
                score:       Number(h.stress_score ?? 0),
                state:       Object.values(STRESS_STATE).find(
                               s => s.label.toLowerCase() === (h.stress_state ?? '').toLowerCase()
                             ) ?? STRESS_STATE.RELAXED,
                rmssd:       Number(h.rmssd ?? 0),
                currentHR:   h.current_hr == null ? null : Number(h.current_hr),
                avgHR:       h.avg_hr == null ? null : Number(h.avg_hr),
                hrIntensity: Number(h.hr_intensity ?? 0),
                hrScore:     Number(h.hr_score ?? 0),
                rmssdScore:  Number(h.rmssd_score ?? 0),
              },
              source:     h.source,
              recordedAt: h.created_at,
            },
          }));
        }
      }),
    ];
    return () => unsubs.forEach(u => u());
  }, [isConnected, on, emitNoAck]);

  // ── Context value ─────────────────────────────────────────────────────────
  const value = useMemo(() => ({
    stress:            resolvedStress,
    bleData,
    activeSource:      resolvedActiveSource,
    hasLiveData,
    isUsingLastRecord: !hasLiveData && !!lastRecordedFallback,
    lastRecordedAt:    lastRecordedFallback?.recordedAt ?? null,
    sosArmed,
    sendSos,
    dismissSos,
    contactsLastHealthData,
    manualHROverride,
    setManualHR:   setManualHROverride,
    clearManualHR: () => setManualHROverride(null),
  }), [
    resolvedStress, bleData, resolvedActiveSource,
    hasLiveData, lastRecordedFallback,
    sosArmed, sendSos, dismissSos,
    contactsLastHealthData, manualHROverride,
  ]);

  return (
    <StressContext.Provider value={value}>
      {children}
    </StressContext.Provider>
  );
}

// ── Hooks ─────────────────────────────────────
export function useStress() {
  const ctx = useContext(StressContext);
  if (!ctx) throw new Error('useStress must be inside StressProvider');
  return ctx;
}
export function useStressScore()  { return useStress().stress; }
export function useBleData()      { return useStress().bleData; }
export function useSos()          { const { sosArmed, sendSos, dismissSos } = useStress(); return { sosArmed, sendSos, dismissSos }; }
export function useActiveSource() { return useStress().activeSource; }