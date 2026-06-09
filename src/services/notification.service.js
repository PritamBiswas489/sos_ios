import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  requestPermission,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  setBackgroundMessageHandler as setFCMBackgroundHandler,
  AuthorizationStatus,
  getToken,
} from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';

// Modular API: get the messaging instance once
const getMsg = () => getMessaging(getApp());

// ─── iOS sound mapping ───────────────────────────────────────────────────────
// Sound files must be added to your Xcode project under the app target.
// Supported formats: .caf, .aiff, .wav (max 30 seconds).
const IOS_SOUNDS = {
  CHAT: 'chat_tone.caf',
  SOS: 'sos_alert.caf',
  VICTIM: 'victim_tone.caf',
  DEFAULT: 'default_tone.caf',
};

const getSoundByMessage = remoteMessage => {
  const type = remoteMessage?.data?.messageType || '';
  const normalizedType = String(type).toUpperCase();

  switch (normalizedType) {
    case 'SOS':
      return IOS_SOUNDS.SOS;
    case 'VICTIM':
      return IOS_SOUNDS.VICTIM;
    case 'CHAT':
      return IOS_SOUNDS.CHAT;
    default:
      return IOS_SOUNDS.DEFAULT;
  }
};
// ─────────────────────────────────────────────────────────────────────────────

let onNotificationPress = null;
const PENDING_NOTIFICATION_PRESS_KEY = '@pending_notification_press_payload';

// ─── Channel config is Android-only; on iOS notifee uses APNs categories ───
// This is a no-op on iOS but kept so call sites in App.jsx don't break.
export const createNotificationChannels = async () => {
  // No-op on iOS — notification channels are Android-only.
};

export const requestNotificationPermissions = async () => {
  await notifee.requestPermission();
  await requestPermission(getMsg());
};

export const requestUserPermission = async () => {
  try {
    const authStatus = await requestPermission(getMsg());
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;
    return enabled;
  } catch (error) {
    console.log('❌ Error requesting notification permission:', error);
    return false;
  }
};

export const getFCMToken = async () => {
  try {
    const fcmToken = await getToken(getMsg());
    if (fcmToken) {
      return fcmToken;
    }
    console.log('Failed to get FCM token');
    return null;
  } catch (error) {
    console.log('❌ Error getting FCM token:', error);
    return null;
  }
};

export const displayRemoteNotification = async remoteMessage => {
  const title =
    remoteMessage?.notification?.title ||
    remoteMessage?.data?.title ||
    'SOS App';
  const body =
    remoteMessage?.notification?.body || remoteMessage?.data?.body || '';

  const sound = getSoundByMessage(remoteMessage);

  console.log('📩 Displaying iOS notification:', {
    sound,
    messageType: remoteMessage?.data?.messageType,
  });

  await notifee.displayNotification({
    title,
    body,
    data: remoteMessage?.data,
    ios: {
      sound,                          // e.g. 'sos_alert.caf', 'chat_tone.caf', etc.
      foregroundPresentationOptions: {
        alert: true,
        badge: true,
        sound: true,
      },
    },
  });
};

export const subscribeForegroundNotifications = onForegroundMessage => {
  return onMessage(getMsg(), async remoteMessage => {
    if (typeof onForegroundMessage === 'function') {
      onForegroundMessage({
        source: 'messaging.foreground',
        remoteMessage,
        data: remoteMessage?.data,
      });
    }

    await displayRemoteNotification(remoteMessage);
  });
};

export const setBackgroundMessageHandler = () => {
  setFCMBackgroundHandler(getMsg(), async remoteMessage => {
    await displayRemoteNotification(remoteMessage);
  });
};

export const subscribeNotificationPress = handler => {
  onNotificationPress = handler;

  const triggerPressCallback = payload => {
    if (typeof onNotificationPress === 'function') {
      onNotificationPress(payload);
    }
  };

  const notifeeUnsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
      triggerPressCallback({
        source: 'notifee.foreground',
        notification: detail?.notification,
        data: detail?.notification?.data,
        pressAction: detail?.pressAction,
      });
    }
  });

  const messagingUnsubscribe = onNotificationOpenedApp(
    getMsg(),
    remoteMessage => {
      triggerPressCallback({
        source: 'messaging.opened',
        remoteMessage,
        data: remoteMessage?.data,
      });
    },
  );

  getInitialNotification(getMsg()).then(remoteMessage => {
    console.log('App opened from quit state by notification:', remoteMessage);
    if (remoteMessage?.data) {
      AsyncStorage.setItem(
        PENDING_NOTIFICATION_PRESS_KEY,
        JSON.stringify({
          source: 'messaging.initial',
          remoteMessage,
          data: remoteMessage?.data,
        }),
      ).catch(err =>
        console.log('Failed to persist FCM initial notification:', err),
      );
    }
  });

  notifee
    .getInitialNotification()
    .then(initialNotification => {
      if (initialNotification?.notification) {
        console.log(
          'App opened from quit state by Notifee notification:',
          initialNotification,
        );
        triggerPressCallback({
          source: 'notifee.initial',
          notification: initialNotification.notification,
          data: initialNotification.notification?.data,
          pressAction: initialNotification.pressAction,
        });
      }
    });

  return () => {
    notifeeUnsubscribe();
    messagingUnsubscribe();
    onNotificationPress = null;
  };
};

export const consumePendingNotificationPress = async () => {
  try {
    const storedPayload = await AsyncStorage.getItem(
      PENDING_NOTIFICATION_PRESS_KEY,
    );
    console.log(
      'Checking for pending background notification press payload:',
      storedPayload,
    );
    if (!storedPayload) {
      return null;
    }
    await AsyncStorage.removeItem(PENDING_NOTIFICATION_PRESS_KEY);
    return JSON.parse(storedPayload);
  } catch (error) {
    console.log(
      'Failed to consume pending background notification payload:',
      error,
    );
    return null;
  }
};

// Checks if the app was cold-started by tapping a notification (quit state).
export const getQuitStateNotification = async () => {
  try {
    // Check Notifee quit-state tap
    const notifeeInitial = await notifee.getInitialNotification();
    if (notifeeInitial?.notification) {
      return {
        source: 'notifee.initial',
        notification: notifeeInitial.notification,
        data: notifeeInitial.notification?.data,
        pressAction: notifeeInitial.pressAction,
      };
    }

    // Check FCM quit-state tap
    const fcmInitial = await getInitialNotification(getMsg());
    if (fcmInitial) {
      return {
        source: 'messaging.initial',
        remoteMessage: fcmInitial,
        data: fcmInitial?.data,
      };
    }

    return null;
  } catch (error) {
    console.log('Failed to get quit-state notification:', error);
    return null;
  }
};