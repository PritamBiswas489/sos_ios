import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated } from 'react-native';
import styles from './style';

import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Polyline } from 'react-native-svg';
import appColors from '../../theme/appColors';

const HealthScreen = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Health</Text>
        <Text style={styles.subtitle}>WEARABLE CONNECTED + LIVE</Text>
      </View>

      {/* Heart Section */}
      <View style={styles.heartContainer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Icon name="favorite" size={70} color={appColors.primary} />
        </Animated.View>

        <Text style={styles.heartRate}>74</Text>
        <Text style={styles.bpm}>Beats per minute</Text>
      </View>

      {/* ECG Graph */}
      <View style={styles.ecgContainer}>
        <Svg
          height="60"
          width="100%"
          viewBox="0 0 220 48"
          preserveAspectRatio="none"
        >
          {/* Main ECG line */}
          <Polyline
            points="0,30 15,30 22,10 30,42 38,8 46,38 54,20 62,34 70,30 80,30 90,30 97,12 105,44 113,8 121,40 129,22 137,32 145,30 160,30 170,30 177,15 185,42 193,10 201,38 209,24 220,30"
            fill="none"
            stroke="#ff3b5c"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Highlight / glow layer */}
          <Polyline
            points="0,30 15,30 22,10 30,42 38,8 46,38 54,20 62,34 70,30 80,30"
            fill="none"
            stroke="#ff8fa3"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />
        </Svg>
      </View>
      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Icon name="opacity" size={24} color="#FF4757" />
          <Text style={styles.statValue}>98%</Text>
          <Text style={styles.statLabel}>SPO2</Text>
        </View>

        <View style={styles.statCard}>
          <Icon name="thermostat" size={24} color="#FFA502" />
          <Text style={styles.statValue}>36.8°</Text>
          <Text style={styles.statLabel}>TEMP</Text>
        </View>

        <View style={styles.statCard}>
          <Icon name="directions-walk" size={24} color="#2ED573" />
          <Text style={styles.statValue}>4.2k</Text>
          <Text style={styles.statLabel}>STEPS</Text>
        </View>
      </View>

      {/* Stress Level */}
      <View style={styles.stressContainer}>
        <View style={styles.stressHeader}>
          <Text style={styles.stressTitle}>😐 Stress Level</Text>
          <Text style={styles.stressPercent}>Medium – 62%</Text>
        </View>

        <View style={styles.progressBar}>
          <LinearGradient
            colors={['#2ED573', '#FFA502', '#FF4757']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: '62%' }]}
          />
        </View>
      </View>

      {/* Warning Card */}
      <View style={styles.warningBox}>
        <Icon name="warning" size={18} color="#FFA502" />
        <Text style={styles.warningText}>
          Elevated stress detected — take a breath
        </Text>
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

export default HealthScreen;
