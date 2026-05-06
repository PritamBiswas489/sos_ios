import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import ContactRowItem from '../../components/contactRowItem';
import styles from './style';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { getProfileImage } from '../../config/utility';
 
import { chatSelectedTrustedContactActions } from '../../store/redux/chatSelectedTrustedContact.redux';

import { useChatContacts } from '../../hook/useChatContacts';
import { useTrustedContacts } from '../../hook/useTrustedContacts';
import { useIncommingRequests } from '../../hook/useIncommingRequests';
import { useOutgoingRequests } from '../../hook/useOutgoingRequests';
import { useContactTab } from '../../hook/useContactTab';
import { useTrustedContactActions } from '../../context/TrustedProviderContext';

import { useUserData } from '../../hook/useUserData';


import useToast from '../../hook/useToast';
const ContactsScreen = () => {
  console.log('Rendering ContactsScreen');
  const [editModal, setEditModal] = useState(false);
  const { currentTab:activeTab, setCurrentTab:setActiveTab } = useContactTab();
  const [refreshing, setRefreshing] = useState(false);
  const [loader, setLoader] = useState(false);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { showError, showSuccess } = useToast();
  const { contactList: contacts, fetchTrustedContacts, setData: setTrustedContacts } = useTrustedContacts();
  const { contactList: incomingRequests, fetchIncommingRequests, setData: setIncomingRequests } = useIncommingRequests();
  const { contactList: outgoingRequests, fetchOutgoingRequests, setData: setOutgoingRequests } = useOutgoingRequests();
  const {  fetchChatContacts } = useChatContacts();
  const loadDataRef = useRef(new Set()); 
 const {userData} = useUserData();
  const { acceptTrustedContactRequest, deleteTrustedContactRequest } = useTrustedContactActions();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoader(true);
        console.log("loadref",loadDataRef.current.has('trustedContacts'));  
        if (!loadDataRef.current.has('trustedContacts')) {
          console.log("Fetching trusted contacts...");
          await fetchTrustedContacts();
          loadDataRef.current.add('trustedContacts');
        }
        if (!loadDataRef.current.has('incomingRequests')) {
          await fetchIncommingRequests();
          loadDataRef.current.add('incomingRequests');
        }
        if (!loadDataRef.current.has('outgoingRequests')) {
          await fetchOutgoingRequests();
          loadDataRef.current.add('outgoingRequests');
        }
      } finally {   
        setLoader(false);
      }
    };

    loadData();
  }, [fetchTrustedContacts, fetchIncommingRequests, fetchOutgoingRequests]);
 

   
 
  
  /**
   * This function determines which list of contacts to display based on the currently active tab. If the active tab is 'incoming', it returns the list of incoming requests from the Redux store. If the active tab is 'outgoing', it returns the list of outgoing requests. For any other case (which would be the 'contact' tab), it returns the main trusted contact list. This allows the component to dynamically display the appropriate set of contacts based on user interaction with the tabs.
   */
  const getCurrentList = () => {
    if (activeTab === 'incoming') {
      return incomingRequests;
    }
    if (activeTab === 'outgoing') {
      return outgoingRequests;
    }
    return contacts;
  };
  const currentList = getCurrentList() ?? [];

  const avatarColors = [
    '#2F6BFF',
    '#FF3B5C',
    '#2ED573',
    '#FFA726',
    '#6A4CFF',
    '#00BCD4',
    '#8BC34A',
    '#E91E63',
  ];

  const getAvatarColor = item => {
    const key = `${item?.id ?? ''}-${item?.nickname ?? ''}`;
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };

  const getActionIcons = () => {
    if (activeTab === 'incoming') {
      return [
        { key: 'accept', icon: 'check', color: '#2ED573' },
        { key: 'cancel', icon: 'close', color: '#FF4757' },
      ];
    }
    if (activeTab === 'outgoing') {
      return [
        { key: 'cancel', icon: 'close', color: '#FF4757' },
      ];
    }
    return [
      { key: 'chat', icon: 'chat', color: '#2F6BFF' },
      { key: 'audio', icon: 'mic', color: '#2ED573' },
      { key: 'map', icon: 'map', color: '#FFA726' },
      { key: 'health', icon: 'favorite', color: '#FF3B5C' },
      { key: 'delete', icon: 'delete', color: '#FF4757' }];
  };

  const onActionPress = useCallback((action, item) => {
    const tab = activeTab;
    const actionText = action.charAt(0).toUpperCase() + action.slice(1);
    if (action === 'chat' && tab === 'contact') {
     
      navigation.navigate('Main', {
        screen: 'MainTabs',
        params: { 
          screen: 'Chat',
          params: { selectedReceipentId : item.trusted_user_id },
         },
        });
      return;
    }
     if (action === 'map' && tab === 'contact') {
       navigation.navigate('Main', {
        screen: 'MainTabs',
        params: { 
          screen: 'Map',
          params: { selectedMapRecipentId : item.trusted_user_id },
         },
        });
      return;


     }
     if (action === 'audio' && tab === 'contact') {
       navigation.navigate('Main', {
        screen: 'MainTabs',
        params: { 
          screen: 'AudioStream',
          params: { selectedReceipentId : item.trusted_user_id },
         },
        });
      return;


     }
     if (action === 'health' && tab === 'contact') {
       navigation.navigate('Main', {
        screen: 'MainTabs',
        params: { 
          screen: 'Health',
          params: { selectedHealthRecipentId : item.trusted_user_id },
         },
        });
      return;


     }
    if (action === 'cancel' && tab === 'outgoing') {
      //need a confirm and cancel alert
      Alert.alert(
        `${actionText} Request`,
        `Are you sure you want to cancel this outgoing trusted contact request?`,
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: async () => {
              setLoader(true);
              try {
                const response = await deleteTrustedContactRequest({id: item.id});
                  showSuccess('SUCCESS', response?.message || 'Trusted contact request deleted successfully');
                  const removeRequest = outgoingRequests.filter(request => request.id !== item.id);
                  console.log('Updated outgoing requests after deletion:', removeRequest);
                  setOutgoingRequests(removeRequest);
              } catch (error) {
                  showError('ERROR', error?.message || 'Failed to delete trusted contact request');
              } finally {
                  setLoader(false);
              }
            },
          },
        ],
      );
      return;
    }
    if (action === 'cancel' && tab === 'incoming') {
      Alert.alert(
        `${actionText} Request`,
        `Are you sure you want to reject this incoming trusted contact request?`,
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: async () => {
               setLoader(true);
              try {
                const response = await deleteTrustedContactRequest({id: item.id});
                  showSuccess('SUCCESS', response?.message || 'Trusted contact request deleted successfully');
                  const removeRequest = incomingRequests.filter(request => request.id !== item.id);
                  console.log('Updated incoming requests after deletion:', removeRequest);
                  setIncomingRequests(removeRequest);
              } catch (error) {
                  showError('ERROR', error?.message || 'Failed to delete trusted contact request');
              } finally {
                  setLoader(false);
              }
             
            },
          },
        ],
      );
      return;
    }
    if (action === 'accept' && tab === 'incoming') {
      Alert.alert(
        `${actionText} Request`,
        `Do you want to accept this incoming trusted contact request?`,
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: async () => {
              setLoader(true);
               try {
                const response = await acceptTrustedContactRequest({id: item.id});
                  showSuccess('SUCCESS', response?.message || 'Trusted contact request accepted successfully');
                 setActiveTab('contact');  
              } catch (error) {
                showError('ERROR', error?.message || 'Failed to accept trusted contact request');
              } finally {
                  setLoader(false);
              }
             
            },
          },
        ],
      );
      return;
    }
   
    if (action === 'delete' && tab === 'contact') {
      Alert.alert(
        `${actionText} Contact`,
        `Are you sure you want to delete this trusted contact?`,
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Yes',
             onPress: async () => {
              setLoader(true);
              try {
                const response = await deleteTrustedContactRequest({id: item.id});
                  showSuccess('SUCCESS', response?.message || 'Trusted contact request deleted successfully');
                  const removeContact = contacts.filter(contact => contact.id !== item.id);
                  console.log('Updated contact list after deletion:', removeContact);
                  setTrustedContacts(removeContact);
                 setActiveTab('contact');  
              } catch (error) {
                  showError('ERROR', error?.message || 'Failed to delete trusted contact request');
              } finally {
                  setLoader(false);
              }
            },
          },
        ],
      );
      return;


    }
  }, [activeTab, contacts, incomingRequests, outgoingRequests, deleteTrustedContactRequest, acceptTrustedContactRequest, setTrustedContacts, setIncomingRequests, setOutgoingRequests, setActiveTab, showSuccess, showError, navigation]);

  const gotToAddContactScreen = () => {
    navigation.navigate('AddContact');
  };

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([
        fetchTrustedContacts(),
        fetchIncommingRequests(),
        fetchOutgoingRequests(),
    ]).finally(() => setRefreshing(false));
  };

  return (
    <View style={styles.container}>
      {/* Header — fixed */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>Contacts</Text>
          <Text style={styles.subtitle}>{currentList?.length} ITEMS</Text>
        </View>
      </View>

      {/* Tab List — fixed */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'contact' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('contact')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'contact' && styles.activeTabText,
            ]}
          >
            Contact
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'incoming' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('incoming')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'incoming' && styles.activeTabText,
            ]}
          >
            Incoming Request
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'outgoing' && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab('outgoing')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'outgoing' && styles.activeTabText,
            ]}
          >
            Outgoing Request
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable contact list only */}
      <ScrollView
        style={styles.contactList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={['#2F6BFF']}
          />
        }
      >
        {loader && (
          <View style={styles.listLoaderWrap}>
            <ActivityIndicator size="large" color="#2F6BFF" />
            <Text style={styles.listLoaderText}>Loading contacts...</Text>
          </View>
        )}

        {!loader && currentList.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Icon
                name={
                  activeTab === 'incoming'
                    ? 'call-received'
                    : activeTab === 'outgoing'
                    ? 'call-made'
                    : 'people-outline'
                }
                size={48}
                color={
                  activeTab === 'incoming'
                    ? '#2ED573'
                    : activeTab === 'outgoing'
                    ? '#2F6BFF'
                    : '#FFA726'
                }
              />
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === 'incoming'
                ? 'No Incoming Requests'
                : activeTab === 'outgoing'
                ? 'No Outgoing Requests'
                : 'No Trusted Contacts'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'incoming'
                ? 'When someone sends you a trusted contact request, it will appear here.'
                : activeTab === 'outgoing'
                ? 'Requests you send to others will show up here until accepted.'
                : 'Add trusted contacts so they can be alerted during an SOS emergency.'}
            </Text>
          </View>
        )}

        {!loader && currentList.map(item => {
          let displayName = '?';
          if (activeTab === 'incoming') {
            displayName = item?.inviter?.name || item?.relationship || '?';
          }
          if (activeTab === 'outgoing') {
            displayName = item?.nickname || item?.trusted_contact?.name || item?.relationship || '?';
          }
          displayName = item?.nickname || item?.trusted_contact?.name || item?.relationship || displayName;

          let profileImage = null;
          if (activeTab === 'incoming') {
            profileImage = item?.inviter?.profile_photo ? getProfileImage(item?.inviter?.profile_photo) : null;
          } else {
            profileImage = item?.trusted_contact?.profile_photo ? getProfileImage(item?.trusted_contact?.profile_photo) : null;
          }

          const phoneNumber = activeTab === 'incoming'
            ? item?.inviter?.phone_number
            : item?.trusted_contact?.phone_number;

          const normalizedItem = {
            ...item,
            displayName,
            profileImage,
            phoneNumber,
          };

          return (
            <ContactRowItem
              key={item.id}
              item={normalizedItem}
              actions={getActionIcons()}
              onActionPress={onActionPress}
              getAvatarColor={getAvatarColor}
            />
          );
        })}
      </ScrollView>

      {/* Add Trusted Contact — fixed */}
      {!loader && <TouchableOpacity onPress={gotToAddContactScreen} style={styles.addBtn}>
        <Text style={styles.addText}>+ Add Trusted Contact</Text>
      </TouchableOpacity>}

      {/* Emergency Info — fixed */}
      {!loader && <View style={styles.infoCard}>
        <Icon name="warning" size={18} color="#FFC107" />
        <Text style={styles.infoText}>
          <Text style={{ color: '#2ED573', fontWeight: '600' }}>
            Emergency SOS
          </Text>{' '}
          will instantly notify all contacts with your live GPS location.
        </Text>
      </View>}

      <Modal visible={editModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Contact</Text>

              <TouchableOpacity onPress={() => setEditModal(false)}>
                <Icon name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Contact Name"
              placeholderTextColor="#6C7A92"
              style={styles.input}
            />

            <TextInput
              placeholder="Relation"
              placeholderTextColor="#6C7A92"
              style={styles.input}
            />

            <TextInput
              placeholder="Phone Number"
              placeholderTextColor="#6C7A92"
              style={styles.input}
              keyboardType="phone-pad"
            />

            <TouchableOpacity style={styles.saveBtn}>
              <Text style={styles.saveText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ContactsScreen;
