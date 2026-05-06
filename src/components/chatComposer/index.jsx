import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  PermissionsAndroid,
  Animated,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import Geolocation from '@react-native-community/geolocation';
import AudioRecord from 'react-native-audio-record';
import ChatActionSheet from '../chatActionSheet';
import MediaPreviewModal from '../mediaPreviewModal';
import { useChatActions, useChatTyping } from '../../context/ChatContext';
import { uploadMedia } from '../../config/apiClient';
import { getAppUrl } from '../../config/utility';
import styles from './style';
import MessageInput from './MessageInput';
import { selectedReplyMessageActions } from '../../store/redux/selectedReplyMessage.redux';
import { useUserData } from '../../hook/useUserData';
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 30 * 1024 * 1024;
const MAX_AUDIO_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024;
const getMediaSizeLimit = mediaCategory =>
  mediaCategory === 'video' ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;

const formatMegabytes = bytes => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const AUDIO_RECORD_OPTIONS = {
  sampleRate: 16000,
  channels: 1,
  bitsPerSample: 16,
  audioSource: 6,
  wavFile: 'recording.wav',
};

const ChatComposer = ({
  onSendComplete,
  showTypingIndicator = true,
}) => {
  const [showActionMenu, setShowActionMenu] = useState(false);
  const messageInputRef = useRef(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedMediaType, setSelectedMediaType] = useState(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadingLocalUri, setUploadingLocalUri] = useState(null);
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const chatSelectedTrustedContact = useSelector(state => state.chatSelectedTrustedContact);
  const {userData} = useUserData();
  const selectedReplyMessage = useSelector(state => state.selectedReplyMessage);
  const chatActions = useChatActions();
  const typingIndicators = useChatTyping();
  const currentUserId = userData?.id;
  const currentRoomId = chatSelectedTrustedContact?.roomId;
  const dispatch = useDispatch();

  const rawTypingInfo = typingIndicators?.[currentRoomId] || null;
  const typingInfo = rawTypingInfo?.userId && rawTypingInfo.userId !== currentUserId ? rawTypingInfo : null;
  if (typingInfo) {
    typingInfo.userName = chatSelectedTrustedContact?.name || typingInfo.userName;
  }

   


  useEffect(() => {
    if (isRecordingAudio) {
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingDuration(0);
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    };
  }, [isRecordingAudio, pulseAnim]);

  useEffect(() => {
    return () => {
      if (isRecordingAudio) {
        AudioRecord.stop();
      }
    };
  }, [currentRoomId, isRecordingAudio]);

  const openActionMenu = useCallback(() => setShowActionMenu(true), []);
  const closeActionMenu = useCallback(() => setShowActionMenu(false), []);

  const handleRemovePreview = useCallback(() => {
    setSelectedMedia(null);
    setSelectedMediaType(null);
    setIsUploadingMedia(false);
    setUploadingLocalUri(null);
    setShowMediaPreview(false);
  }, []);

  const handlePreviewSend = useCallback(async () => {
    if (isSendingMessage || !selectedMedia) return;
    try {
      setIsSendingMessage(true);
      setShowMediaPreview(false);
      await chatActions.sendMessage(
        chatSelectedTrustedContact?.roomId,
        chatSelectedTrustedContact?.receipent_id,
        messageInputRef.current?.getMessage()?.trim() ?? '',
        { url: selectedMedia, mediaType: selectedMediaType || 'image' },
        null,
        selectedReplyMessage?.id || null,
      );
      messageInputRef.current?.clearMessage();
      setSelectedMedia(null);
      setSelectedMediaType(null);
      setUploadingLocalUri(null);
      if (onSendComplete) {
        onSendComplete();
      }
    } finally {
      setIsSendingMessage(false);
    }
  }, [
    isSendingMessage,
    selectedMedia,
    selectedMediaType,
    chatActions,
    chatSelectedTrustedContact,
    onSendComplete,
    selectedReplyMessage,
  ]);

  const handleSendMessage = useCallback(async () => {
    if (isSendingMessage) return;
    const trimmedMessage = messageInputRef.current?.getMessage()?.trim() ?? '';
    if (!trimmedMessage && !selectedMedia) return;
    try {
      setIsSendingMessage(true);
      await chatActions.sendMessage(
        chatSelectedTrustedContact?.roomId,
        chatSelectedTrustedContact?.receipent_id,
        trimmedMessage,
        selectedMedia ? { url: selectedMedia, mediaType: selectedMediaType || 'image' } : null,
        null,
        selectedReplyMessage?.id || null,
      );
      messageInputRef.current?.clearMessage();
      setSelectedMedia(null);
      setSelectedMediaType(null);
      setUploadingLocalUri(null);
      if (onSendComplete) {
        onSendComplete();
      }
    } finally {
      setIsSendingMessage(false);
    }
  }, [
    isSendingMessage,
    selectedMedia,
    selectedMediaType,
    chatActions,
    chatSelectedTrustedContact,
    onSendComplete,
    selectedReplyMessage,
  ]);

  const handlePickFromGallery = useCallback((type) => {
    closeActionMenu();
    launchImageLibrary(
      { mediaType: type, selectionLimit: 1, quality: 0.8 },
      async response => {
        if (response.didCancel || response.errorCode) return;
        const asset = response?.assets?.[0];
        const uri = asset?.uri;
        if (!uri) return;
        const mimeType = asset?.type || 'image/jpeg';
        const mediaCategory = mimeType.startsWith('video/')
          ? 'video'
          : mimeType.startsWith('audio/')
          ? 'audio'
          : mimeType.startsWith('image/')
          ? 'image'
          : 'document';
        const fileSize = Number(asset?.fileSize || 0);
        const maxAllowedSize = getMediaSizeLimit(mediaCategory);
        if (fileSize > 0 && fileSize > maxAllowedSize) {
          Alert.alert(
            'File too large',
            `${mediaCategory === 'video' ? 'Video' : 'Image'} exceeds ${formatMegabytes(maxAllowedSize)}. Please choose a smaller file.`,
          );
          return;
        }
        setSelectedMediaType(mediaCategory);
        setIsUploadingMedia(true);
        setUploadingLocalUri(uri);
        let lastError;
        for (let attempt = 1; attempt <= 4; attempt++) {
          try {
            if (attempt === 2) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
            const formData = new FormData();
            formData.append('file', { uri, type: mimeType, name: asset?.fileName || 'media' });
            const uploads = await uploadMedia('/chat/upload-media', formData);
            const rawUrl = uploads?.data?.url;
            if (rawUrl) {
              const baseUrl = getAppUrl();
              const mediaUrl = rawUrl.includes('http://localhost:4000')
                ? rawUrl.replace('http://localhost:4000', baseUrl)
                : rawUrl;
              setSelectedMedia(mediaUrl);
              setSelectedMediaType(mediaCategory);
            }
            lastError = null;
            break;
          } catch (err) {
            lastError = err;
          }
        }
        if (lastError) {
          Alert.alert('Upload failed', 'Could not upload the media. Please try again.');
        }
        setIsUploadingMedia(false);
      },
    );
  }, [closeActionMenu]);

  const uploadAudioUri = useCallback(
    async ({ uri, mimeType = 'audio/wav', name = 'audio.wav', fileSize = 0 }) => {
      if (!uri) return;
      if (fileSize > 0 && fileSize > MAX_AUDIO_SIZE_BYTES) {
        Alert.alert(
          'File too large',
          `Audio exceeds ${formatMegabytes(MAX_AUDIO_SIZE_BYTES)}. Please choose a smaller file.`,
        );
        return;
      }

      setSelectedMediaType('audio');
      setIsUploadingMedia(true);
      setUploadingLocalUri(uri);
      let lastError;
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          if (attempt === 2) {
            // First attempt failed — file may still be flushing; wait before retry.
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          const formData = new FormData();
          formData.append('file', { uri, type: mimeType, name });
          const uploads = await uploadMedia('/chat/upload-media', formData);
          console.log('Upload response:', uploads);
          const rawUrl = uploads?.data?.url;
          if (rawUrl) {
            const baseUrl = getAppUrl();
            const mediaUrl = rawUrl.includes('http://localhost:4000')
              ? rawUrl.replace('http://localhost:4000', baseUrl)
              : rawUrl;
            setSelectedMedia(mediaUrl);
            setSelectedMediaType('audio');
          }
          lastError = null;
          break;
        } catch (err) {
          lastError = err;
        }
      }
      if (lastError) {
        Alert.alert('Upload failed', 'Could not upload the audio. Please try again.');
      }
      setIsUploadingMedia(false);
    },
    [],
  );

  const handlePickAudio = useCallback(async () => {
    closeActionMenu();
    try {
      const [file] = await pick({ type: [types.audio] });
      const uri = file?.uri;
      if (!uri) return;
      const mimeType = file?.type || 'audio/mpeg';
      const fileSize = Number(file?.size || 0);
      await uploadAudioUri({ uri, mimeType, name: file?.name || 'audio', fileSize });
    } catch (err) {
      if (!isErrorWithCode(err) || err.code !== errorCodes.OPERATION_CANCELED) {
        Alert.alert('Error', 'Could not open audio picker. Please try again.');
      }
    }
  }, [closeActionMenu, uploadAudioUri]);

  const handleRecordAudio = useCallback(async () => {
    closeActionMenu();
    try {
      if (!isRecordingAudio) {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert('Permission denied', 'Microphone permission is required to record audio.');
            return;
          }
        }

        AudioRecord.init(AUDIO_RECORD_OPTIONS);
        AudioRecord.start();
        setIsRecordingAudio(true);
        return;
      }

      const recordedPath = await AudioRecord.stop();
      setIsRecordingAudio(false);

      if (!recordedPath) {
        Alert.alert('Recording failed', 'Could not resolve recorded file path.');
        return;
      }

      // Wait for the native audio recorder to fully flush the WAV file to disk.
      // Without this delay, Android may return the path before the file is written,
      // causing net::ERR_FAILED on the first upload attempt.
      // Wait for the native audio encoder to finish flushing the WAV file to disk.
      // AudioRecord.stop() resolves before the file is fully written on Android.
      await new Promise(resolve => setTimeout(resolve, 1500));

      const recordedUri =
        recordedPath.startsWith('file://') || recordedPath.startsWith('content://')
          ? recordedPath
          : `file://${recordedPath}`;

      await uploadAudioUri({
        uri: recordedUri,
        mimeType: 'audio/wav',
        name: recordedPath.split('/').pop() || `voice-note-${Date.now()}.wav`,
      });
    } catch {
      setIsRecordingAudio(false);
      Alert.alert('Recording error', 'Could not record audio. Please try again.');
    }
  }, [closeActionMenu, isRecordingAudio, uploadAudioUri]);

  const handleCancelRecording = useCallback(async () => {
    try {
      await AudioRecord.stop();
    } catch {
      // ignore
    }
    setIsRecordingAudio(false);
  }, []);

  const handlePickDocument = useCallback(async () => {
    closeActionMenu();
    try {
      const [file] = await pick({ type: [types.allFiles] });
      const uri = file?.uri;
      if (!uri) return;

      const mimeType = file?.type || 'application/octet-stream';
      const fileSize = Number(file?.size || 0);
      if (fileSize > 0 && fileSize > MAX_DOCUMENT_SIZE_BYTES) {
        Alert.alert(
          'File too large',
          `Document exceeds ${formatMegabytes(MAX_DOCUMENT_SIZE_BYTES)}. Please choose a smaller file.`,
        );
        return;
      }

      setSelectedMediaType('document');
      setIsUploadingMedia(true);
      setUploadingLocalUri(uri);
      let lastError;
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          if (attempt === 2) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          const formData = new FormData();
          formData.append('file', { uri, type: mimeType, name: file?.name || 'document' });
          const uploads = await uploadMedia('/chat/upload-media', formData);
          const rawUrl = uploads?.data?.url;
          if (rawUrl) {
            const baseUrl = getAppUrl();
            const mediaUrl = rawUrl.includes('http://localhost:4000')
              ? rawUrl.replace('http://localhost:4000', baseUrl)
              : rawUrl;
            setSelectedMedia(mediaUrl);
            setSelectedMediaType('document');
          }
          lastError = null;
          break;
        } catch (err) {
          lastError = err;
        }
      }
      if (lastError) {
        Alert.alert('Upload failed', 'Could not upload the document. Please try again.');
      }
      setIsUploadingMedia(false);
    } catch (err) {
      if (!isErrorWithCode(err) || err.code !== errorCodes.OPERATION_CANCELED) {
        Alert.alert('Error', 'Could not open document picker. Please try again.');
      }
    }
  }, [closeActionMenu]);

  const handleCaptureFromCamera = useCallback(() => {
    closeActionMenu();
    launchCamera(
      { mediaType: 'photo', quality: 0.8, saveToPhotos: true },
      async response => {
        if (response.didCancel || response.errorCode) return;
        const asset = response?.assets?.[0];
        const uri = asset?.uri;
        if (!uri) return;
        const mimeType = asset?.type || 'image/jpeg';
        const fileSize = Number(asset?.fileSize || 0);
        if (fileSize > 0 && fileSize > MAX_IMAGE_SIZE_BYTES) {
          Alert.alert(
            'File too large',
            `Image exceeds ${formatMegabytes(MAX_IMAGE_SIZE_BYTES)}. Please capture a smaller image.`,
          );
          return;
        }
        setIsUploadingMedia(true);
        setUploadingLocalUri(uri);
        let lastError;
        for (let attempt = 1; attempt <= 4; attempt++) {
          try {
            if (attempt === 2) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
            const formData = new FormData();
            formData.append('file', { uri, type: mimeType, name: asset?.fileName || 'photo.jpg' });
            const uploads = await uploadMedia('/chat/upload-media', formData);
            const rawUrl = uploads?.data?.url;
            if (rawUrl) {
              const baseUrl = getAppUrl();
              const mediaUrl = rawUrl.includes('http://localhost:4000')
                ? rawUrl.replace('http://localhost:4000', baseUrl)
                : rawUrl;
              setSelectedMedia(mediaUrl);
              setSelectedMediaType('image');
            }
            lastError = null;
            break;
          } catch (err) {
            lastError = err;
          }
        }
        if (lastError) {
          Alert.alert('Upload failed', 'Could not upload the image. Please try again.');
        }
        setIsUploadingMedia(false);
      },
    );
  }, [closeActionMenu]);

  const handleShareCurrentLocation = useCallback(async () => {
    closeActionMenu();
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
        const hasPermission =
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
            PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
            PermissionsAndroid.RESULTS.GRANTED;
        if (!hasPermission) {
          Alert.alert('Permission denied', 'Location permission is required.');
          return;
        }
      }

      if (Platform.OS === 'ios') {
        Geolocation.requestAuthorization();
      }

      const position = await new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 30000,
          maximumAge: 60000,
        });
      });

      const { latitude, longitude } = position.coords;
      if (!latitude || !longitude) {
        Alert.alert('Location error', 'Could not fetch location. Please try again.');
        return;
      }

      await chatActions.sendMessage(
        chatSelectedTrustedContact?.roomId,
        chatSelectedTrustedContact?.receipent_id,
        '',
        null,
        { latitude, longitude },
      );
    } catch (error) {
      const msg =
        error?.code === 1 ? 'Location permission was denied.' :
        error?.code === 2 ? 'Location unavailable. Please enable GPS.' :
        error?.code === 3 ? 'Location request timed out. Try again.' :
        error?.message || 'Unable to fetch location';
      Alert.alert('Location Error', msg);
    }
  }, [closeActionMenu, chatActions, chatSelectedTrustedContact]);

  const handleCancelPreview = useCallback(() => setShowMediaPreview(false), []);

  return (
    <>
      {showTypingIndicator && typingInfo && (
        <View style={styles.typingIndicatorRow}>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, styles.typingDotOne]} />
            <View style={[styles.typingDot, styles.typingDotTwo]} />
            <View style={[styles.typingDot, styles.typingDotThree]} />
          </View>
          <Text style={styles.typingIndicatorText}>
            {typingInfo?.userName || 'Someone'} is typing...
          </Text>
        </View>
      )}

      <MediaPreviewModal
        visible={showMediaPreview}
        mediaType={selectedMediaType}
        localUri={uploadingLocalUri}
        uploadedUrl={selectedMedia}
        isUploading={isUploadingMedia}
        onSend={handlePreviewSend}
        onCancel={handleCancelPreview}
      />

      {(isUploadingMedia || selectedMedia) && (
        <TouchableOpacity
          style={styles.previewWrapper}
          activeOpacity={0.8}
          onPress={() => setShowMediaPreview(true)}
        >
          <View style={styles.previewImageContainer}>
            {selectedMediaType === 'video' ? (
              <View style={styles.previewImage}>
                <Icon name="videocam" size={28} color="#FFFFFF" />
              </View>
            ) : selectedMediaType === 'audio' ? (
              <View style={styles.previewImage}>
                <Icon name="headset" size={28} color="#FFFFFF" />
              </View>
            ) : selectedMediaType === 'document' ? (
              <View style={styles.previewImage}>
                <Icon name="description" size={28} color="#FFFFFF" />
              </View>
            ) : (
              <Image
                source={{ uri: uploadingLocalUri || selectedMedia }}
                style={styles.previewImage}
              />
            )}
            {isUploadingMedia && (
              <View style={styles.previewImageOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </View>
          <View style={styles.previewMetaContainer}>
            <Text style={styles.previewTitle}>
              {isUploadingMedia
                ? 'Uploading...'
                : selectedMediaType === 'video'
                ? 'Ready to send video'
                : selectedMediaType === 'audio'
                ? 'Ready to send audio'
                : selectedMediaType === 'document'
                ? 'Ready to send document'
                : 'Ready to send image'}
            </Text>
            <Text style={styles.previewSubtitle}>
              {isUploadingMedia ? 'Please wait' : 'Tap to preview'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.previewRemoveBtn}
            onPress={handleRemovePreview}
            activeOpacity={0.8}
          >
            <Icon name="close" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      <View style={styles.inputContainer}>
        {isRecordingAudio ? (
          <View style={styles.recordingBar}>
            <Animated.View style={[styles.recordingPulse, { opacity: pulseAnim }]}>
              <Icon name="mic" size={22} color="#FF3B5C" />
            </Animated.View>
            <View style={styles.recordingInfo}>
              <Text style={styles.recordingLabel}>Recording</Text>
              <Text style={styles.recordingTimer}>
                {String(Math.floor(recordingDuration / 60)).padStart(2, '0')}:
                {String(recordingDuration % 60).padStart(2, '0')}
              </Text>
            </View>
            <TouchableOpacity style={styles.recordingCancelBtn} onPress={handleCancelRecording}>
              <Icon name="delete-outline" size={20} color="#FF6B6B" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.recordingStopBtn} onPress={handleRecordAudio}>
              <Icon name="stop" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputField}>
            <TouchableOpacity style={styles.micBtn} onPress={openActionMenu}>
              <Icon name="add" size={22} color="#6B7C99" />
            </TouchableOpacity>

            <MessageInput
              ref={messageInputRef}
            />
              

            <TouchableOpacity
              onPress={handleSendMessage}
              style={[styles.sendBtn, (isSendingMessage || isUploadingMedia) && styles.sendBtnDisabled]}
              disabled={isSendingMessage || isUploadingMedia}
            >
              {isSendingMessage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ChatActionSheet
        visible={showActionMenu}
        onClose={closeActionMenu}
        onPickFromGallery={handlePickFromGallery}
        onPickAudio={handlePickAudio}
        onRecordAudio={handleRecordAudio}
        isRecordingAudio={isRecordingAudio}
        onPickDocument={handlePickDocument}
        onCaptureFromCamera={handleCaptureFromCamera}
        onShareCurrentLocation={handleShareCurrentLocation}
      />
    </>
  );
};

export default React.memo(ChatComposer);
