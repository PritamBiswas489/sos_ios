import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Modal, Animated, Dimensions,
  Image, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../components/abuserReport/theme.jsx';
import { ThreatBadge, SectionDivider, DetailRow, BoolChip } from '../../components/abuserReport/UIKit.jsx';
import RNBlobUtil from 'react-native-blob-util';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.92;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');

const formatDate = (iso) => {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
};

const formatDob = (dob) => {
  if (!dob) return null;
  const d   = new Date(dob);
  const age = Math.floor((Date.now() - d) / (365.25 * 24 * 60 * 60 * 1000));
  return `${formatDate(dob)} (Age ${age})`;
};

const capitalise = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : null;

const fileLabel = (url = '') => {
  const name = url.split('/').pop() || 'file';
  return name.length > 32 ? name.slice(0, 14) + '…' + name.slice(-10) : name;
};

// ─── Threat level color map ───────────────────────────────────────────────────
const THREAT_COLORS = {
  High:   { bg: 'rgba(255,59,48,0.12)',  border: '#FF3B30', text: '#FF3B30' },
  Medium: { bg: 'rgba(255,159,10,0.12)', border: '#FF9F0A', text: '#FF9F0A' },
  Low:    { bg: 'rgba(52,199,89,0.12)',  border: '#34C759', text: '#34C759' },
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
function ModalAvatar({ name, photo, size = 64 }) {
  const initials = getInitials(name || '?');
  if (photo) {
    return (
      <Image
        source={{ uri: photo }}
        style={[styles.avatarImg, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }
  return (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarInitials, { fontSize: size * 0.36 }]}>{initials || '?'}</Text>
    </View>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ label, value, accent }) {
  return (
    <View style={[styles.statPill, accent && styles.statPillAccent]}>
      <Text style={[styles.statPillValue, accent && styles.statPillValueAccent]}>{value}</Text>
      <Text style={[styles.statPillLabel, accent && styles.statPillLabelAccent]}>{label}</Text>
    </View>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderIcon}>{icon}</Text>
      <Text style={styles.sectionHeaderText}>{title}</Text>
      <View style={styles.sectionHeaderLine} />
    </View>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────
function InfoRow({ label, value, highlight }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>{value}</Text>
    </View>
  );
}

// ─── Blob-util download helper ────────────────────────────────────────────────
const downloadFile = async ({ url, onProgress }) => {
  const rawName  = decodeURIComponent(url.split('/').pop().split('?')[0] || `evidence_${Date.now()}`);
  const filename = rawName.replace(/[\\/:*?"<>|]/g, '_');
  const ext      = filename.split('.').pop()?.toLowerCase() || 'bin';

  const destDir = Platform.OS === 'ios'
    ? RNBlobUtil.fs.dirs.DocumentDir
    : RNBlobUtil.fs.dirs.DownloadDir;

  const destPath = `${destDir}/${filename}`;

  const mimeMap = {
    pdf: 'application/pdf', png: 'image/png',
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    gif: 'image/gif', webp: 'image/webp',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  const mime = mimeMap[ext] || 'application/octet-stream';

  const config = Platform.OS === 'ios'
    ? { path: destPath, fileCache: false }
    : {
        path: destPath, fileCache: false,
        addAndroidDownloads: {
          useDownloadManager: true, notification: true,
          title: filename, description: 'Evidence file download',
          mime, mediaScannable: true,
        },
      };

  await RNBlobUtil
    .config(config)
    .fetch('GET', url)
    .progress({ interval: 250 }, (received, total) => {
      if (total > 0) onProgress?.(Math.round((received / total) * 100));
    });

  if (Platform.OS === 'ios') {
    await RNBlobUtil.ios.openDocument(destPath);
  }

  return { destPath, filename };
};

// ─── Evidence File Row ────────────────────────────────────────────────────────
function EvidenceFileRow({ file, index, isLast }) {
  const [progress, setProgress] = useState(null);
  const isImage  = file.file_type === 'image';
  const icon     = isImage ? '🖼️' : '📄';
  const label    = fileLabel(file.file_url);
  const isActive = progress !== null;

  const handleDownload = async () => {
    if (isActive) return;
    setProgress(0);
    try {
      const { filename } = await downloadFile({
        url: file.file_url,
        onProgress: (pct) => setProgress(pct),
      });
      setProgress(null);
      Alert.alert(
        'Downloaded',
        Platform.OS === 'android'
          ? `"${filename}" saved to Downloads.`
          : `"${filename}" saved in Files → On My iPhone → KobyTech.`,
      );
    } catch (err) {
      setProgress(null);
      Alert.alert('Download Failed', err?.message || 'Could not download the file. Please try again.');
    }
  };

  return (
    <View style={[styles.evidenceRow, !isLast && styles.evidenceRowBorder]}>
      <View style={styles.evidenceIconWrap}>
        <Text style={styles.evidenceIcon}>{icon}</Text>
      </View>

      <View style={styles.evidenceMeta}>
        <Text style={styles.evidenceType}>
          {isImage ? 'Image' : 'Document'} {index + 1}
        </Text>
        <Text style={styles.evidenceLabel} numberOfLines={1}>{label}</Text>
        {isActive ? (
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        ) : null}
      </View>

      <TouchableOpacity
        style={[styles.downloadBtn, isActive && styles.downloadBtnBusy]}
        onPress={handleDownload}
        disabled={isActive}
        activeOpacity={0.75}
      >
        {isActive ? (
          <View style={styles.downloadBtnInner}>
            <ActivityIndicator size="small" color={Colors.accent} />
            {progress > 0 && <Text style={styles.progressPct}>{progress}%</Text>}
          </View>
        ) : (
          <Text style={styles.downloadBtnText}>⬇  Save</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function AbuserDetailsModal({ visible, report, onClose }) {
  const slideAnim   = useRef(new Animated.Value(SHEET_H)).current;
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const [bulkProgress, setBulkProgress] = useState(null);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: SHEET_H, duration: 260, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!report) return null;

  const {
    abuser, abuseType, incidentDate, incidentLocation,
    description, witnessInformation, threatLevel,
    historyOfViolence, weaponAccess, restrainingOrder,
    notes, evidenceFiles = [], createdAt,
  } = report;

  const documents     = evidenceFiles.filter(f => f.file_type === 'document');
  const images        = evidenceFiles.filter(f => f.file_type === 'image');
  const threatColors  = THREAT_COLORS[threatLevel] || THREAT_COLORS.Low;
  const riskCount     = [historyOfViolence, weaponAccess, restrainingOrder].filter(Boolean).length;

  const handleDownloadAll = async () => {
    if (bulkProgress !== null) return;
    setBulkProgress({ done: 0, total: evidenceFiles.length });
    let failed = 0;
    for (let i = 0; i < evidenceFiles.length; i++) {
      try {
        await downloadFile({ url: evidenceFiles[i].file_url });
      } catch {
        failed++;
      }
      setBulkProgress({ done: i + 1, total: evidenceFiles.length });
    }
    setBulkProgress(null);
    const success = evidenceFiles.length - failed;
    Alert.alert(
      'Download Complete',
      Platform.OS === 'ios'
        ? (failed === 0
          ? `All ${success} file${success > 1 ? 's' : ''} saved in Files → On My iPhone → KobyTech.`
          : `${success} downloaded, ${failed} failed.`)
        : (failed === 0
          ? `All ${success} file${success > 1 ? 's' : ''} downloaded successfully.`
          : `${success} downloaded, ${failed} failed.`),
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Bottom Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>

        {/* ── Drag handle ── */}
        <View style={styles.handleBar}>
          <View style={styles.handle} />
        </View>

        {/* ── Hero header ── */}
        <View style={[styles.heroHeader, { borderBottomColor: threatColors.border + '33' }]}>
          {/* Left: avatar + name */}
          <View style={styles.heroLeft}>
            <ModalAvatar name={abuser?.fullName} photo={abuser?.photo} size={58} />
            <View style={styles.heroMeta}>
              <Text style={styles.heroName} numberOfLines={1}>
                {abuser?.fullName || 'Unknown'}
              </Text>
              {abuser?.aliasName ? (
                <Text style={styles.heroAlias}>aka "{abuser.aliasName}"</Text>
              ) : null}
              <View style={styles.heroTags}>
                {abuser?.gender ? (
                  <View style={styles.heroTag}>
                    <Text style={styles.heroTagText}>{capitalise(abuser.gender)}</Text>
                  </View>
                ) : null}
                {abuseType ? (
                  <View style={[styles.heroTag, styles.heroTagAccent]}>
                    <Text style={[styles.heroTagText, styles.heroTagTextAccent]}>{abuseType}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Right: threat badge */}
          <View style={[styles.threatBadge, { backgroundColor: threatColors.bg, borderColor: threatColors.border }]}>
            <Text style={[styles.threatBadgeText, { color: threatColors.text }]}>
              {threatLevel?.toUpperCase()}
            </Text>
            <Text style={[styles.threatBadgeLabel, { color: threatColors.text }]}>THREAT</Text>
          </View>

          {/* Close */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* ── Risk flags row ── */}
        {(historyOfViolence || weaponAccess || restrainingOrder) ? (
          <View style={styles.riskRow}>
            {historyOfViolence && (
              <View style={styles.riskFlag}>
                <Text style={styles.riskFlagIcon}>⚠️</Text>
                <Text style={styles.riskFlagText}>Violence History</Text>
              </View>
            )}
            {weaponAccess && (
              <View style={styles.riskFlag}>
                <Text style={styles.riskFlagIcon}>🔫</Text>
                <Text style={styles.riskFlagText}>Weapon Access</Text>
              </View>
            )}
            {restrainingOrder && (
              <View style={styles.riskFlag}>
                <Text style={styles.riskFlagIcon}>🚫</Text>
                <Text style={styles.riskFlagText}>Restraining Order</Text>
              </View>
            )}
          </View>
        ) : null}

        {/* ── Scrollable body ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* Incident section */}
          <SectionHeader icon="📋" title="Incident Details" />
          <View style={styles.card}>
            <InfoRow label="Date"      value={formatDate(incidentDate)} highlight />
            <InfoRow label="Location"  value={incidentLocation} />
            <InfoRow label="Reported"  value={formatDate(createdAt)} />
          </View>

          {/* Description */}
          {description ? (
            <>
              <SectionHeader icon="📝" title="Description" />
              <View style={styles.textCard}>
                <Text style={styles.textCardContent}>{description}</Text>
              </View>
            </>
          ) : null}

          {/* Witness */}
          {witnessInformation ? (
            <>
              <SectionHeader icon="👁" title="Witness Information" />
              <View style={styles.textCard}>
                <Text style={styles.textCardContent}>{witnessInformation}</Text>
              </View>
            </>
          ) : null}

          {/* Abuser profile */}
          <SectionHeader icon="👤" title="Abuser Profile" />
          <View style={styles.card}>
            {abuser?.dob     && <InfoRow label="Date of Birth" value={formatDob(abuser.dob)} />}
            {abuser?.phone   && <InfoRow label="Phone"   value={abuser.phone} />}
            {abuser?.email   && <InfoRow label="Email"   value={abuser.email} />}
            {abuser?.address && <InfoRow label="Address" value={abuser.address} />}
          </View>

          {/* Evidence */}
          {evidenceFiles.length > 0 ? (
            <>
              <SectionHeader icon="🗂" title={`Evidence  ·  ${evidenceFiles.length} file${evidenceFiles.length !== 1 ? 's' : ''}`} />

              {evidenceFiles.length > 1 ? (
                <TouchableOpacity
                  style={[styles.downloadAllBtn, bulkProgress !== null && styles.downloadAllBtnBusy]}
                  onPress={handleDownloadAll}
                  activeOpacity={0.8}
                  disabled={bulkProgress !== null}
                >
                  {bulkProgress !== null ? (
                    <View style={styles.downloadAllInner}>
                      <ActivityIndicator size="small" color={Colors.accent} />
                      <Text style={styles.downloadAllText}>
                        Downloading {bulkProgress.done} of {bulkProgress.total}…
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.downloadAllText}>⬇  Download all {evidenceFiles.length} files</Text>
                  )}
                </TouchableOpacity>
              ) : null}

              {documents.length > 0 ? (
                <View style={styles.evidenceGroup}>
                  <Text style={styles.evidenceGroupLabel}>Documents</Text>
                  <View style={styles.evidenceList}>
                    {documents.map((file, i) => (
                      <EvidenceFileRow
                        key={file.id ?? i}
                        file={file}
                        index={i}
                        isLast={i === documents.length - 1}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {images.length > 0 ? (
                <View style={styles.evidenceGroup}>
                  <Text style={styles.evidenceGroupLabel}>Images</Text>
                  <View style={styles.evidenceList}>
                    {images.map((file, i) => (
                      <EvidenceFileRow
                        key={file.id ?? i}
                        file={file}
                        index={i}
                        isLast={i === images.length - 1}
                      />
                    ))}
                  </View>
                </View>
              ) : null}
            </>
          ) : null}

          {/* Notes */}
          {notes ? (
            <>
              <SectionHeader icon="🔒" title="Internal Notes" />
              <View style={styles.noteCard}>
                <Text style={styles.noteCardContent}>{notes}</Text>
              </View>
            </>
          ) : null}

          <View style={{ height: 48 }} />
        </ScrollView>

      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.82)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: SHEET_H,
    backgroundColor: '#0F1621',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },

  // ── Handle ──
  handleBar: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 6,
  },
  handle: {
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // ── Hero header ──
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 14,
  },
  heroLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarImg: {
    resizeMode: 'cover',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  avatarFallback: {
    backgroundColor: '#1E2D45',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  avatarInitials: {
    color: '#8BA7CC',
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroMeta:  { flex: 1 },
  heroName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  heroAlias: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  heroTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 7,
  },
  heroTag: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroTagAccent: {
    backgroundColor: 'rgba(229,62,109,0.12)',
    borderColor: 'rgba(229,62,109,0.3)',
  },
  heroTagText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '600',
  },
  heroTagTextAccent: {
    color: '#E53E6D',
  },

  // ── Threat badge ──
  threatBadge: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 62,
  },
  threatBadgeText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  threatBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 1,
    opacity: 0.7,
  },

  // ── Close button ──
  closeBtn: {
    width: 30, height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },

  // ── Risk flags ──
  riskRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,59,48,0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,59,48,0.12)',
  },
  riskFlag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.2)',
  },
  riskFlagIcon: { fontSize: 12 },
  riskFlagText: {
    color: '#FF6B6B',
    fontSize: 11,
    fontWeight: '600',
  },

  // ── Scroll ──
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 6 },

  // ── Section header ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 22,
    marginBottom: 10,
  },
  sectionHeaderIcon: { fontSize: 14 },
  sectionHeaderText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginLeft: 4,
  },

  // ── Card ──
  card: {
    backgroundColor: '#161F2E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },

  // ── Info row ──
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  infoLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    flexShrink: 0,
  },
  infoValue: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  infoValueHighlight: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // ── Text card ──
  textCard: {
    backgroundColor: '#161F2E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 16,
  },
  textCardContent: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 22,
  },

  // ── Note card ──
  noteCard: {
    backgroundColor: 'rgba(229,62,109,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(229,62,109,0.2)',
    padding: 16,
  },
  noteCardContent: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    lineHeight: 22,
  },

  // ── Evidence ──
  downloadAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,62,109,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229,62,109,0.3)',
    paddingVertical: 12,
    marginBottom: 12,
    gap: 8,
  },
  downloadAllBtnBusy: { opacity: 0.6 },
  downloadAllInner:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  downloadAllText: {
    color: '#E53E6D',
    fontWeight: '700',
    fontSize: 13,
  },

  evidenceGroup:      { marginBottom: 12 },
  evidenceGroupLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginLeft: 2,
  },
  evidenceList: {
    backgroundColor: '#161F2E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  evidenceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  evidenceIconWrap: {
    width: 36, height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  evidenceIcon:  { fontSize: 18 },
  evidenceMeta:  { flex: 1 },
  evidenceType: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  evidenceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  downloadBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(229,62,109,0.4)',
    backgroundColor: 'rgba(229,62,109,0.1)',
    minWidth: 80,
    alignItems: 'center',
  },
  downloadBtnBusy:  { opacity: 0.6 },
  downloadBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  downloadBtnText:  { color: '#E53E6D', fontWeight: '700', fontSize: 12 },
  progressPct:      { color: '#E53E6D', fontSize: 11, fontWeight: '700' },

  progressTrack: {
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: 2,
    borderRadius: 1,
    backgroundColor: '#E53E6D',
  },
});