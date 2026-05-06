import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

/**
 * Request foreground + background location permissions on Android.
 * Returns: 'full' | 'foreground-only' | 'denied'
 */
export const requestAndroidLocationPermissions = async () => {
  const fgGranted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Foreground Location Permission',
      message: 'This app needs access to your location.',
      buttonPositive: 'OK',
    },
  );

  if (fgGranted !== PermissionsAndroid.RESULTS.GRANTED) {
    return 'denied';
  }

  // Android 10+ requires a separate background permission request.
  if (Platform.Version >= 29) {
    const bgGranted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      // {
      //   title: 'Background Location Permission',
      //   message:
      //     'Allow this app to access your location in the background so your room stays updated.',
      //   buttonPositive: 'Allow',
      // },
    );
    return bgGranted === PermissionsAndroid.RESULTS.GRANTED
      ? 'full'
      : 'foreground-only';
  }

  return 'full';
};

/**
 * Request location permissions for the current platform.
 * Returns: 'full' | 'foreground-only' | 'denied'
 */
export const requestLocationPermissions = async () => {
  if (Platform.OS === 'android') {
    return requestAndroidLocationPermissions();
  }

  // iOS – @react-native-community/geolocation
  const auth = await Geolocation.requestAuthorization('always');
  return auth === 'granted' ? 'full' : auth;
};

/**
 * Request microphone (RECORD_AUDIO) permission on Android.
 */
export const requestMicrophonePermission = async () => {
  if (Platform.OS !== 'android') return 'granted';
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    {
      title: 'Microphone Permission',
      message: 'This app needs microphone access to stream live audio during an SOS.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );
  return result === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
};

/**
 * Check (without prompting) whether all required permissions are granted.
 * Returns an array of missing permission keys: 'location' | 'notification' | 'microphone'
 * An empty array means all permissions are granted.
 */
export const checkRequiredPermissions = async () => {
  const missing = [];

  if (Platform.OS === 'android') {
    const fgLocation = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    let bgLocation = true;
    if (Platform.Version >= 29) {
      bgLocation = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      );
    }
    if (!fgLocation || !bgLocation) missing.push('location');

    if (Platform.Version >= 33) {
      const notif = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (!notif) missing.push('notification');
    }

    const mic = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    );
    if (!mic) missing.push('microphone');
  }
  // iOS: permissions are handled by system dialogs; treated as granted here.
  return missing;
};
