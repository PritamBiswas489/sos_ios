import { Alert, Platform } from 'react-native';
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
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { set } from '@react-native-firebase/app/dist/module/internal/web/firebaseDatabase';

// Modular API: get the messaging instance once
const getMsg = () => getMessaging(getApp());

export const NOTIFICATION_CHANNELS = {
  CHAT: 'chat_channel',
  SOS: 'sos_channel',
  VICTIM: 'victim_channel',
  DEFAULT: 'default_channel',
};

let onNotificationPress = null;
const PENDING_NOTIFICATION_PRESS_KEY = '@pending_notification_press_payload';

const getChannelByMessage = remoteMessage => {
  const type = remoteMessage?.data?.messageType  || '';
  const normalizedType = String(type).toUpperCase();

  if (normalizedType === 'SOS') {
    return NOTIFICATION_CHANNELS.SOS;
  } else if (normalizedType === 'VICTIM') {
    //Alert.alert('SOS Alert', 'A new SOS alert has been received. Please check the app for details.');
    return NOTIFICATION_CHANNELS.VICTIM;
  }else if (normalizedType === 'CHAT') {
    return NOTIFICATION_CHANNELS.CHAT;
  }else{
    return NOTIFICATION_CHANNELS.DEFAULT;
  }
  
};

export const createNotificationChannels = async () => {
  if (Platform.OS !== 'android') {
    return;
  }


  await notifee.deleteChannel(NOTIFICATION_CHANNELS.CHAT);
  await notifee.deleteChannel(NOTIFICATION_CHANNELS.SOS);
  await notifee.deleteChannel(NOTIFICATION_CHANNELS.VICTIM);
  await notifee.deleteChannel(NOTIFICATION_CHANNELS.DEFAULT);

  // Create channels with appropriate settings
  await notifee.createChannel({
    id: NOTIFICATION_CHANNELS.CHAT,
    name: 'Chat Notifications',
    importance: AndroidImportance.HIGH,
    sound: 'chat_tone',
    vibration: true,
  });

  // Create SOS channel with custom sound and high importance
  await notifee.createChannel({
    id: NOTIFICATION_CHANNELS.SOS,
    name: 'SOS Notifications',
    importance: AndroidImportance.HIGH,
    sound: 'sos_alert',
    vibration: true,
  });

  // Create Victim channel with custom sound and high importance
  await notifee.createChannel({
    id: NOTIFICATION_CHANNELS.VICTIM,
    name: 'Victim Notifications',
    importance: AndroidImportance.HIGH,
    sound: 'victim_tone',
    vibration: true,
  });
   
   await notifee.createChannel({
    id: NOTIFICATION_CHANNELS.DEFAULT,
    name: 'Default Notifications',
    importance: AndroidImportance.HIGH,
    sound: 'default_tone',
    vibration: true,
  });
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
  const channelId = getChannelByMessage(remoteMessage);
  console.log('📩 Displaying notification for message:', {
    channelId,
    remoteMessage,
  });
  const title = remoteMessage?.notification?.title || remoteMessage?.data?.title || 'SOS App';
  const body = remoteMessage?.notification?.body || remoteMessage?.data?.body || '';

  await notifee.displayNotification({
    title,
    body,
    data: remoteMessage?.data,
    android: {
      channelId,
      smallIcon: 'ic_launcher',
      pressAction: {
        id: 'default',
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
    await createNotificationChannels();
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

  const messagingUnsubscribe = onNotificationOpenedApp(getMsg(), remoteMessage => {
    triggerPressCallback({
      source: 'messaging.opened',
      remoteMessage,
      data: remoteMessage?.data,
    });
  });

  getInitialNotification(getMsg()).then(remoteMessage => {
    console.log('App opened from quit state by notification:', remoteMessage);
    if (remoteMessage) {
      (async () => {
        if (remoteMessage?.data) {
          await AsyncStorage.setItem(PENDING_NOTIFICATION_PRESS_KEY, JSON.stringify({
            source: 'messaging.initial',
            remoteMessage,
            data: remoteMessage?.data,
          }));
        }
      })(); 
    }
  });

  notifee
    .getInitialNotification()
    .then(initialNotification => {
      if (initialNotification?.notification) {
        console.log('App opened from quit state by Notifee notification:', initialNotification);
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
    const storedPayload = await AsyncStorage.getItem(PENDING_NOTIFICATION_PRESS_KEY);
    console.log('Checking for pending background notification press payload:', storedPayload);
    if (!storedPayload) {
      return null;
    }

   await AsyncStorage.removeItem(PENDING_NOTIFICATION_PRESS_KEY);
    return JSON.parse(storedPayload);
  } catch (error) {
    console.log('Failed to consume pending background notification payload:', error);
    return null;
  }
};

// Checks if the app was cold-started by tapping a notification (quit state).
// notifee.onBackgroundEvent does NOT fire in quit state — use getInitialNotification instead.
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
