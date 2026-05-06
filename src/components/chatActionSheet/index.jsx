import React from 'react';
import { Modal, Pressable, View, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from './style';

const ChatActionSheet = ({
  visible,
  onClose,
  onPickFromGallery,
  onPickAudio,
    onRecordAudio,
    isRecordingAudio = false,
    onPickDocument,
  onCaptureFromCamera,
  onShareCurrentLocation,
}) => {
    return (
    <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
        hardwareAccelerated
    >
        <Pressable style={styles.actionSheetOverlay} onPress={onClose} android_disableSound>
            <View style={styles.actionSheetContainer}>
                <TouchableOpacity style={styles.actionItem} onPress={() => onPickFromGallery('image')}>
                    <Icon name="image" size={20} color="#FFFFFF" />
                    <Text style={styles.actionText}>Image</Text>
                </TouchableOpacity>

                 <TouchableOpacity style={styles.actionItem} onPress={() => onPickFromGallery('video')}>
                    <Icon name="video-library" size={20} color="#FFFFFF" />
                    <Text style={styles.actionText}>Video</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem} onPress={onPickAudio}>
                    <Icon name="headset" size={20} color="#FFFFFF" />
                    <Text style={styles.actionText}>Audio File</Text>
                </TouchableOpacity>

                {typeof onRecordAudio === 'function' && (
                    <TouchableOpacity style={styles.actionItem} onPress={onRecordAudio}>
                        <Icon name={isRecordingAudio ? 'stop-circle' : 'keyboard-voice'} size={20} color="#FFFFFF" />
                        <Text style={styles.actionText}>{isRecordingAudio ? 'Stop Recording' : 'Record Audio'}</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.actionItem} onPress={onPickDocument}>
                    <Icon name="description" size={20} color="#FFFFFF" />
                    <Text style={styles.actionText}>Document</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem} onPress={onCaptureFromCamera}>
                    <Icon name="camera-alt" size={20} color="#FFFFFF" />
                    <Text style={styles.actionText}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem} onPress={onShareCurrentLocation}>
                    <Icon name="my-location" size={20} color="#FFFFFF" />
                    <Text style={styles.actionText}>Share Current Location</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionItem, styles.cancelActionItem]}
                    onPress={onClose}
                >
                    <Icon name="clear" size={20} color="#FF6B6B" />
                    <Text style={styles.cancelActionText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </Pressable>
    </Modal>
);
};

export default React.memo(ChatActionSheet);
