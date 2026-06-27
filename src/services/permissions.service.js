import { getApp } from '@react-native-firebase/app';
import { getMessaging, AuthorizationStatus, requestPermission } from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import Geolocation from '@react-native-community/geolocation';
import { mediaDevices } from 'react-native-webrtc';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const getMsg = () => getMessaging(getApp());

// ─── Check notification (no request) ─────────────────────────────────────────
const isNotificationPermissionGranted = async () => {
  try {
    const notifeeSettings = await notifee.getNotificationSettings();
    const notifeeGranted =
      notifeeSettings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;

    const authStatus = await requestPermission(getMsg());
    const fcmGranted =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    return notifeeGranted && fcmGranted;
  } catch {
    return false;
  }
};

// ─── Location Permission ──────────────────────────────────────────────────────
/**
 * Request location permissions on iOS in correct order.
 * Returns: 'full' | 'foreground-only' | 'denied'
 */
export const requestLocationPermission = async () => {
  // Step 1 — Check current status of When In Use
  const whenInUse = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);

  // Step 2 — Request When In Use first (required before Always)
  if (whenInUse === RESULTS.DENIED) {
    const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    if (result !== RESULTS.GRANTED) return 'denied';
  } else if (whenInUse === RESULTS.BLOCKED) {
    return 'denied';
  }

  // Step 3 — Only then request Always
  const always = await check(PERMISSIONS.IOS.LOCATION_ALWAYS);
  if (always === RESULTS.DENIED) {
    const result = await request(PERMISSIONS.IOS.LOCATION_ALWAYS);
    if (result === RESULTS.GRANTED) return 'full';
    return 'foreground-only'; // user chose "When In Use" instead
  }

  if (always === RESULTS.GRANTED) return 'full';
  if (whenInUse === RESULTS.GRANTED) return 'foreground-only';

  return 'denied';
};

// ─── Microphone Permission ────────────────────────────────────────────────────
/**
 * Request microphone permission on iOS.
 * Returns: 'granted' | 'denied'
 */
export const requestMicrophonePermission = async () => {
  try {
    const currentStatus = await check(PERMISSIONS.IOS.MICROPHONE);
    if (currentStatus === RESULTS.GRANTED) return 'granted';
    if (currentStatus === RESULTS.BLOCKED) return 'blocked';

    const requestedStatus = await request(PERMISSIONS.IOS.MICROPHONE);
    return requestedStatus === RESULTS.GRANTED ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
};

// ─── Notification Permission ──────────────────────────────────────────────────
/**
 * Request notification permission via Notifee (triggers iOS system popup).
 * Then syncs Firebase Messaging after grant.
 * Returns: 'granted' | 'denied'
 */
export const requestNotificationPermission = async () => {
  try {
    const alreadyGranted = await isNotificationPermissionGranted();
    if (alreadyGranted) {
      console.log('✅ Notifications already granted');
      return 'granted';
    }

    console.log('📣 Requesting notification permission via Notifee...');

    // ✅ Notifee triggers the real iOS system popup
    const settings = await notifee.requestPermission({
      alert: true,
      sound: true,
      badge: true,
      announcement: false,
      carPlay: false,
      criticalAlert: false,
    });

    console.log('📣 Notifee permission result:', settings.authorizationStatus);

    const granted =
      settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;

    if (!granted) {
      console.log('❌ Notification permission denied by user');
      return 'denied';
    }

    // ✅ Sync Firebase Messaging token after Notifee grants
    try {
      await requestPermission(getMsg());
    } catch (fcmErr) {
      console.warn('FCM sync warning:', fcmErr.message);
    }

    console.log('✅ Notification permission granted');
    return 'granted';
  } catch (err) {
    console.error('requestNotificationPermission error:', err);
    return 'denied';
  }
};

// ─── Check location (no request) ─────────────────────────────────────────────
const checkLocationPermission = async () => {
  const whenInUse = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
  if (whenInUse === RESULTS.DENIED || whenInUse === RESULTS.BLOCKED) {
    return 'denied';
  }

  const always = await check(PERMISSIONS.IOS.LOCATION_ALWAYS);
  if (always === RESULTS.GRANTED) return 'full';
  if (always === RESULTS.DENIED || always === RESULTS.BLOCKED) return 'foreground-only';

  return 'denied';
};

// ─── Check all required permissions ──────────────────────────────────────────
export const checkRequiredPermissions = async () => {
  console.log('🔑 [permissions] checking required permissions...');
  const missing = [];

  // Notifications — check only, never request here
  const notificationGranted = await isNotificationPermissionGranted();
  if (!notificationGranted) missing.push('notification');

  // Location
  const locationStatus = await checkLocationPermission();
  if (locationStatus === 'denied') missing.push('location');
  if (locationStatus === 'foreground-only') missing.push('location-background');

  // Microphone
  const micStatus = await check(PERMISSIONS.IOS.MICROPHONE);
  if (micStatus !== RESULTS.GRANTED) missing.push('microphone');

  console.log('🔑 [permissions] missing permissions:', missing);
  return missing;
};

 
 
 