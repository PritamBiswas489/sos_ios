import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import styles from './style';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const [autoSOS, setAutoSOS] = useState(true);
  const [gpsTracking, setGpsTracking] = useState(true);
  const [dangerAlert, setDangerAlert] = useState(true);
  const [heartMonitor, setHeartMonitor] = useState(true);
  const [encryptAudio, setEncryptAudio] = useState(true);
  const [stealthMode, setStealthMode] = useState(false);

  const SettingRow = ({
    icon,
    bgColor,
    iconColor,
    title,
    subtitle,
    value,
    onChange,
    status,
  }) => (
    <View style={styles.row}>
      <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
        <Icon name={icon} size={18} color={iconColor} />
      </View>

      <View style={styles.rowText}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {status ? (
        <Text style={styles.status}>{status}</Text>
      ) : (
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: '#39445C', true: '#00E0A4' }}
          thumbColor="#fff"
        />
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={{flex: 1, marginLeft: 12}}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSub}>DEVICE CONFIGURATION</Text>
        </View>

        <Icon name="settings" size={26} color="#fff" />
      </View>

      {/* SAFETY */}
      <Text style={styles.section}>SAFETY</Text>

      <SettingRow
        icon="notifications-active"
        bgColor="#2B0D12"
        iconColor="#FF3B5C"
        title="Auto SOS Trigger"
        subtitle="Detect fall & send alert"
        value={autoSOS}
        onChange={setAutoSOS}
      />

      <SettingRow
        icon="location-on"
        bgColor="#062D28"
        iconColor="#00E0A4"
        title="Live GPS Tracking"
        subtitle="Share location with contacts"
        value={gpsTracking}
        onChange={setGpsTracking}
      />

      <SettingRow
        icon="notifications"
        bgColor="#332402"
        iconColor="#FFC107"
        title="Danger Notifications"
        subtitle="Alerts from your area"
        value={dangerAlert}
        onChange={setDangerAlert}
      />

      {/* WEARABLE */}
      <Text style={styles.section}>WEARABLE</Text>

      <SettingRow
        icon="watch"
        bgColor="#0A1F3F"
        iconColor="#4DA3FF"
        title="Bluetooth Device"
        subtitle="Galaxy Watch 6 • Connected"
        status="• ON"
      />

      <SettingRow
        icon="favorite"
        bgColor="#2B0D12"
        iconColor="#FF3B5C"
        title="Heart Rate Monitor"
        subtitle="Sample every 30 sec"
        value={heartMonitor}
        onChange={setHeartMonitor}
      />

      {/* PRIVACY */}
      <Text style={styles.section}>PRIVACY</Text>

      <SettingRow
        icon="lock"
        bgColor="#332402"
        iconColor="#FFC107"
        title="Encrypt Audio Stream"
        subtitle="AES-256 encryption"
        value={encryptAudio}
        onChange={setEncryptAudio}
      />

      <SettingRow
        icon="visibility"
        bgColor="#1A1F2E"
        iconColor="#FFFFFF"
        title="Stealth Mode"
        subtitle="Record without indicator"
        value={stealthMode}
        onChange={setStealthMode}
      />

      <View style={{ height: 80 }} />
    </ScrollView>
  );
};

export default SettingsScreen;
