import React, { useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Animated, ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, ThreatConfig } from '../../components/abuserReport/theme.jsx';
import appColors from '../../theme/appColors';
import appFonts from '../../theme/appFonts';
import { SW, SF } from '../../theme/dimensions';

// ─── FormField ───────────────────────────────────────────────────────────────
export function FormField({ label, required, error, children, style }) {
  return (
    <View style={[styles.fieldWrap, style]}>
      {label && (
        <Text style={styles.fieldLabel}>
          {label}{required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      {children}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

// ─── StyledInput ─────────────────────────────────────────────────────────────
export function StyledInput({ error, multiline, style, ...props }) {
  return (
    <TextInput
      style={[
        styles.input,
        multiline && styles.inputMulti,
        error && styles.inputError,
        style,
      ]}
      placeholderTextColor={appColors.bodyColor}
      selectionColor={appColors.primary}
      {...props}
    />
  );
}

// ─── SegmentControl ──────────────────────────────────────────────────────────
export function SegmentControl({ options, value, onChange }) {
  return (
    <View style={styles.segmentWrap}>
      {options.map(opt => {
        const active = value === opt;
        const cfg = ThreatConfig[opt];
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(opt)}
            style={[
              styles.segmentBtn,
              active && { backgroundColor: cfg?.bg || appColors.primaryAA, borderColor: cfg?.color || appColors.primary },
            ]}
            activeOpacity={0.7}
          >
            {cfg && (
              <Text style={{ color: active ? cfg.color : appColors.bodyColor, fontSize: SF(10), marginRight: 4 }}>
                {cfg.icon}
              </Text>
            )}
            <Text style={[styles.segmentText, active && { color: cfg?.color || appColors.white, fontFamily: appFonts.NunitoBold }]}>
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── ToggleRow ────────────────────────────────────────────────────────────────
export function ToggleRow({ label, value, onToggle }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: value ? 1 : 0, useNativeDriver: false, tension: 80, friction: 8 }).start();
  }, [value]);
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 18] });
  const trackColor = anim.interpolate({ inputRange: [0, 1], outputRange: ['#1A2438', appColors.primary] });

  return (
    <TouchableOpacity style={styles.toggleRow} onPress={onToggle} activeOpacity={0.8}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View style={[styles.thumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── PrimaryButton ───────────────────────────────────────────────────────────
export function PrimaryButton({ title, onPress, loading, disabled, style, variant = 'solid' }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.btnBase,
        variant === 'solid' ? styles.btnSolid : styles.btnOutline,
        (disabled || loading) && styles.btnDisabled,
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator size="small" color={appColors.white} />
        : <Text style={[styles.btnText, variant === 'outline' && styles.btnTextOutline]}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

// ─── ThreatBadge ─────────────────────────────────────────────────────────────
export function ThreatBadge({ level, large }) {
  const cfg = ThreatConfig[level];
  if (!cfg) return null;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (level !== 'High') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.18, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [level]);

  return (
    <Animated.View
      style={[
        styles.badge,
        large && styles.badgeLarge,
        { backgroundColor: cfg.bg, borderColor: cfg.color },
        level === 'High' && { transform: [{ scale: pulse }] },
      ]}
    >
      <Text style={[styles.badgeIcon, large && { fontSize: SF(11) }, { color: cfg.color }]}>{cfg.icon}</Text>
      <Text style={[styles.badgeText, large && styles.badgeTextLarge, { color: cfg.color }]}>{level}</Text>
    </Animated.View>
  );
}

// ─── SectionDivider ──────────────────────────────────────────────────────────
export function SectionDivider({ title }) {
  return (
    <View style={styles.dividerRow}>
      <Text style={styles.dividerTitle}>{title}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

// ─── DetailRow ────────────────────────────────────────────────────────────────
export function DetailRow({ label, value, accent }) {
  if (!value && value !== false) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, accent && { color: appColors.primary }]}>
        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
      </Text>
    </View>
  );
}

// ─── BoolChip ────────────────────────────────────────────────────────────────
export function BoolChip({ label, value }) {
  return (
    <View style={[styles.boolChip, { borderColor: value ? '#EF4444' : appColors.primary }]}>
      <Text style={{ fontSize: SF(10), marginRight: 4 }}>{value ? '⚠️' : '✓'}</Text>
      <Text style={[styles.boolChipText, { color: value ? '#EF4444' : appColors.bodyColor }]}>
        {label}
      </Text>
    </View>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ name, size = 48 }) {
  const initials = (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // FormField — label matches AddContactsScreen label style
  fieldWrap:  { marginBottom: SW(16) },
  fieldLabel: {
    color: appColors.bodyColor,
    fontSize: SF(11),
    fontFamily: appFonts.NunitoSemiBold,
    marginBottom: SW(8),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  required:   { color: appColors.primary },
  fieldError: { fontSize: SF(12), color: '#EF4444', marginTop: SW(4) },

  // StyledInput — matches inputBox from AddContactsScreen
  input: {
    backgroundColor: appColors.primaryAA,
    borderWidth: 0.7,
    borderColor: appColors.primary,
    borderRadius: SW(14),
    paddingHorizontal: SW(14),
    paddingVertical: SW(12),
    color: appColors.white,
    fontSize: SF(14),
    fontFamily: appFonts.NunitoRegular,
    minHeight: SW(48),
  },
  inputMulti: { minHeight: SW(100), textAlignVertical: 'top', paddingTop: SW(12) },
  inputError: { borderColor: '#EF4444' },

  // SegmentControl — mirrors relationTab chips
  segmentWrap: { flexDirection: 'row', gap: SW(8) },
  segmentBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SW(10), borderRadius: SW(20),
    borderWidth: 1, borderColor: '#1A2438',
    backgroundColor: appColors.primaryAA,
  },
  segmentText: { fontSize: SF(13), fontFamily: appFonts.NunitoSemiBold, color: appColors.bodyColor },

  // ToggleRow — fits inside toggleCard
  toggleRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SW(14) },
  toggleLabel: { color: appColors.white, fontSize: SF(13), fontFamily: appFonts.NunitoSemiBold, flex: 1, marginRight: SW(16) },
  track:       { width: SW(42), height: SW(24), borderRadius: SW(12), justifyContent: 'center' },
  thumb:       { width: SW(20), height: SW(20), borderRadius: SW(10), backgroundColor: appColors.white },

  // PrimaryButton — matches saveBtn from AddContactsScreen
  btnBase:        { height: SW(48), borderRadius: SW(14), alignItems: 'center', justifyContent: 'center', paddingHorizontal: SW(16) },
  btnSolid:       { backgroundColor: appColors.primary },
  btnOutline:     { backgroundColor: 'transparent', borderWidth: 0.7, borderColor: appColors.primary },
  btnDisabled:    { opacity: 0.45 },
  btnText:        { color: appColors.white, fontSize: SF(13), fontFamily: appFonts.NunitoBold },
  btnTextOutline: { color: appColors.white, fontSize: SF(13), fontFamily: appFonts.NunitoBold },

  // Badge
  badge:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SW(8), paddingVertical: SW(4), borderRadius: 999, borderWidth: 1, gap: 4 },
  badgeLarge:     { paddingHorizontal: SW(12), paddingVertical: SW(6) },
  badgeIcon:      { fontSize: SF(8) },
  badgeText:      { fontSize: SF(11), fontFamily: appFonts.NunitoBold, letterSpacing: 0.5 },
  badgeTextLarge: { fontSize: SF(13) },

  // SectionDivider — label style matches AddContactsScreen label
  dividerRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: SW(12), marginTop: SW(16) },
  dividerTitle: {
    color: appColors.bodyColor,
    fontSize: SF(11),
    fontFamily: appFonts.NunitoSemiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginRight: SW(8),
    flexShrink: 0,
  },
  dividerLine:  { flex: 1, height: 0.7, backgroundColor: appColors.primary, opacity: 0.5 },

  // DetailRow
  detailRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SW(9), borderBottomWidth: 0.7, borderBottomColor: appColors.primary },
  detailLabel: { color: appColors.bodyColor, fontSize: SF(12), fontFamily: appFonts.NunitoSemiBold, flex: 1 },
  detailValue: { color: appColors.white, fontSize: SF(13), fontFamily: appFonts.NunitoBold, flex: 1.5, textAlign: 'right' },

  // BoolChip
  boolChip:     { flexDirection: 'row', alignItems: 'center', borderWidth: 0.7, borderRadius: SW(10), paddingHorizontal: SW(10), paddingVertical: SW(5) },
  boolChipText: { fontSize: SF(12), fontFamily: appFonts.NunitoBold },

  // Avatar
  avatar:     { backgroundColor: appColors.primaryAA, borderWidth: 1, borderColor: appColors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: appColors.white, fontFamily: appFonts.NunitoBold },
});