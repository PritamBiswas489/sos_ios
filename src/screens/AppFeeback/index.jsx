import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Switch,
  Animated,
  Easing,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { uploadMedia } from '../../config/apiClient';
import DeviceInfo from 'react-native-device-info';
import appFonts from '../../theme/appFonts';
import appColors from '../../theme/appColors';
import { SW, SH, SF } from '../../theme/dimensions';

// ─── NOTE ────────────────────────────────────────────────────────────────────
// This component requires the following peer package:
//   npm install react-native-image-picker
// And for iOS:
//   cd ios && pod install
// Add these keys to Info.plist:
//   NSPhotoLibraryUsageDescription
//   NSMicrophoneUsageDescription (for video)
// And to AndroidManifest.xml:
//   READ_MEDIA_IMAGES, READ_MEDIA_VIDEO, READ_EXTERNAL_STORAGE (API < 33)
// ─────────────────────────────────────────────────────────────────────────────

// Dynamic import – swap with real one once the package is installed:
// import { launchImageLibrary } from 'react-native-image-picker';

const COLORS = {
  bg: appColors.DarkPrimary,
  surface: appColors.primaryAA,
  surfaceRaised: appColors.primaryAA,
  border: appColors.primary,
  borderFocus: appColors.primary,
  text: appColors.white,
  textDim: appColors.bodyColor,
  textFaint: appColors.bodyColor,
  accent: appColors.primary,
  accentSoft: appColors.primaryAA,
  star: '#FFC857',
  success: '#3DDC97',
  danger: '#FF6B6B',
  attachBg: appColors.primaryAA,
  attachBorder: appColors.primary,
};

const FEEDBACK_TYPES = [
  { key: 'general', label: 'General Feedback' },
  { key: 'bug', label: 'Bug report' },
  { key: 'feature', label: 'Feature request' },
  { key: 'complaint', label: 'Complaint' },
  { key: 'praise', label: 'Praise' },
  { key: 'other', label: 'Other' },
];

const RATING_LABELS = ['Poor', 'Fair', 'Okay', 'Good', 'Excellent'];

const EMPTY_ATTACHMENT = { uri: null, name: null, type: null, mimeType: null };

// ─── Attachment type icons ───────────────────────────────────────────────────
const ATTACH_ICONS = {
  image: '🖼️',
  video: '🎬',
  default: '📎',
};

function attachIconFor(mimeType) {
  if (!mimeType) return ATTACH_ICONS.default;
  if (mimeType.startsWith('image/')) return ATTACH_ICONS.image;
  if (mimeType.startsWith('video/')) return ATTACH_ICONS.video;
  return ATTACH_ICONS.default;
}

function truncateName(name, maxLen = 28) {
  if (!name || name.length <= maxLen) return name;
  const ext = name.includes('.') ? '.' + name.split('.').pop() : '';
  return name.slice(0, maxLen - ext.length - 1) + '…' + ext;
}

// ─── Single attachment slot ──────────────────────────────────────────────────
function AttachmentSlot({ index, attachment, onPick, onRemove }) {
  const hasFile = !!attachment.uri;
  const isVideo = attachment.mimeType && attachment.mimeType.startsWith('video/');
  const isMock = attachment.uri && attachment.uri.indexOf('mock://') === 0;

  return (
    <View style={slotStyles.wrapper}>
      {hasFile ? (
        <View style={slotStyles.card}>
          <View style={slotStyles.thumbWrap}>
            {isMock ? (
              <View style={slotStyles.mockThumb}>
                <Text style={slotStyles.mockThumbIcon}>
                  {isVideo ? '🎬' : '🖼️'}
                </Text>
              </View>
            ) : (
              <Image
                source={{ uri: attachment.uri }}
                style={slotStyles.thumb}
                resizeMode="cover"
              />
            )}
            {isVideo && (
              <View style={slotStyles.playOverlay}>
                <Icon name="play-circle-filled" size={32} color="rgba(255,255,255,0.92)" />
              </View>
            )}
            <View style={slotStyles.typeBadge}>
              <Text style={slotStyles.typeBadgeText}>
                {isVideo ? 'VIDEO' : 'IMAGE'}
              </Text>
            </View>
          </View>
          <View style={slotStyles.cardMeta}>
            <View style={slotStyles.cardMetaText}>
              <Text style={slotStyles.fileName} numberOfLines={1}>
                {truncateName(attachment.name || 'Attachment')}
              </Text>
              <Text style={slotStyles.fileMime} numberOfLines={1}>
                {attachment.mimeType || 'Unknown type'}
              </Text>
            </View>
            <TouchableOpacity
              style={slotStyles.removeBtn}
              onPress={() => onRemove(index)}
              hitSlop={10}
            >
              <Icon name="delete-outline" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={slotStyles.empty}
          onPress={() => onPick(index)}
          activeOpacity={0.7}
        >
          <View style={slotStyles.emptyInner}>
            <Icon name="add-circle-outline" size={22} color={COLORS.textFaint} />
            <Text style={slotStyles.emptyLabel}>
              {index === 0 ? 'Add attachment' : 'Add another'}
            </Text>
            <Text style={slotStyles.emptyHint}>Image or Video</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const slotStyles = StyleSheet.create({
  wrapper: {
    marginBottom: SW(12),
  },
  // ── Empty slot ──
  empty: {
    borderWidth: 0.7,
    borderColor: appColors.primary,
    borderStyle: 'dashed',
    borderRadius: SW(14),
    backgroundColor: appColors.primaryAA,
    paddingVertical: SW(18),
    paddingHorizontal: SW(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyInner: {
    alignItems: 'center',
  },
  emptyLabel: {
    color: appColors.bodyColor,
    fontSize: SF(13),
    fontFamily: appFonts.NunitoSemiBold,
    marginTop: 8,
  },
  emptyHint: {
    color: appColors.bodyColor,
    fontSize: SF(11),
    marginTop: 3,
  },
  // ── Filled card ──
  card: {
    backgroundColor: appColors.primaryAA,
    borderWidth: 0.7,
    borderColor: appColors.primary,
    borderRadius: SW(14),
    overflow: 'hidden',
  },
  thumbWrap: {
    width: '100%',
    height: 180,
    backgroundColor: appColors.primaryAA,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  mockThumb: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.primaryAA,
  },
  mockThumbIcon: {
    fontSize: 48,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  typeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  typeBadgeText: {
    color: appColors.white,
    fontSize: SF(10),
    fontFamily: appFonts.NunitoBold,
    letterSpacing: 0.5,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SW(14),
    paddingVertical: SW(12),
    justifyContent: 'space-between',
  },
  cardMetaText: {
    flex: 1,
    marginRight: 10,
  },
  fileName: {
    color: appColors.white,
    fontSize: SF(13),
    fontFamily: appFonts.NunitoSemiBold,
  },
  fileMime: {
    color: appColors.bodyColor,
    fontSize: SF(11),
    marginTop: 2,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,107,107,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function AppFeedback() {
  const [rating, setRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState(null);
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([
    { ...EMPTY_ATTACHMENT },
    { ...EMPTY_ATTACHMENT },
    { ...EMPTY_ATTACHMENT },
  ]);
  const [allowContact, setAllowContact] = useState(false);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const navigation = useNavigation();

  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.4)).current;
  const cardTranslate = useRef(new Animated.Value(16)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  const getDevicePayload = async () => {
  return {
    deviceId:      DeviceInfo.getDeviceId(),
    brand:         DeviceInfo.getBrand(),
    model:         DeviceInfo.getModel(),
    os:            DeviceInfo.getSystemName(),
    osVersion:     DeviceInfo.getSystemVersion(),
    appVersion:    DeviceInfo.getVersion(),
    buildNumber:   DeviceInfo.getBuildNumber(),
    isTablet:      DeviceInfo.isTablet(),
    uniqueId:      await DeviceInfo.getUniqueId(),
    deviceName:    await DeviceInfo.getDeviceName(),
    ipAddress:     await DeviceInfo.getIpAddress(),
  };
};

  // ── Attachment helpers ────────────────────────────────────────────────────

  /**
   * Opens the device gallery with mediaType 'mixed' so the user can pick
   * either a photo or a video in a single step — no action sheet needed.
   */
  const handlePickAttachment = async (slotIndex) => {
    try {
      //── Real implementation (uncomment after installing react-native-image-picker) ──
      const { launchImageLibrary } = await import('react-native-image-picker');
      const result = await launchImageLibrary({
        mediaType: 'mixed',   // lets user pick photo OR video
        selectionLimit: 1,
        quality: 0.85,
        videoQuality: 'medium',
      });
      if (result.didCancel || result.errorCode) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      applyAttachment(slotIndex, {
        uri: asset.uri,
        name: asset.fileName || `media_${Date.now()}`,
        type: asset.type?.startsWith('video/') ? 'video' : 'image',
        mimeType: asset.type,
      });

      // ── Mock (remove once the package is installed) ──

    } catch (err) {
      console.warn('Gallery picker error:', err);
    }
  };

  const applyAttachment = (slotIndex, file) => {
    setAttachments((prev) => {
      const next = [...prev];
      next[slotIndex] = file;
      return next;
    });
  };

  const removeAttachment = (slotIndex) => {
    setAttachments((prev) => {
      const next = [...prev];
      next[slotIndex] = { ...EMPTY_ATTACHMENT };
      return next;
    });
  };

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = () => {
    const next = {};
    if (rating < 1) next.rating = 'Please choose a rating';
    if (!feedbackType) next.feedbackType = 'Please select a feedback type';
    if (!message.trim()) next.message = 'Please tell us a bit more';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const resetForm = () => {
    setRating(0);
    setFeedbackType(null);
    setMessage('');
    setAttachments([
      { ...EMPTY_ATTACHMENT },
      { ...EMPTY_ATTACHMENT },
      { ...EMPTY_ATTACHMENT },
    ]);
    setAllowContact(false);
    setErrors({});
  };

  // ── Success animation ─────────────────────────────────────────────────────

  const playSuccessAnimation = () => {
    setShowSuccess(true);
    overlayOpacity.setValue(0);
    cardOpacity.setValue(0);
    cardTranslate.setValue(16);
    checkScale.setValue(0);
    checkOpacity.setValue(0);
    ringScale.setValue(0.4);

    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();

    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 280,
        delay: 80,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslate, {
        toValue: 0,
        duration: 320,
        delay: 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(220),
      Animated.parallel([
        Animated.spring(checkScale, {
          toValue: 1,
          friction: 5,
          tension: 140,
          useNativeDriver: true,
        }),
        Animated.timing(checkOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(ringScale, {
          toValue: 1,
          duration: 480,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const dismissSuccess = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setShowSuccess(false));
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    const deviceInfo = await getDevicePayload();
     

    const filledAttachments = attachments.filter((a) => !!a.uri);

    try {
        const formData = new FormData();
      formData.append('rating', rating);
      formData.append('feedback_type', feedbackType);
      formData.append('message', message.trim());
      formData.append('allowContact', allowContact);
      formData.append('appVersion', deviceInfo.appVersion);
      formData.append('osVersion', deviceInfo.os + ' ' + deviceInfo.osVersion);
      formData.append('deviceInfo', deviceInfo.brand + ' ' + deviceInfo.model);
      filledAttachments.forEach((file, i) => {
        formData.append('feedback_files', { uri: file.uri, name: file.name, type: file.mimeType });
      })
       
     const uploads = await uploadMedia('/app-feedback/submit-feedback', formData);
     if(uploads.status === 200) {
       playSuccessAnimation();
      resetForm();
     }else{
      Alert.alert('Submission failed', 'Unable to submit feedback. Please try again.');
     }
     setSubmitting(false);
    } catch (e) {
      console.error('Feedback submission error:', e);
      Alert.alert('Submission failed', 'Unable to submit feedback. Please try again.');
      setSubmitting(false);
    }
  };

  const selectedTypeLabel = feedbackType
    ? FEEDBACK_TYPES.find((t) => t.key === feedbackType)?.label
    : null;

  // How many slots to show: always show slot 0; show slot N only if slot N-1 is filled
  const visibleSlotCount = attachments.reduce((count, a, i) => {
    if (i === 0) return 1;
    return attachments[i - 1].uri ? Math.max(count, i + 1) : count;
  }, 1);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Icon name="arrow-back" size={24} color={appColors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Send Feedback</Text>
          </View>
        </View>

        {/* Rating */}
        <View style={styles.section}>
          <Text style={styles.label}>How would you rate your experience?</Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                onPress={() => {
                  setRating(n);
                  setErrors((p) => ({ ...p, rating: undefined }));
                }}
                hitSlop={8}
                style={styles.starButton}
              >
                <Text style={[styles.star, n <= rating && styles.starFilled]}>
                  {n <= rating ? '★' : '☆'}
                </Text>
              </Pressable>
            ))}
            {rating > 0 && (
              <Text style={styles.ratingLabel}>{RATING_LABELS[rating - 1]}</Text>
            )}
          </View>
          {errors.rating && <Text style={styles.errorText}>{errors.rating}</Text>}
        </View>

        {/* Feedback type */}
        <View style={styles.section}>
          <Text style={styles.label}>Feedback type</Text>
          <Pressable
            style={[
              styles.selectInput,
              errors.feedbackType && styles.inputError,
            ]}
            onPress={() => setTypeMenuOpen(true)}
          >
            <Text
              style={[
                styles.selectInputText,
                !selectedTypeLabel && styles.placeholderText,
              ]}
            >
              {selectedTypeLabel || 'Select a category'}
            </Text>
            <Text style={styles.chevron}>⌄</Text>
          </Pressable>
          {errors.feedbackType && (
            <Text style={styles.errorText}>{errors.feedbackType}</Text>
          )}
        </View>

        {/* Message */}
        <View style={styles.section}>
          <Text style={styles.label}>Your message</Text>
          <TextInput
            style={[styles.textArea, errors.message && styles.inputError]}
            placeholder="Describe the issue, idea, or comment in detail..."
            placeholderTextColor={COLORS.textFaint}
            multiline
            numberOfLines={5}
            value={message}
            onChangeText={(v) => {
              setMessage(v);
              if (v.trim()) setErrors((p) => ({ ...p, message: undefined }));
            }}
            textAlignVertical="top"
          />
          {errors.message && <Text style={styles.errorText}>{errors.message}</Text>}
        </View>

        {/* Attachments – up to 3 optional slots */}
        <View style={styles.section}>
          <View style={styles.attachmentHeader}>
            <Text style={styles.label}>Attachments</Text>
            <Text style={styles.attachmentOptional}>Optional · up to 3</Text>
          </View>
          <Text style={styles.attachmentHint}>
            Add screenshots or screen recordings from your gallery.
          </Text>
          <View style={styles.attachmentList}>
            {attachments.slice(0, visibleSlotCount).map((attachment, i) => (
              <AttachmentSlot
                key={i}
                index={i}
                attachment={attachment}
                onPick={handlePickAttachment}
                onRemove={removeAttachment}
              />
            ))}
          </View>
        </View>

        {/* Allow contact */}
        <View style={[styles.section, styles.switchRow]}>
          <View style={styles.switchTextWrap}>
            <Text style={styles.label}>Allow us to contact you</Text>
            <Text style={styles.helperText}>
              We may follow up about this feedback by email.
            </Text>
          </View>
          <Switch
            value={allowContact}
            onValueChange={setAllowContact}
            trackColor={{ false: COLORS.border, true: COLORS.accent }}
            thumbColor={Platform.OS === 'android' ? COLORS.text : undefined}
            ios_backgroundColor={COLORS.border}
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            pressed && styles.submitButtonPressed,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Sending…' : 'Submit feedback'}
          </Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Feedback type modal */}
      <Modal
        visible={typeMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTypeMenuOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setTypeMenuOpen(false)}
        >
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>Select feedback type</Text>
            {FEEDBACK_TYPES.map((t) => (
              <Pressable
                key={t.key}
                style={[
                  styles.menuItem,
                  feedbackType === t.key && styles.menuItemActive,
                ]}
                onPress={() => {
                  setFeedbackType(t.key);
                  setErrors((p) => ({ ...p, feedbackType: undefined }));
                  setTypeMenuOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.menuItemText,
                    feedbackType === t.key && styles.menuItemTextActive,
                  ]}
                >
                  {t.label}
                </Text>
                {feedbackType === t.key && (
                  <Text style={styles.menuItemCheck}>✓</Text>
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Success overlay */}
      {showSuccess && (
        <Modal visible transparent animationType="none">
          <Animated.View
            style={[styles.successOverlay, { opacity: overlayOpacity }]}
          >
            <Animated.View
              style={[
                styles.successCard,
                {
                  opacity: cardOpacity,
                  transform: [{ translateY: cardTranslate }],
                },
              ]}
            >
              <View style={styles.checkWrap}>
                <Animated.View
                  style={[
                    styles.successRing,
                    {
                      transform: [{ scale: ringScale }],
                      opacity: ringScale.interpolate({
                        inputRange: [0.4, 1],
                        outputRange: [0.5, 0],
                      }),
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.checkCircle,
                    {
                      opacity: checkOpacity,
                      transform: [{ scale: checkScale }],
                    },
                  ]}
                >
                  <Text style={styles.checkMark}>✓</Text>
                </Animated.View>
              </View>
              <Text style={styles.successTitle}>Feedback sent</Text>
              <Text style={styles.successSubtitle}>
                Thanks for helping us improve the app.
              </Text>
              <Pressable style={styles.successButton} onPress={dismissSuccess}>
                <Text style={styles.successButtonText}>Done</Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: appColors.DarkPrimary },
  scrollContent: {
    paddingHorizontal: SW(18),
    paddingBottom: 24,
  },
  // ── Header — mirrors AddContactsScreen ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SW(48),
    marginBottom: SW(20),
  },
  headerTextWrap: {
    flex: 1,
    marginLeft: SW(10),
  },
  headerTitle: {
    color: appColors.white,
    fontSize: SF(17),
    fontFamily: appFonts.NunitoBold,
  },
  headerSubtitle: {
    color: appColors.bodyColor,
    fontSize: SF(10),
    fontFamily: appFonts.NunitoSemiBold,
  },
  // ── Sections & labels ──
  section: {
    marginBottom: SW(20),
  },
  label: {
    color: appColors.bodyColor,
    fontSize: SF(11),
    marginTop: SW(20),
    marginBottom: SW(8),
  },
  helperText: {
    color: appColors.bodyColor,
    fontSize: SF(11),
    marginTop: 4,
  },
  // ── Stars ──
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    paddingRight: 6,
  },
  star: {
    fontSize: 34,
    color: appColors.bodyColor,
  },
  starFilled: {
    color: '#FFC857',
  },
  ratingLabel: {
    color: appColors.bodyColor,
    fontSize: SF(13),
    marginLeft: 10,
    fontFamily: appFonts.NunitoSemiBold,
  },
  // ── Select / inputs — mirror inputBox ──
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0.7,
    borderColor: appColors.primary,
    backgroundColor: appColors.primaryAA,
    borderRadius: SW(14),
    paddingHorizontal: SW(14),
    height: SW(48),
  },
  selectInputText: {
    color: appColors.white,
    fontSize: SF(14),
  },
  placeholderText: {
    color: appColors.bodyColor,
  },
  chevron: {
    color: appColors.bodyColor,
    fontSize: SF(16),
  },
  textArea: {
    borderWidth: 0.7,
    borderColor: appColors.primary,
    backgroundColor: appColors.primaryAA,
    borderRadius: SW(14),
    paddingHorizontal: SW(14),
    paddingVertical: SW(12),
    color: appColors.white,
    fontSize: SF(14),
    minHeight: 120,
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: SF(12),
    marginTop: 6,
  },
  // ── Attachments ──
  attachmentHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: SW(20),
    marginBottom: 4,
  },
  attachmentOptional: {
    color: appColors.bodyColor,
    fontSize: SF(11),
    marginLeft: 8,
  },
  attachmentHint: {
    color: appColors.bodyColor,
    fontSize: SF(11),
    marginBottom: SW(12),
  },
  attachmentList: {
    gap: 0,
  },
  // ── Switch row — mirrors toggleCard ──
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: appColors.whiteTransparent,
    borderColor: appColors.whiteBdrTransparent,
    borderWidth: 1,
    borderRadius: SW(14),
    paddingHorizontal: SW(14),
    paddingVertical: SW(14),
    marginTop: SW(4),
  },
  switchTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  // ── Submit button — mirrors saveBtn ──
  submitButton: {
    backgroundColor: appColors.primary,
    borderRadius: SW(16),
    paddingVertical: SW(15),
    alignItems: 'center',
    marginTop: SW(18),
  },
  submitButtonPressed: {
    opacity: 0.85,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: appColors.white,
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(13),
  },
  // ── Type bottom-sheet modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  menuCard: {
    backgroundColor: appColors.primaryAA,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: SW(20),
    paddingTop: SW(18),
    paddingBottom: SW(32),
    borderTopWidth: 0.7,
    borderColor: appColors.primary,
  },
  menuTitle: {
    color: appColors.bodyColor,
    fontSize: SF(11),
    fontFamily: appFonts.NunitoSemiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SW(12),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SW(14),
    paddingHorizontal: SW(14),
    borderRadius: SW(10),
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: appColors.primaryAA,
    borderWidth: 1,
    borderColor: appColors.primary,
    borderRadius: SW(10),
  },
  menuItemText: {
    color: appColors.white,
    fontSize: SF(14),
  },
  menuItemTextActive: {
    color: appColors.white,
    fontFamily: appFonts.NunitoBold,
  },
  menuItemCheck: {
    color: appColors.primary,
    fontSize: SF(15),
    fontFamily: appFonts.NunitoBold,
  },
  // ── Success overlay ──
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4,5,8,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successCard: {
    backgroundColor: appColors.primaryAA,
    borderRadius: SW(24),
    paddingVertical: SW(36),
    paddingHorizontal: SW(28),
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    borderWidth: 0.7,
    borderColor: appColors.primary,
  },
  checkWrap: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: '#3DDC97',
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(61, 220, 151, 0.14)',
    borderWidth: 1.5,
    borderColor: '#3DDC97',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#3DDC97',
    fontSize: 34,
    fontFamily: appFonts.NunitoBold,
  },
  successTitle: {
    color: appColors.white,
    fontSize: SF(19),
    fontFamily: appFonts.NunitoBold,
    marginBottom: 6,
  },
  successSubtitle: {
    color: appColors.bodyColor,
    fontSize: SF(13),
    textAlign: 'center',
    marginBottom: SW(24),
  },
  successButton: {
    backgroundColor: appColors.primary,
    borderRadius: SW(12),
    paddingVertical: SW(12),
    paddingHorizontal: SW(32),
  },
  successButtonText: {
    color: appColors.white,
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(14),
  },
});
