/**
 * ContactStressMonitor
 * Shows a selected contact's stress score, BPM, HRV and breakdown.
 * ── Static data is used now; swap TODO sections for real API/socket data later.
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from './style';
import { useSelector } from 'react-redux';
import { STRESS_STATE } from '../../context/StressContext';
import { useStress } from '../../context/StressContext';
import { formatDateSeparator, formatMessageTime } from '../../config/utility';
import { useNavigation } from '@react-navigation/native';
// ─────────────────────────────────────────────
// STATIC PLACEHOLDER DATA  (replace with props / selector later)
// ─────────────────────────────────────────────

const STRESS_TIPS = {
  Relaxed: 'Your contact is calm and balanced. No action needed.',
  Low: 'Mild tension. A quick check-in message might be nice.',
  Moderate: 'Stress is building — consider reaching out.',
  High: 'Elevated stress detected. Recommend contacting them soon.',
  Critical: 'Critical level — contact them immediately or send SOS.',
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function ContactAvatar({ contact, stressColor }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.07,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.avatarOuter,
        { transform: [{ scale: pulseAnim }], shadowColor: stressColor },
      ]}
    >
      <View style={[styles.avatarRing, { borderColor: stressColor }]}>
        {contact?.profile_image ? (
          <Image
            source={{ uri: contact?.profile_image }}
            style={styles.avatarImg}
          />
        ) : (
          <View
            style={[
              styles.avatarFallback,
              { backgroundColor: stressColor + '22' },
            ]}
          >
            <Text style={[styles.avatarInitial, { color: stressColor }]}>
              {contact?.initial || contact?.name?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

function StressGauge({ score, state }) {
  const anim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef(null);
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const scorePct = Math.round(safeScore);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: safeScore / 100,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [safeScore]);

  useEffect(() => {
    pulseLoop.current?.stop();
    pulseAnim.setValue(1);
    if (state.level >= 3) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      );
      pulseLoop.current.start();
    }
    return () => pulseLoop.current?.stop();
  }, [state.level]);

  const ZONES = [
    { from: 0, to: 25, color: '#00E5A0', label: 'Relaxed' },
    { from: 25, to: 50, color: '#FFD166', label: 'Elevated' },
    { from: 50, to: 75, color: '#FF8C42', label: 'High' },
    { from: 75, to: 100, color: '#FF3366', label: 'Critical' },
  ];

  const activeZone = ZONES.find(z => scorePct < z.to) ?? ZONES[3];

  return (
    <Animated.View
      style={[styles.gaugeCard, { transform: [{ scale: pulseAnim }] }]}
    >
      {/* Top color accent bar */}
      <View style={[styles.gaugeAccentBar, { backgroundColor: state.color }]} />

      {/* Circular dial */}
      <View style={styles.gaugeCircleWrap}>
        <View
          style={[
            styles.gaugeOuterRing,
            { borderColor: state.color, shadowColor: state.color },
          ]}
        >
          <View style={styles.gaugeInner}>
            <Text style={styles.gaugeEmoji}>{state.emoji}</Text>
            <Text style={[styles.gaugeScore, { color: state.color }]}>
              {scorePct}
            </Text>
            <Text style={styles.gaugeScoreUnit}>/ 100</Text>
            <View
              style={[
                styles.gaugeStatePill,
                {
                  backgroundColor: state.color + '20',
                  borderColor: state.color + '50',
                },
              ]}
            >
              <Text style={[styles.gaugeStateLabel, { color: state.color }]}>
                {state.label}
              </Text>
            </View>
          </View>
        </View>
      </View>

      

      {/* Segmented zone bar */}
      <View style={styles.gaugeZoneWrap}>
        <View style={styles.gaugeZoneHeaderRow}>
          <Text style={styles.gaugeZoneHeaderLabel}>Stress Load</Text>
          <Text style={[styles.gaugeZoneHeaderPct, { color: state.color }]}>
            {scorePct}%
          </Text>
        </View>
        <View style={styles.gaugeSegBar}>
          {ZONES.map((z, i) => (
            <View key={i} style={styles.gaugeSegSlot}>
              <View
                style={[
                  styles.gaugeSegTrack,
                  { backgroundColor: z.color + '20' },
                ]}
              >
                <Animated.View
                  style={[
                    styles.gaugeSegFill,
                    {
                      backgroundColor: z.color,
                      width: anim.interpolate({
                        inputRange: [z.from / 100, z.to / 100],
                        outputRange: ['0%', '100%'],
                        extrapolate: 'clamp',
                      }),
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
        <View style={styles.gaugeTickRow}>
          {['0', '25', '50', '75', '100'].map((t, i) => (
            <Text key={i} style={styles.gaugeTick}>
              {t}
            </Text>
          ))}
        </View>
        <View style={styles.gaugeZoneLegend}>
          {ZONES.map((z, i) => (
            <View key={i} style={styles.gaugeZoneLegendItem}>
              <View
                style={[
                  styles.gaugeZoneLegendDot,
                  { backgroundColor: z.color },
                ]}
              />
              <Text style={styles.gaugeZoneLegendText}>{z.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

function BpmHero({ bpm, avgBpm, stressColor, isLive, lastUpdated }) {
  const dotAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isLive) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, {
          toValue: 0.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(dotAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isLive]);

  return (
    <View style={styles.bpmHero}>
      <View style={styles.bpmHeroLeft}>
        <Text style={styles.bpmHeroLabel}>Heart Rate</Text>
        <View style={styles.bpmValRow}>
          <Text style={[styles.bpmVal, { color: stressColor }]}>
            {bpm ?? '––'}
          </Text>
          <Text style={styles.bpmUnit}>bpm</Text>
        </View>
        <Text style={styles.bpmMeta}>
          Avg {avgBpm || '–'} bpm · {lastUpdated}
        </Text>
      </View>

      <View style={styles.bpmHeroRight}>
        {isLive && (
          <View style={styles.liveBadge}>
            <Animated.View style={[styles.liveDot, { opacity: dotAnim }]} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
        <View
          style={[styles.bpmPulseRing, { borderColor: stressColor + '60' }]}
        >
          <Text style={styles.bpmPulseIcon}>🫀</Text>
        </View>
      </View>
    </View>
  );
}

function MetricCard({ icon, label, value, unit, color = '#A0AEC0', sub }) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIconWrap, { backgroundColor: color + '18' }]}>
        <Text style={styles.metricIcon}>{icon}</Text>
      </View>
      <Text style={[styles.metricValue, { color }]}>
        {value ?? '–'}
        {unit ? <Text style={styles.metricUnit}> {unit}</Text> : null}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
      {sub ? <Text style={[styles.metricSub, { color }]}>{sub}</Text> : null}
    </View>
  );
}

function BreakdownBar({ label, score, max, color, icon }) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const pct = Math.min(100, (score / max) * 100);

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 900,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={styles.barRow}>
      <View style={[styles.barIconWrap, { backgroundColor: color + '18' }]}>
        <Text style={styles.barIcon}>{icon}</Text>
      </View>
      <View style={styles.barContent}>
        <View style={styles.barTopRow}>
          <Text style={styles.barLabel}>{label}</Text>
          <Text style={[styles.barScore, { color }]}>
            {score}
            <Text style={styles.barMax}>/{max}</Text>
          </Text>
        </View>
        <View style={styles.barTrack}>
          <Animated.View
            style={[
              styles.barFill,
              {
                width: widthAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: color,
              },
            ]}
          />
        </View>
        <Text style={[styles.barPct, { color: color + 'AA' }]}>
          {Math.round(pct)}% of max
        </Text>
      </View>
    </View>
  );
}

function StatusBanner({ level, stressColor, label }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (level >= 3) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.4,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      opacity.setValue(1);
    }
  }, [level]);

  if (level < 2) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          opacity,
          borderColor: stressColor,
          backgroundColor: stressColor + '10',
        },
      ]}
    >
      <Text style={styles.bannerIcon}>{level >= 3 ? '⚠️' : 'ℹ️'}</Text>
      <Text style={[styles.bannerText, { color: stressColor }]}>
        {level >= 3
          ? `${label} Stress — Consider reaching out`
          : `${label} Stress — Monitoring closely`}
      </Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export default function ContactStressMonitor() {
   const healthSelectedContact = useSelector(
    state => state.healthSelectedContact,
  );
  const {contactsLastHealthData} = useStress();
  const navigation = useNavigation();
  const selectedContactData =
    contactsLastHealthData?.[healthSelectedContact?.item?.receipent_id];
  const contact = healthSelectedContact?.item;
  const stress = {
    score: selectedContactData?.stress?.score ?? 0,
    label:
      selectedContactData?.stress?.state?.label ?? STRESS_STATE.RELAXED.label,
    emoji:
      selectedContactData?.stress?.state?.emoji ?? STRESS_STATE.RELAXED.emoji,
    color:
      selectedContactData?.stress?.state?.color ?? STRESS_STATE.RELAXED.color,
    level:
      selectedContactData?.stress?.state?.level ?? STRESS_STATE.RELAXED.level,
  };
  const metrics = {
    bpm: selectedContactData?.stress?.currentHR ?? 0,
    avgBpm: selectedContactData?.stress?.avgHR ?? 0,
    rmssd: selectedContactData?.stress?.rmssd ?? 0,
    hrIntensity: selectedContactData?.stress?.hrIntensity ?? 0,
    lastUpdated:
      formatDateSeparator(selectedContactData?.recordedAt) +
      ' ' +
      formatMessageTime(selectedContactData?.recordedAt),
    isLive: true,
  };
  const breakdown = {
    hrScore: selectedContactData?.stress?.hrScore ?? 0,
    rmssdScore: selectedContactData?.stress?.rmssdScore ?? 0,
  };
  const hrvColor =
    metrics.rmssd > 40 ? '#00E5A0' : metrics.rmssd > 20 ? '#FFD166' : '#FF3366';
  const zoneColor =
    metrics.hrIntensity > 70
      ? '#FF3366'
      : metrics.hrIntensity > 50
      ? '#FFD166'
      : '#00E5A0';
 
  

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Contact Header ── */}
      <View style={styles.contactHeader}>
        <ContactAvatar contact={contact} stressColor={stress.color} />
        <View style={styles.contactInfo}>
          <Text style={styles.contactName} numberOfLines={1}>
            {contact?.name}
          </Text>
          
          <View
            style={[
              styles.stressLevelPill,
              {
                backgroundColor: stress.color + '18',
                borderColor: stress.color + '40',
              },
            ]}
          >
            <Text style={[styles.stressLevelText, { color: stress.color }]}>
              {stress.emoji} {stress.label}
            </Text>
          </View>

          {/* ── Action Buttons ── */}
          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionBtnChat,
                pressed && styles.actionBtnPressed,
              ]}
              onPress={() => {
                navigation.navigate('Main', {
                  screen: 'MainTabs',
                  params: {
                    screen: 'Chat',
                    params: {
                      selectedReceipentId:
                        healthSelectedContact?.item?.receipent_id,
                    },
                  },
                });
              }}
            >
              <Icon name="chat" size={15} color="#4A90FF" />
              <Text style={[styles.actionBtnLabel, { color: '#4A90FF' }]}>
                Chat
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionBtnAudio,
                pressed && styles.actionBtnPressed,
              ]}
              onPress={() => {
                navigation.navigate('Main', {
                  screen: 'MainTabs',
                  params: {
                    screen: 'AudioStream',
                    params: {
                      selectedReceipentId:
                        healthSelectedContact?.item?.receipent_id,
                    },
                  },
                });
              }}
            >
              <Icon name="mic" size={15} color="#00E5A0" />
              <Text style={[styles.actionBtnLabel, { color: '#00E5A0' }]}>
                Audio
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionBtnHeart,
                pressed && styles.actionBtnPressed,
              ]}
              onPress={() => {
                navigation.navigate('Main', {
                  screen: 'MainTabs',
                  params: {
                    screen: 'Map',
                    params: {
                      selectedMapRecipentId:
                        healthSelectedContact?.item?.receipent_id,
                    },
                  },
                });
                return;
              }}
            >
              <Icon name="map" size={15} color="#FF3366" />
              <Text style={[styles.actionBtnLabel, { color: '#FF3366' }]}>
                Map
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* ── Alert Banner ── */}
      <StatusBanner
        level={stress.level}
        stressColor={stress.color}
        label={stress.label}
      />

      {/* ── Stress Gauge ── */}
      <StressGauge score={stress.score} state={stress} />

      {/* ── BPM Hero ── */}
      <BpmHero
        bpm={metrics.bpm}
        avgBpm={metrics.avgBpm}
        stressColor={stress.color}
        isLive={metrics.isLive}
        lastUpdated={metrics.lastUpdated}
      />

      {/* ── HRV & Zone Metrics ── */}
      <View style={styles.grid}>
        <MetricCard
          icon="💓"
          label="HRV · RMSSD"
          value={metrics.rmssd}
          unit="ms"
          color={hrvColor}
          sub={
            metrics.rmssd > 40
              ? 'Good'
              : metrics.rmssd > 20
              ? 'Moderate'
              : 'Low'
          }
        />
        <MetricCard
          icon="⚡"
          label="HR Zone"
          value={metrics.hrIntensity}
          unit="%"
          color={zoneColor}
          sub={
            metrics.hrIntensity > 70
              ? 'High'
              : metrics.hrIntensity > 50
              ? 'Elevated'
              : 'Normal'
          }
        />
      </View>

      {/* ── Score Breakdown ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Score Breakdown</Text>
          <View
            style={[
              styles.scorePill,
              {
                backgroundColor: stress.color + '18',
                borderColor: stress.color + '40',
              },
            ]}
          >
            <Text style={[styles.scorePillText, { color: stress.color }]}>
              {stress.score}/100
            </Text>
          </View>
        </View>
        <Text style={styles.sectionDesc}>
          How the stress index is calculated from this contact's biometrics.
        </Text>
        <BreakdownBar
          icon="🫀"
          label="Heart Rate"
          score={breakdown.hrScore}
          max={40}
          color="#FF8C42"
        />
        <BreakdownBar
          icon="💓"
          label="HRV Quality"
          score={breakdown.rmssdScore}
          max={30}
          color="#5352ED"
        />
      </View>

      {/* ── Tip ── */}
      <View style={styles.tipCard}>
        <Text style={styles.tipIcon}>💡</Text>
        <View style={styles.tipBody}>
          <Text style={styles.tipTitle}>Recommendation</Text>
          <Text style={styles.tipText}>
            {STRESS_TIPS[stress.label] ??
              `Keep monitoring this contact's wellbeing.`}
          </Text>
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}
