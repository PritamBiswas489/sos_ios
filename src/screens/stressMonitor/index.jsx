import React,{useState, useEffect, useRef, useMemo, use} from 'react';
import { View, Text, StatusBar, StyleSheet, Platform } from 'react-native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
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
  console.log('Rendering StressMonitorScreen');
  const { userData } = useUserData();
  const { contactsLastHealthData } = useStress();
  const selectedHealthRecipentId = route?.params?.selectedHealthRecipentId;
  const [normalizedselectedHealthRecipentId, setNormalizedselectedHealthRecipentId] =
    useState(null);
  const hasAutoSelectedFromParamRef = useRef(false);
  const healthSelectedContactRef = useRef(null);
  const onlineUsers = useChatPresence();
  const usrId = userData?.id;
  const { contactList: chatContactList, fetchChatContacts } = useChatContacts();
  const healthSelectedContact = useSelector(state => state.healthSelectedContact);
  healthSelectedContactRef.current = healthSelectedContact;
  const dispatch = useDispatch();
  const { hasLicense } = useUserData();
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
    const currentSelected = healthSelectedContactRef.current;
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
    const stillExists = currentSelected?.item?.id
      ? mappedHealthContacts.some(c => c.id === currentSelected.item.id)
      : false;
    if (currentSelected?.item?.id && !stillExists) {
      if (hasLicense) {
        dispatch(
          healthSelectedContactActions.setHealthSelectedContact({isMe: true, item: null}),
        );
      } else {
        dispatch(
          healthSelectedContactActions.setHealthSelectedContact({isMe: false, item: mappedHealthContacts[0]}),
        );
      }
    } else if (!currentSelected?.item?.id && !currentSelected?.isMe) {
      if (hasLicense) {
        dispatch(
          healthSelectedContactActions.setHealthSelectedContact({isMe: true, item: null}),
        );
      } else {
        dispatch(
          healthSelectedContactActions.setHealthSelectedContact({isMe: false, item: mappedHealthContacts[0]}),
        );
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappedHealthContacts, normalizedselectedHealthRecipentId, dispatch, hasLicense]);
   
  const showNoContactsPanel = !hasLicense && mappedHealthContacts.length === 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#07090F" />

      {showNoContactsPanel ? (
        <View style={styles.noContactsWrap}>
          <View style={styles.noContactsCard}>
            <View style={styles.noContactsIconWrap}>
              <IconMC name="account-group-outline" size={48} color="#FF3B5C" />
            </View>
            <Text style={styles.noContactsTitle}>No Contacts Yet</Text>
            
            <View style={styles.noContactsDivider} />
            <View style={styles.noContactsHintRow}>
              <IconMC name="information-outline" size={14} color="#6B7C99" />
              <Text style={styles.noContactsHint}>
                Contacts appear here once a connection is accepted.
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <>
          {isMe ? <MyStressMonitor /> : null}
          {!isMe ? <ContactStressMonitor /> : null}
        </>
      )}

      <HealthAvatarList
        chatContacts={mappedHealthContacts}
        fetchChatContacts={fetchChatContacts}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07090F' },
  noContactsWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  noContactsCard: {
    width: '100%',
    backgroundColor: '#0E1A33',
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,59,92,0.15)',
    shadowColor: '#FF3B5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  noContactsIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,59,92,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,59,92,0.25)',
  },
  noContactsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  noContactsSubtitle: {
    fontSize: 13.5,
    color: '#6B7C99',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  noContactsDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 16,
  },
  noContactsHintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  noContactsHint: {
    fontSize: 12,
    color: '#6B7C99',
    flex: 1,
    lineHeight: 18,
  },
});
