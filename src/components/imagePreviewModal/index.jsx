import React, { useState, useEffect } from 'react';
import { Image, Modal, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from './style';


const ImagePreviewModal = ({ visible, imageUrl, onClose }) => {
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    if (visible) {
      setHasImageError(false);
    }
  }, [visible, imageUrl]);

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
            <Text style={styles.title}>Image</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <Icon name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {hasImageError || !imageUrl ? (
            <View style={styles.errorBox}>
              <Icon name="error-outline" size={28} color="#FFFFFF" />
              <Text style={styles.errorText}>Image not available.</Text>
            </View>
          ) : (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="contain"
              onError={() => setHasImageError(true)}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

export default React.memo(ImagePreviewModal);
