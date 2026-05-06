import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';
import styles from './style';

const formatDuration = seconds => {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const wholeSeconds = Math.floor(seconds);
  const mins = Math.floor(wholeSeconds / 60);
  const secs = wholeSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const AudioPlayerModal = ({ visible, audioUrl, onClose }) => {
  const playerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasPlaybackError, setHasPlaybackError] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setIsPaused(false);
    setDuration(0);
    setCurrentTime(0);
    setHasPlaybackError(false);
  }, [visible, audioUrl]);

  const handleSeek = useCallback(targetTime => {
    if (!playerRef.current) return;
    const safeTarget = Math.max(0, Math.min(targetTime, duration || 0));
    playerRef.current.seek(safeTarget);
    setCurrentTime(safeTarget);
  }, [duration]);

  const progressWidth = useMemo(() => {
    if (!duration || duration <= 0) return '0%';
    const progress = Math.max(0, Math.min(currentTime / duration, 1));
    return `${Math.round(progress * 100)}%`;
  }, [currentTime, duration]);

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
            <Text style={styles.title}>Audio Message</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <Icon name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {hasPlaybackError || !audioUrl ? (
            <View style={styles.errorBox}>
              <Icon name="error-outline" size={28} color="#FFFFFF" />
              <Text style={styles.errorText}>Unable to play this audio.</Text>
            </View>
          ) : (
            <View style={styles.content}>
              <View style={styles.iconBubble}>
                <Icon name="graphic-eq" size={26} color="#FFFFFF" />
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: progressWidth }]} />
              </View>

              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>{formatDuration(currentTime)}</Text>
                <Text style={styles.timeLabel}>{formatDuration(duration)}</Text>
              </View>

              <View style={styles.controlsRow}>
                <TouchableOpacity
                  style={styles.controlBtn}
                  onPress={() => handleSeek(currentTime - 10)}
                  activeOpacity={0.85}
                >
                  <Icon name="replay-10" size={22} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.playPauseBtn}
                  onPress={() => setIsPaused(previous => !previous)}
                  activeOpacity={0.85}
                >
                  <Icon name={isPaused ? 'play-arrow' : 'pause'} size={28} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlBtn}
                  onPress={() => handleSeek(currentTime + 10)}
                  activeOpacity={0.85}
                >
                  <Icon name="forward-10" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!!audioUrl && (
            <Video
              ref={playerRef}
              source={{ uri: audioUrl }}
              paused={isPaused || !visible}
              playInBackground={false}
              playWhenInactive={false}
              ignoreSilentSwitch="ignore"
              style={styles.hiddenPlayer}
              onLoad={({ duration: loadedDuration }) => setDuration(loadedDuration || 0)}
              onProgress={({ currentTime: playbackTime }) => setCurrentTime(playbackTime || 0)}
              onError={() => setHasPlaybackError(true)}
              onEnd={() => {
                setIsPaused(true);
                handleSeek(0);
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

export default React.memo(AudioPlayerModal);
