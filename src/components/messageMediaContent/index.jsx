import React, { useEffect, useState, useRef } from 'react';
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import { getAppUrl } from '../../config/utility';
import { getAuthTokens } from '../../config/auth';
import { useChatActions } from '../../context/ChatContext';
import { handleVideoClickProcess } from '../../config/utility';

const isLikelyMediaUrl = value => {
  if (!value || typeof value !== 'string') return false;
  const normalizedValue = value.trim();
  if (!normalizedValue) return false;

  if (
    normalizedValue.startsWith('http://') ||
    normalizedValue.startsWith('https://')
  ) {
    return true;
  }

  if (
    normalizedValue.startsWith('file://') ||
    normalizedValue.startsWith('content://')
  ) {
    return true;
  }

  // Allow bare domains/paths because document handler can normalize these.
  return (
    normalizedValue.includes('.') ||
    normalizedValue.startsWith('/') ||
    normalizedValue.startsWith('//')
  );
};

const MessageMediaContent = ({
  item,
  styles,
  compact = false,
  onOpenImageModal,
  onOpenVideoModal,
  onOpenAudioModal,
  onOpenDocument,
}) => {
  const chatActions = useChatActions();
  const chatSelectedTrustedContact = useSelector(
    state => state.chatSelectedTrustedContact,
  );
  const currentRoomId = chatSelectedTrustedContact?.roomId;

  const [mediaErrorText, setMediaErrorText] = useState('');
  const [converting, setConverting] = useState(false);
  const [convertProgress, setConvertProgress] = useState(0);
  const [convertedUrl, setConvertedUrl] = useState('');
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [isMovFile, setIsMovFile] = useState(item?.isMov);

  useEffect(() => {
    setMediaErrorText('');
  }, [item?.mediaUrl, item?.mediaType]);

  const startConversion = async () => {
    if (!item?.mediaUrl) return;

    setConverting(true);
    setConvertProgress(0);
    setShowConversionModal(true);

    try {
      const { accessToken } = await getAuthTokens();
      const baseUrl = getAppUrl();

      const xhr = new XMLHttpRequest();
      let lastProcessedLength = 0;
      let isDone = false;

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 3 || xhr.readyState === 4) {
          const responseText = xhr.responseText || '';
          const newText = responseText.substring(lastProcessedLength);
          lastProcessedLength = responseText.length;

          if (!newText) return;

          const lines = newText.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6).trim();
                if (!jsonStr) continue;

                const data = JSON.parse(jsonStr);
                //console.log('SSE event received:', data);

                if (data.status === 'start') {
                  setConvertProgress(0);
                } else if (
                  data.status === 'progress' &&
                  typeof data.percent === 'number'
                ) {
                  setConvertProgress(data.percent);
                  //console.log('Progress updated:', data.percent);
                } else if (data.status === 'done' && data.media_url) {
                  if (!isDone) {
                    isDone = true;
                    setConvertedUrl(data.media_url);
                    setIsMovFile(false);
                    setConverting(false);
                    setConvertProgress(100);
                    // console.log('Conversion complete:', data.media_url);

                    // Update the message in the store
                    if (currentRoomId && item?.id) {
                      chatActions.updateMessage(currentRoomId, item.id, {
                        mediaUrl: data.media_url,
                        media_url: data.media_url,
                        isMov: false,
                      });
                    }

                    setTimeout(() => {
                      setShowConversionModal(false);
                      onOpenVideoModal?.(data.media_url);
                    }, 500);
                  }
                } else if (data.status === 'error') {
                  //console.log('Conversion error from server:', data.message);
                  setConverting(false);
                  setShowConversionModal(false);
                  setMediaErrorText(data.message || 'Video conversion failed');
                }
              } catch (e) {
                //console.log('Failed to parse SSE line:', line, e);
              }
            }
          }
        }
      };

      xhr.addEventListener('error', () => {
        //console.log('Conversion XHR error');
        setConverting(false);
        setShowConversionModal(false);
        setMediaErrorText('Video conversion failed');
      });

      xhr.open(
        'POST',
        `${baseUrl}/api-mobile/auth/chat/chat-ios-convert-mov-to-mp4`,
      );
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

      xhr.send(
        JSON.stringify({
          chatMessageId: item.id,
        }),
      );
    } catch (error) {
      //console.log('Conversion error:', error);
      setConverting(false);
      setShowConversionModal(false);
      setMediaErrorText('Video conversion failed');
    }
  };

  if (!item?.mediaUrl) return null;

  const showUnavailable = text => (
    <View
      style={[
        styles.mediaBubbleImage,
        compact && styles.mediaBubbleCompact,
        {
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#EEEEEE',
        },
      ]}
    >
      <Icon name="error-outline" size={28} color="#666666" />
      <Text style={{ color: '#666666', marginTop: 4, fontSize: 12 }}>
        {text}
      </Text>
    </View>
  );

  if (mediaErrorText) {
    return showUnavailable(mediaErrorText);
  }

  const openMedia = async (openHandler, fallbackText) => {
    try {
      const result = await openHandler?.(item.mediaUrl);
      if (result === false) {
        setMediaErrorText(fallbackText);
      }
    } catch {
      setMediaErrorText(fallbackText);
    }
  };

  const renderConversionModal = () => (
    <Modal
      visible={showConversionModal}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.82)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            backgroundColor: '#0F1115',
            borderRadius: 16,
            padding: 32,
            width: '80%',
            maxWidth: 320,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)',
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: 'rgba(96, 166, 255, 0.22)',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <Icon name="videocam" size={32} color="#60A6FF" />
          </View>

          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#F3F6FF',
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            Processing Video
          </Text>

          <ActivityIndicator size="large" color="#60A6FF" />

          <Text
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: '#60A6FF',
              marginTop: 16,
              marginBottom: 12,
            }}
          >
            {convertProgress}%
          </Text>

          <View
            style={{
              width: '100%',
              height: 8,
              backgroundColor: 'rgba(96, 166, 255, 0.16)',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${convertProgress}%`,
                height: '100%',
                backgroundColor: '#60A6FF',
                borderRadius: 4,
              }}
            />
          </View>

          <Text
            style={{
              fontSize: 12,
              color: '#8A96AD',
              marginTop: 16,
              textAlign: 'center',
            }}
          >
            Please wait while we prepare your video
          </Text>
        </View>
      </View>
    </Modal>
  );

  if (item.mediaType === 'image') {
    if (!isLikelyMediaUrl(item.mediaUrl)) {
      return showUnavailable('Image not available');
    }

    return (
      <>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => onOpenImageModal?.(item.mediaUrl)}
        >
          <Image
            source={{ uri: item.mediaUrl }}
            style={[
              styles.mediaBubbleImage,
              compact && styles.mediaBubbleCompact,
            ]}
            resizeMode="cover"
            onError={() => setMediaErrorText('Image not available')}
          />
        </TouchableOpacity>
        {renderConversionModal()}
      </>
    );
  }

  if (item.mediaType === 'video') {
    //console.log('Rendering video content for URL:', item);
    if (!isLikelyMediaUrl(item.mediaUrl) && !convertedUrl) {
      return showUnavailable('Video not available');
    }

    const videoUrl = convertedUrl || item.mediaUrl;

    const handleVideoClick = () => {
      console.log(item);
      console.log('isMovFile', isMovFile);
      console.log(
        'Video clicked. MOV file:',
        isMovFile,
        'Converted URL:',
        videoUrl,
      );
      // if (isMovFile) {
      //   startConversion();
      // } else {
      //   openMedia(() => onOpenVideoModal?.(videoUrl), 'Video not available');
      // }
      handleVideoClickProcess({
        isMovFile,
        startConversion,
        onOpenVideoModal: () =>
          openMedia(() => onOpenVideoModal?.(videoUrl), 'Video not available'),
        videoUrl,
      });
    };

    return (
      <>
        <TouchableOpacity
          style={[
            styles.mediaBubbleVideo,
            compact && styles.mediaBubbleCompact,
          ]}
          activeOpacity={0.85}
          onPress={handleVideoClick}
        >
          <View style={styles.mediaBubbleMetaRow}>
            <View style={styles.mediaTypePill}>
              <Icon name="videocam" size={13} color="#DDF5FF" />
              <Text style={styles.mediaTypePillText}>
                {isMovFile ? 'MOV VIDEO' : 'VIDEO'}
              </Text>
            </View>
          </View>

          <View style={styles.mediaBubblePlayBtn}>
            <Icon name="play-arrow" size={30} color="#FFFFFF" />
          </View>
          <Text style={styles.mediaBubbleLabel}>Tap to play video</Text>
          <Text style={styles.mediaBubbleSubLabel}>
            {isMovFile ? 'Will convert to MP4' : 'HD attachment'}
          </Text>
        </TouchableOpacity>
        {renderConversionModal()}
      </>
    );
  }

  if (item.mediaType === 'audio') {
    if (!isLikelyMediaUrl(item.mediaUrl)) {
      return showUnavailable('Audio not available');
    }

    return (
      <>
        <TouchableOpacity
          style={[
            styles.mediaBubbleAudio,
            compact && styles.mediaBubbleCompact,
          ]}
          activeOpacity={0.85}
          onPress={() => openMedia(onOpenAudioModal, 'Audio not available')}
        >
          <View style={styles.mediaAudioIconWrap}>
            <Icon name="headset" size={18} color="#FFFFFF" />
          </View>

          <View style={styles.mediaAudioContent}>
            <Text style={styles.mediaBubbleLabel}>Audio message</Text>
            <View style={styles.mediaAudioWaveRow}>
              <View style={styles.mediaAudioWaveBarShort} />
              <View style={styles.mediaAudioWaveBarTall} />
              <View style={styles.mediaAudioWaveBarMedium} />
              <View style={styles.mediaAudioWaveBarTall} />
              <View style={styles.mediaAudioWaveBarShort} />
              <View style={styles.mediaAudioWaveBarMedium} />
              <View style={styles.mediaAudioWaveBarShort} />
            </View>
          </View>

          <Icon name="play-arrow" size={22} color="#CFE9FF" />
        </TouchableOpacity>
        {renderConversionModal()}
      </>
    );
  }

  if (item.mediaType === 'document') {
    if (!isLikelyMediaUrl(item.mediaUrl)) {
      return showUnavailable('Document not available');
    }

    return (
      <>
        <TouchableOpacity
          style={[
            styles.mediaBubbleDocument,
            compact && styles.mediaBubbleCompact,
          ]}
          activeOpacity={0.85}
          onPress={() => openMedia(onOpenDocument, 'Document not available')}
        >
          <Icon name="insert-drive-file" size={22} color="#FFFFFF" />
          <Text style={styles.mediaBubbleLabel}>Document</Text>
        </TouchableOpacity>
        {renderConversionModal()}
      </>
    );
  }

  return renderConversionModal();
};

export default React.memo(MessageMediaContent);
