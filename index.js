/**
 * @format
 */

import 'react-native-gesture-handler';
import { registerGlobals } from 'react-native-webrtc';
registerGlobals();

// Suppress unhandled rejections from react-native-ble-plx internal promises
// when BleManager is destroyed or re-initialized during hot reload / component unmount.
// These are library-internal promises that react-native-ble-plx never attaches .catch() to.
const _globalHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  if (
    error?.name === 'BleError' ||
    error?.message?.includes('BleManager was destroyed') ||
    error?.message?.includes('This is probably a bug')
  ) return;
  _globalHandler(error, isFatal);
});
import { Alert, AppRegistry } from 'react-native';
import React from 'react';
import App from './App';
import { name as appName } from './app.json'; 
import { Provider } from 'react-redux';
import store from './src/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { EventType } from '@notifee/react-native';
import { setBackgroundMessageHandler, createNotificationChannels } from './src/services/notification.service';

const PENDING_NOTIFICATION_PRESS_KEY = '@pending_notification_press_payload';

// Required for Notifee to handle background/quit-state notification events
notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('Received background notification press event:', { type, detail });
  if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
    
    const payload = {
      source: 'notifee.background',
      notification: detail?.notification,
      data: detail?.notification?.data,
      pressAction: detail?.pressAction,
      timestamp: Date.now(),
    };

    try {
      await AsyncStorage.setItem(
        PENDING_NOTIFICATION_PRESS_KEY,
        JSON.stringify(payload),
      );
    } catch (error) {
      console.log('Failed to persist background notification press payload:', error);
    }
  }
});

// Create channels at startup so FCM auto-display uses the correct channel with custom sound
createNotificationChannels();

setBackgroundMessageHandler();

const RootApp = () => (
  <Provider store={store}>
    <App />
  </Provider>
);
AppRegistry.registerComponent(appName, () => RootApp);
