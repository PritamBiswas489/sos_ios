import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text, DeviceEventEmitter, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserService } from '../../services/user.service';
import { useDispatch } from 'react-redux';
import { useUserData } from '../../hook/useUserData';
import { requestUserPermission, getFCMToken, consumePendingNotificationPress, getQuitStateNotification } from '../../services/notification.service';
import { Platform } from 'react-native';
import { useChatContacts } from '../../hook/useChatContacts';
import useUserAuth from '../../hook/useUserAuth';
import { resetAllState } from '../../store';

const ProfessionalLoader = () => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0)).current;
  const shimmerValue = useRef(new Animated.Value(0)).current;
 

  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 850,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0,
          duration: 850,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    );

    spinAnimation.start();
    pulseAnimation.start();
    shimmerAnimation.start();

    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
      shimmerAnimation.stop();
    };
  }, [pulseValue, shimmerValue, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulseScale = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.08],
  });

  const shimmerTranslate = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <View style={styles.loaderRoot}>
      <View style={styles.glowAura} />

      <Animated.View style={[styles.outerRing, { transform: [{ rotate: spin }] }]}>
        <View style={styles.ringHighlight} />
      </Animated.View>

      <Animated.View style={[styles.middleRing, { transform: [{ scale: pulseScale }] }]} />
      <View style={styles.innerCore} />

      <Text style={styles.loaderTitle}>Setting Things Up</Text>
      <Text style={styles.loaderSubtitle}>Preparing your secure environment...</Text>

      <View style={styles.progressTrack}>
        <Animated.View
          style={[styles.progressShimmer, { transform: [{ translateX: shimmerTranslate }] }]}
        />
      </View>
    </View>
  );
};


const ProcessScreen = payload => {
  const { action } = payload.route.params;
  const dispatch = useDispatch();
  const { fetchChatContacts } = useChatContacts();
  console.log('=====================================================');
  console.log('Process Screen Action:', action);
  console.log('=====================================================');
  const navigation = useNavigation();
  const { fetchUserData } = useUserData();
  const { isAuthenticated } = useUserAuth();
  

  const saveFcmTokenData = async fcmToken => {
    // TODO: Replace this with actual API integration to store token on backend.
    console.log('=====================================================');
    console.log('Saving FCM token to server:', fcmToken);
    console.log('Platform:', Platform.OS);
    console.log('=====================================================');
    try{
        await new Promise((resolve, reject) => {
            UserService.saveFcmToken({ token: fcmToken, platform: Platform.OS }, response => {
              if (response.success) {
                resolve(response.data);
                console.log('FCM token saved successfully on server');
              } else {
                reject(
                  new Error(response?.error || 'Failed to save FCM token'),
                );
              }
            });
        });
    } catch (error) {
        console.log('❌ Error saving FCM token:', error?.message);
        if(error?.message === 'UNAUTHORIZED'){
            console.log('Unauthorized error detected while saving FCM token. Logging out user.');
            UserService.logout(); // Clear any existing session data
            dispatch(resetAllState()); // Reset Redux state
            navigation.replace('Login');
        }
    }
    
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) {
        navigation.replace('Login');
        return;
      }
      if (action === 'retrieveDataAfterLogin') {

      
        
        console.log('=====================================================');
        console.log('Device token need to be sent to server here');
        console.log('=====================================================');

        const isPermissionGranted = await requestUserPermission();
        if (isPermissionGranted) {
          const fcmToken = await getFCMToken();
          console.log("fcmToken in process screen:", fcmToken);
          if (fcmToken) {
            saveFcmTokenData(fcmToken);
          }
        }
         


       console.log('=====================================================');
       console.log('Fetching user profile data after login');
       console.log('=====================================================');
        const data =  await fetchUserData();
        console.log('=====================================================');
        console.log('User profile data fetched successfullyyyyyy:', data);
        console.log('=====================================================');
        console.log("Trusted Contacts for Join Socket Room need to be fetched here");
        console.log('=====================================================');
        await fetchChatContacts();
        console.log('=====================================================');
        console.log('Data retrieval successful, navigating to Main screen');
        console.log('=====================================================');

        if(!data?.id){
            console.log('❌ User data is missing id after login. Navigating back to Login screen.');
            navigation.replace('Login');
            return;
        }
        if(data?.first_time_login){
            console.log('First time login detected, navigating to CompleteProfile screen');
            navigation.replace('CompleteProfile');
            return;
        }
        const pendingNotification = await consumePendingNotificationPress()
          ?? await getQuitStateNotification();
          console.log('=====================================================');
          console.log('Pending notification press payload after login:', pendingNotification);
          console.log('=====================================================');
        if (pendingNotification) {
          DeviceEventEmitter.emit('notification:pending-press', pendingNotification);
        }else{
             navigation.replace('Main');
        }
        
      }
    };
    fetchData();
  }, [action, dispatch, fetchChatContacts, navigation,isAuthenticated]);
  return (
    <View style={styles.container}>
      <ProfessionalLoader />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050B18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderRoot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowAura: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(67, 138, 255, 0.14)',
  },
  outerRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: 'rgba(114, 182, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  ringHighlight: {
    marginTop: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#72B6FF',
    shadowColor: '#72B6FF',
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  middleRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(136, 195, 255, 0.45)',
  },
  innerCore: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#A8D3FF',
    shadowColor: '#A8D3FF',
    shadowOpacity: 0.7,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  loaderTitle: {
    marginTop: 30,
    color: '#F4F8FF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loaderSubtitle: {
    marginTop: 8,
    color: '#A5B6D0',
    fontSize: 13,
    fontWeight: '500',
  },
  progressTrack: {
    marginTop: 18,
    width: 180,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(102, 140, 196, 0.25)',
    overflow: 'hidden',
  },
  progressShimmer: {
    width: 70,
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#7EC0FF',
  },
});

export default ProcessScreen;
