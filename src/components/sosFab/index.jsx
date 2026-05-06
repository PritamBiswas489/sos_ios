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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const FAB_SIZE = 40;
const PADDING = 10; // min distance from screen edges

const SosFab = ({ onPress, visible = true, loading = false }) => {
  const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

  // Position — start top-right (near header)
  const position = useRef(
    new Animated.ValueXY({
      x: SCREEN_W - FAB_SIZE - PADDING,
      y: 20,
    }),
  ).current;

  // Track raw coords for clamping
  const posRef = useRef({
    x: SCREEN_W - FAB_SIZE - PADDING,
    y: 20,
  });

  // Entrance scale
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // Drag scale (shrink slightly while dragging)
  const dragScale = useRef(new Animated.Value(1)).current;

  // Pulse ring
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.7)).current;

  // Snapshot of position at the moment a drag starts (before extractOffset resets values to 0)
  const startPosRef = useRef({
    x: SCREEN_W - FAB_SIZE - PADDING,
    y: 60,
  });

  const pulseLoop = useRef(null);

  // ── Entrance / exit ─────────────────────────────────────────────────────
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

  // ── Pulse ring ──────────────────────────────────────────────────────────
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

  // ── PanResponder ────────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      // Do NOT intercept touch start — lets TouchableOpacity handle taps normally.
      // Only claim the gesture once real movement is detected.
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,

      onPanResponderGrant: () => {
        // Snapshot position BEFORE extractOffset resets values to 0
        startPosRef.current = { ...posRef.current };
        position.extractOffset();
        Animated.spring(dragScale, { toValue: 0.88, useNativeDriver: true }).start();
      },

      onPanResponderMove: (_, g) => {
        // g.dx/dy are always relative to original touch-start, use snapshot for absolute pos
        const rawX = startPosRef.current.x + g.dx;
        const rawY = startPosRef.current.y + g.dy;
        const clampedX = Math.max(PADDING, Math.min(SCREEN_W - FAB_SIZE - PADDING, rawX));
        const clampedY = Math.max(PADDING, Math.min(SCREEN_H - FAB_SIZE - PADDING, rawY));
        position.setValue({
          x: clampedX - startPosRef.current.x,
          y: clampedY - startPosRef.current.y,
        });
      },

      onPanResponderRelease: (_, g) => {
        position.flattenOffset();
        const currentX = startPosRef.current.x + g.dx;
        const currentY = startPosRef.current.y + g.dy;
        const snapX =
          currentX + FAB_SIZE / 2 < SCREEN_W / 2
            ? PADDING
            : SCREEN_W - FAB_SIZE - PADDING;
        const clampedY = Math.max(PADDING, Math.min(SCREEN_H - FAB_SIZE - PADDING, currentY));

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

  // ── Sync posRef when position changes (for clamping reference) ───────────
  useEffect(() => {
    const listenerId = position.addListener(({ x, y }) => {
      posRef.current = { x, y };
    });
    return () => position.removeListener(listenerId);
  }, [position]);

  return (
    // Outer view: position only — useNativeDriver: false (left/top are layout props)
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.wrapper,
        { left: position.x, top: position.y },
      ]}
      pointerEvents={visible ? 'box-none' : 'none'}>

      {/* Inner view: scale only — useNativeDriver: true */}
      <Animated.View
        style={{ transform: [{ scale: Animated.multiply(scaleAnim, dragScale) }] }}>

        {/* Outer pulse ring */}
        <Animated.View
          style={[
            styles.pulseRing,
            { transform: [{ scale: ringScale }], opacity: ringOpacity },
          ]}
        />

        {/* Second softer ring */}
        <Animated.View
          style={[
            styles.pulseRingSoft,
            {
              transform: [{ scale: ringScale }],
              opacity: Animated.multiply(ringOpacity, 0.4),
            },
          ]}
        />

        {/* Main button */}
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
