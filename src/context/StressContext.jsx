/**
 * StressContext.jsx
 *
 * Consumes GoogleFitContext + BleContext separately.
 * Exposes both data sources independently so any screen
 * can read GF data, BLE data, and stress result individually.
 *
 * Exposed via useStress():
 *   stress        → computed score, state, breakdown
 *   googleFitData → hr (from GF only)
 *   bleData       → currentHR, hrBuffer, device info (from BLE only)
 *   activeSource  → 'ble' | 'googlefit'
 *   sosArmed, sendSos, dismissSos
 */

import React, {
  createContext, useContext, useState, useEffect,
  useMemo, useCallback, useRef,
  use,
} from 'react';
import {Vibration} from 'react-native';
import {useGoogleFit} from './GoogleFitContext';
import {useBle} from './BleContext';
import {StressDataService} from '../services/stressData.service';
import { useSocket } from './SocketContext';
import { buildStressRecord } from '../models/stressRecord.model';
import useUserAuth from '../hook/useUserAuth';
import { SOSService } from '../services/sos.service';
import { useOutgoingRequests } from '../hook/useOutgoingRequests';

// ── Stress States ─────────────────────────────
export const STRESS_STATE = {
  RELAXED:  {label: 'Relaxed',  color: '#00E5A0', emoji: '😌', level: 0},
  LOW:      {label: 'Low',      color: '#7EE8A2', emoji: '🙂', level: 1},
  MODERATE: {label: 'Moderate', color: '#FFD166', emoji: '😐', level: 2},
  HIGH:     {label: 'High',     color: '#FF8C42', emoji: '😟', level: 3},
  CRITICAL: {label: 'Critical', color: '#FF3366', emoji: '🆘', level: 4},
};

 
 

// ── Stress Algorithm ──────────────────────────
export function computeStress({
  hrValues = [],
  maxHR = 190,
  restingHR = 60,
}) {
  const empty = {
    score: 0,
    state: STRESS_STATE.RELAXED,
    rmssd: 0,
    currentHR: null,
    avgHR: 0,
    hrIntensity: 0,
    hrScore: 0,
    rmssdScore: 0,
  };

  if (!hrValues.length) return empty;

  const currentHR = hrValues[hrValues.length - 1];
  const avgHR =
    hrValues.reduce((a, b) => a + b, 0) / hrValues.length;

  // 🚨 ── 0. HARD SAFETY OVERRIDES ─────────────

  // Extreme abnormal (sensor or real danger)
  if (currentHR >= 180) {
    return {
      score: 100,
      state: STRESS_STATE.CRITICAL,
      rmssd: 0,
      currentHR,
      avgHR: Math.round(avgHR),
      hrIntensity: 100,
      hrScore: 40,
      rmssdScore: 40,
    };
  }

  // Very high HR (almost always critical)
  if (currentHR >= 160) {
    return {
      score: 90,
      state: STRESS_STATE.CRITICAL,
      rmssd: 0,
      currentHR,
      avgHR: Math.round(avgHR),
      hrIntensity: 90,
      hrScore: 38,
      rmssdScore: 30,
    };
  }

  // ── 1. HR INTENSITY (0–40) ────────────────
  const hrReserve = maxHR - restingHR;
  const hrIntensity = Math.max(
    0,
    (currentHR - restingHR) / hrReserve
  );

  let hrScore = hrIntensity * 40;

  // Boost for high HR
  if (currentHR >= 140) hrScore = Math.max(hrScore, 35);
  else if (currentHR >= 120) hrScore = Math.max(hrScore, 30);

  hrScore = Math.min(40, hrScore);

  // ── 2. VARIABILITY (STD DEV instead of fake RMSSD) ──
  let rmssd = 0;
  let rmssdScore = 0;

  if (hrValues.length >= 3) {
    const mean = avgHR;
    const variance =
      hrValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
      hrValues.length;

    const stdDev = Math.sqrt(variance);
    rmssd = stdDev;

    // Low variability = stress
    if (stdDev < 2) rmssdScore = 30;
    else if (stdDev < 5) rmssdScore = 20;
    else if (stdDev < 10) rmssdScore = 10;
    else rmssdScore = 0;
  }

  // ── 3. TREND (0–20) ──────────────────────
  let trendScore = 0;

  if (hrValues.length >= 5) {
    const trend =
      hrValues[hrValues.length - 1] -
      hrValues[hrValues.length - 5];

    if (trend > 25) trendScore = 20;
    else if (trend > 15) trendScore = 15;
    else if (trend > 8) trendScore = 10;
    else if (trend < -10) trendScore = -5;
  }

  // ── 4. HIGH HR + LOW VARIABILITY BOOST ───
  if (currentHR > 120 && rmssd < 3) {
    rmssdScore += 10;
  }

  // ── FINAL SCORE ──────────────────────────
  let score = hrScore + rmssdScore + trendScore;

  score = Math.max(0, Math.min(100, score));

  // ── STATE ────────────────────────────────
  let state = STRESS_STATE.RELAXED;

  if (score >= 80 || currentHR >= 150) {
    state = STRESS_STATE.CRITICAL;
  } else if (score >= 60 || currentHR >= 130) {
    state = STRESS_STATE.HIGH;
  } else if (score >= 40) {
    state = STRESS_STATE.MODERATE;
  } else if (score >= 20) {
    state = STRESS_STATE.LOW;
  }

  return {
    score: Math.round(score),
    state,
    rmssd: Math.round(rmssd),
    currentHR,
    avgHR: Math.round(avgHR),
    hrIntensity: Math.round(hrIntensity * 100),
    hrScore: Math.round(hrScore),
    rmssdScore: Math.round(rmssdScore),
  };
}
// ── Context ───────────────────────────────────
const StressContext = createContext(null);

// ── Provider ──────────────────────────────────
export function StressProvider({
  children,
  criticalThreshold=76,
   
}) {
  const gf  = useGoogleFit();
  const ble = useBle();

  const { isAuthenticated } = useUserAuth();

  const [sosArmed, setSosArmed] = useState(false);
  const [lastRecordedFallback, setLastRecordedFallback] = useState(null);
  const [contactsLastHealthData, setContactsLastHealthData] = useState(null);
  const [manualHROverride, setManualHROverride] = useState(null); // DEV: manual HR injection
  const prevScoreRef = useRef(0);
  const lastSosTriggerScoreRef = useRef(0);
  const lastSavedAtRef = useRef(0);
  const lastSavedFingerprintRef = useRef('');
  const { on, emitNoAck, emit, isConnected } = useSocket();
  const {fetchOutgoingRequests} = useOutgoingRequests();

  // ────────────────────────────────────────────
  // GOOGLE FIT DATA BLOCK
  // Pure GF snapshot — all fields from Google Fit only
  // ────────────────────────────────────────────
  const googleFitData = useMemo(() => ({
    // Heart Rate from Google Fit
    hrReadings: gf.hrReadings,                              // [{value, startDate}]
    hrValues:   gf.hrReadings.map(r => r.value),           // [bpm, bpm, ...]
    latestHR:   gf.hrReadings.length
                  ? gf.hrReadings[gf.hrReadings.length - 1].value
                  : null,
    avgHR: gf.hrReadings.length
      ? Math.round(gf.hrReadings.reduce((a,r)=>a+r.value,0) / gf.hrReadings.length)
      : null,

    // Status
    authorized: gf.authorized,
    loading:    gf.loading,
    error:      gf.error,

    // Actions
    authorize: gf.authorize,
    refresh:   gf.refresh,
  }), [gf]);

  // ────────────────────────────────────────────
  // BLE DATA BLOCK
  // Pure BLE snapshot — live HR stream only
  // Updates every ~1 second when device is connected
  // ────────────────────────────────────────────
  const bleData = useMemo(() => ({
    // Live Heart Rate
    currentHR: ble.currentHR,                              // latest single reading
    hrBuffer:  ble.hrBuffer,                               // last 60 readings array
    latestHR:  ble.currentHR,
    avgHR: ble.hrBuffer.length
      ? Math.round(ble.hrBuffer.reduce((a,b)=>a+b,0) / ble.hrBuffer.length)
      : null,
    minHR: ble.hrBuffer.length ? Math.min(...ble.hrBuffer) : null,
    maxHR: ble.hrBuffer.length ? Math.max(...ble.hrBuffer) : null,

    // Device Info
    deviceName: ble.deviceName,
    connected:  ble.connected,
    scanning:   ble.scanning,
    error:      ble.error,

    // Actions
    startScan:  ble.startScan,
    disconnect: ble.disconnect,
  }), [ble]);

  // ────────────────────────────────────────────
  // ACTIVE SOURCE
  // BLE takes priority when connected + has data
  // ────────────────────────────────────────────
  const activeSource = ble.connected && ble.hrBuffer.length > 0
    ? 'ble'
    : 'googlefit';

  const mergedHRValues = manualHROverride !== null
    ? Array(15).fill(manualHROverride)   // DEV: spread over 15 slots so trend/variability computes
    : activeSource === 'ble'
      ? ble.hrBuffer
      : gf.hrReadings.map(r => r.value);

  // ────────────────────────────────────────────
  // STRESS CALCULATION
  // Uses merged HR + GF context data (sleep, spo2)
  // ────────────────────────────────────────────
  const stress = useMemo(() =>
    computeStress({hrValues: mergedHRValues}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mergedHRValues.join(',')],
  );

  const hasLiveData = mergedHRValues.length > 0;

  useEffect(() => {
    if (hasLiveData) {
      setLastRecordedFallback(null);
      return;
    }
    if (!isAuthenticated) {
      setLastRecordedFallback(null);
      return;
    }

    StressDataService.getLatest(result => {
      if (!result?.success) return;
      const latest = result.data;

      if (!latest) {
        setLastRecordedFallback(null);
        return;
      }

      const fallbackState =
        Object.values(STRESS_STATE).find(s => s.label === latest.stress_state) ||
        STRESS_STATE.RELAXED;

      setLastRecordedFallback({
        stress: {
          score: Number(latest.stress_score ?? 0),
          state: fallbackState,
          rmssd: Number(latest.rmssd ?? 0),
          currentHR: latest.current_hr == null ? null : Number(latest.current_hr),
          avgHR: latest.avg_hr == null ? null : Number(latest.avg_hr),
          hrIntensity: Number(latest.hr_intensity ?? 0),
          hrScore: Number(latest.hr_score ?? 0),
          rmssdScore: Number(latest.rmssd_score ?? 0),
        },
        source: latest.source,
        recordedAt: latest.created_at,
      
      });
    });
  }, [hasLiveData, isAuthenticated]);

  const resolvedStress = hasLiveData
    ? stress
    : (lastRecordedFallback?.stress ?? stress);

  const resolvedActiveSource = hasLiveData
    ? activeSource
    : (lastRecordedFallback?.source ?? activeSource);

  // ────────────────────────────────────────────
  // STRESS/HR PERSISTENCE
  // Save only when a valid source has data
  // ────────────────────────────────────────────
  useEffect(() => {
    const hasBleData    = ble.connected && ble.hrBuffer.length > 0;
    const hasGfData     = gf.hrReadings.length > 0;
    const hasManualData = manualHROverride !== null;

    // Skip insert if no data source is active.
    if (!hasBleData && !hasGfData && !hasManualData) return;

    // Skip insert if stress was computed without a current HR value.
    if (stress.currentHR == null) return;

    const now = Date.now();
    const saveThrottleMs = 10_000;
    if (now - lastSavedAtRef.current < saveThrottleMs) return;

    const effectiveSource = hasManualData ? 'manual' : activeSource;

    const fingerprint = [
      effectiveSource,
      stress.currentHR,
      stress.score,
      stress.rmssd,
      stress.avgHR,
    ].join(':');

    if (fingerprint === lastSavedFingerprintRef.current) return;

    lastSavedAtRef.current = now;
    lastSavedFingerprintRef.current = fingerprint;
    console.log({
      stress,
      activeSource: effectiveSource,
      bleData,
      googleFitData,
    });
    const insertData = buildStressRecord({
      stress,
      activeSource: effectiveSource,
      bleData,
      googleFitData,
    });
    console.log('Inserting stress record:', insertData);
    // Emit to trusted contacts before saving, so they get the update faster (no API roundtrip)
    emitNoAck('contact:healthdata:update', JSON.stringify(insertData));
    StressDataService.insertFromContext(
      insertData,
      result => {
        if (__DEV__ && !result.success) {
          console.log('Stress save skipped/failed:', result.error);
        }
      },
    );
  }, [
    activeSource,
    ble.connected,
    ble.hrBuffer.length,
    bleData,
    gf.hrReadings.length,
    googleFitData,
    manualHROverride,
    stress,
    emitNoAck,
  ]);

  // ────────────────────────────────────────────
  // SOS AUTO-TRIGGER
  // Fires only on rising edge: normal → critical
  // ────────────────────────────────────────────
  useEffect(() => {
    console.log(`Stress score updated: ${stress.score} (${stress.state.label}) — Source: ${activeSource}`);
    console.log({criticalThreshold});

    const inCriticalRange = stress.score >= criticalThreshold && stress.score <= 100;

    if (inCriticalRange && stress.score > lastSosTriggerScoreRef.current) {
      lastSosTriggerScoreRef.current = stress.score;
      setSosArmed(true);
      // Vibration.vibrate([0, 500, 200, 500, 200, 500]);
      console.log(`SOS API triggered at score: ${stress.score}`);
        SOSService.triggerStressSos({ hr: stress.currentHR, stress_score: stress.score}, result => {
        if (result.success) {
           fetchOutgoingRequests();
        }
      });
      
    }

    if (!inCriticalRange) {
      lastSosTriggerScoreRef.current = 0;
      if (sosArmed) setSosArmed(false);
    }
  }, [stress.score]);

  const sendSos = useCallback(() => {
    console.log('SOS manually triggered by user');
    // setSosArmed(false);
  }, [stress, googleFitData, bleData, activeSource]);

  const dismissSos = useCallback(() => setSosArmed(false), []);

  // ────────────────────────────────────────────
  // FETCH CONTACTS' LAST HEALTH DATA
  // For map/list fallback when no live data
  // ────────────────────────────────────────────
  const getContactLastHealthData = useCallback(async () => {
    try{
      const response = await new Promise((resolve, reject) => {
              StressDataService.getContactsLastHealthData(result => {
                if (result.success) {
                  resolve(result.data);
                } else {            
                  reject(new Error(result.error || 'Unknown error fetching health data'));
                }        
              });
            });
            if(response?.data){
              console.log('Fetched contacts last health data:', response.data);
              const contactStressData = []
              response.data.forEach(contact => {
                contactStressData[contact.user_id] = {
                  stress: {
                    score:       Number(contact.stress_score ?? 0),
                    state:       Object.values(STRESS_STATE).find(
                                   s => s.label.toLowerCase() === (contact.stress_state ?? '').toLowerCase()
                                 ) ?? STRESS_STATE.RELAXED,
                    rmssd:       Number(contact.rmssd ?? 0),
                    currentHR:   contact.current_hr  == null ? null : Number(contact.current_hr),
                    avgHR:       contact.avg_hr       == null ? null : Number(contact.avg_hr),
                    hrIntensity: Number(contact.hr_intensity ?? 0),
                    hrScore:     Number(contact.hr_score     ?? 0),
                    rmssdScore:  Number(contact.rmssd_score  ?? 0),
                  },
                  source:     contact.source,
                  recordedAt: contact.created_at,
                }
              });
              setContactsLastHealthData(contactStressData);
            }

    }catch (err) {
      console.error('Failed to get contacts last health data:', err.message);
    }
  },[]);
  useEffect(() => {
    // Fetch contacts' last health data on mount
    if(isAuthenticated){
        getContactLastHealthData();
    }
   
  }, [getContactLastHealthData, isAuthenticated]);

  useEffect(() => {
    if(!isConnected) return;

    const unsubs = [
      on('contact:healthdata:updated', (payload) => {
         const data = {};
         if (typeof payload === 'string') {
           try {
             const parsed = JSON.parse(payload);
             Object.assign(data, parsed);
           } catch (err) {
             console.error(
               'Failed to parse contact:healthdata:updated payload:',
               err.message,
             );
             return;
           }
         } else if (typeof payload === 'object' && payload !== null) {
           Object.assign(data, payload);
         } else {
           console.error(
             'Received invalid payload for contact:healthdata:updated:',
             payload,
           );
           return;
         }
         console.log('Received contact:healthdata:updated event with data:', data);
         if(data?.userId){
          console.log(`Received health data update for user ${data.userId}:`, data);
          const healthData = data.healthData || {};
          const fallbackState = {
                stress: {
                  score:       Number(healthData.stress_score ?? 0),
                  state:       Object.values(STRESS_STATE).find(
                                 s => s.label.toLowerCase() === (healthData.stress_state ?? '').toLowerCase()
                               ) ?? STRESS_STATE.RELAXED,
                  rmssd:       Number(healthData.rmssd ?? 0),
                  currentHR:   healthData.current_hr  == null ? null : Number(healthData.current_hr),
                  avgHR:       healthData.avg_hr      == null ? null : Number(healthData.avg_hr),
                  hrIntensity: Number(healthData.hr_intensity ?? 0),
                  hrScore:     Number(healthData.hr_score     ?? 0),
                  rmssdScore:  Number(healthData.rmssd_score  ?? 0),
                },
                source:     healthData.source,
                recordedAt: healthData.created_at,
              };
              console.log(`Updating last health data for user ${data.userId} with:`, fallbackState);
            setContactsLastHealthData(prev => ({
              ...prev,
              [data.userId]:  fallbackState,
             }));
         }
      })
    ];
    return () => {      
      unsubs.forEach(unsub => unsub());
    }

  },[isConnected, on, emitNoAck])

  // ────────────────────────────────────────────
  // CONTEXT VALUE
  // ────────────────────────────────────────────
  const value = useMemo(() => ({
    stress: resolvedStress, // live stress or last saved fallback
    googleFitData,    // ← GF-only block
    bleData,          // ← BLE-only block
    activeSource: resolvedActiveSource, // 'ble' | 'googlefit'
    hasLiveData,
    isUsingLastRecord: !hasLiveData && !!lastRecordedFallback,
    lastRecordedAt: lastRecordedFallback?.recordedAt ?? null,
    sosArmed,
    sendSos,
    dismissSos,
    contactsLastHealthData, // ← Contacts' last health data for fallback in map/list
    manualHROverride,
    setManualHR: setManualHROverride,
    clearManualHR: () => setManualHROverride(null),
  }), [
    resolvedStress,
    googleFitData,
    bleData,
    resolvedActiveSource,
    hasLiveData,
    lastRecordedFallback,
    sosArmed,
    sendSos,
    dismissSos,
    contactsLastHealthData,
    manualHROverride,
  ]);

  return (
    <StressContext.Provider value={value}>
      {children}
    </StressContext.Provider>
  );
}

// ─────────────────────────────────────────────
// HOOKS — consume only what you need
// ─────────────────────────────────────────────

/** Everything */
export function useStress() {
  const ctx = useContext(StressContext);
  if (!ctx) throw new Error('useStress must be inside StressProvider');
  return ctx;
}

/** Only stress score + state → gauge, banner */
export function useStressScore() {
  const {stress} = useStress();
  return stress;
}

/** Only Google Fit data → sleep, spo2 cards */
export function useGoogleFitData() {
  const {googleFitData} = useStress();
  return googleFitData;
}

/** Only BLE data → live HR, device status */
export function useBleData() {
  const {bleData} = useStress();
  return bleData;
}

/** Only SOS controls */
export function useSos() {
  const {sosArmed, sendSos, dismissSos} = useStress();
  return {sosArmed, sendSos, dismissSos};
}

/** Which source is driving stress calc */
export function useActiveSource() {
  const {activeSource} = useStress();
  return activeSource;
}
