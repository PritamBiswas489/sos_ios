import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, View, Text, Animated, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation, DrawerActions } from '@react-navigation/native';
 
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useListenerMediaSoup } from '../context/ListenerMediaSoupContext';

import HomeScreen from '../screens/homeScreen';
import MapScreen from '../screens/mapScreen';
import HealthScreen from '../screens/healthScreen';
import AudioStreamScreen from '../screens/audioStream';
import ChatScreen from '../screens/chatScreen';
import StressMonitorScreen from '../screens/stressMonitor';

const Tab = createBottomTabNavigator();

const tabConfig = {
  Home: { icon: 'home', label: 'Home' },
  Map: { icon: 'map', label: 'Map' },
  Health: { icon: 'favorite', label: 'Health' },
  AudioStream: { icon: 'mic', label: 'Audio' },
  Chat: { icon: 'chat', label: 'Chat' },
};

// ── Animated KobyTech Header Title ────────────────────────────────────────────
const KobyTechHeader = () => {
  const colorAnim = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(colorAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: false,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 0.2, duration: 700, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const animatedColor = colorAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: ['#7c6ff7', '#ef4444', '#f59e0b', '#7c6ff7'],
  });

  return (
    <View style={headerStyles.logoRow}>
      <Animated.Text style={[headerStyles.brandText, { color: animatedColor }]}>
        KobyTech
      </Animated.Text>
    </View>
  );
};
const BottomTabNavigator = () => {
  const navigation = useNavigation();
  const { currentStreamingRoomIds } = useListenerMediaSoup();
  const streamingCount = Object.values(currentStreamingRoomIds).filter(Boolean).length;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: '#1A1A2E',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#2a2d3a',
        },
        headerTitle: () => <KobyTechHeader />,
        headerTitleAlign: 'center',
        headerTintColor: '#FFFFFF',
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={{ marginLeft: 16 }}
          >
            <Icon name="menu" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        ),
        tabBarIcon: ({ focused, color, size }) => {
          const config = tabConfig[route.name];
          return <Icon name={config.icon} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF4757',
        tabBarInactiveTintColor: '#A4B0BE',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: '#1b1b1b',
          borderTopWidth: 0,
          height: 65,
          paddingBottom: 0,
          paddingTop: 8,
          elevation: 20,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarLabel: tabConfig[route.name]?.label,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen
        name="Health"
        component={StressMonitorScreen}
        options={{ title: 'Stress Monitor' }}
      />
      <Tab.Screen
        name="AudioStream"
        component={AudioStreamScreen}
        options={{
          title: 'Audio Stream',
          tabBarBadge: streamingCount > 0 ? streamingCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#FFD700',
            fontSize: 10,
            color: '#000',
          },
        }}
      />
      <Tab.Screen name="Chat" component={ChatScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;

// ─── Styles ───────────────────────────────────────────────────────────────────
const headerStyles = StyleSheet.create({
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#7c6ff7',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconLineTop: {
    width: 14,
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 2,
    opacity: 0.9,
  },
  iconLineMid: {
    width: 10,
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 2,
    opacity: 0.65,
  },
  iconLineBot: {
    width: 14,
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 2,
    opacity: 0.9,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 3,
    color: '#000',
    textTransform: 'uppercase',
  },
  gradientFill: {
    height: 30,
    width: 155,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginLeft: 2,
  },
});