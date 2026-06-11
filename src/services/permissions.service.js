import { getApp } from '@react-native-firebase/app';
import { getMessaging, AuthorizationStatus, requestPermission } from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import Geolocation from '@react-native-community/geolocation';
import { mediaDevices } from 'react-native-webrtc';

const getMsg = () => getMessaging(getApp());

/**
 * Request location permissions on iOS.
 * Returns: 'full' | 'foreground-only' | 'denied'
 */
export const requestLocationPermissions = async () => {
  const status = await new Promise(resolve => {
    Geolocation.requestAuthorization(
      s => resolve(s),
      () => resolve('denied'),
    );
  });

  // iOS returns 'always' for background, 'whenInUse' for foreground-only
  if (status === 'always') return 'full';
  if (status === 'whenInUse') return 'foreground-only';
  return 'denied';
};

/**
 * Request microphone permission on iOS.
 * getUserMedia triggers the system microphone permission dialog.
 * Returns: 'granted' | 'denied'
 */
export const requestMicrophonePermission = async () => {
  try {
    const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
    stream.getTracks().forEach(track => track.stop());
    return 'granted';
  } catch {
    return 'denied';
  }
};

/**
 * Check (without prompting) whether all required permissions are granted.
 * Returns an array of missing permission keys: 'location' | 'microphone'
 * An empty array means all permissions are granted.
 *
 * NOTE: iOS does not expose a synchronous "check" API for most permissions.
 * The reliable approach is to attempt access and catch the denial error.
 */
export const checkRequiredPermissions = async () => {
  const missing = [];

  // ── Location ──────────────────────────────────────────────────────────────
  const locationGranted = await new Promise(resolve => {
    Geolocation.getCurrentPosition(
      () => resolve(true),
      error => resolve(error.code !== 1), // code 1 = PERMISSION_DENIED
      { timeout: 3000, maximumAge: 10000 },
    );
  });
  if (!locationGranted) missing.push('location');

  // ── Microphone ────────────────────────────────────────────────────────────
  try {
    const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
    stream.getTracks().forEach(track => track.stop());
  } catch {
    missing.push('microphone');
  }

  // ── Notifications (Notifee + Firebase Messaging) ──────────────────────────
  try {
    // notifee returns a settings object; authorizationStatus mirrors iOS values
    const notifeeSettings = await notifee.getNotificationSettings();
    const notifeeGranted =
      notifeeSettings.authorizationStatus >= 1; // 1 = AUTHORIZED, 2 = PROVISIONAL

    // Firebase Messaging auth status as a secondary check
    const authStatus = await requestPermission(getMsg());
    const fcmGranted =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    if (!notifeeGranted || !fcmGranted) missing.push('notification');
  } catch {
    missing.push('notification');
  }

  return missing;
};


export const waitUntilLocationSettled = (intervalMs = 300, timeoutMs = 10000) => {
  return new Promise(resolve => {
    const start = Date.now();

    const poll = () => {
      Geolocation.getCurrentPosition(
        () => resolve('granted'),
        error => {
          if (error.code === 1) {
            resolve('denied'); // Definitive denial — stop polling
          } else if (Date.now() - start >= timeoutMs) {
            resolve('timeout');
          } else {
            setTimeout(poll, intervalMs); // Still undetermined — keep polling
          }
        },
        { timeout: 2000, maximumAge: 0 },
      );
    };

    poll();
  });
};

export const waitUntilNotificationSettled = async (
  intervalMs = 300,
  timeoutMs = 10000,
) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const settings = await notifee.getNotificationSettings();
    if (settings.authorizationStatus !== 0) return; // 0 = NOT_DETERMINED
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  console.warn('Notification permission timed out — proceeding anyway.');
};

export const waitUntilMicrophoneSettled = async (
  intervalMs = 300,
  timeoutMs = 10000,
) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
      stream.getTracks().forEach(track => track.stop());
      return 'granted';
    } catch (err) {
      // 'NotAllowedError' = user denied — stop polling
      if (err?.name === 'NotAllowedError' || err?.message?.includes('denied')) {
        return 'denied';
      }
      // 'NotFoundError' or others = dialog still pending — keep polling
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
  console.warn('Microphone permission timed out — proceeding anyway.');
};
