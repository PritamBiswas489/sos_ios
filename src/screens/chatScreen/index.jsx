import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  TouchableOpacity,
  DeviceEventEmitter,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from './style';
import ContactAvatarList from '../../components/contactAvatarList';
import ChatComposer from '../../components/chatComposer';
import ConversationList from '../../components/conversationList';
import { useChatPresence } from '../../context/ChatContext';
import { useChatContacts } from '../../hook/useChatContacts';
import { useUserData } from '../../hook/useUserData';
import { chatSelectedTrustedContactActions } from '../../store/redux/chatSelectedTrustedContact.redux';

const ANDROID_15_KEYBOARD_GAP = 0;

const ChatScreen = ({ route }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const onlineUsers = useChatPresence();
  const onlineCount = Object.values(onlineUsers || {}).filter(status => status).length;
  const { contactList: chatContacts, fetchChatContacts } = useChatContacts();
  const chatSelectedTrustedContact = useSelector(state => state.chatSelectedTrustedContact);
  const { userData } = useUserData();
  const usrId = userData?.id;
  const selectedReceipentId = route?.params?.selectedReceipentId;
  console.log('ChatScreen selectedReceipentId from route params:', selectedReceipentId);
  const [normalizedSelectedReceipentId, setNormalizedSelectedReceipentId] = useState(null);
  const hasAutoSelectedFromParamRef = useRef(false);

  useEffect(() => {
    console.log('ChatScreen selectedReceipentId changed:', selectedReceipentId);
    hasAutoSelectedFromParamRef.current = false;
    setNormalizedSelectedReceipentId(
      selectedReceipentId === null || selectedReceipentId === undefined
        ? null
        : String(selectedReceipentId),
    );
  }, [selectedReceipentId]);

  // Pending recipient set by the DeviceEventEmitter path (push notification while on Chat).
  // Kept separate from the route-param path to avoid batching/ordering issues.
  const eventRecipientRef = useRef(null);
  const [eventTrigger, setEventTrigger] = useState(0);

  // When already on Chat screen, App.jsx emits this instead of updating route params
  // (setParams targets the wrong navigator level for nested tabs).
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('chat:switch-recipient', ({ senderId }) => {
      if (!senderId) return;
      eventRecipientRef.current = String(senderId);
      // Increment so the consume-effect always fires, even for the same senderId
      setEventTrigger(t => t + 1);
    });
    return () => sub.remove();
  }, []);

  const mappedChatContacts = useMemo(() => {
    const list = chatContacts;
    if (!list || list.length === 0) return [];

    const trustedContacts = [];
    const otherContacts = [];

    for (const contact of list) {
      const roomid = [contact.user_id, contact.trusted_user_id].sort().join(':');
      if (contact.user_id === usrId) {
        const displayName =
          contact.nickname || contact.trusted_contact.name || contact.relationship || '?';
        trustedContacts.push({
          id: contact.id,
          name: displayName,
          initial: displayName?.charAt(0).toUpperCase(),
          isOnline: onlineUsers[contact.trusted_user_id] || false,
          receipent_id: contact.trusted_user_id,
          phone_number: contact.trusted_contact.phone_number,
          roomId: roomid,
        });
      } else if (contact.trusted_user_id === usrId) {
        const displayName = contact?.inviter?.name || contact?.inviter?.phone_number || 'Unknown';
        otherContacts.push({
          id: contact.id,
          name: displayName,
          initial: displayName.charAt(0).toUpperCase(),
          phone_number: contact?.inviter?.phone_number,
          isOnline: onlineUsers[contact.user_id] || false,
          receipent_id: contact.user_id,
          roomId: roomid,
        });
      }
    }

    const filteredOtherContacts = otherContacts.filter(
      oc => !trustedContacts.some(tc => tc.roomId === oc.roomId),
    );

    return [...trustedContacts, ...filteredOtherContacts].sort((a, b) => {
      if (a.isOnline === b.isOnline) return 0;
      return a.isOnline ? -1 : 1;
    });
  }, [chatContacts, usrId, onlineUsers]);

  // Keep a ref of the latest contacts for use inside the event listener closure
  const mappedChatContactsRef = useRef([]);
  useEffect(() => {
    mappedChatContactsRef.current = mappedChatContacts;
  }, [mappedChatContacts]);

  // Consume pending event recipient — runs on every trigger increment or when contacts reload
  useEffect(() => {
    if (!eventRecipientRef.current || mappedChatContacts.length === 0) return;
    const contact = mappedChatContacts.find(
      c => String(c.receipent_id) === eventRecipientRef.current,
    );
    if (contact) {
      dispatch(chatSelectedTrustedContactActions.setSelectedTrustedContact(contact));
      eventRecipientRef.current = null;
    }
  }, [eventTrigger, mappedChatContacts, dispatch]);

  useEffect(() => {
    console.log('Mapped chat contacts updated:', mappedChatContacts);
    if (mappedChatContacts.length === 0) return;

    if (normalizedSelectedReceipentId && !hasAutoSelectedFromParamRef.current) {
      hasAutoSelectedFromParamRef.current = true;
      const contactToSelect = mappedChatContacts.find(
        c => String(c.receipent_id) === normalizedSelectedReceipentId,
      );
      console.log('Auto-selecting contact from route param:', contactToSelect);
      dispatch(
        chatSelectedTrustedContactActions.setSelectedTrustedContact(
          contactToSelect ?? mappedChatContacts[0],
        ),
      );
      return;
    }

    const stillExists = chatSelectedTrustedContact?.id
      ? mappedChatContacts.some(c => c.id === chatSelectedTrustedContact.id)
      : false;

    if (!stillExists) {
      dispatch(
        chatSelectedTrustedContactActions.setSelectedTrustedContact(mappedChatContacts[0]),
      );
    }
  }, [mappedChatContacts, normalizedSelectedReceipentId, chatSelectedTrustedContact?.id, dispatch]);

  const [androidKeyboardHeight, setAndroidKeyboardHeight] = useState(0);
  const isAndroid15OrAbove = Platform.OS === 'android' && Number(Platform.Version) >= 35;

  useEffect(() => {
    fetchChatContacts();
  }, [fetchChatContacts]); 

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onKeyboardShow = event => {
      const keyboardHeight = event?.endCoordinates?.height || 0;
      setAndroidKeyboardHeight(keyboardHeight);
    };

    const onKeyboardHide = () => {
      setAndroidKeyboardHeight(0);
    };

    const showSub = Keyboard.addListener('keyboardDidShow', onKeyboardShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', onKeyboardHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        Platform.OS === 'android'
          ? {
              paddingBottom:
                isAndroid15OrAbove && androidKeyboardHeight > 0
                  ? androidKeyboardHeight + ANDROID_15_KEYBOARD_GAP
                  : 0,
            }
          : null,
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled={Platform.OS === 'ios'}
    >
      {/* FIXED HEADER */}
      {/* <View style={styles.header}>
        <View style={styles.headerCenter}>
          <Text style={styles.subtitle}> {onlineCount} online</Text>
        </View>
      </View> */}

      {/* FIXED AVATAR ROW */}
      <ContactAvatarList
        navigation={navigation}
        chatContacts={mappedChatContacts} fetchChatContacts={fetchChatContacts} 
      />
      {/* MESSAGE LIST */}
      <View style={{ flex: 1 }}>
        {chatContacts.length === 0 ? (
          <View style={[styles.chatContentEmpty, { justifyContent: 'center' }]}>
            <View style={styles.emptyStateWrapper}>
              <View style={styles.emptyStateIconCircle}>
                <Icon name="person-search" size={28} color="#8FA3C8" />
              </View>
              <Text style={styles.emptyStateTitle}>No Contacts Found</Text>
              <Text style={styles.emptyStateSubtitle}>
                Add a trusted contact to start chatting and sharing SOS updates.
              </Text>
              <TouchableOpacity
                style={{ marginTop: 14 }}
                onPress={() => navigation.navigate('AddContact')}
              >
                <Text style={{ color: '#4DA3FF', fontWeight: '700' }}>Add Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <ConversationList
            styles={styles}
          />
        )}
      </View>

      {chatContacts.length > 0 ? (<ChatComposer />) : null}
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;
