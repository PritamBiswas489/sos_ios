import React, { useRef, useState } from 'react';
import {
  SafeAreaView,
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
  StatusBar,
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
  bg: '#0B0D12',
  surface: '#14171F',
  surfaceRaised: '#1B1F2A',
  border: '#262B38',
  borderFocus: '#5B8CFF',
  text: '#F2F4F8',
  textDim: '#9AA3B5',
  textFaint: '#5C6377',
  accent: '#5B8CFF',
  accentSoft: 'rgba(91, 140, 255, 0.12)',
  star: '#FFC857',
  success: '#3DDC97',
  danger: '#FF6B6B',
  attachBg: '#1B1F2A',
  attachBorder: '#2E3545',
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
    marginBottom: 12,
  },
  // ── Empty slot ──
  empty: {
    borderWidth: 1,
    borderColor: COLORS.attachBorder,
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: COLORS.attachBg,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyInner: {
    alignItems: 'center',
  },
  emptyLabel: {
    color: COLORS.textDim,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyHint: {
    color: COLORS.textFaint,
    fontSize: 11,
    marginTop: 3,
  },
  // ── Filled card ──
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    overflow: 'hidden',
  },
  thumbWrap: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.surfaceRaised,
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
    backgroundColor: COLORS.surfaceRaised,
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
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  cardMetaText: {
    flex: 1,
    marginRight: 10,
  },
  fileName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  fileMime: {
    color: COLORS.textFaint,
    fontSize: 11,
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
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.headerWrap}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Icon name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Send feedback</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Tell us what's working and what isn't. It helps us improve the app for everyone.
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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

          <View style={styles.footerSpacer} />
        </ScrollView>

        <View style={styles.footerWrap}>
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
        </View>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    color: COLORS.textDim,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  footerWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 14 : 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerSpacer: {
    height: 96,
  },
  section: {
    marginBottom: 22,
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  helperText: {
    color: COLORS.textFaint,
    fontSize: 12,
    marginTop: 4,
    maxWidth: 240,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    paddingRight: 6,
  },
  star: {
    fontSize: 34,
    color: COLORS.textFaint,
  },
  starFilled: {
    color: COLORS.star,
  },
  ratingLabel: {
    color: COLORS.textDim,
    fontSize: 13,
    marginLeft: 10,
    fontWeight: '500',
  },
  selectInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectInputText: {
    color: COLORS.text,
    fontSize: 15,
  },
  placeholderText: {
    color: COLORS.textFaint,
  },
  chevron: {
    color: COLORS.textDim,
    fontSize: 16,
  },
  textArea: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 15,
    minHeight: 120,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 6,
  },
  // Attachments
  attachmentHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  attachmentOptional: {
    color: COLORS.textFaint,
    fontSize: 11,
    marginLeft: 8,
    fontWeight: '500',
  },
  attachmentHint: {
    color: COLORS.textFaint,
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 17,
  },
  attachmentList: {
    gap: 0,
  },
  // Switch row
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  switchTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  submitButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  submitButtonPressed: {
    opacity: 0.85,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#0B0D12',
    fontSize: 16,
    fontWeight: '700',
  },
  // Type modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  menuCard: {
    backgroundColor: COLORS.surfaceRaised,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  menuTitle: {
    color: COLORS.textDim,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: COLORS.accentSoft,
  },
  menuItemText: {
    color: COLORS.text,
    fontSize: 15,
  },
  menuItemTextActive: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  menuItemCheck: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  // Success overlay
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4,5,8,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successCard: {
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    borderColor: COLORS.success,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(61, 220, 151, 0.14)',
    borderWidth: 1.5,
    borderColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: COLORS.success,
    fontSize: 34,
    fontWeight: '700',
  },
  successTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 6,
  },
  successSubtitle: {
    color: COLORS.textDim,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
  },
  successButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  successButtonText: {
    color: '#0B0D12',
    fontSize: 14,
    fontWeight: '700',
  },
});
