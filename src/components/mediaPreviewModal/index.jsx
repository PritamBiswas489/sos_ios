import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';
import styles from './style';

const MediaPreviewModal = ({
  visible,
  mediaType,
  localUri,
  uploadedUrl,
  isUploading,
  onSend,
  onCancel,
}) => {
  const previewUri = localUri || uploadedUrl;
  const canSend = !!uploadedUrl && !isUploading;

   console.log(previewUri);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {mediaType === 'video'
                ? 'Video Preview'
                : mediaType === 'audio'
                ? 'Audio Preview'
                : 'Image Preview'}
            </Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeBtn} activeOpacity={0.8}>
              <Icon name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.previewArea}>
            {mediaType === 'video' && previewUri ? (
              <Video
                source={{ uri: previewUri }}
                style={styles.videoPreview}
                controls
                resizeMode="contain"
                paused={!visible}
              />
            ) : mediaType === 'audio' && previewUri ? (
              <View style={styles.audioPreviewContainer}>
                <Video
                  source={{ uri: previewUri }}
                  style={styles.audioPreview}
                  controls
                  audioOnly
                  paused={!visible}
                />
                <Text style={styles.audioFileName} numberOfLines={1}>
                  {previewUri.split('/').pop()}
                </Text>
              </View>
            ) : previewUri ? (
              <Image
                source={{ uri: previewUri }}
                style={styles.imagePreview}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.noPreview}>
                <Icon name="broken-image" size={40} color="#6B7C99" />
                <Text style={styles.noPreviewText}>No preview available</Text>
              </View>
            )}

            {isUploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="#FF3B5C" />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Icon name="delete-outline" size={20} color="#FF6B6B" />
              <Text style={styles.cancelBtnText}>Discard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
              onPress={onSend}
              disabled={!canSend}
              activeOpacity={0.8}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="send" size={18} color="#FFFFFF" />
                  <Text style={styles.sendBtnText}>Send</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default React.memo(MediaPreviewModal);
