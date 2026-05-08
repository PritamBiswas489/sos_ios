/**
 * MyStressMonitor — Health Connect edition
 */

import React, {useRef, useEffect, useState} from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Animated, Easing, Modal, TextInput,
  KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import styles from './style';
import {useStress, STRESS_STATE} from '../../context/StressContext';
import {useGoogleFit} from '../../context/GoogleFitContext';
import {useBle} from '../../context/BleContext';
import { formatDateSeparator, formatMessageTime } from '../../config/utility';

// ── Animated Stress Gauge ─────────────────────
function StressGauge({score, state}) {
  const anim      = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef(null);
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const scorePct = Math.round(safeScore);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: safeScore / 100, duration: 1200,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, [safeScore]);

  useEffect(() => {
    pulseLoop.current?.stop();
    pulseAnim.setValue(1);
    if (state.level >= 3) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {toValue: 1.04, duration: 700, useNativeDriver: true}),
          Animated.timing(pulseAnim, {toValue: 1,    duration: 700, useNativeDriver: true}),
        ]),
      );
      pulseLoop.current.start();
    }
    return () => pulseLoop.current?.stop();
  }, [state.level]);

  const ZONES = [
    {from: 0,  to: 25,  color: '#00E5A0', label: 'Relaxed'},
    {from: 25, to: 50,  color: '#FFD166', label: 'Elevated'},
    {from: 50, to: 75,  color: '#FF8C42', label: 'High'},
    {from: 75, to: 100, color: '#FF3366', label: 'Critical'},
  ];

  const activeZone = ZONES.find(z => scorePct < z.to) ?? ZONES[3];

  return (
    <Animated.View style={[styles.gaugeCard, {transform: [{scale: pulseAnim}]}]}>
      {/* Top color accent bar */}
      <View style={[styles.gaugeAccentBar, {backgroundColor: state.color}]} />

      {/* Circular dial */}
      <View style={styles.gaugeCircleWrap}>
        <View style={[styles.gaugeOuterRing, {borderColor: state.color, shadowColor: state.color}]}>
          <View style={styles.gaugeInner}>
            <Text style={styles.gaugeEmoji}>{state.emoji}</Text>
            <Text style={[styles.gaugeScore, {color: state.color}]}>{scorePct}</Text>
            <Text style={styles.gaugeScoreUnit}>/ 100</Text>
            <View style={[styles.gaugeStatePill, {backgroundColor: state.color + '20', borderColor: state.color + '50'}]}>
              <Text style={[styles.gaugeStateLabel, {color: state.color}]}>{state.label}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stats strip */}
   

      {/* Segmented zone bar */}
      <View style={styles.gaugeZoneWrap}>
        <View style={styles.gaugeZoneHeaderRow}>
          <Text style={styles.gaugeZoneHeaderLabel}>Stress Load</Text>
          <Text style={[styles.gaugeZoneHeaderPct, {color: state.color}]}>{scorePct}%</Text>
        </View>
        <View style={styles.gaugeSegBar}>
          {ZONES.map((z, i) => (
            <View key={i} style={styles.gaugeSegSlot}>
              <View style={[styles.gaugeSegTrack, {backgroundColor: z.color + '20'}]}>
                <Animated.View style={[styles.gaugeSegFill, {
                  backgroundColor: z.color,
                  width: anim.interpolate({
                    inputRange: [z.from / 100, z.to / 100],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp',
                  }),
                }]} />
              </View>
            </View>
          ))}
        </View>
        <View style={styles.gaugeTickRow}>
          {['0', '25', '50', '75', '100'].map((t, i) => (
            <Text key={i} style={styles.gaugeTick}>{t}</Text>
          ))}
        </View>
        <View style={styles.gaugeZoneLegend}>
          {ZONES.map((z, i) => (
            <View key={i} style={styles.gaugeZoneLegendItem}>
              <View style={[styles.gaugeZoneLegendDot, {backgroundColor: z.color}]} />
              <Text style={styles.gaugeZoneLegendText}>{z.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

// ── Metric Card ───────────────────────────────
function MetricCard({icon, label, value, unit, color = '#A0AEC0', sub}) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIconWrap, {backgroundColor: color + '18'}]}>
        <Text style={styles.metricIcon}>{icon}</Text>
      </View>
      <Text style={[styles.metricValue, {color}]}>
        {value ?? '–'}
        {unit ? <Text style={styles.metricUnit}> {unit}</Text> : null}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
      {sub ? <Text style={[styles.metricSub, {color}]}>{sub}</Text> : null}
    </View>
  );
}

// ── Breakdown Bar ─────────────────────────────
function BreakdownBar({label, score, max, color, icon}) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const pct = Math.min(100, (score / max) * 100);

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct, duration: 900,
      easing: Easing.out(Easing.quad), useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={styles.barRow}>
      <View style={[styles.barIconWrap, {backgroundColor: color + '18'}]}>
        <Text style={styles.barIcon}>{icon}</Text>
      </View>
      <View style={styles.barContent}>
        <View style={styles.barTopRow}>
          <Text style={styles.barLabel}>{label}</Text>
          <Text style={[styles.barScore, {color}]}>
            {score}<Text style={styles.barMax}>/{max}</Text>
          </Text>
        </View>
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, {
            width: widthAnim.interpolate({inputRange: [0, 100], outputRange: ['0%', '100%']}),
            backgroundColor: color,
          }]} />
        </View>
        <Text style={[styles.barPct, {color: color + 'AA'}]}>{Math.round(pct)}% of max</Text>
      </View>
    </View>
  );
}

// ── Source Badge ──────────────────────────────
function SourceBadge({active, label, icon}) {
  return (
    <View style={[styles.badge, {
      backgroundColor: active ? '#00E5A010' : '#FFFFFF08',
      borderColor:     active ? '#00E5A040' : '#FFFFFF10',
    }]}>
      <Text style={styles.badgeIcon}>{icon}</Text>
      <View style={[styles.badgeDot, {backgroundColor: active ? '#00E5A0' : '#3D4E6A'}]} />
      <Text style={[styles.badgeText, {color: active ? '#E8EDF5' : '#3D4E6A'}]}>{label}</Text>
    </View>
  );
}

// ── SOS Banner ────────────────────────────────
function SosBanner({visible, stressState}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const loop    = useRef(null);

  useEffect(() => {
    if (visible) {
      loop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {toValue: 1,   duration: 500, useNativeDriver: true}),
          Animated.timing(opacity, {toValue: 0.4, duration: 500, useNativeDriver: true}),
        ]),
      );
      loop.current.start();
    } else {
      loop.current?.stop();
      opacity.setValue(0);
    }
    return () => loop.current?.stop();
  }, [visible]);

  if (!visible) return null;
  return (
    <Animated.View style={[styles.sosBanner, {opacity, borderColor: stressState.color}]}>
      <Text style={styles.sosBannerIcon}>⚠️</Text>
      <Text style={[styles.sosBannerText, {color: stressState.color}]}>
        {stressState === STRESS_STATE.CRITICAL
          ? 'Critical Stress — SOS Ready'
          : 'High Stress — Monitor Closely'}
      </Text>
    </Animated.View>
  );
}

const TIPS = {
  Relaxed:  "You're in balance. Your nervous system is thriving — keep it up.",
  Low:      'Mild tension detected. A short walk or stretching will keep you stable.',
  Moderate: 'Try box breathing (4‑4‑4‑4) or 5 minutes of mindfulness now.',
  High:     'Step away. Hydrate, breathe deeply, and rest for at least 10 minutes.',
  Critical: 'Critical level — if emergency, use SOS. Sit down, breathe slowly, call someone.',
};
// ── Manual HR Test Modal ──────────────────
const HR_PRESETS = [
  {label: 'Relaxed',  hr: 65,  color: '#00E5A0'},
  {label: 'Low',      hr: 80,  color: '#7EE8A2'},
  {label: 'Moderate', hr: 100, color: '#FFD166'},
  {label: 'High',     hr: 135, color: '#FF8C42'},
  {label: 'Critical', hr: 170, color: '#FF3366'},
];

function ManualHRModal({visible, currentOverride, onApply, onClear, onClose}) {
  const [inputVal, setInputVal] = useState(
    currentOverride != null ? String(currentOverride) : '72',
  );

  // Sync input when modal opens
  useEffect(() => {
    if (visible) {
      setInputVal(currentOverride != null ? String(currentOverride) : '72');
    }
  }, [visible, currentOverride]);

  const parsed  = parseInt(inputVal, 10);
  const isValid = !isNaN(parsed) && parsed >= 30 && parsed <= 220;

  const hrColor = !isValid ? '#3D4E6A'
    : parsed >= 160 ? '#FF3366'
    : parsed >= 130 ? '#FF8C42'
    : parsed >= 100 ? '#FFD166'
    : '#00E5A0';

  const step = delta => {
    const next = Math.max(30, Math.min(220, (parsed || 72) + delta));
    setInputVal(String(next));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalBackdrop}>
        <TouchableOpacity style={{flex: 1}} activeOpacity={1} onPress={() => { Keyboard.dismiss(); onClose(); }} />
        <View style={styles.manualHRSheet}>
          {/* Header */}
          <View style={styles.manualHRHeader}>
            <View>
              <Text style={styles.manualHRTitle}>Manual HR Override</Text>
              <Text style={styles.manualHRSub}>Injects HR directly into the stress algorithm</Text>
            </View>
            {currentOverride != null && (
              <View style={styles.manualHRActiveBadge}>
                <View style={styles.manualHRActiveDot} />
                <Text style={styles.manualHRActiveText}>ACTIVE</Text>
              </View>
            )}
          </View>

          {/* Big HR Input */}
          <View style={styles.manualHRInputRow}>
            <TouchableOpacity style={styles.manualHRStepBtn} onPress={() => step(-5)}>
              <Text style={styles.manualHRStepText}>−</Text>
            </TouchableOpacity>
            <View style={[styles.manualHRInputWrap, {borderColor: hrColor + '80'}]}>
              <TextInput
                style={[styles.manualHRInput, {color: isValid ? hrColor : '#FF3366'}]}
                value={inputVal}
                onChangeText={setInputVal}
                keyboardType="number-pad"
                maxLength={3}
                selectTextOnFocus
              />
              <Text style={styles.manualHRBpmLabel}>bpm</Text>
            </View>
            <TouchableOpacity style={styles.manualHRStepBtn} onPress={() => step(5)}>
              <Text style={styles.manualHRStepText}>+</Text>
            </TouchableOpacity>
          </View>

          {!isValid && (
            <Text style={styles.manualHRValidationError}>Enter a value between 30 and 220</Text>
          )}

          {/* Presets */}
          <Text style={styles.manualHRPresetsLabel}>QUICK PRESETS</Text>
          <View style={styles.manualHRPresets}>
            {HR_PRESETS.map(p => (
              <TouchableOpacity
                key={p.label}
                style={[
                  styles.manualHRPresetBtn,
                  {borderColor: p.color + '60', backgroundColor: p.color + '10'},
                  String(parsed) === String(p.hr) && {backgroundColor: p.color + '25', borderColor: p.color},
                ]}
                onPress={() => setInputVal(String(p.hr))}
                activeOpacity={0.7}>
                <Text style={[styles.manualHRPresetLabel, {color: p.color}]}>{p.label}</Text>
                <Text style={[styles.manualHRPresetHR, {color: p.color}]}>{p.hr}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.manualHRActions}>
            {currentOverride != null && (
              <TouchableOpacity
                style={styles.manualHRClearBtn}
                onPress={() => { onClear(); onClose(); }}
                activeOpacity={0.8}>
                <Text style={styles.manualHRClearText}>Clear Override</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.manualHRApplyBtn, !isValid && {opacity: 0.4}]}
              onPress={() => { if (isValid) { onApply(parsed); onClose(); } }}
              disabled={!isValid}
              activeOpacity={0.8}>
              <Text style={styles.manualHRApplyText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
// ── BLE Device Panel ─────────────────────────
function ScanDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {toValue: 1,   duration: 400, useNativeDriver: true}),
          Animated.timing(dot, {toValue: 0.3, duration: 400, useNativeDriver: true}),
          Animated.delay(800),
        ]),
      ).start();
    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);
  }, []);

  return (
    <View style={styles.scanDots}>
      {[dot1, dot2, dot3].map((d, i) => (
        <Animated.View key={i} style={[styles.scanDot, {opacity: d}]} />
      ))}
    </View>
  );
}

function DevicesPanel({ble, gf}) {
  const ringAnim = useRef(new Animated.Value(0)).current;
  const ringLoop = useRef(null);

  useEffect(() => {
    ringLoop.current?.stop();
    ringAnim.setValue(0);
    if (ble.scanning) {
      ringLoop.current = Animated.loop(
        Animated.timing(ringAnim, {toValue: 1, duration: 1800, useNativeDriver: true}),
      );
      ringLoop.current.start();
    }
    return () => ringLoop.current?.stop();
  }, [ble.scanning]);

  const ringScale   = ringAnim.interpolate({inputRange: [0, 1], outputRange: [1, 1.9]});
  const ringOpacity = ringAnim.interpolate({inputRange: [0, 0.6, 1], outputRange: [0.5, 0.15, 0]});

  const isIOS      = Platform.OS === 'ios';
  const hcLabel     = isIOS ? 'Apple Health' : 'Health Connect';
  const bleColor    = ble.connected ? '#00E5A0' : ble.scanning ? '#7EB8F7' : '#3D4E6A';
  const hcColor     = gf.authorized ? '#AA3CFF' : gf.loading   ? '#7EB8F7' : '#3D4E6A';
  const activeCount = (ble.connected ? 1 : 0) + (gf.authorized ? 1 : 0);
  const hcLatestHR  = gf.hrReadings?.[gf.hrReadings.length - 1]?.value;

  return (
    <View style={styles.devicesPanel}>
      {/* ── Header ── */}
      <View style={styles.devicesPanelHeader}>
        <Text style={styles.devicesPanelTitle}>Data Sources</Text>
        <View style={styles.devicesPanelMeta}>
          <View style={[styles.devicesPanelDot, {backgroundColor: bleColor}]} />
          <View style={[styles.devicesPanelDot, {backgroundColor: hcColor}]} />
          <Text style={styles.devicesPanelCount}>
            {activeCount === 0 ? 'None active' : `${activeCount}/2 active`}
          </Text>
        </View>
      </View>

      {/* ── BLE row ── */}
      <View style={styles.deviceRow}>
        <View style={styles.bleIconWrap}>
          {ble.scanning && (
            <Animated.View style={[styles.bleScanRing, {
              transform: [{scale: ringScale}],
              opacity: ringOpacity,
              borderColor: '#7EB8F7',
            }]} />
          )}
          <View style={[styles.bleIconCircle, {
            borderColor:     bleColor + '60',
            backgroundColor: bleColor + '10',
          }]}>
            <Text style={styles.bleIconText}>📡</Text>
          </View>
          <View style={[styles.bleStatusDot, {backgroundColor: bleColor}]} />
        </View>

        <View style={styles.bleInfo}>
          <Text style={styles.bleDeviceName} numberOfLines={1}>
            {ble.connected
              ? (ble.deviceName || 'HR Device')
              : ble.scanning ? 'Scanning for devices…'
              : 'BLE Heart Rate'}
          </Text>
          {ble.connected && ble.currentHR ? (
            <View style={styles.bleHrRow}>
              <Text style={styles.bleHrVal}>{ble.currentHR}</Text>
              <Text style={styles.bleHrUnit}> bpm</Text>
              <View style={styles.bleLiveBadge}>
                <View style={styles.bleLiveDot} />
                <Text style={styles.bleLiveText}>LIVE</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.bleDeviceSub}>
              {ble.connected
                ? 'Waiting for HR data…'
                : ble.scanning ? 'HR Service · 0x180D'
                : 'Pair a smartwatch or chest strap'}
            </Text>
          )}
        </View>

        {!ble.connected ? (
          <TouchableOpacity
            style={[styles.bleActionBtn, ble.scanning && styles.bleActionBtnMuted]}
            onPress={ble.startScan}
            disabled={ble.scanning}
            activeOpacity={0.75}>
            {ble.scanning ? <ScanDots /> : <Text style={styles.bleActionBtnText}>Scan</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.bleActionBtnDisconnect}
            onPress={ble.disconnect}
            activeOpacity={0.75}>
            <Text style={styles.bleActionBtnDisconnectText}>Disconnect</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Divider ── */}
      <View style={styles.devicesDivider} />

      {/* ── Health row (Health Connect on Android, Apple Health on iOS) ── */}
      <View style={styles.deviceRow}>
        <View style={styles.bleIconWrap}>
          <View style={[styles.bleIconCircle, {
            borderColor:     hcColor + '60',
            backgroundColor: hcColor + '10',
          }]}>
            <Text style={styles.bleIconText}>❤️</Text>
          </View>
          <View style={[styles.bleStatusDot, {backgroundColor: hcColor}]} />
        </View>

        <View style={styles.bleInfo}>
          <Text style={styles.bleDeviceName} numberOfLines={1}>
            {gf.authorized ? hcLabel
              : gf.loading  ? 'Connecting…'
              : hcLabel}
          </Text>
          {gf.authorized && hcLatestHR ? (
            <View style={styles.bleHrRow}>
              <Text style={[styles.bleHrVal, {color: '#AA3CFF'}]}>{hcLatestHR}</Text>
              <Text style={styles.bleHrUnit}> bpm</Text>
              <View style={[styles.bleLiveBadge, {backgroundColor: '#AA3CFF12', borderColor: '#AA3CFF30'}]}>
                <View style={[styles.bleLiveDot, {backgroundColor: '#AA3CFF'}]} />
                <Text style={[styles.bleLiveText, {color: '#AA3CFF'}]}>LIVE</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.bleDeviceSub}>
              {gf.authorized
                ? 'Waiting for HR data…'
                : gf.loading ? 'Requesting permissions…'
                : 'Tap to connect heart rate data'}
            </Text>
          )}
        </View>

        {!gf.authorized ? (
          <TouchableOpacity
            style={[styles.bleActionBtn, gf.loading && styles.bleActionBtnMuted]}
            onPress={gf.authorize}
            disabled={gf.loading}
            activeOpacity={0.75}>
            {gf.loading ? <ScanDots /> : <Text style={styles.bleActionBtnText}>Connect</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.bleActionBtnDisconnect}
            onPress={gf.disconnect}
            activeOpacity={0.75}>
            <Text style={styles.bleActionBtnDisconnectText}>Disconnect</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Errors ── */}
      {ble.error ? (
        <View style={styles.bleErrorBox}>
          <Text style={styles.bleErrorIcon}>⚠</Text>
          <Text style={styles.bleErrorText}>BLE: {ble.error}</Text>
        </View>
      ) : null}
      {gf.error ? (
        <View style={[styles.bleErrorBox, {marginTop: ble.error ? 4 : 8}]}>
          <Text style={styles.bleErrorIcon}>⚠</Text>
          <Text style={styles.bleErrorText}>{hcLabel}: {gf.error}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ── Main Component ────────────────────────────
export default function MyStressMonitor() {
  const {
    stress,
    sosArmed,
    sendSos,
    dismissSos,
    isUsingLastRecord,
    lastRecordedAt,
    activeSource,
    manualHROverride,
    setManualHR,
    clearManualHR,
  } = useStress();
  const gf  = useGoogleFit();
  const ble = useBle();

  const [hrModalVisible, setHrModalVisible] = useState(false);

  const displayHR = ble.connected && ble.currentHR ? ble.currentHR : stress.currentHR;
  const isAndroid  = Platform.OS === 'android';
  const hcName     = isAndroid ? 'Health Connect' : 'Apple Health';
  const hrSource = isUsingLastRecord
    ? `Last saved (${activeSource === 'ble' ? 'BLE' : hcName})`
    : (ble.connected ? 'Live BLE' : hcName);

  const fallbackDate = isUsingLastRecord ? formatDateSeparator(lastRecordedAt) : '';
  const fallbackTime = isUsingLastRecord ? formatMessageTime(lastRecordedAt) : '';
  const fallbackDisplay = isUsingLastRecord
    ? [fallbackDate, fallbackTime].filter(Boolean).join(' · ')
    : '';

  const hrvColor  = stress.rmssd > 40 ? '#00E5A0' : stress.rmssd > 20 ? '#FFD166' : '#FF3366';
  const zoneColor = stress.hrIntensity > 70 ? '#FF3366' : stress.hrIntensity > 50 ? '#FFD166' : '#00E5A0';

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
     

      {/* ── Data Sources (BLE + Health Connect) ── */}
      <DevicesPanel ble={ble} gf={gf} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ── Gauge ── */}
        <StressGauge score={stress.score} state={stress.state} />

        {/* ── Alert Banner ── */}
        <SosBanner visible={stress.state.level >= 3} stressState={stress.state} />

        

        {/* ── Source Status ── */}
        <View style={styles.badgeRow}>
          <SourceBadge active={gf.authorized} label={hcName} icon="❤️" />
          <SourceBadge active={ble.connected}  label={ble.connected ? ble.deviceName : 'BLE Device'} icon="📡" />
        </View>

        {isUsingLastRecord ? (
          <View style={styles.snapshotBadge}>
            <Text style={styles.snapshotBadgeIcon}>🕒</Text>
            <Text style={styles.snapshotBadgeText}>Offline snapshot</Text>
          </View>
        ) : null}

        {/* ── Heart Rate Hero ── */}
        <View style={styles.hrHero}>
          <View style={styles.hrHeroLeft}>
            <Text style={styles.hrHeroLabel}>Heart Rate</Text>
            <View style={styles.hrHeroValRow}>
              <Text style={styles.hrHeroVal}>{displayHR ?? '––'}</Text>
              <Text style={styles.hrHeroUnit}>bpm</Text>
            </View>
            <Text style={styles.hrHeroMeta}>
              <Text style={styles.hrSourceDot}>● </Text>
              {hrSource}  ·  Avg {stress.avgHR || '–'} bpm
            </Text>
            {fallbackDisplay ? (
              <Text style={styles.hrHeroMeta}>Last record: {fallbackDisplay}</Text>
            ) : null}
          </View>
          <View style={styles.hrHeroRight}>
            <View style={[styles.hrPulseRing, {borderColor: stress.state.color + '60'}]}>
              <Text style={styles.hrPulseEmoji}>{stress.state.emoji}</Text>
            </View>
          </View>
        </View>

        {/* ── Metrics ── */}
        <View style={styles.grid}>
          <MetricCard
            icon="💓" label="HRV · RMSSD" value={stress.rmssd} unit="ms"
            color={hrvColor}
            sub={stress.rmssd > 40 ? 'Good' : stress.rmssd > 20 ? 'Moderate' : 'Low'}
          />
          <MetricCard
            icon="⚡" label="HR Zone" value={stress.hrIntensity} unit="%"
            color={zoneColor}
            sub={stress.hrIntensity > 70 ? 'High' : stress.hrIntensity > 50 ? 'Elevated' : 'Normal'}
          />
        </View>

        {/* ── Score Breakdown ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Score Breakdown</Text>
            <View style={[styles.scorePill, {backgroundColor: stress.state.color + '18', borderColor: stress.state.color + '40'}]}>
              <Text style={[styles.scorePillText, {color: stress.state.color}]}>{stress.score}/100</Text>
            </View>
          </View>
          <Text style={styles.sectionDesc}>How your stress index is calculated from live biometrics.</Text>
          <BreakdownBar icon="🫀" label="Heart Rate"  score={stress.hrScore}    max={40} color="#FF8C42" />
          <BreakdownBar icon="💓" label="HRV Quality" score={stress.rmssdScore} max={30} color="#5352ED" />
        </View>

        {/* ── Tip ── */}
        <View style={styles.tipCard}>
          <Text style={styles.tipIcon}>💡</Text>
          <View style={styles.tipBody}>
            <Text style={styles.tipTitle}>Recommendation</Text>
            <Text style={styles.tipText}>{TIPS[stress.state.label] ?? 'Stay hydrated and keep monitoring.'}</Text>
          </View>
        </View>

        <View style={{height: 32}} />
      </ScrollView>

      {/* ── Manual HR FAB ── */}
      <TouchableOpacity
        style={[
          styles.manualHRFab,
          manualHROverride != null && styles.manualHRFabActive,
        ]}
        onPress={() => setHrModalVisible(true)}
        activeOpacity={0.85}>
        <Text style={styles.manualHRFabIcon}>♥</Text>
        {manualHROverride != null && (
          <View style={styles.manualHRFabBadge}>
            <Text style={styles.manualHRFabBadgeText}>{manualHROverride}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* ── Manual HR Modal ── */}
      <ManualHRModal
        visible={hrModalVisible}
        currentOverride={manualHROverride}
        onApply={setManualHR}
        onClear={clearManualHR}
        onClose={() => setHrModalVisible(false)}
      />
    </View>
  );
}


