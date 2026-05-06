import React,{useState, useEffect, useRef, useMemo} from 'react';
import { View, StatusBar, StyleSheet, Platform } from 'react-native';
import MyStressMonitor from '../../components/myStressMonitor';
import { useChatPresence } from '../../context/ChatContext';
import { useChatContacts } from '../../hook/useChatContacts';
import { useUserData } from '../../hook/useUserData';
import { healthSelectedContactActions } from '../../store/redux/healthSelectedContact.redux';
import { getProfileImage } from '../../config/utility';
import { useSelector, useDispatch } from 'react-redux';
import HealthAvatarList from '../../components/healthAvatarList';
import ContactStressMonitor from '../../components/contactStressMonitor';
import { useStress } from '../../context/StressContext';
import { formatDateSeparator, formatMessageTime } from '../../config/utility';

export default function StressMonitorScreen({ route }) {
  const { userData } = useUserData();
  const { contactsLastHealthData } = useStress();
  const selectedHealthRecipentId = route?.params?.selectedHealthRecipentId;
  const [normalizedselectedHealthRecipentId, setNormalizedselectedHealthRecipentId] =
    useState(null);
  const hasAutoSelectedFromParamRef = useRef(false);
  const onlineUsers = useChatPresence();
  const usrId = userData?.id;
  const { contactList: chatContactList, fetchChatContacts } = useChatContacts();
  const healthSelectedContact = useSelector(state => state.healthSelectedContact);
  const dispatch = useDispatch();
  useEffect(() => {
    hasAutoSelectedFromParamRef.current = false;
    setNormalizedselectedHealthRecipentId(
      selectedHealthRecipentId == null ? null : String(selectedHealthRecipentId),
    );
  }, [selectedHealthRecipentId]);
  
  const isMe = healthSelectedContact?.isMe;
  // Auto-select logic: when contact list changes, try to maintain the same selection if possible. If a selected contact no longer exists, select "Me". If there's a selectedHealthRecipentId from params and we haven't already auto-selected from it, try to select that contact.
  const mappedHealthContacts = useMemo(() => {
    const list = chatContactList;
    if (!list || list.length === 0) return [];
    const trustedContacts = [];
    const otherContacts = [];
    for (const contact of list) {
      const roomid = [contact.user_id, contact.trusted_user_id]
        .sort()
        .join(':');
      if (contact.user_id === usrId) {
        const displayName =
          contact.nickname ||
          contact.trusted_contact.name ||
          contact.relationship ||
          '?';

        const stressData = contactsLastHealthData?.[contact.trusted_user_id] ?? null;  
        const stressLevel = stressData?.stress?.state?.level ?? 0;
        trustedContacts.push({
          id: contact.id,
          name: displayName,
          initial: displayName?.charAt(0).toUpperCase(),
          isOnline: onlineUsers[contact.trusted_user_id] || false,
          stressLevel,
          receipent_id: contact.trusted_user_id,
          phone_number: contact.trusted_contact.phone_number,
          roomId: roomid,
          profile_image: contact?.trusted_contact?.profile_photo
            ? getProfileImage(contact.trusted_contact.profile_photo)
            : null,
        });
      } else if (contact.trusted_user_id === usrId) {
        const stressData = contactsLastHealthData?.[contact.user_id] ?? null;
        const stressLevel = stressData?.stress?.state?.level ?? 0;
        const displayName =
          contact?.inviter?.name || contact?.inviter?.phone_number || 'Unknown';
        otherContacts.push({
          id: contact.id,
          name: displayName,
          initial: displayName.charAt(0).toUpperCase(),
          phone_number: contact?.inviter?.phone_number,
          isOnline: onlineUsers[contact.user_id] || false,
          stressLevel,
          receipent_id: contact.user_id,
          roomId: roomid,
          profile_image: contact?.inviter?.profile_photo
            ? getProfileImage(contact.inviter.profile_photo)
            : null,
        });
      }
    }
    const filteredOtherContacts = otherContacts.filter(
      oc => !trustedContacts.some(tc => tc.roomId === oc.roomId),
    );
    return [...trustedContacts, ...filteredOtherContacts].sort((a, b) => {
      if (b.stressLevel !== a.stressLevel) return b.stressLevel - a.stressLevel;
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      return 0;
    });
  }, [chatContactList, usrId, onlineUsers, contactsLastHealthData]);

  useEffect(() => {
    if (mappedHealthContacts.length === 0) return;
    if (
      normalizedselectedHealthRecipentId &&
      !hasAutoSelectedFromParamRef.current
    ) {
      hasAutoSelectedFromParamRef.current = true;
      const contactToSelect = mappedHealthContacts.find(
        c => String(c.receipent_id) === normalizedselectedHealthRecipentId,
      );
      dispatch(
        healthSelectedContactActions.setHealthSelectedContact({
          isMe: false,
          item: contactToSelect ?? mappedHealthContacts[0],
        }),
      );
      return;
    }
    const stillExists = healthSelectedContact?.item?.id
      ? mappedHealthContacts.some(c => c.id === healthSelectedContact.item.id)
      : false;
      if (healthSelectedContact?.item?.id && !stillExists) {
        console.log('Previously selected contact no longer exists. Auto-selecting the first contact in the list.');
        dispatch(
          healthSelectedContactActions.setHealthSelectedContact({isMe: true, item: null}),
        );
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healthSelectedContact, normalizedselectedHealthRecipentId, dispatch, contactsLastHealthData]);
   
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#07090F" />
      {isMe ? <MyStressMonitor /> : null}

      {!isMe ? (
        <ContactStressMonitor/>
      ) : null}

      <HealthAvatarList
        chatContacts={mappedHealthContacts}
        fetchChatContacts={fetchChatContacts}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07090F' },
});
