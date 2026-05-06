import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image , Alert} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useUserAuth from '../../hook/useUserAuth';
import { UserService } from '../../services/user.service';
import { useDispatch } from 'react-redux';
import { resetAllState } from '../../store';
const AuthLoadingScreen = () => {
  const navigation = useNavigation();
  const { checkAuthentication } = useUserAuth();
  const dispatch = useDispatch();

  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0)).current;
  const shimmerValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

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
  }, [fadeValue, pulseValue, shimmerValue, spinValue]);

  useEffect(() => {
    const verify = async () => {
      const isAuthenticated = await checkAuthentication();
      if (isAuthenticated) {
        const checkLastDeviceId = await new Promise(resolve => {
          UserService.checkDeviceidLastLogin(response => {
            if (response.success) {
              resolve({ is_equal: response.data.data.isDeviceIdEqual });
            } else {
              console.error(
                'Error checking device ID last login:',
                response?.error,
              );
              resolve({ is_equal: true }); // Default to true to avoid blocking login on error
            }
          });
        });

        if (!checkLastDeviceId.is_equal) {
          Alert.alert(
            'Device Mismatch',
            'Your device does not match the last login device. Please login again.',
            [{ text: 'OK', onPress: () => navigation.replace('Login') }],
          );
          UserService.logout(); // Clear any existing session data
          dispatch(resetAllState()); // Reset Redux state
          return;
        }

        navigation.replace('Process', { action: 'retrieveDataAfterLogin' });
      } else {
        navigation.replace('Login');
      }
    };
    verify();
  }, [navigation]);

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
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeValue }]}>
        <View style={styles.loaderRoot}>
          <View style={styles.glowAura} />

          <Animated.View
            style={[styles.outerRing, { transform: [{ rotate: spin }] }]}
          >
            <View style={styles.ringHighlight} />
          </Animated.View>

          <Animated.View
            style={[styles.middleRing, { transform: [{ scale: pulseScale }] }]}
          />
          <View style={styles.innerCore} />
        </View>

        <Text style={styles.title}>Verifying Session</Text>
        <Text style={styles.subtitle}>
          Checking your authentication status...
        </Text>

        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressShimmer,
              { transform: [{ translateX: shimmerTranslate }] },
            ]}
          />
        </View>
      </Animated.View>
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
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 160,
    height: 100,
    marginBottom: 48,
  },
  loaderRoot: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
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
  title: {
    marginTop: 30,
    color: '#F4F8FF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subtitle: {
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

export default AuthLoadingScreen;
