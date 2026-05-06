import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Image, StyleSheet } from 'react-native';

// ---------------------------------------------------------------------------
// Pulsing dot
// ---------------------------------------------------------------------------
export const PulseDot = ({ color = '#FF3B5C' }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.7, duration: 800, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.2, duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity, scale]);

  return (
    <View style={styles.pulseWrapper}>
      <Animated.View style={[styles.pulseRing, { backgroundColor: color, transform: [{ scale }], opacity }]} />
      <View style={[styles.pulseDot, { backgroundColor: color }]} />
    </View>
  );
};

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------
const avatarColors = ['#FF3B5C', '#4A9EFF', '#00FF9C', '#FFA502', '#A855F7'];

export const Avatar = ({ item, borderColor }) => {
  const color = avatarColors[item.id.charCodeAt(0) % avatarColors.length];
  const bc = borderColor || color;

  if (item.avatar) {
    return <Image source={{ uri: item.avatar }} style={[styles.avatar, { borderColor: bc }]} />;
  }
  return (
    <View style={[styles.avatarFallback, { backgroundColor: color + '22', borderColor: bc }]}>
      <Text style={[styles.avatarInitials, { color }]}>{item.initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pulseWrapper: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    opacity: 0.4,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '700',
  },
});
