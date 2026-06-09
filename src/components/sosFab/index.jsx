import React, { useEffect, useRef } from 'react';
import {
  Animated,
  ActivityIndicator,
  Dimensions,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const FAB_SIZE = 40;
const PADDING = 10;

const SosFab = ({ onPress, visible = true, loading = false }) => {
  const insets = useSafeAreaInsets();
  const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
  const initialX = PADDING;
  const centerY = (SCREEN_H - FAB_SIZE) / 2;
  const initialY = Math.max(
    PADDING + insets.top,
    Math.min(centerY, SCREEN_H - FAB_SIZE - PADDING - insets.bottom),
  );

  const position = useRef(
    new Animated.ValueXY({
      x: initialX,
      y: initialY,
    }),
  ).current;

  const posRef = useRef({
    x: initialX,
    y: initialY,
  });

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const dragScale = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.7)).current;
  const startPosRef = useRef({
    x: initialX,
    y: initialY,
  });
  const pulseLoop = useRef(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, scaleAnim]);

  useEffect(() => {
    pulseLoop.current = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ringScale, { toValue: 1.55, duration: 1000, useNativeDriver: true }),
          Animated.timing(ringScale, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(ringOpacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0.7, duration: 1000, useNativeDriver: true }),
        ]),
      ]),
    );
    pulseLoop.current.start();

    return () => pulseLoop.current?.stop();
  }, [ringScale, ringOpacity]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,

      onPanResponderGrant: () => {
        startPosRef.current = { ...posRef.current };
        position.extractOffset();
        Animated.spring(dragScale, { toValue: 0.88, useNativeDriver: true }).start();
      },

      onPanResponderMove: (_, g) => {
        const minY = PADDING + insets.top;
        const maxY = SCREEN_H - FAB_SIZE - PADDING - insets.bottom;
        const rawX = startPosRef.current.x + g.dx;
        const rawY = startPosRef.current.y + g.dy;
        const clampedX = Math.max(PADDING, Math.min(SCREEN_W - FAB_SIZE - PADDING, rawX));
        const clampedY = Math.max(minY, Math.min(maxY, rawY));
        position.setValue({
          x: clampedX - startPosRef.current.x,
          y: clampedY - startPosRef.current.y,
        });
      },

      onPanResponderRelease: (_, g) => {
        const minY = PADDING + insets.top;
        const maxY = SCREEN_H - FAB_SIZE - PADDING - insets.bottom;
        position.flattenOffset();
        const currentX = startPosRef.current.x + g.dx;
        const currentY = startPosRef.current.y + g.dy;
        const snapX =
          currentX + FAB_SIZE / 2 < SCREEN_W / 2
            ? PADDING
            : SCREEN_W - FAB_SIZE - PADDING;
        const clampedY = Math.max(minY, Math.min(maxY, currentY));

        Animated.parallel([
          Animated.spring(position, {
            toValue: { x: snapX, y: clampedY },
            friction: 6,
            tension: 80,
            useNativeDriver: false,
          }),
          Animated.spring(dragScale, { toValue: 1, useNativeDriver: true }),
        ]).start(() => {
          posRef.current = { x: snapX, y: clampedY };
        });
      },

      onPanResponderTerminate: () => {
        position.flattenOffset();
        Animated.spring(dragScale, { toValue: 1, useNativeDriver: true }).start();
      },
    }),
  ).current;

  useEffect(() => {
    const listenerId = position.addListener(({ x, y }) => {
      posRef.current = { x, y };
    });
    return () => position.removeListener(listenerId);
  }, [position]);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.wrapper,
        { left: position.x, top: position.y },
      ]}
      pointerEvents={visible ? 'box-none' : 'none'}>
      <Animated.View
        style={{ transform: [{ scale: Animated.multiply(scaleAnim, dragScale) }] }}>
        <Animated.View
          style={[
            styles.pulseRing,
            { transform: [{ scale: ringScale }], opacity: ringOpacity },
          ]}
        />

        <Animated.View
          style={[
            styles.pulseRingSoft,
            {
              transform: [{ scale: ringScale }],
              opacity: Animated.multiply(ringOpacity, 0.4),
            },
          ]}
        />

        <TouchableOpacity
          style={styles.fab}
          onPress={onPress}
          activeOpacity={0.85}
          disabled={loading}
          accessibilityLabel="Open SOS Alerts"
          accessibilityRole="button">
          <View style={styles.innerGlow} />
          {loading
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <Icon name="shield-alert" size={26} color="#FFFFFF" />}
          <View style={styles.liveDot} />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: FAB_SIZE,
    height: FAB_SIZE,
    zIndex: 999,
    elevation: 12,
  },
  pulseRing: {
    position: 'absolute',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#FF3B5C',
  },
  pulseRingSoft: {
    position: 'absolute',
    width: FAB_SIZE + 12,
    height: FAB_SIZE + 12,
    borderRadius: (FAB_SIZE + 12) / 2,
    backgroundColor: '#FF3B5C',
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#C0132E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3B5C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  innerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    borderTopLeftRadius: FAB_SIZE / 2,
    borderTopRightRadius: FAB_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  liveDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00FF9C',
    borderWidth: 1.5,
    borderColor: '#C0132E',
  },
});

export default SosFab;
