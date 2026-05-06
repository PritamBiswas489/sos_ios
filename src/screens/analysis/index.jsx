import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { useNavigation } from '@react-navigation/native';

import styles from './style';
import appColors from '../../theme/appColors';

const AnalysisScreen = () => {
  const navigation = useNavigation();
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#612244', '#380f25', '#020B1B']}
          style={StyleSheet.absoluteFill}
        />

        {/* TOP ICONS */}
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back-ios" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* PROFILE */}
        <View style={styles.profile}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={{ fontSize: 26 }}>👩</Text>
            </View>
            <View style={styles.onlineDot} />
          </View>

          <Text style={styles.name}>Sarah Jhonson</Text>
          <Text style={styles.username}>@SARAH.J • SG#4821</Text>
          <Text style={styles.address}>
            📍 123 Oak Street, New York, NY 10001
          </Text>

          {/* TAGS */}
          <View style={styles.tags}>
            <View style={[styles.tag, styles.greenTag]}>
              <Text style={styles.greenText}>✔ Verified</Text>
            </View>

            <View style={[styles.tag, styles.purpleTag]}>
              <Text style={styles.purpleText}>⚡ Pro Plan</Text>
            </View>

            <View style={styles.tag}>
              <Text style={styles.grayText}>📅 Since Mar 2023</Text>
            </View>
          </View>
        </View>
      </View>

      {/* SAFETY CARD */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          {/* CIRCLE */}
          <AnimatedCircularProgress
            size={100}
            width={10}
            fill={85}
            tintColor="#00FFC6"
            backgroundColor="rgba(255,255,255,0.08)"
            rotation={0}
            arcSweepAngle={360}
            lineCap="round"
          >
            {() => <Text style={styles.progressText}>85</Text>}
          </AnimatedCircularProgress>

          {/* TEXT */}
          <View style={styles.scoreBox}>
            <Text style={styles.scoreTitle}>SAFETY SCORE</Text>

            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
              <Text style={styles.scoreMain}>85</Text>
              <Text style={styles.scoreTotal}>/100</Text>
            </View>

            <Text style={styles.excellent}>Excellent •</Text>
            <Text style={styles.rank}>Top 12% Of Users</Text>
          </View>

          {/* BARS */}
          <View style={styles.rightBars}>
            {[
              { label: 'GPS', color: '#00FF9C', width: '90%' },
              { label: 'Alerts', color: '#3B82F6', width: '60%' },
              { label: 'Health', color: '#A855F7', width: '70%' },
              { label: 'Net', color: '#F59E0B', width: '50%' },
            ].map((item, i) => (
              <View key={i} style={styles.barRow}>
                <Text style={styles.barLabel}>{item.label}</Text>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      { width: item.width, backgroundColor: item.color },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        {[
          {
            icon: 'shield',
            value: '247',
            label: 'DAYS SAFE',
            color: '#00FF9C',
          },
          { icon: 'warning', value: '2', label: 'SOS SENT', color: '#FF4D4D' },
          { icon: 'people', value: '4', label: 'CONTACTS', color: '#3B82F6' },
          { icon: 'place', value: '3', label: 'SAFE ZONES', color: '#8B5CF6' },
        ].map((item, i) => (
          <View key={i} style={styles.statCard}>
            <Icon name={item.icon} size={18} color="#94A3B8" />
            <Text style={[styles.statValue, { color: item.color }]}>
              {item.value}
            </Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* ACTION BUTTONS */}
      <View style={styles.actions}>
        {[
          { label: 'Emergency ID', icon: 'badge', active: true },
          { label: 'Share Profile', icon: 'share' },
          { label: 'Alerts', icon: 'notifications' },
          { label: 'Med Info', icon: 'description' },
        ].map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.actionBtn, item.active && styles.activeBtn]}
          >
            <Icon
              name={item.icon}
              size={20}
              color={item.active ? appColors.blue : appColors.yellow}
            />
            <Text
              style={[
                styles.actionText,
                item.active && { color: appColors.primary },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* EMERGENCY */}
      <LinearGradient
        colors={['#010E28', '#EF3C5A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 8 }}
        style={styles.emergencyCard}
      >
        <View style={styles.emergencyRow}>
          <View style={styles.sosBox}>
            <Text style={styles.sosText}>SOS</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>LICENSE NUMBER</Text>
            <Text style={styles.emergencyCode}>SG • 4821 • JHN</Text>
          </View>

          <TouchableOpacity style={styles.copyBtn}>
            <Text style={styles.copyText}>COPY</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ACTIVITY */}
      <View style={styles.activity}>
        <View style={styles.activityHeader}>
          <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
          <Text style={styles.viewAll}>View All</Text>
        </View>

        {[
          {
            icon: 'check-circle',
            title: 'Safe Zone Entered',
            sub: 'Home · Madhyamgram',
          },
          {
            icon: 'place',
            title: 'Location Shared',
            sub: 'Sent To 4 Contacts',
          },
          {
            icon: 'favorite',
            title: 'Health Check Passed',
            sub: '74 Bpm · Stress 38%',
          },
        ].map((item, i) => (
          <View key={i} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Icon name={item.icon} size={18} color="#22C55E" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.activityTitle}>{item.title}</Text>
              <Text style={styles.activitySub}>{item.sub}</Text>
            </View>

            <Text style={styles.time}>09:41</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default AnalysisScreen;
