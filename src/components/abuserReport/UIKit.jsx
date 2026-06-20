import React, { useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Animated, ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow, ThreatConfig } from '../../components/abuserReport/theme.jsx';

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
      placeholderTextColor={Colors.textMuted}
      selectionColor={Colors.accent}
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
              active && { backgroundColor: cfg?.bg || Colors.accentMuted, borderColor: cfg?.color || Colors.accent },
            ]}
            activeOpacity={0.7}
          >
            {cfg && <Text style={{ color: active ? cfg.color : Colors.textMuted, fontSize: 10, marginRight: 4 }}>{cfg.icon}</Text>}
            <Text style={[styles.segmentText, active && { color: cfg?.color || Colors.accent, fontWeight: '700' }]}>
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
  const trackColor = anim.interpolate({ inputRange: [0, 1], outputRange: [Colors.surfaceBorder, Colors.accent] });

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
        ? <ActivityIndicator size="small" color={variant === 'solid' ? Colors.textPrimary : Colors.accent} />
        : <Text style={[styles.btnText, variant === 'outline' && { color: Colors.accent }]}>{title}</Text>
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
      <Text style={[styles.badgeIcon, large && { fontSize: 11 }, { color: cfg.color }]}>{cfg.icon}</Text>
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
      <Text style={[styles.detailValue, accent && { color: Colors.accent }]}>
        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
      </Text>
    </View>
  );
}

// ─── BoolChip ────────────────────────────────────────────────────────────────
export function BoolChip({ label, value }) {
  return (
    <View style={[styles.boolChip, { borderColor: value ? Colors.threatHigh : Colors.divider }]}>
      <Text style={{ fontSize: 10, marginRight: 4 }}>{value ? '⚠️' : '✓'}</Text>
      <Text style={[styles.boolChipText, { color: value ? Colors.threatHigh : Colors.textMuted }]}>
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
  // FormField
  fieldWrap:   { marginBottom: Spacing.lg },
  fieldLabel:  { ...Typography.label, marginBottom: Spacing.sm },
  required:    { color: Colors.accent },
  fieldError:  { fontSize: 12, color: Colors.error, marginTop: 4 },

  // StyledInput
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    color: Colors.textPrimary,
    fontSize: 15,
    minHeight: 48,
  },
  inputMulti:  { minHeight: 100, textAlignVertical: 'top', paddingTop: Spacing.md },
  inputError:  { borderColor: Colors.error },

  // Segment
  segmentWrap: { flexDirection: 'row', gap: Spacing.sm },
  segmentBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.divider,
    backgroundColor: Colors.inputBg,
  },
  segmentText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },

  // Toggle
  toggleRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  toggleLabel: { ...Typography.body, color: Colors.textPrimary, flex: 1, marginRight: Spacing.base },
  track:       { width: 42, height: 24, borderRadius: 12, justifyContent: 'center' },
  thumb:       { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.textPrimary },

  // Button
  btnBase:     { height: 52, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  btnSolid:    { backgroundColor: Colors.accent },
  btnOutline:  { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.accent },
  btnDisabled: { opacity: 0.45 },
  btnText:     { ...Typography.heading3, color: Colors.textPrimary, fontSize: 15 },

  // Badge
  badge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: Radius.pill, borderWidth: 1,
    gap: 4,
  },
  badgeLarge:     { paddingHorizontal: Spacing.md, paddingVertical: 6 },
  badgeIcon:      { fontSize: 8 },
  badgeText:      { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  badgeTextLarge: { fontSize: 13 },

  // Divider
  dividerRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, marginTop: Spacing.base },
  dividerTitle: { ...Typography.label, marginRight: Spacing.sm, flexShrink: 0 },
  dividerLine:  { flex: 1, height: 1, backgroundColor: Colors.divider },

  // DetailRow
  detailRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  detailLabel: { ...Typography.caption, color: Colors.textMuted, flex: 1 },
  detailValue: { ...Typography.bodyBold, flex: 1.5, textAlign: 'right' },

  // BoolChip
  boolChip:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 10, paddingVertical: 5 },
  boolChipText: { fontSize: 12, fontWeight: '600' },

  // Avatar
  avatar:     { backgroundColor: Colors.accentMuted, borderWidth: 1.5, borderColor: Colors.accentGlow, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.accent, fontWeight: '800' },
});
