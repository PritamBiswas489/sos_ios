import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  requestMicrophonePermission,
  requestNotificationPermission,
  requestLocationPermission,
  checkRequiredPermissions,
} from '../../services/permissions.service';

const PermissionItem = ({ icon, label, description, granted, onPress, loading }) => (
  <View style={styles.permissionItem}>
    <View style={[styles.permIconWrap, granted ? styles.permIconGranted : styles.permIconDenied]}>
      <Icon name={icon} size={22} color={granted ? '#00c48c' : '#FF3B5C'} />
    </View>
    <View style={styles.permTextWrap}>
      <Text style={styles.permLabel}>{label}</Text>
      <Text style={styles.permDesc}>{description}</Text>
    </View>
    {granted ? (
      <View style={[styles.statusBadge, styles.statusGranted]}>
        <Text style={[styles.statusText, styles.statusTextGranted]}>Granted</Text>
      </View>
    ) : (
      <TouchableOpacity
        style={[styles.enableButton, loading && styles.enableButtonDisabled]}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={!onPress || loading}>
        <Text style={styles.enableButtonText}>
          {loading ? 'Wait...' : `Enable\nNow`}
        </Text>
      </TouchableOpacity>
    )}
  </View>
);

const NoPermissionsScreen = ({ missingPermissions: initialMissing = [], onRetry }) => {
  // ✅ Track missing permissions locally so UI updates after each grant
  const [missingPermissions, setMissingPermissions] = useState(initialMissing);
  const [loadingPermission, setLoadingPermission] = useState(null);

  useEffect(() => {
    setMissingPermissions(initialMissing);
  }, [initialMissing]);

  const locationForegroundMissing =
    missingPermissions.includes('location') ||
    missingPermissions.includes('location-foreground');
  const locationBackgroundMissing =
    missingPermissions.includes('location') ||
    missingPermissions.includes('location-background');
  const notificationMissing = missingPermissions.includes('notification');
  const microphoneMissing = missingPermissions.includes('microphone');

  // ✅ After any permission request, re-check and refresh UI
  const refreshPermissions = async () => {
    const missing = await checkRequiredPermissions();
    setMissingPermissions(missing);
    onRetry?.();
  };

  const openSettings = async () => {
    try {
      await Linking.openURL('app-settings:');
    } catch {
      Alert.alert(
        'Unable to Open Settings',
        'Please go to Settings manually and grant the required permissions.',
      );
    }
  };

  const handleNotification = async () => {
    setLoadingPermission('notification');
    try {
      const result = await requestNotificationPermission();
      console.log('📣 Notification permission result:', result);
      if (result === 'denied') {
        // ✅ Already denied before — send to Settings
        Alert.alert(
          'Notifications Blocked',
          'Please enable notifications in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings },
          ],
        );
      }
      await refreshPermissions();
    } finally {
      setLoadingPermission(null);
    }
  };

  const handleMicrophone = async () => {
    setLoadingPermission('microphone');
    try {
      const result = await requestMicrophonePermission();
      console.log('🎤 Microphone permission result:', result);
      if (result === 'blocked') {
        Alert.alert(
          'Microphone Blocked',
          'Please enable microphone access in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings },
          ],
        );
      }
      await refreshPermissions();
    } finally {
      setLoadingPermission(null);
    }
  };

  const handleLocation = async () => {
    setLoadingPermission('location');
    try {
      const result = await requestLocationPermission();
      console.log('📍 Location permission result:', result);
      if (result === 'denied') {
        Alert.alert(
          'Location Blocked',
          'Please enable location access in Settings and choose "Always".',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings },
          ],
        );
      }
      await refreshPermissions();
    } finally {
      setLoadingPermission(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        {/* Header icon */}
        <View style={styles.iconWrap}>
          <Icon name="security" size={48} color="#FF3B5C" />
        </View>

        <Text style={styles.title}>Permissions Required</Text>
        <Text style={styles.subtitle}>
          SOS App needs the following permissions to keep you and your contacts
          safe. Without them, core features won't work.
        </Text>

        {/* Permission items */}
        <View style={styles.card}>
          <PermissionItem
            icon="location-on"
            label="Location (Foreground)"
            description="Required while using the app to determine your current location accurately."
            granted={!locationForegroundMissing}
            onPress={handleLocation}
            loading={loadingPermission === 'location'}
          />
          <View style={styles.divider} />
          <PermissionItem
            icon="my-location"
            label="Location (Background)"
            description="Required to share your real-time position with trusted contacts during SOS, even when app is not open. Choose 'Always'."
            granted={!locationBackgroundMissing}
            onPress={handleLocation}
            loading={loadingPermission === 'location'}
          />
          <View style={styles.divider} />
          <PermissionItem
            icon="notifications-active"
            label="Notifications"
            description="Required to receive SOS alerts and emergency messages."
            granted={!notificationMissing}
            onPress={handleNotification}  // ✅ now calls handleNotification not raw service fn
            loading={loadingPermission === 'notification'}
          />
          <View style={styles.divider} />
          <PermissionItem
            icon="mic"
            label="Microphone"
            description="Required to stream live audio during an SOS emergency."
            granted={!microphoneMissing}
            onPress={handleMicrophone}
            loading={loadingPermission === 'microphone'}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020B1B',
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 40,
  },
  iconWrap: {
    height: 88,
    width: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,59,92,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,59,92,0.25)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
    maxWidth: 320,
  },
  card: {
    width: '100%',
    backgroundColor: '#0E1A33',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    marginBottom: 20,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  permIconWrap: {
    height: 42,
    width: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  permIconDenied: {
    backgroundColor: 'rgba(255,59,92,0.12)',
  },
  permIconGranted: {
    backgroundColor: 'rgba(0,196,140,0.12)',
  },
  permTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  permLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  permDesc: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    lineHeight: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusDenied: {
    backgroundColor: 'rgba(255,59,92,0.15)',
  },
  statusGranted: {
    backgroundColor: 'rgba(0,196,140,0.15)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextDenied: {
    color: '#FF3B5C',
  },
  statusTextGranted: {
    color: '#00c48c',
  },
  enableButton: {
    minWidth: 66,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,59,92,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,92,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enableButtonDisabled: {
    opacity: 0.5,
  },
  enableButtonText: {
    color: '#FF6A84',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: -4,
  },
});

export default NoPermissionsScreen;