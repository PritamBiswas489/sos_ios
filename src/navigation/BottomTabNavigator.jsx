import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation, DrawerActions } from '@react-navigation/native';
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
        },
        headerTitleStyle: {
          color: '#FFFFFF',
          fontWeight: '600',
        },
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
        tabBarLabel: tabConfig[route.name].label,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Health" component={StressMonitorScreen}
       options={{
          title: 'Stress Monitor',
       }}
      />
      <Tab.Screen
        name="AudioStream"
        component={AudioStreamScreen}
        options={{
          title: 'Audio Stream',
          tabBarBadge: streamingCount > 0 ? streamingCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#FFD700', fontSize: 10, color: '#000' },
        }}
      />
      <Tab.Screen name="Chat" component={ChatScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
