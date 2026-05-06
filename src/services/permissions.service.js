import Geolocation from '@react-native-community/geolocation';
import notifee, { AuthorizationStatus } from '@notifee/react-native';

/**
 * Request location permissions on iOS.
 * Prompts for 'always' authorization via CLLocationManager.
 * Returns: 'full' | 'denied'
 */
export const requestLocationPermissions = async () => {
  Geolocation.setRNConfiguration({ authorizationLevel: 'always' });
  return new Promise(resolve => {
    Geolocation.getCurrentPosition(
      () => resolve('full'),
      error => {
        // error.code 1 = PERMISSION_DENIED; other codes (timeout/unavailable) are not denials
        resolve(error.code === 1 ? 'denied' : 'full');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
    );
  });
};

/**
 * Request microphone (audio) permission on iOS.
 * iOS shows the system prompt on first use when NSMicrophoneUsageDescription
 * is declared in Info.plist. No explicit pre-request API is available without
 * react-native-permissions, so the system dialog will appear on first recording attempt.
 * Returns: 'granted'
 */
export const requestMicrophonePermission = async () => {
  return 'granted';
};

/**
 * Check (without prompting) whether all required permissions are granted.
 * Returns an array of missing permission keys: 'location' | 'notification' | 'microphone'
 * An empty array means all permissions are granted.
 */
export const checkRequiredPermissions = async () => {
  const missing = [];

  const notifeeSettings = await notifee.getNotificationSettings();
  if (notifeeSettings.authorizationStatus < AuthorizationStatus.AUTHORIZED) {
    missing.push('notification');
  }

  return missing;
};
