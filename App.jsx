import React, { useCallback, useEffect, useRef, useState } from 'react';
import {Alert, StatusBar, DeviceEventEmitter, Platform, AppState} from 'react-native';
import {NavigationContainer, CommonActions} from '@react-navigation/native';
import { navigationRef } from './src/utils/navigationService';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import Toast, {BaseToast, ErrorToast} from 'react-native-toast-message';
import DrawerNavigator from './src/navigation/DrawerNavigator';
import SplashScreen from './src/screens/splashScreen/index.jsx';
import LoginScreen from './src/screens/loginScreen/index.jsx';
import AddContactsScreen from './src/screens/addContactsScreen/index.jsx';
import ProcessScreen from './src/screens/processScreen/index.jsx';
import { SocketProvider } from './src/context/SocketContext';
import { ChatProvider } from './src/context/ChatContext';
import { LocationProvider } from './src/context/LocationContext.jsx';
import { TrustedContactsProvider } from './src/context/TrustedProviderContext.jsx';
import HealthProvider from './src/context/HealthProvider.jsx';

import NetInfo from '@react-native-community/netinfo';
import InAppNotificationBanner from './src/components/inAppNotificationBanner/index.jsx'; 
import NoInternetScreen from './src/components/noInternetScreen/index.jsx';
import NoPermissionsScreen from './src/components/noPermissionsScreen/index.jsx';
import { checkRequiredPermissions, requestLocationPermissions, requestMicrophonePermission } from './src/services/permissions.service';
import CompleteProfileScreen from './src/screens/completeProfileScreen/index.jsx';
import AuthLoadingScreen from './src/screens/authLoadingScreen/index.jsx';
import EditProfileScreen from './src/screens/editProfileScreen/index.jsx';
import {
  createNotificationChannels,
  requestNotificationPermissions,
  subscribeForegroundNotifications,
  subscribeNotificationPress,
  consumePendingNotificationPress,
} from './src/services/notification.service';
import { useDispatch } from 'react-redux';
import { currentScreenActions } from './src/store/redux/currentScreen.redux';

import { useChatContacts } from './src/hook/useChatContacts.jsx';
import { useTrustedContacts } from './src/hook/useTrustedContacts.jsx';
import { useIncommingRequests } from './src/hook/useIncommingRequests.jsx';
import { useOutgoingRequests } from './src/hook/useOutgoingRequests.jsx';
import { CreatorMediaSoupProvider } from './src/context/CreatorMediaSoupContext.jsx';
import { ListenerMediaSoupProvider } from './src/context/ListenerMediaSoupContext.jsx';
import SOSAlertModal, { DUMMY_INCOMING_SOS, DUMMY_OUTGOING_SOS } from './src/components/sosAlertModal/index.jsx';
import SosFab from './src/components/sosFab/index.jsx';
import { useIncomingSosNotifications } from './src/hook/useIncomingSosNotifications.jsx';
import { useMySosSessions } from './src/hook/useMySosSessions.jsx';
import { initCrashLogger, logError } from './src/middleware/nativeCrashLogger.js';
import useUserAuth from './src/hook/useUserAuth.jsx';
import { Device } from 'mediasoup-client';
import { UserService } from './src/services/user.service.js';
import { resetAllState } from './src/store/index.jsx';
// initCrashLogger();
// logError(new Error('Test error from App.jsx to verify crash logging is working correctly')); 
// Isolated so that opening from FAB only re-renders this component logic
const SOSController = React.memo(({ fabVisible, navigationRef, sosModalVisible, setSosModalVisible }) => {
  const [isOpening, setIsOpening] = useState(false);

  const handleFabPress = () => {
    setIsOpening(true); 
    setSosModalVisible(true);
  };

  const handleOpened = () => setIsOpening(false);

  return (
    <>
      <SosFab
        visible={fabVisible}
        onPress={handleFabPress}
        loading={isOpening}
      />
      <SOSAlertModal
        visible={sosModalVisible}
        navigationRef={navigationRef}
        onClose={() => setSosModalVisible(false)}
        onOpened={handleOpened}
      />
    </>
  );
});
// navigationRef is imported from src/utils/navigationService
const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{borderLeftColor: '#00c48c', backgroundColor: '#111', borderRadius: 8}}
      contentContainerStyle={{paddingHorizontal: 15}}
      text1Style={{color: '#fff', fontSize: 14, fontWeight: 'bold'}}
      text2Style={{color: '#aaa', fontSize: 12}}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{borderLeftColor: '#ff3b5c', backgroundColor: '#111', borderRadius: 8}}
      contentContainerStyle={{paddingHorizontal: 15}}
      text1Style={{color: '#fff', fontSize: 14, fontWeight: 'bold'}}
      text2Style={{color: '#aaa', fontSize: 12}}
    />
  ),
  info: (props) => (
    <BaseToast
      {...props}
      style={{borderLeftColor: '#4a9eff', backgroundColor: '#111', borderRadius: 8}}
      contentContainerStyle={{paddingHorizontal: 15}}
      text1Style={{color: '#fff', fontSize: 14, fontWeight: 'bold'}}
      text2Style={{color: '#aaa', fontSize: 12}}
    />
  ), 
};
const Stack = createNativeStackNavigator();

const App = () => {
  console.log('App rendered');
  const dispatch = useDispatch();
  
  const [isConnected, setIsConnected] = useState(true);
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [missingPermissions, setMissingPermissions] = useState(null); // null = checking
  const appStateRef = useRef(AppState.currentState);
  const pendingNavigationRef = useRef(null);
  const pendingSosRef = useRef(false);
  const routeNameRef = useRef(null);
  const [activeScreen, setActiveScreen] = useState(null);
  const [banner, setBanner] = useState({ visible: false, title: '', body: '' });
  const [incomingVictims, setIncomingVictims] = useState(DUMMY_INCOMING_SOS);
  const [outgoingVictims, setOutgoingVictims] = useState(DUMMY_OUTGOING_SOS);
  const { fetchSosNotifications } = useIncomingSosNotifications();
  const { fetchMySosSessions } = useMySosSessions();
  const { isAuthenticated } = useUserAuth();
  const [emittedSOS, setEmittedSOS] = useState(null);

   

  const openSosModalFromNotification = useCallback(() => {
    if (AppState.currentState === 'active') {
      pendingSosRef.current = false;
      setSosModalVisible(true);
       
      return;
    }

    pendingSosRef.current = true;
    // Handles resume race: notification press can arrive before appStateRef is updated.
    setTimeout(() => {
      if (pendingSosRef.current && AppState.currentState === 'active') {
        pendingSosRef.current = false;
        setSosModalVisible(true);
        if (fetchSOS) {
          fetchSosNotifications();
        }
      }
    }, 450);
  }, []);

  const handleCheckPermissions = useCallback(async () => {
    // First, prompt the user to grant permissions, then check what is still missing
    await requestLocationPermissions();
    await requestNotificationPermissions();
    await requestMicrophonePermission();
    const missing = await checkRequiredPermissions();
    setMissingPermissions(missing);
  }, []);

  // Check permissions on mount
  useEffect(() => {
    handleCheckPermissions();
  }, [handleCheckPermissions]);

  // Re-check permissions when app comes back to foreground (user returns from Settings)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async nextState => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        // Flush any SOS modal that was triggered from a background notification tap
        if (pendingSosRef.current) {
          pendingSosRef.current = false;
          setSosModalVisible(true);
        }

        // Only update state if missingPermissions actually changes
        const missing = await checkRequiredPermissions();
        setMissingPermissions(prev => {
          if (Array.isArray(prev) && Array.isArray(missing) && prev.length === missing.length && prev.every((v, i) => v === missing[i])) {
            return prev;
          }
          return missing;
        });
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, []);

  const syncCurrentScreen = useCallback(() => {
    
    const routeName = navigationRef.getCurrentRoute()?.name;
    if (!routeName || routeNameRef.current === routeName) {
      return;
    }
     
    console.log('Current screen changed:', routeName); 
    routeNameRef.current = routeName;
    setActiveScreen(routeName);
    dispatch(currentScreenActions.setCurrentScreen(routeName));
  }, [dispatch]);

  const navigateToContacts = useCallback(() => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('Main', { screen: 'Contacts' });
      return;
    }

    pendingNavigationRef.current = () => {
      navigationRef.navigate('Main', { screen: 'Contacts' });
    };
  }, []);

  const navigateToMain = useCallback(() => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('Main');
      return;
    }
    pendingNavigationRef.current = () => {
      navigationRef.navigate('Main');
      };
    }, []);

  const navigateToChat = useCallback((senderId) => {
    if (!navigationRef.isReady()) {
      console.log('Navigating to chat screen for senderId2:', senderId);
      pendingNavigationRef.current = () => {
        navigationRef.navigate('Main', {
          screen: 'MainTabs',
          params: { screen: 'Chat', params: { selectedReceipentId: senderId } },
        });
      };
      return;
    }

    // If already on Chat screen, signal the screen directly via DeviceEventEmitter.
    // CommonActions.setParams dispatches to the root-focused route (Drawer/Stack),
    // not the nested Chat screen, so route.params never updates there.
    const currentRoute = navigationRef.getCurrentRoute();
    if (currentRoute?.name === 'Chat') {
      DeviceEventEmitter.emit('chat:switch-recipient', { senderId });
      return;
    }

    navigationRef.navigate('Main', {
      screen: 'MainTabs',
      params: { screen: 'Chat', params: { selectedReceipentId: senderId } },
    });
  }, []);

  const notificationAction = useCallback((payload) => {
     
    const payloadData =
      payload?.data ||
      payload?.remoteMessage?.data ||
      payload?.notification?.data ||
      {};
    const messageType = String(payloadData?.messageType || payloadData?.type || '').toUpperCase();
    console.log({messageType:messageType});
    const refreshMessageTypes = [
      'ACCEPTED_TRUSTED_CONTACT',
      'DELETED_TRUSTED_CONTACT',
      'REMOVED_BY_TRUSTED_CONTACT',
      'NEW_TRUSTED_CONTACT_INVITATION',
    ];

    if (refreshMessageTypes.includes(messageType)) {
      navigateToContacts();
      
    }
    if(payloadData?.fetchSOS){
        fetchSosNotifications();
    }
    

    if (messageType === 'SOS') {
      console.log('Opening SOS modal from notification with payloadData:', payloadData); 
      openSosModalFromNotification();
      
    }
    if (payloadData?.fetchVictimSOS) {
        fetchMySosSessions();
      
    }
    if (messageType === 'VICTIM') {
     
    }
    if(messageType === 'ACCOUNT_ACCESSED_FROM_NEW_DEVICE_NOTIFICATION') {
      Alert.alert(
        'New Device Login Detected',
        'Your account was accessed from a new device. If this was not you, please contact support immediately.'
      );
     UserService.logout(); 
      dispatch(resetAllState());
      if (navigationRef.isReady()) {
         navigationRef.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });

      }


    }

    if (messageType === 'CHAT') {
      console.log('Navigating to chat screen for senderId:', payloadData?.senderId);
      navigateToChat(payloadData?.senderId);
      
    }
    if(!messageType) {
       navigateToMain();
    }
   
  }, [fetchMySosSessions, fetchSosNotifications, navigateToContacts, navigateToChat, navigateToMain, openSosModalFromNotification]);

  // useEffect(() => {
  //   const subscription = AppState.addEventListener('change', async nextState => {
  //     if (nextState !== 'active') {
  //       return;
  //     }

  //     const pendingPressPayload = await consumePendingNotificationPress();
  //     if (pendingPressPayload) {
  //       console.log('Consumed pending background notification press:', pendingPressPayload);
  //       notificationAction(pendingPressPayload);
  //     }
  //   });

  //   return () => subscription.remove();
  // }, [notificationAction]);

  const showBanner = useCallback((title, body) => {
    setBanner({ visible: true, title, body });
  }, []);

  const closeBanner = () => {
    setBanner(prev => ({ ...prev, visible: false }));
  };

  // Poll device ID check every 20s while authenticated and app is active
  useEffect(() => {
    if (!isAuthenticated) return;

    let isBusy = false;

    const check = () => {
      if (isBusy || AppState.currentState !== 'active') return;
      isBusy = true;
      UserService.checkDeviceidLastLogin(({ success, data }) => {
        isBusy = false;
        if (success && data?.data?.isDeviceIdEqual === false) {
          clearInterval(interval);
          Alert.alert(
            'Session Expired',
            'Your account is logged in from another device. You have been logged out.',
            [{ text: 'OK' }],
          );
          UserService.logout();
          dispatch(resetAllState());
          if (navigationRef.isReady()) {
            navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
          }
        }
      });
    };

    const interval = setInterval(check, 40_000);

    return () => clearInterval(interval);
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    const syncConnectionState = state => {
      const internetAvailable = Boolean(
        state?.isConnected && state?.isInternetReachable !== false,
      );
      setIsConnected(prev => (prev !== internetAvailable ? internetAvailable : prev));
    };

    NetInfo.fetch().then(syncConnectionState);
    const unsubscribeNetInfo = NetInfo.addEventListener(syncConnectionState);

    return () => {
      unsubscribeNetInfo();
    };
  }, []);

  const handleNotificationPress = useCallback(payload => {
    console.log('Notification clicked:', payload);
    notificationAction(payload);
  }, [notificationAction]);

  const handleForegroundNotification = useCallback(payload => {
    console.log('Foreground notification received:', payload);
    const title =
      payload?.remoteMessage?.notification?.title ||
      payload?.data?.title ||
      'SOS App';
    const body =
      payload?.remoteMessage?.notification?.body ||
      payload?.data?.body ||
      '';
    showBanner(title, body);
    notificationAction(payload);
  }, [notificationAction, showBanner]);

  useEffect(() => {
     
    const setupNotifications = async () => {
      await createNotificationChannels();
      
    };
    

    const bannerSubscription = DeviceEventEmitter.addListener(
      'chat:new-message-banner',
      payload => {
        const title = payload?.title || 'New Message';
        const body = payload?.body || 'You have received a new message.';
        showBanner(title, body);
      },
    );

    const pendingPressSubscription = DeviceEventEmitter.addListener(
      'notification:pending-press',
      payload => {
        console.log('Received pending notification press event via DeviceEventEmitter:', payload);
       notificationAction(payload);
      },
    );

    setupNotifications();
    const unsubscribe = subscribeForegroundNotifications(handleForegroundNotification);
   const unsubscribePress = subscribeNotificationPress(handleNotificationPress);

    return () => {
      unsubscribe();
      unsubscribePress();
      bannerSubscription.remove();
      pendingPressSubscription.remove();
    };
  }, [handleNotificationPress, handleForegroundNotification, showBanner, notificationAction ]);

  const handleRetryConnection = () => {
    NetInfo.fetch().then(state => {
      const internetAvailable = Boolean(
        state?.isConnected && state?.isInternetReachable !== false,
      );
      setIsConnected(internetAvailable);
    });
  };

  const renderContent = () => {
    if (!isConnected) {
      return (
        <>
          <StatusBar barStyle="light-content" backgroundColor="#020B1B" />
          <NoInternetScreen onRetry={handleRetryConnection} />
        </>
      );
    }

    // Still checking permissions on first load
    if (missingPermissions === null) {
      return null;
    }

    if (missingPermissions.length > 0) {
      return (
        <>
          <StatusBar barStyle="light-content" backgroundColor="#020B1B" />
          <NoPermissionsScreen
            missingPermissions={missingPermissions}
            onRetry={handleCheckPermissions}
          />
        </>
      );
    }

    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
        <InAppNotificationBanner
          visible={banner.visible}
          title={banner.title}
          body={banner.body}
          onClose={closeBanner}
        />
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            if (pendingNavigationRef.current) {
              pendingNavigationRef.current();
              pendingNavigationRef.current = null;
            }
            syncCurrentScreen();
          }}
          onStateChange={syncCurrentScreen}
        >
          <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Process" component={ProcessScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen
              name="AddContact"
              component={AddContactsScreen}
            />
            <Stack.Screen name="Main" component={DrawerNavigator} />
          </Stack.Navigator>
        </NavigationContainer>
        <Toast config={toastConfig} />
      </>
    );
  };

  return (
    <SocketProvider>
      <CreatorMediaSoupProvider>
      <ListenerMediaSoupProvider>
      <TrustedContactsProvider>
        <ChatProvider>
          <LocationProvider>
            <HealthProvider
              userAge={28}              // user's age → used for max HR calculation
              criticalThreshold={76}   // stress score that triggers SOS alert
              gfRefreshMs={10_000}     // Google Fit polling interval
                 // called when user confirms SOS

            >
            <GestureHandlerRootView style={{ flex: 1 }}>
              <SafeAreaProvider>
                {renderContent()}
              </SafeAreaProvider>
              {/* Floating SOS alert button + modal — isolated component so open/close never re-renders App */}
              <SOSController
                fabVisible={
                  isConnected &&
                  Array.isArray(missingPermissions) &&
                  missingPermissions.length === 0 &&
                  activeScreen !== null &&
                  !['Splash', 'Process', 'Login', 'CompleteProfile','AuthLoading'].includes(activeScreen)
                }
                navigationRef={navigationRef}
                sosModalVisible={sosModalVisible}
                setSosModalVisible={setSosModalVisible}
              />
            </GestureHandlerRootView>
            </HealthProvider>
          </LocationProvider>
        </ChatProvider>
      </TrustedContactsProvider>
      </ListenerMediaSoupProvider>
      </CreatorMediaSoupProvider>
    </SocketProvider>
  );
};

export default App;
