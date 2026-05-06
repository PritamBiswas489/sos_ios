import React, { useEffect, useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';
import styles from './style';

const VideoPlayerModal = ({ visible, videoUrl, onClose }) => {
  const [hasPlaybackError, setHasPlaybackError] = useState(false);

  useEffect(() => {
    if (visible) {
      setHasPlaybackError(false);
    }
  }, [visible, videoUrl]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Video</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <Icon name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {hasPlaybackError || !videoUrl ? (
            <View style={styles.errorBox}>
              <Icon name="error-outline" size={28} color="#FFFFFF" />
              <Text style={styles.errorText}>Unable to play this video.</Text>
            </View>
          ) : (
            <Video
              source={{ uri: videoUrl }}
              style={styles.video}
              controls
              resizeMode="contain"
              paused={!visible}
              onError={() => setHasPlaybackError(true)}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

export default React.memo(VideoPlayerModal);
