import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../components/abuserReport/theme.jsx';
import { ThreatBadge } from '../../components/abuserReport/UIKit.jsx';
import api from '../../config/authApi.config';

// ─── API path ─────────────────────────────────────────────────────────────────
// api baseURL = <appUrl>/api-mobile/auth
const DELETE_PATH =   `/abuser-report/delete-report`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');

const formatDate = (iso) => {
  if (!iso) return 'Date unknown';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const capitalise = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : null;

// ─── Avatar ───────────────────────────────────────────────────────────────────
function CardAvatar({ name, photo, size = 46 }) {
  const initials = getInitials(name || '?');
  const fontSize  = size * 0.36;

  if (photo) {
    return (
      <Image
        source={{ uri: photo }}
        style={[styles.avatarImg, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }
  return (
    <View style={styles.modalAvatarEmpty}><Text style={styles.modalAvatarIcon}>👤</Text></View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AbuserReportCard({ report, onPress, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const {
    id,
    abuser,
    abuseType,
    incidentDate,
    incidentLocation,
    threatLevel,
    historyOfViolence,
    weaponAccess,
    restrainingOrder,
    evidenceFiles = [],
  } = report;

  const docCount    = evidenceFiles.filter(f => f.file_type === 'document').length;
  const imgCount    = evidenceFiles.filter(f => f.file_type === 'image').length;
  const hasEvidence = evidenceFiles.length > 0;

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = () => {
    Alert.alert(
      'Delete Report',
      `Are you sure you want to delete the report for "${abuser?.fullName || 'this abuser'}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ],
    );
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await api.post(DELETE_PATH,{ reportId: id });
      // Accept both 200 and 204 as success
      if (res?.data?.status === 200 || res?.data?.status === 204 || res?.status === 200 || res?.status === 204) {
        // Notify parent to remove this card from the list instantly
        onDeleted?.(id);
      } else {
        throw new Error(res?.data?.message || 'Delete failed');
      }
    } catch (err) {
      Alert.alert('Error', err?.message || 'Could not delete report. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.78}
      disabled={deleting}
    >
      {/* Left threat-level accent stripe */}
      <View style={[
        styles.stripe,
        threatLevel === 'High'   && styles.stripeHigh,
        threatLevel === 'Medium' && styles.stripeMed,
        threatLevel === 'Low'    && styles.stripeLow,
      ]} />

      <View style={styles.body}>

        {/* ── Top row: avatar + name + badge + delete ── */}
        <View style={styles.topRow}>
          <CardAvatar name={abuser?.fullName} photo={abuser?.photo} size={46} />

          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {abuser?.fullName || 'Unknown'}
            </Text>
            {abuser?.aliasName ? (
              <Text style={styles.alias} numberOfLines={1}>aka "{abuser.aliasName}"</Text>
            ) : null}
            {abuser?.gender ? (
              <Text style={styles.genderText}>{capitalise(abuser.gender)}</Text>
            ) : null}
          </View>

          {/* Threat badge */}
          {threatLevel ? <ThreatBadge level={threatLevel} /> : null}

          {/* Delete button */}
          <TouchableOpacity
            style={[styles.deleteBtn, deleting && styles.deleteBtnBusy]}
            onPress={handleDelete}
            disabled={deleting}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            {deleting
              ? <ActivityIndicator size="small" color={Colors.threatHigh} />
              : <Text style={styles.deleteBtnText}>🗑</Text>
            }
          </TouchableOpacity>
        </View>

        {/* ── Meta: abuse type + date ── */}
        <View style={styles.metaRow}>
          {abuseType ? (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{abuseType}</Text>
            </View>
          ) : null}
          <Text style={styles.date}>📅 {formatDate(incidentDate)}</Text>
        </View>

        {/* ── Location ── */}
        {incidentLocation ? (
          <Text style={styles.location} numberOfLines={1}>📍 {incidentLocation}</Text>
        ) : null}

        {/* ── Danger flags ── */}
        {(historyOfViolence || weaponAccess || restrainingOrder) ? (
          <View style={styles.flagsRow}>
            {historyOfViolence && (
              <View style={styles.flag}>
                <Text style={styles.flagText}>⚠ Violence History</Text>
              </View>
            )}
            {weaponAccess && (
              <View style={[styles.flag, styles.flagDanger]}>
                <Text style={[styles.flagText, styles.flagTextDanger]}>🔫 Weapon Access</Text>
              </View>
            )}
            {restrainingOrder && (
              <View style={[styles.flag, styles.flagOrder]}>
                <Text style={[styles.flagText, styles.flagTextOrder]}>🚫 Restraining Order</Text>
              </View>
            )}
          </View>
        ) : null}

        {/* ── Evidence summary ── */}
        {hasEvidence ? (
          <View style={styles.evidenceRow}>
            <Text style={styles.evidenceText}>📎 Evidence: </Text>
            {docCount > 0 && (
              <Text style={styles.evidenceBadge}>
                {docCount} doc{docCount > 1 ? 's' : ''}
              </Text>
            )}
            {imgCount > 0 && (
              <Text style={[styles.evidenceBadge, styles.evidenceBadgeImg]}>
                {imgCount} image{imgCount > 1 ? 's' : ''}
              </Text>
            )}
          </View>
        ) : null}

      </View>

      {/* Chevron — hidden while deleting */}
      {!deleting ? <Text style={styles.chevron}>›</Text> : null}
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.divider,
    overflow: 'hidden',
    ...Shadow.card,
  },

  stripe:     { width: 4, backgroundColor: Colors.divider },
  stripeHigh: { backgroundColor: Colors.threatHigh },
  stripeMed:  { backgroundColor: Colors.threatMedium },
  stripeLow:  { backgroundColor: Colors.threatLow },

  body:   { flex: 1, padding: Spacing.base, gap: Spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  info:   { flex: 1 },

  // Avatar
  avatarImg: { resizeMode: 'cover', borderWidth: 1.5, borderColor: Colors.divider },
  avatarFallback: {
    backgroundColor: Colors.accentMuted,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.accent,
  },
  avatarInitials: { color: Colors.accent, fontWeight: '700' },

  // Name
  name:       { ...Typography.heading3 },
  alias:      { ...Typography.caption, color: Colors.textSecondary, marginTop: 1 },
  genderText: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },

  // Delete button
  deleteBtn: {
    width: 34, height: 34,
    borderRadius: 17,
    backgroundColor: Colors.threatHighBg,
    borderWidth: 1, borderColor: Colors.threatHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtnBusy: { opacity: 0.6 },
  deleteBtnText: { fontSize: 15 },

  // Meta
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pill: {
    backgroundColor: Colors.surfaceHigh, borderRadius: Radius.pill,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.divider,
  },
  pillText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  date:     { fontSize: 12, color: Colors.textMuted },
  location: { fontSize: 12, color: Colors.textMuted },

  // Flags
  flagsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  flag: {
    backgroundColor: Colors.threatMedBg, borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.threatMedium,
  },
  flagDanger:      { backgroundColor: Colors.threatHighBg, borderColor: Colors.threatHigh },
  flagOrder:       { backgroundColor: 'rgba(99,102,241,0.08)', borderColor: '#6366F1' },
  flagText:        { fontSize: 11, fontWeight: '600', color: Colors.threatMedium },
  flagTextDanger:  { color: Colors.threatHigh },
  flagTextOrder:   { color: '#6366F1' },

  // Evidence
  evidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  evidenceText: { fontSize: 11, color: Colors.textMuted },
  evidenceBadge: {
    fontSize: 11, fontWeight: '600',
    color: Colors.accent, backgroundColor: Colors.accentMuted,
    paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: Radius.sm, overflow: 'hidden', marginRight: 4,
  },
  evidenceBadgeImg: { color: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)' },

  chevron: {
    fontSize: 26, color: Colors.textMuted,
    alignSelf: 'center',
    paddingRight: Spacing.base, paddingLeft: 0,
  },
  modalAvatarEmpty: { width: 54, height: 54, borderRadius: 27, borderWidth: 1, borderColor: Colors.divider, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  modalAvatarIcon: { fontSize: 20 },
});
