import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const PermissionItem = ({ icon, label, description, granted }) => (
  <View style={styles.permissionItem}>
    <View style={[styles.permIconWrap, granted ? styles.permIconGranted : styles.permIconDenied]}>
      <Icon name={icon} size={22} color={granted ? '#00c48c' : '#FF3B5C'} />
    </View>
    <View style={styles.permTextWrap}>
      <Text style={styles.permLabel}>{label}</Text>
      <Text style={styles.permDesc}>{description}</Text>
    </View>
    <View style={[styles.statusBadge, granted ? styles.statusGranted : styles.statusDenied]}>
      <Text style={[styles.statusText, granted ? styles.statusTextGranted : styles.statusTextDenied]}>
        {granted ? 'Granted' : 'Required'}
      </Text>
    </View>
  </View>
);

const NoPermissionsScreen = ({ missingPermissions = [], onRetry }) => {
  const locationMissing = missingPermissions.includes('location');
  const notificationMissing = missingPermissions.includes('notification');
  const microphoneMissing = missingPermissions.includes('microphone');

  const openSettings = () => {
    Linking.openSettings();
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
            label="Location (Foreground & Background)"
            description="Required to share your real-time position with trusted contacts. Choose this option ''Allow all the time'' when granting permission."
            granted={!locationMissing}
          />
          <View style={styles.divider} />
          <PermissionItem
            icon="notifications-active"
            label="Notifications"
            description="Required to receive SOS alerts and emergency messages."
            granted={!notificationMissing}
          />
          <View style={styles.divider} />
          <PermissionItem
            icon="mic"
            label="Microphone"
            description="Required to stream live audio during an SOS emergency."
            granted={!microphoneMissing}
          />
        </View>

        {/* Action buttons */}
        {locationMissing && (
          <TouchableOpacity
            onPress={openSettings}
            activeOpacity={0.85}
            style={[styles.actionBtn, styles.locationBtn]}>
            <Icon name="location-on" size={18} color="#fff" style={styles.btnIcon} />
            <Text style={styles.actionBtnText}>Enable Location in Settings</Text>
          </TouchableOpacity>
        )}

        {notificationMissing && (
          <TouchableOpacity
            onPress={openSettings}
            activeOpacity={0.85}
            style={[styles.actionBtn, styles.notifBtn]}>
            <Icon name="notifications" size={18} color="#fff" style={styles.btnIcon} />
            <Text style={styles.actionBtnText}>Enable Notifications in Settings</Text>
          </TouchableOpacity>
        )}

        {microphoneMissing && (
          <TouchableOpacity
            onPress={openSettings}
            activeOpacity={0.85}
            style={[styles.actionBtn, styles.micBtn]}>
            <Icon name="mic" size={18} color="#fff" style={styles.btnIcon} />
            <Text style={styles.actionBtnText}>Enable Microphone in Settings</Text>
          </TouchableOpacity>
        )}

        {/* Re-check button */}
        <TouchableOpacity
          onPress={onRetry}
          activeOpacity={0.85}
          style={styles.retryBtn}>
          <Icon name="refresh" size={18} color="#4a9eff" style={styles.btnIcon} />
          <Text style={styles.retryText}>I've Enabled Permissions — Continue</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Tap the button above after granting permissions in Settings.
        </Text>
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
    fontSize: 11,
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
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: -4,
  },
  actionBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 13,
    marginBottom: 10,
  },
  locationBtn: {
    backgroundColor: '#1B3A6B',
    borderWidth: 1,
    borderColor: 'rgba(74,158,255,0.35)',
  },
  notifBtn: {
    backgroundColor: '#2A1B3D',
    borderWidth: 1,
    borderColor: 'rgba(160,100,255,0.35)',
  },
  micBtn: {
    backgroundColor: '#1B3030',
    borderWidth: 1,
    borderColor: 'rgba(0,196,140,0.35)',
  },
  btnIcon: {
    marginRight: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  retryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 13,
    marginTop: 4,
    marginBottom: 14,
    backgroundColor: 'rgba(74,158,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74,158,255,0.3)',
  },
  retryText: {
    color: '#4a9eff',
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default NoPermissionsScreen;
