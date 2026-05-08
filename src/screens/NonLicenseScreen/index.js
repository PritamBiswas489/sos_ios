import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useUserData } from '../../hook/useUserData';
import { useChatContacts } from '../../hook/useChatContacts';
import { useIncommingRequests } from '../../hook/useIncommingRequests';
import { useTrustedContactActions } from '../../context/TrustedProviderContext';
import { getProfileImage } from '../../config/utility';
import useToast from '../../hook/useToast';
import IncomingSOSList from '../../components/sosAlertModal/IncomingSOSList';
import ContactRowItem from '../../components/contactRowItem';
import { navigationRef } from '../../utils/navigationService';

// ─── helpers ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'sos',      label: 'SOS Alerts',  icon: 'shield-alert',        color: '#FF3B5C' },
  { key: 'contacts', label: 'Contacts',    icon: 'account-multiple',    color: '#4A9EFF' },
  { key: 'requests', label: 'Requests',    icon: 'account-clock',       color: '#FACC15' },
];

const AVATAR_COLORS = ['#4A9EFF', '#4ADE80', '#FACC15', '#F87171', '#818CF8', '#FB923C'];
const getAvatarColor = id =>
  AVATAR_COLORS[Number(id ?? 0) % AVATAR_COLORS.length];

const formatTime = iso => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

// ─── Avatar ──────────────────────────────────────────────────────────────────
const Avatar = ({ user, size = 44 }) => {
  const initial = (user?.name ?? user?.nickname ?? '?')[0].toUpperCase();
  const color   = getAvatarColor(user?.id);
  if (user?.profile_photo) {
    return (
      <Image
        source={{ uri: getProfileImage(user.profile_photo) }}
        style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderColor: color + '66' }}
      />
    );
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color + '22', borderWidth: 1.5, borderColor: color,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color, fontSize: size * 0.38, fontWeight: '700' }}>{initial}</Text>
    </View>
  );
};

// ─── Animated Tab Bar ────────────────────────────────────────────────────────
const TabBar = ({ active, onSelect }) => {
  const indAnim = useRef(new Animated.Value(0)).current;
  const activeIdx = TABS.findIndex(t => t.key === active);

  useEffect(() => {
    Animated.spring(indAnim, { toValue: activeIdx, useNativeDriver: false, speed: 20, bounciness: 4 }).start();
  }, [activeIdx]);

  const indLeft = indAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0%', '33.33%', '66.66%'],
  });

  return (
    <View style={s.tabBarWrap}>
      <View style={s.tabBar}>
        <Animated.View style={[s.tabIndicator, { left: indLeft, width: '33.33%' }]} />
        {TABS.map(tab => {
          const isActive = active === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={s.tabBtn} onPress={() => onSelect(tab.key)} activeOpacity={0.8}>
              <IconMC name={tab.icon} size={15} color={isActive ? tab.color : '#6B7C99'} />
              <Text style={[s.tabLabel, isActive && { color: tab.color }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ─── SOS Tab ─────────────────────────────────────────────────────────────────
const SosTab = () => (
  <IncomingSOSList navigationRef={navigationRef} onClose={() => {}} />
);

// ─── Contact helpers ──────────────────────────────────────────────────────────
const CONTACT_AVATAR_COLORS = ['#2F6BFF','#FF3B5C','#2ED573','#FFA726','#6A4CFF','#00BCD4','#8BC34A','#E91E63'];
const getContactAvatarColor = item => {
  const key = `${item?.id ?? ''}-${item?.nickname ?? ''}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CONTACT_AVATAR_COLORS[Math.abs(hash) % CONTACT_AVATAR_COLORS.length];
};

const CONTACT_ACTIONS = [
  { key: 'chat',   icon: 'chat',     color: '#2F6BFF' },
  { key: 'audio',  icon: 'mic',      color: '#2ED573' },
  { key: 'map',    icon: 'map',      color: '#FFA726' },
  { key: 'health', icon: 'favorite', color: '#FF3B5C' },
  { key: 'delete', icon: 'delete',   color: '#FF4757' },
];

// ─── Request row card ─────────────────────────────────────────────────────────
const RequestCard = ({ item, onAccept, onDecline }) => {
  const user  = item.user ?? item.trusted_user ?? {};
  const color = '#FACC15';
  return (
    <View style={[s.card, { borderColor: color + '30' }]}>
      <View style={s.cardRow}>
        <Avatar user={user} size={46} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.cardName} numberOfLines={1}>{user?.name ?? user?.nickname ?? 'Unknown'}</Text>
          <Text style={s.cardSub} numberOfLines={1}>{formatTime(item.created_at)}</Text>
        </View>
        <View style={[s.incomingBadge]}>
          <IconMC name="account-clock" size={11} color={color} />
          <Text style={[s.incomingBadgeText, { color }]}>Pending</Text>
        </View>
      </View>
      <View style={s.cardActions}>
        <TouchableOpacity style={[s.reqBtn, s.reqDecline]} onPress={() => onDecline(item)} activeOpacity={0.8}>
          <Icon name="close" size={15} color="#F87171" />
          <Text style={{ color: '#F87171', fontSize: 12, fontWeight: '700', marginLeft: 4 }}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.reqBtn, s.reqAccept]} onPress={() => onAccept(item)} activeOpacity={0.8}>
          <Icon name="check" size={15} color="#4ADE80" />
          <Text style={{ color: '#4ADE80', fontSize: 12, fontWeight: '700', marginLeft: 4 }}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Contacts Tab ─────────────────────────────────────────────────────────────
const ContactsTab = () => {
  const navigation = useNavigation();
  const { userData } = useUserData();
  const [refreshing, setRefreshing] = useState(false);
  const [loader, setLoader] = useState(false);
  const { showError, showSuccess } = useToast();
  const { contactList, fetchChatContacts } = useChatContacts();
  const { deleteTrustedContactRequest } = useTrustedContactActions();
  const fetchedRef = useRef(false);

  // Deduplicate: both sides of a contact pair share the same sorted roomId
  const dedupedList = useMemo(() => {
    const seen = new Set();
    return (contactList ?? []).filter(item => {
      const roomId = [item.user_id, item.trusted_user_id].sort().join(':');
      if (seen.has(roomId)) return false;
      seen.add(roomId);
      return true;
    });
  }, [contactList]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchChatContacts();
  }, [fetchChatContacts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChatContacts()?.finally(() => setRefreshing(false)) ?? setRefreshing(false);
  }, [fetchChatContacts]);

  const onActionPress = useCallback((action, item) => {
    // Determine the other person's user ID (works for both sides of the contact)
    const recipientId = item.user_id === userData?.id ? item.trusted_user_id : item.user_id;
    if (action === 'chat') {
      navigation.navigate('Main', { screen: 'MainTabs', params: { screen: 'Chat', params: { selectedReceipentId: recipientId } } });
      return;
    }
    if (action === 'audio') {
      navigation.navigate('Main', { screen: 'MainTabs', params: { screen: 'AudioStream', params: { selectedReceipentId: recipientId } } });
      return;
    }
    if (action === 'map') {
      navigation.navigate('Main', { screen: 'MainTabs', params: { screen: 'Map', params: { selectedMapRecipentId: recipientId } } });
      return;
    }
    if (action === 'health') {
      navigation.navigate('Main', { screen: 'MainTabs', params: { screen: 'Health', params: { selectedHealthRecipentId: recipientId } } });
      return;
    }
    if (action === 'delete') {
      Alert.alert('Delete Contact', 'Are you sure you want to delete this contact?', [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            setLoader(true);
            try {
              const res = await deleteTrustedContactRequest({ id: item.id });
              showSuccess('SUCCESS', res?.message ?? 'Contact deleted');
              fetchChatContacts();
            } catch (e) {
              showError('ERROR', e?.message ?? 'Failed to delete');
            } finally { setLoader(false); }
          },
        },
      ]);
    }
  }, [navigation, userData, deleteTrustedContactRequest, fetchChatContacts, showSuccess, showError]);

  return (
    <View style={{ flex: 1 }}>
      {loader && (
        <View style={s.loaderOverlay}>
          <ActivityIndicator size="large" color="#2F6BFF" />
        </View>
      )}
      <FlatList
        data={dedupedList}
        keyExtractor={item => item.id?.toString()}
        contentContainerStyle={{ padding: 16, gap: 4 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2F6BFF" colors={['#2F6BFF']} />}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <View style={[s.emptyIcon, { backgroundColor: 'rgba(74,158,255,0.1)', borderColor: 'rgba(74,158,255,0.3)' }]}>
              <IconMC name="account-multiple-outline" size={40} color="#4A9EFF" />
            </View>
            <Text style={s.emptyTitle}>No Contacts</Text>
            <Text style={s.emptySubtitle}>Your chat contacts will appear here once added.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isSender = item.user_id === userData?.id;
          const displayName = isSender
            ? (item.nickname ?? item.trusted_contact?.name ?? item.relationship ?? '?')
            : (item.inviter?.name ?? item.inviter?.phone_number ?? '?');
          const profileImage = isSender
            ? (item.trusted_contact?.profile_photo ? getProfileImage(item.trusted_contact.profile_photo) : null)
            : (item.inviter?.profile_photo ? getProfileImage(item.inviter.profile_photo) : null);
          const phoneNumber = isSender
            ? (item.trusted_contact?.phone_number ?? '')
            : (item.inviter?.phone_number ?? '');
          const normalizedItem = { ...item, displayName, profileImage, phoneNumber };
          return (
            <ContactRowItem
              item={normalizedItem}
              actions={CONTACT_ACTIONS}
              onActionPress={onActionPress}
              getAvatarColor={getContactAvatarColor}
            />
          );
        }}
      />
    </View>
  );
};

// ─── Requests Tab ─────────────────────────────────────────────────────────────
const RequestsTab = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [loader, setLoader] = useState(false);
  const { showError, showSuccess } = useToast();
  const { contactList: incoming, fetchIncommingRequests, setData: setIncoming } = useIncommingRequests();
  const { acceptTrustedContactRequest, deleteTrustedContactRequest } = useTrustedContactActions();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchIncommingRequests();
  }, [fetchIncommingRequests]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchIncommingRequests().finally(() => setRefreshing(false));
  }, [fetchIncommingRequests]);

  const onAccept = useCallback(item => {
    Alert.alert('Accept Request', 'Accept this trusted contact request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: async () => {
          setLoader(true);
          try {
            const res = await acceptTrustedContactRequest({ id: item.id });
            showSuccess('SUCCESS', res?.message ?? 'Request accepted');
            setIncoming(prev => prev.filter(r => r.id !== item.id));
          } catch (e) {
            showError('ERROR', e?.message ?? 'Failed to accept');
          } finally { setLoader(false); }
        },
      },
    ]);
  }, [acceptTrustedContactRequest, setIncoming, showSuccess, showError]);

  const onDecline = useCallback(item => {
    Alert.alert('Decline Request', 'Decline this trusted contact request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          setLoader(true);
          try {
            const res = await deleteTrustedContactRequest({ id: item.id });
            showSuccess('SUCCESS', res?.message ?? 'Request declined');
            setIncoming(prev => prev.filter(r => r.id !== item.id));
          } catch (e) {
            showError('ERROR', e?.message ?? 'Failed to decline');
          } finally { setLoader(false); }
        },
      },
    ]);
  }, [deleteTrustedContactRequest, setIncoming, showSuccess, showError]);

  return (
    <>
      {loader && (
        <View style={s.loaderOverlay}>
          <ActivityIndicator size="large" color="#FACC15" />
        </View>
      )}
      <FlatList
        data={incoming ?? []}
        keyExtractor={item => item.id?.toString()}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FACC15" colors={['#FACC15']} />}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <View style={[s.emptyIcon, { backgroundColor: 'rgba(250,204,21,0.1)', borderColor: 'rgba(250,204,21,0.3)' }]}>
              <IconMC name="account-clock-outline" size={40} color="#FACC15" />
            </View>
            <Text style={s.emptyTitle}>No Incoming Requests</Text>
            <Text style={s.emptySubtitle}>Contact requests from others will appear here for you to accept or decline.</Text>
          </View>
        }
        renderItem={({ item }) => <RequestCard item={item} onAccept={onAccept} onDecline={onDecline} />}
      />
    </>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const NonLicenseScreen = () => {
  const { userData } = useUserData();
  const [activeTab, setActiveTab] = useState('sos');

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={s.container}>
      {/* ── Header ── */}
      <View style={s.header}>
        {/* Accent line */}
        <View style={s.headerAccent} />

        <View style={s.headerContent}>
         

          <View style={s.greetRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.greetLabel}>{greeting()},</Text>
              <Text style={s.greetName} numberOfLines={1}>
                {userData?.name ?? userData?.phone_number ?? 'User'} 👋
              </Text>
            </View>
            <View style={s.licensePill}>
              <IconMC name="lock-outline" size={12} color="#FACC15" />
              <Text style={s.licensePillText}>NO LICENSE</Text>
            </View>
          </View>

         
           
        </View>
      </View>

      {/* ── Tab Bar ── */}
      <TabBar active={activeTab} onSelect={setActiveTab} />

      {/* ── Content ── */}
      <View style={{ flex: 1 }}>
        {activeTab === 'sos'      && <SosTab />}
        {activeTab === 'contacts' && <ContactsTab />}
        {activeTab === 'requests' && <RequestsTab />}
      </View>
    </View>
  );
};

export default NonLicenseScreen;

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020B1B',
  },

  // Header
  header: {
    backgroundColor: '#071022',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  headerAccent: {
    height: 3,
    backgroundColor: '#FF3B5C',
    width: '100%',
  },
  headerContent: {
    padding: 16,
    gap: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#FF3B5C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  appTagline: {
    color: '#6B7C99',
    fontSize: 9,
    letterSpacing: 1.5,
    marginTop: 1,
  },
  headerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  greetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greetLabel: {
    color: '#6B7C99',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  greetName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 1,
  },
  licensePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(250,204,21,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.4)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  licensePillText: {
    color: '#FACC15',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(74,158,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(74,158,255,0.25)',
    borderRadius: 10,
    padding: 10,
  },
  infoBannerText: {
    flex: 1,
    color: '#8AA2C6',
    fontSize: 11,
    lineHeight: 16,
  },

  // Tab bar
  tabBarWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#071022',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0E1A33',
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    height: 42,
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255,59,92,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,92,0.3)',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    zIndex: 1,
  },
  tabLabel: {
    color: '#6B7C99',
    fontSize: 11,
    fontWeight: '600',
  },

  // Cards
  card: {
    backgroundColor: '#071022',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  cardSub: {
    color: '#6B7C99',
    fontSize: 11,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 10,
  },
  cardActionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  cardActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActionLabel: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Request card
  incomingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(250,204,21,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.35)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  incomingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  reqBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  reqDecline: {
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderColor: 'rgba(248,113,113,0.25)',
  },
  reqAccept: {
    backgroundColor: 'rgba(74,222,128,0.08)',
    borderColor: 'rgba(74,222,128,0.25)',
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#6B7C99',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Loader overlay
  loaderOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(2,11,27,0.6)',
  },
});
