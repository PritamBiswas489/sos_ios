import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';

import Icon from 'react-native-vector-icons/MaterialIcons';

import BottomTabNavigator from './BottomTabNavigator';
import SettingsScreen from '../screens/settingsScreen';

import AddContactsScreen from '../screens/addContactsScreen';
import ContactsScreen from '../screens/contactsScreen';
import EmergencyServicesScreen from '../screens/EmergencyServicesScreen/index.jsx';
import analysisScreen from '../screens/analysis';
import CreatorScreen from '../screens/soupCreatorScreen/index.jsx';
import ListenerScreen from '../screens/soupListenerScreen/index.jsx';
import AppFeedback from '../screens/AppFeeback/index.jsx';
import PrivacyPolicy from '../screens/PrivacyPolicy/index.jsx';
import ReportFormScreen from '../screens/abuserReportFormScreen/index.jsx';

import { Alert } from 'react-native';

import { UserService } from '../services/user.service';
import { useDispatch } from 'react-redux';
import { resetAllState } from '../store';
import { useUserData } from '../hook/useUserData';
import { getProfileImage } from '../config/utility';
import useUserAuth from '../hook/useUserAuth.jsx';
import DeviceInfo from 'react-native-device-info';

const Drawer = createDrawerNavigator();

const logoutProcess = async (navigation, dispatch, callback) => {
  try {
    await UserService.deleteFcmToken(() => { }); // Best effort to delete FCM token, ignoring result
    await UserService.logout();
    dispatch(resetAllState());
    callback();
    Alert.alert('Logged Out', 'You have been logged out successfully.');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  } catch (error) {
    console.error('Logout failed:', error);
    Alert.alert('Logout Failed', 'Unable to logout. Please try again.');
  }
};

const CustomDrawerContent = props => {
  const dispatch = useDispatch();
  console.log('=====================================================');

  const { userData, hasLicense } = useUserData();
  const { logout } = useUserAuth();

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerContainer}
    >
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileAvatar}>
          {userData?.profile_photo ? (
            <Image
              source={{ uri: getProfileImage(userData.profile_photo) }}
              resizeMode="cover"
              style={styles.avatarImage}
            />
          ) : (
            <Icon name="person" size={40} color="#FFFFFF" />
          )}
        </View>

        <Text style={styles.profileName}>{userData?.name}</Text>
        <Text style={styles.profileEmail}>{userData?.email}</Text>

        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Online</Text>
        </View>

        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={() => {
            props.navigation.closeDrawer();
            props.navigation.navigate('EditProfile');
          }}
        >
          <Icon name="edit" size={14} color="#5352ED" />
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Drawer Items */}
      <View style={styles.drawerItems}>
        <DrawerItemList {...props} />
      </View>

      {/* Divider */}
      <View style={styles.divider} />


      {/* Logout */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          onPress={() =>
            logoutProcess(props.navigation, dispatch, () => {
              logout();
            })
          }
          style={styles.logoutBtn}
        >
          <Icon name="logout" size={22} color="#FF4757" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version {DeviceInfo.getVersion()}</Text>
      </View>
    </DrawerContentScrollView>
  );
};

const DrawerNavigator = () => {
  const { userData, hasLicense } = useUserData();
  const isDevUser = userData?.phone_number?.includes('+9198309900');

  return (
    <Drawer.Navigator
      initialRouteName="MainTabs"
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#1A1A2E',
          width: 280,
        },
        drawerActiveBackgroundColor: '#5352ED30',
        drawerActiveTintColor: '#5352ED',
        drawerInactiveTintColor: '#A4B0BE',
        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: '500',
          marginLeft: 0,
        },
      }}
    >
      <Drawer.Screen
        name="MainTabs"
        component={BottomTabNavigator}
        options={{
          drawerLabel: 'Home',
          drawerIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />

      {hasLicense && (
        <Drawer.Screen
          name="Contacts"
          component={ContactsScreen}
          options={{
            drawerLabel: 'Contacts',
            drawerIcon: ({ color, size }) => (
              <Icon name="chat" size={size} color={color} />
            ),
          }}
        />
      )}



      {/* <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          drawerLabel: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Icon name="settings" size={size} color={color} />
          ),
        }}
      /> */}
      {hasLicense && (
        <Drawer.Screen
          name="Analysis"
          component={analysisScreen}
          options={{
            drawerLabel: 'Analysis',
            drawerIcon: ({ color, size }) => (
              <Icon name="analytics" size={size} color={color} />
            ),
          }}
        />
      )}
      <Drawer.Screen
        name="EmergencyServices"
        component={EmergencyServicesScreen}
        options={{
          drawerLabel: 'Emergency Services',
          drawerIcon: ({ color, size }) => (
            <Icon name="emergency" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="AppFeedback"
        component={AppFeedback}
        options={{
          drawerLabel: 'Feedback',
          drawerIcon: ({ color, size }) => (
            <Icon name="feedback" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="AbuseReport"
        component={ReportFormScreen}
        options={{
          drawerLabel: 'Report Abuse',
          drawerIcon: ({ color, size }) => (
            <Icon name="person-off" size={size} color={color} />
          ),
        }}
      />


      <Drawer.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicy}
        options={{
          drawerLabel: 'Privacy Policy',
          drawerIcon: ({ color, size }) => (
            <Icon name="privacy-tip" size={size} color={color} />
          ),
        }}
      />



    </Drawer.Navigator>
  );
};

export default DrawerNavigator;

const styles = StyleSheet.create({
  drawerContainer: {
    flexGrow: 1,
  },

  profileSection: {
    padding: 20,
    paddingTop: 30,
    alignItems: 'center',
  },

  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#5352ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },

  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  profileEmail: {
    fontSize: 13,
    color: '#A4B0BE',
    marginTop: 4,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#2ED57320',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2ED573',
    marginRight: 6,
  },

  statusText: {
    color: '#2ED573',
    fontSize: 12,
    fontWeight: '600',
  },

  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#5352ED',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 6,
  },

  editProfileText: {
    color: '#5352ED',
    fontSize: 13,
    fontWeight: '600',
  },

  divider: {
    height: 1,
    backgroundColor: '#16213E',
    marginHorizontal: 20,
    marginVertical: 10,
  },

  drawerItems: {
    paddingTop: 5,
  },

  extraSection: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  extraItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },

  extraItemText: {
    color: '#A4B0BE',
    fontSize: 14,
    marginLeft: 15,
  },

  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: 'auto',
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF475715',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
  },

  logoutText: {
    color: '#FF4757',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },

  version: {
    color: '#A4B0BE',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});
