import React, { use, useCallback, useEffect, useRef, useState } from 'react';
import appColors from '../../theme/appColors';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Image,
  Button,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useUserData } from '../../hook/useUserData';
import { useCreatorMediaSoup } from '../../context/CreatorMediaSoupContext';
import AudioVisualizer from '../../components/audioVisualizer';
import styles from './style';
import { getProfileImage } from '../../config/utility';
import { SOSService } from '../../services/sos.service';
import { useMySosSessions } from '../../hook/useMySosSessions';
import { useChatContacts } from '../../hook/useChatContacts';
import { useStress } from '../../context/StressContext';
import { useLocation } from '../../context/LocationContext';
import * as Sentry from '@sentry/react-native';

// ─── Status badge config ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  idle: {
    label: 'IDLE',
    dotColor: '#2a2a30',
    badgeColor: '#6b6b7a',
    badgeBg: '#1f1f24',
  },
  connecting: {
    label: 'CONNECTING',
    dotColor: '#7c6ff7',
    badgeColor: '#7c6ff7',
    badgeBg: 'rgba(124,111,247,0.15)',
  },
  streaming: {
    label: '● LIVE',
    dotColor: '#ef4444',
    badgeColor: '#ef4444',
    badgeBg: 'rgba(239,68,68,0.15)',
  },
  waiting: {
    label: 'WAITING',
    dotColor: '#f59e0b',
    badgeColor: '#f59e0b',
    badgeBg: 'rgba(245,158,11,0.15)',
  },
  error: {
    label: 'ERROR',
    dotColor: '#ef4444',
    badgeColor: '#ef4444',
    badgeBg: 'rgba(239,68,68,0.15)',
  },
};

const HomeScreen = () => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const holdAnim = useRef(new Animated.Value(0)).current;
  const panelAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const holdTimerRef = useRef(null);
  const { fetchMySosSessions } = useMySosSessions();
  const { contactList } = useChatContacts();
  const { stress } = useStress();
  const { getCurrentPosition } = useLocation();
  const { userData } = useUserData();
  const {
    status,
    statusText,
    isMuted,
    joinRoom,
    leaveRoom,
    toggleMute,
    connectedListeners,
  } = useCreatorMediaSoup();

  const isInRoom = status !== 'idle' && status !== 'error';
  const showPanel = status !== 'idle';
  const isStreaming = status === 'streaming';
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.idle;

  // ── Pulse ring animation ───────────────────────────────────────────────────
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  useEffect(() => {
    console.log('Status changed:', status, statusText);
  }, [status, statusText]);

  // ── Connecting spin animation ──────────────────────────────────────────────
  useEffect(() => {
    if (status === 'connecting') {
      spinAnim.setValue(0);
      const spin = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      );
      spin.start();
      return () => spin.stop();
    } else {
      spinAnim.setValue(0);
    }
  }, [status]);

  // ── Streaming panel slide-in ───────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(panelAnim, {
      toValue: showPanel ? 1 : 0,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [showPanel]);

  // ── Hold-to-stream handlers ────────────────────────────────────────────────
  const handlePressIn = useCallback(() => {
    if (isInRoom) return;
    holdAnim.setValue(0);
    Animated.timing(holdAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();
  }, [isInRoom]);

  const handlePressOut = useCallback(() => {
    holdAnim.stopAnimation();
    Animated.timing(holdAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, []);

  const handleLongPress = useCallback(async () => {
    if (isInRoom) return;
    const currentLocation = await getCurrentPosition();
    const args = {
      latitude: currentLocation?.latitude,
      longitude: currentLocation?.longitude,
    };
    const createSOS = await new Promise(resolve => {
      SOSService.createNewSOS(args, result => {
        resolve(result.data);
      });
    });

    console.log('Joining room...' + userData?.id);
    const sosId = createSOS?.data?.id;
    if (!sosId) {
      console.log('❌ Failed to create SOS. Cannot join room.');
      return;
    }
    joinRoom(`sos-live-${userData?.id}`, sosId);
    fetchMySosSessions();
  }, [isInRoom, joinRoom, userData?.id, fetchMySosSessions]);

  const handleStop = useCallback(() => leaveRoom(), [leaveRoom]);

  // ── Interpolations ─────────────────────────────────────────────────────────
  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1.2],
    outputRange: [0, 1.8],
  });
  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.3, 0],
  });

  const holdRingColor = holdAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(239,68,68,0.0)', 'rgba(239,68,68,1.0)'],
  });
  const holdRingScale = holdAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 1.13],
  });

  const panelOpacity = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const panelMaxH = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 400],
  });

  const spinRotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      {/* ── Greeting ── */}
      <View style={styles.greetingContainer}>
        <Text style={styles.goodMorning}>WELCOME,</Text>
        <Text style={styles.userName}>
          {userData?.name || userData?.phone_number} 👋
        </Text>
        {/* <Button
          title="Try!"
          onPress={() => {
            Sentry.captureException(new Error('First error'));
          }}
        /> */}
      </View>

      {/* ── SOS Button ── */}
      <View style={styles.sosWrapper}>
        {/* Idle pulse rings */}
        {!isInRoom && (
          <>
            <Animated.View
              style={[
                styles.glowRing,
                { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
              ]}
            />
            <Animated.View
              style={[
                styles.glowRing2,
                { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
              ]}
            />
          </>
        )}

        {/* Hold-progress ring */}
        <Animated.View
          style={[
            localStyles.holdRing,
            {
              borderColor: holdRingColor,
              transform: [{ scale: holdRingScale }],
            },
          ]}
        />

        {/* Connecting spinner */}
        {status === 'connecting' && (
          <Animated.View
            style={[
              localStyles.connectingRing,
              { transform: [{ rotate: spinRotate }] },
            ]}
          />
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onLongPress={handleLongPress}
          delayLongPress={2000}
          disabled={isInRoom}
        >
          <View
            style={[styles.sosButton, isStreaming && localStyles.sosButtonLive]}
          >
            {isStreaming && (
              <View style={localStyles.liveBadge}>
                <Text style={localStyles.liveBadgeText}>● LIVE</Text>
              </View>
            )}
            <Text style={styles.sosText}>SOS</Text>
            <Text style={styles.sosSubText}>
              {isInRoom
                ? isStreaming
                  ? 'STREAMING'
                  : 'CONNECTING…'
                : 'HOLD 2s TO STREAM'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Streaming Panel ── */}
      <Animated.View
        style={[
          localStyles.streamPanel,
          { opacity: panelOpacity, maxHeight: panelMaxH },
        ]}
      >
        {/* Header */}
        <View style={localStyles.headerRow}>
          <View style={localStyles.headerLeft}>
            <View style={localStyles.liveDot} />
            <Text style={localStyles.headerTitle}>
              Live — streaming audio
            </Text>
          </View>
          {isStreaming && (
            <View style={localStyles.liveBadgeTop}>
              <Text style={localStyles.liveBadgeTopText}>LIVE</Text>
            </View>
          )}
        </View>

        {/* Listeners section */}
        {isStreaming && (
          <View style={localStyles.listenersSection}>
            <View style={localStyles.listenersHeader}>
              <Icon name="headset" size={14} color="#9ca3af" />
              <Text style={localStyles.listenersTitle}>LISTENERS</Text>
              <View style={localStyles.listenerCountBadge}>
                <Text style={localStyles.listenerCountText}>
                  {Object.keys(connectedListeners).length}
                </Text>
              </View>
            </View>
            {Object.keys(connectedListeners).length === 0 ? (
              <View style={localStyles.noListenersContainer}>
                <Text style={localStyles.noListenersText}>
                  Waiting for listeners…
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={localStyles.listenersScroll}
              >
                {Object.values(connectedListeners).map(listener => {
                  const initials = (listener.userName || listener.userId || '?')
                    .split(' ')
                    .map(w => w[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  return (
                    <View
                      key={listener.userId}
                      style={localStyles.listenerChip}
                    >
                      <View style={localStyles.listenerAvatarWrap}>
                        {listener.profilePhoto ? (
                          <Image
                            source={{
                              uri: getProfileImage(listener.profilePhoto),
                            }}
                            style={localStyles.listenerAvatar}
                          />
                        ) : (
                          <View style={localStyles.listenerAvatarFallback}>
                            <Text style={localStyles.listenerInitials}>
                              {initials}
                            </Text>
                          </View>
                        )}
                        <View style={localStyles.onlineDot} />
                      </View>
                      <Text style={localStyles.listenerName} numberOfLines={1}>
                        {listener.userName || 'User'}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}

        {/* Visualizer */}
        <View style={localStyles.visualizerSection}>
          <AudioVisualizer
            active={isStreaming && !isMuted}
            color="#ef4444"
            label="MICROPHONE INPUT"
            height={55}
          />
        </View>

        {/* Action buttons */}
        <View style={localStyles.actionRow}>
          <TouchableOpacity
            style={[
              localStyles.actionBtn,
              localStyles.muteBtn,
              !isStreaming && localStyles.disabledBtn,
            ]}
            onPress={toggleMute}
            disabled={!isStreaming}
            activeOpacity={0.8}
          >
            <Icon
              name={isMuted ? 'mic-off' : 'mic'}
              size={16}
              color={isMuted ? '#f59e0b' : '#fff'}
            />
            <Text
              style={[
                localStyles.actionBtnText,
                isMuted && { color: '#f59e0b' },
              ]}
            >
              {isMuted ? 'UNMUTE' : 'MUTE'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[localStyles.actionBtn, localStyles.stopBtn]}
            onPress={handleStop}
            activeOpacity={0.8}
          >
            <Icon name="stop-circle" size={16} color="#fff" />
            <Text style={localStyles.actionBtnText}>STOP STREAM</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Safe Status ── */}
      <View style={styles.safeCard}>
        <View style={styles.greenDot} />
        <Text style={styles.safeText}>You're safe · Live tracking ON</Text>
      </View>

      {/* ── Info Cards ── */}
      <View style={styles.grid}>
        <View style={styles.card}>
          <Icon name="favorite" size={30} color="#FF4757" />
          <Text style={[styles.cardNumber, { color: appColors.primary }]}>
            {stress.currentHR} bpm
          </Text>
          <Text style={styles.cardLabel}>HEART RATE</Text>
        </View>

        <View style={styles.card}>
          <Icon name="psychology" size={30} color="#FFA502" />
          <Text style={[styles.cardNumber, { color: appColors.yellow }]}>
            {stress.score}%
          </Text>
          <Text style={styles.cardLabel}>STRESS LEVEL</Text>
        </View>

        <View style={styles.card}>
          <Icon name="people" size={30} color="#A4B0BE" />
          <Text style={[styles.cardNumber, { color: appColors.blue }]}>
            {contactList.length}
          </Text>
          <Text style={styles.cardLabel}>CONTACTS</Text>
        </View>

        <View style={styles.card}>
          <Icon name="location-on" size={30} color="#2ED573" />
          <Text style={[styles.cardNumber, { color: '#2ED573' }]}>ON</Text>
          <Text style={styles.cardLabel}>GPS TRACK</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;

// ─── Local styles (streaming panel + hold ring) ───────────────────────────────
const localStyles = StyleSheet.create({
  holdRing: {
    position: 'absolute',
    width: 185,
    height: 185,
    borderRadius: 93,
    borderWidth: 3,
    borderColor: 'transparent',
  },

  connectingRing: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#7c6ff7',
    borderRightColor: 'rgba(124,111,247,0.3)',
  },

  sosButtonLive: {
    backgroundColor: '#c0222299',
    shadowColor: '#ef4444',
  },

  liveBadge: {
    position: 'absolute',
    top: 10,
    backgroundColor: 'rgba(239,68,68,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  liveBadgeText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  // Streaming panel
  streamPanel: {
    marginHorizontal: 18,
    marginBottom: 12,
    backgroundColor: '#1a1b26',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2a2d3a',
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  headerTitle: {
    fontSize: 14,
    color: '#e5e7eb',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  liveBadgeTop: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveBadgeTopText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  statusLabel: {
    flex: 1,
    fontSize: 12,
    color: '#a0a0b0',
    fontWeight: '500',
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
  },

  // Visualizer section
  visualizerSection: {
    backgroundColor: '#16171f',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#252732',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  muteBtn: {
    backgroundColor: '#1f2028',
    borderWidth: 1,
    borderColor: '#2a2d3a',
  },
  stopBtn: {
    backgroundColor: '#ef4444',
  },
  disabledBtn: {
    opacity: 0.4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },

  // Listeners section
  listenersSection: {
    gap: 10,
    paddingTop: 4,
    maxHeight: 120,
  },
  listenersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listenersTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: 1,
    flex: 1,
  },
  listenerCountBadge: {
    backgroundColor: '#ef444420',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listenerCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ef4444',
  },
  noListenersContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  noListenersText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  listenersScroll: {
    gap: 12,
    paddingVertical: 6,
    paddingRight: 4,
  },
  listenerChip: {
    alignItems: 'center',
    gap: 6,
    width: 60,
  },
  listenerAvatarWrap: {
    position: 'relative',
  },
  listenerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: '#3b82f6',
  },
  listenerAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2a2d3a',
    borderWidth: 2.5,
    borderColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listenerInitials: {
    fontSize: 15,
    fontWeight: '700',
    color: '#93c5fd',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#1a1b26',
  },
  listenerName: {
    fontSize: 11,
    color: '#d1d5db',
    fontWeight: '500',
    textAlign: 'center',
    width: 60,
  },
});
