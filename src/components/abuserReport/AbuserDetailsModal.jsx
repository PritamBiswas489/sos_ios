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

// ─── Avatar ───────────────────────────────────────────────────────────────────
function ModalAvatar({ name, photo, size = 64 }) {
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
    <View style={styles.modalAvatarEmpty}>
      <Text style={styles.modalAvatarIcon}>👤</Text>
    </View>
  );
}

// ─── Blob-util download helper ───────────────────────────────────────────────
const downloadFile = async ({ url, onProgress }) => {
  const rawName  = decodeURIComponent(url.split('/').pop().split('?')[0] || `evidence_${Date.now()}`);
  const filename = rawName.replace(/[\\/:*?"<>|]/g, '_');
  const ext      = filename.split('.').pop()?.toLowerCase() || 'bin';

  // Save destination
  // iOS: save directly to DocumentDir root — iOS Files app only exposes
  // the root of DocumentDir, NOT subfolders, even with UIFileSharingEnabled.
  const destDir = Platform.OS === 'ios'
    ? RNBlobUtil.fs.dirs.DocumentDir
    : RNBlobUtil.fs.dirs.DownloadDir;

  const destPath = `${destDir}/${filename}`;

  // MIME for Android download manager
  const mimeMap = {
    pdf:  'application/pdf',
    png:  'image/png',
    jpg:  'image/jpeg',
    jpeg: 'image/jpeg',
    gif:  'image/gif',
    webp: 'image/webp',
    doc:  'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  const mime = mimeMap[ext] || 'application/octet-stream';

  // ✅ FIX: fileCache: false so RNBlobUtil writes directly to destPath
  const config = Platform.OS === 'ios'
    ? {
        path: destPath,
        fileCache: false,
      }
    : {
        path: destPath,
        fileCache: false,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          title: filename,
          description: 'Evidence file download',
          mime,
          mediaScannable: true,
        },
      };

  await RNBlobUtil
    .config(config)
    .fetch('GET', url)
    .progress({ interval: 250 }, (received, total) => {
      if (total > 0) onProgress?.(Math.round((received / total) * 100));
    });

  // ✅ FIX: file is already at destPath — no cp() needed
  if (Platform.OS === 'ios') {
    await RNBlobUtil.ios.openDocument(destPath);
  }
  console.log(`Downloaded file saved to: ${destPath}`);

  return { destPath, filename };
};

// ─── Evidence File Row ────────────────────────────────────────────────────────
function EvidenceFileRow({ file, index }) {
  const [progress, setProgress] = useState(null); // null = idle, 0-100 = downloading
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
    <View style={styles.evidenceRow}>
      <Text style={styles.evidenceIcon}>{icon}</Text>

      <View style={styles.evidenceMeta}>
        <Text style={styles.evidenceIndex}>
          {isImage ? 'Image' : 'Document'} {index + 1}
        </Text>
        <Text style={styles.evidenceLabel} numberOfLines={1}>{label}</Text>

        {/* Progress bar — shown only while downloading */}
        {isActive ? (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
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
            {progress > 0 && (
              <Text style={styles.progressPct}>{progress}%</Text>
            )}
          </View>
        ) : (
          <Text style={styles.downloadBtnText}>⬇  Download</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function AbuserDetailsModal({ visible, report, onClose }) {
  // ── ALL hooks must come before any conditional return ──────────────────────
  const slideAnim   = useRef(new Animated.Value(SHEET_H)).current;
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const [bulkProgress, setBulkProgress] = useState(null); // null | { done, total }

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

  // Safe to return early now — all hooks are already declared above
  if (!report) return null;

  const {
    abuser,
    abuseType,
    incidentDate,
    incidentLocation,
    description,
    witnessInformation,
    threatLevel,
    historyOfViolence,
    weaponAccess,
    restrainingOrder,
    notes,
    evidenceFiles = [],
    createdAt,
  } = report;

  const documents = evidenceFiles.filter(f => f.file_type === 'document');
  const images    = evidenceFiles.filter(f => f.file_type === 'image');

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
          : `${success} downloaded, ${failed} failed. Check Files → On My iPhone → KobyTech.`)
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

        {/* ── Top bar: drag handle + close button ── */}
        <View style={styles.topBar}>
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>
          <TouchableOpacity
            style={styles.closeIconBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Text style={styles.closeIconText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* ── Header: photo + name + threat badge ── */}
        <View style={styles.header}>
          <ModalAvatar name={abuser?.fullName} photo={abuser?.photo} size={62} />

          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>
              {abuser?.fullName || 'Unknown'}
            </Text>
            {abuser?.aliasName ? (
              <Text style={styles.headerAlias}>aka "{abuser.aliasName}"</Text>
            ) : null}
            <View style={styles.headerChips}>
              {abuser?.gender ? (
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipText}>{capitalise(abuser.gender)}</Text>
                </View>
              ) : null}
              {abuser?.dob ? (
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipText}>{formatDob(abuser.dob)}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {threatLevel ? (
            <View style={styles.badgeWrap}>
              <ThreatBadge level={threatLevel} large />
            </View>
          ) : null}
        </View>

        {/* ── Bool chips ── */}
        {(historyOfViolence || weaponAccess || restrainingOrder) ? (
          <View style={styles.boolChipsRow}>
            {historyOfViolence !== undefined && (
              <BoolChip label="History of Violence" value={historyOfViolence} />
            )}
            {weaponAccess !== undefined && (
              <BoolChip label="Weapon Access" value={weaponAccess} />
            )}
            {restrainingOrder !== undefined && (
              <BoolChip label="Restraining Order" value={restrainingOrder} />
            )}
          </View>
        ) : null}

        {/* ── Scrollable body ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Incident Details */}
          <SectionDivider title="Incident Details" />
          <View style={styles.card}>
            <DetailRow label="Type of Abuse" value={abuseType}               accent />
            <DetailRow label="Incident Date" value={formatDate(incidentDate)} />
            <DetailRow label="Location"      value={incidentLocation} />
            <DetailRow label="Report Filed"  value={formatDate(createdAt)} />
          </View>

          {/* Description */}
          {description ? (
            <>
              <SectionDivider title="Description" />
              <View style={styles.textBlock}>
                <Text style={styles.textContent}>{description}</Text>
              </View>
            </>
          ) : null}

          {/* Witness Information */}
          {witnessInformation ? (
            <>
              <SectionDivider title="Witness Information" />
              <View style={styles.textBlock}>
                <Text style={styles.textContent}>{witnessInformation}</Text>
              </View>
            </>
          ) : null}

          {/* Abuser Profile */}
          <SectionDivider title="Abuser Profile" />
          <View style={styles.card}>
            <DetailRow label="Phone"   value={abuser?.phone} />
            <DetailRow label="Email"   value={abuser?.email} />
            <DetailRow label="Address" value={abuser?.address} />
          </View>

          {/* Evidence Files */}
          {evidenceFiles.length > 0 ? (
            <>
              <SectionDivider title={`Evidence Files (${evidenceFiles.length})`} />

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
                        Downloading {bulkProgress.done}/{bulkProgress.total}…
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.downloadAllText}>
                      ⬇  Download All ({evidenceFiles.length} files)
                    </Text>
                  )}
                </TouchableOpacity>
              ) : null}

              {documents.length > 0 ? (
                <View style={styles.evidenceGroup}>
                  <Text style={styles.evidenceGroupLabel}>📄 Documents</Text>
                  <View style={styles.evidenceList}>
                    {documents.map((file, i) => (
                      <EvidenceFileRow key={file.id ?? i} file={file} index={i} />
                    ))}
                  </View>
                </View>
              ) : null}

              {images.length > 0 ? (
                <View style={styles.evidenceGroup}>
                  <Text style={styles.evidenceGroupLabel}>🖼️ Images</Text>
                  <View style={styles.evidenceList}>
                    {images.map((file, i) => (
                      <EvidenceFileRow key={file.id ?? i} file={file} index={i} />
                    ))}
                  </View>
                </View>
              ) : null}
            </>
          ) : null}

          {/* Internal Notes */}
          {notes ? (
            <>
              <SectionDivider title="Internal Notes" />
              <View style={[styles.textBlock, styles.noteBlock]}>
                <Text style={styles.noteIcon}>📝</Text>
                <Text style={[styles.textContent, { flex: 1 }]}>{notes}</Text>
              </View>
            </>
          ) : null}

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>

      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: SHEET_H,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Shadow.modal,
    overflow: 'hidden',
  },

  // ── Top bar (handle + ✕) ──
  topBar: {
    position: 'relative',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handleWrap: { alignItems: 'center' },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.divider },
  closeIconBtn: {
    position: 'absolute',
    right: Spacing.base,
    top: 8,
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceHigh,
    borderWidth: 1, borderColor: Colors.divider,
    alignItems: 'center', justifyContent: 'center',
  },
  closeIconText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '700', lineHeight: 16 },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
    gap: Spacing.base,
  },
  avatarImg: { resizeMode: 'cover', borderWidth: 2, borderColor: Colors.divider },
  avatarFallback: {
    backgroundColor: Colors.accentMuted,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.accent,
  },
  avatarInitials: { color: Colors.accent, fontWeight: '700' },

  headerInfo:  { flex: 1 },
  headerName:  { ...Typography.heading2, fontSize: 20 },
  headerAlias: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  headerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  metaChip: {
    backgroundColor: Colors.surfaceHigh, borderRadius: Radius.sm,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.divider,
  },
  metaChipText: { ...Typography.caption, color: Colors.textSecondary },
  badgeWrap:    { alignSelf: 'flex-start', marginTop: 4 },

  // ── Bool chips ──
  boolChipsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceHigh,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.base },

  card: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.divider,
    paddingHorizontal: Spacing.base, marginBottom: Spacing.base,
  },
  textBlock: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.divider,
    padding: Spacing.base, marginBottom: Spacing.base,
  },
  noteBlock: {
    flexDirection: 'row', gap: Spacing.sm,
    borderColor: Colors.accentMuted,
    backgroundColor: 'rgba(229,62,109,0.04)',
  },
  noteIcon:    { fontSize: 16, marginTop: 2 },
  textContent: { ...Typography.body, lineHeight: 22 },

  // ── Evidence ──
  downloadAllBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.accentMuted,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.accent,
    paddingVertical: Spacing.md, marginBottom: Spacing.base,
  },
  downloadAllText: { color: Colors.accent, fontWeight: '700', fontSize: 14 },

  evidenceGroup:      { marginBottom: Spacing.base },
  evidenceGroupLabel: {
    ...Typography.caption, color: Colors.textSecondary,
    fontWeight: '700', marginBottom: Spacing.sm,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  evidenceList: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.divider,
    overflow: 'hidden',
  },
  evidenceRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
    gap: Spacing.sm,
  },
  evidenceIcon:  { fontSize: 20 },
  evidenceMeta:  { flex: 1 },
  evidenceIndex: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase' },
  evidenceLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  downloadBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1.5, borderColor: Colors.accent,
    backgroundColor: Colors.accentMuted,
    minWidth: 100, alignItems: 'center',
  },
  downloadBtnBusy:  { opacity: 0.6 },
  downloadBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  downloadBtnText:  { color: Colors.accent, fontWeight: '700', fontSize: 12 },
  progressPct:      { color: Colors.accent, fontSize: 11, fontWeight: '700' },

  // Progress bar inside evidence row
  progressTrack: {
    height: 3, borderRadius: 2,
    backgroundColor: Colors.divider,
    marginTop: 5, overflow: 'hidden',
  },
  progressFill: {
    height: 3, borderRadius: 2,
    backgroundColor: Colors.accent,
  },

  // Download All busy state
  downloadAllBtnBusy: { opacity: 0.75 },
  downloadAllInner:   { flexDirection: 'row', alignItems: 'center', gap: 8 },

  // ── Avatar fallback ──
  modalAvatarEmpty: {
    width: 54, height: 54, borderRadius: 27,
    borderWidth: 1, borderColor: Colors.divider,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  modalAvatarIcon: { fontSize: 20 },
});
