import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import MapView, {
  Marker,
  Circle,
  Polyline,
  UrlTile,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';

import styles from './styles';

// ⚠️ ADJUST THIS PATH: this must point at your EXISTING ChatScreen's style.jsx
// (the one with keys like bubbleLeft, bubbleRight, sosCard, dayLabel, etc.)
// ConversationList / ChatMessageItem read their bubble styles from this object,
// not from the file above — the two stylesheets serve different parts of the UI.
import chatBubbleStyles from '../chatScreen/style';

import ConversationList from '../../components/conversationList';
import ChatComposer from '../../components/chatComposer';
import ContactStressMonitor from '../../components/contactStressMonitor';

import { useUserData } from '../../hook/useUserData';
import { useChatContacts } from '../../hook/useChatContacts';
import { useChatPresence } from '../../context/ChatContext';
import { useContactLocations } from '../../hook/useContactLocations';
import { useSocket } from '../../context/SocketContext';
import { useListenerMediaSoup } from '../../context/ListenerMediaSoupContext';
import { useStress } from '../../context/StressContext';

import { chatSelectedTrustedContactActions } from '../../store/redux/chatSelectedTrustedContact.redux';
import { healthSelectedContactActions } from '../../store/redux/healthSelectedContact.redux';
import { getProfileImage } from '../../config/utility';
import {
  GOOGLE_MAPS_API_KEY,
  MAP_TILE_API_KEY,
  ORS_KEY,
  USE_GOOGLE_MAPS,
} from '../../../environment';

// ─── Optional RTCView (only needed to force the audio pipeline to play) ──────
let RTCView;
try {
  RTCView = require('react-native-webrtc').RTCView;
} catch (_) {
  RTCView = null;
}

// ─── Dark map style (Google provider only) ───────────────────────────────────
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5a7a9a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a1628' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#0f2847' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#040c18' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
];

// ─── Polyline decode (shared by Google + ORS, both use the same algorithm) ──
const decodePolyline = encoded => {
  const points = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
};

const formatDistance = meters => (meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`);
const formatDuration = seconds => {
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h} hr ${m} min`;
};
const haversineMeters = (a, b) => {
  const R = 6371000;
  const toRad = v => (v * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
};



// ─── Avatar fallback color (same hashing approach used elsewhere in the app) ─
const AVATAR_COLORS = ['#2F6BFF', '#FF3B5C', '#2ED573', '#FFA726', '#6A4CFF', '#00BCD4', '#8BC34A', '#E91E63'];
const getAvatarColor = id => {
  let hash = 0;
  const key = String(id ?? '');
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// ─── Audio status → icon / label / color ─────────────────────────────────────
const STATUS_META = {
  idle: { label: 'Not connected', sub: 'Tap connect to listen to their SOS audio', icon: 'headset-off', color: '#8A93A6' },
  connecting: { label: 'Connecting…', sub: 'Establishing secure audio link', icon: 'sync', color: '#7c6ff7' },
  listening: { label: 'Live audio connected', sub: 'You are listening to their stream', icon: 'graphic-eq', color: '#2ED573' },
  waiting: { label: 'Waiting for stream', sub: 'They haven\u2019t started an SOS stream yet', icon: 'hourglass-empty', color: '#f59e0b' },
  error: { label: 'Connection failed', sub: 'Tap connect to try again', icon: 'error-outline', color: '#ef4444' },
};

/**
 * ContactHubScreen
 * ──────────────────────────────────────────────────────────────────────────
 * Layout:
 *  – MAIN SCREEN: live SOS audio connect/disconnect bar + full turn-by-turn
 *    location map (route polyline, ETA/distance badge, travel mode, recenter,
 *    live badge) — this is the primary, always-visible content.
 *  – Floating vitals card (heart rate + stress) — tap to expand full vitals.
 *  – Floating "chat" card (small floating screen) — tap it to open the full
 *    chat (ConversationList + ChatComposer) in a Modal.
 *  – Audio streaming now auto-attempts to connect as soon as the contact and
 *    socket are ready, instead of requiring a manual tap on landing.
 *
 * Navigate here with:
 *   navigation.navigate('ContactHub', { contact })            // full object, instant render
 *   navigation.navigate('ContactHub', { selectedReceipentId }) // id only, looked up from contact list
 */
const ContactHubScreen = ({ route }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { userData } = useUserData();
  const usrId = userData?.id;

  const onlineUsers = useChatPresence();
  const { contactList, fetchChatContacts } = useChatContacts();
  const { contactLocations } = useContactLocations();
  const { isConnected } = useSocket();
  const { contactsLastHealthData } = useStress();
  const {
    status,
    remoteStream,
    joinRoom,
    leaveRoom,
    currentStreamingRoomIds,
  } = useListenerMediaSoup();

  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [vitalsExpanded, setVitalsExpanded] = useState(false);
  const [travelMode, setTravelMode] = useState('driving');
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isOffCenter, setIsOffCenter] = useState(false);

  const mainMapRef = useRef(null);
  const lastRouteRef = useRef('');
  const routeRequestRef = useRef(null);
  const leaveRoomRef = useRef(leaveRoom);
  const joinedRoomIdRef = useRef(null);
  // Tracks which contact we've already auto-attempted a connection for, so we
  // only auto-connect once per contact per visit — and never fight a manual
  // disconnect by silently reconnecting behind the user's back.
  const autoConnectAttemptedForRef = useRef(null);

  useEffect(() => {
    leaveRoomRef.current = leaveRoom;
  }, [leaveRoom]);

  // useEffect(() => {
  //   fetchChatContacts();
  // }, [fetchChatContacts]);

  const passedContact = route?.params?.contact ?? null;
  const targetReceipentId =
    route?.params?.selectedReceipentId ?? passedContact?.receipent_id ?? null;
  const normalizedTargetId =
    targetReceipentId != null ? String(targetReceipentId) : null;

  // ── Resolve the contact from the live contact list (keeps online/streaming
  //    status fresh even if a full object was passed in via route params) ──
  const contact = useMemo(() => {

    if (!contactList || contactList.length === 0 || !normalizedTargetId) {
      return passedContact;
    }
    for (const c of contactList) {
      const isMine = c.user_id === usrId;
      const receipent_id = isMine ? c.trusted_user_id : c.user_id;
      if (String(receipent_id) !== normalizedTargetId) continue;

      const roomId = [c.user_id, c.trusted_user_id].sort().join(':');
      const name = isMine
        ? c.nickname || c.trusted_contact?.name || c.relationship || '?'
        : c.inviter?.name || c.inviter?.phone_number || 'Unknown';
      const phone = isMine ? c.trusted_contact?.phone_number : c.inviter?.phone_number;
      const photo = isMine ? c.trusted_contact?.profile_photo : c.inviter?.profile_photo;

      return {
        id: c.id,
        name,
        initial: name?.charAt(0)?.toUpperCase() ?? '?',
        phone_number: phone,
        receipent_id,
        roomId,
        isOnline: onlineUsers[receipent_id] || false,
        profile_image: photo ? getProfileImage(photo) : null,
        isStreaming: currentStreamingRoomIds?.[`sos-live-${receipent_id}`] || false,
      };
    }
    return passedContact;
  }, [contactList, usrId, normalizedTargetId, onlineUsers, currentStreamingRoomIds, passedContact]);

  // ── Keep the shared "selected trusted contact" redux slice in sync, since
  //    ConversationList / ChatComposer / MessageInput read from it ──────────
  useEffect(() => {
    if (!contact) return;
    console.log('ContactHubScreen setting selected trusted contact in redux:', contact);
    dispatch(chatSelectedTrustedContactActions.setSelectedTrustedContact(contact));
    // Keep the Health screen's selected-contact slice in sync too, since
    // ContactStressMonitor reads from `state.healthSelectedContact`.
    dispatch(healthSelectedContactActions.setHealthSelectedContact({ isMe: false, item: contact }));
  }, [contact?.id, dispatch]);

  // ── Live vitals for this contact ──────────────────────────────────────────
  console.log('ContactHubScreen contact', contact);
  const vitalsData = contact ? contactsLastHealthData?.[contact.receipent_id] ?? null : null;
  console.log('ContactHubScreen vitalsData for contact', contact?.receipent_id, vitalsData);
  const stressLevel = vitalsData?.stress?.state?.level ?? 0;
  // ⚠️ Confirm this key — placeholder guess, adjust to match your actual payload shape.
  const heartRateBpm = vitalsData?.stress?.currentHR   ?? null;
  const stressMeta = vitalsData?.stress?.state;
  console.log('ContactHubScreen stressMeta for contact', stressLevel, stressMeta);
  const hasVitals = !!vitalsData;

  // ── Leave audio room + clear selection on unmount ─────────────────────────
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (joinedRoomIdRef.current) {
          leaveRoomRef.current?.();
          joinedRoomIdRef.current = null;
        }
        // ⚠️ Confirm `resetState` exists on these slices — guarded to avoid a crash if not.
        if (typeof chatSelectedTrustedContactActions.resetState === 'function') {
          dispatch(chatSelectedTrustedContactActions.resetState());
        }
        if (typeof healthSelectedContactActions.setHealthSelectedContact === 'function') {
          //dispatch(healthSelectedContactActions.setHealthSelectedContact({ isMe: false, item: null }));
        }
        if (routeRequestRef.current) routeRequestRef.current.abort();
      };
    }, [dispatch]),
  );

  const userLocation = useMemo(() => ({
    latitude: userData?.latitude ?? 0,
    longitude: userData?.longitude ?? 0,
  }), [userData?.latitude, userData?.longitude]);

  const contactLocation = contact
    ? contactLocations?.[contact.receipent_id] ?? null
    : null;

  // ── Route fetching — same Google Directions / OpenRouteService switch
  //    used by your Map Screen ────────────────────────────────────────────
  const fetchRoute = useCallback(async () => {
    if (!userLocation?.latitude || !userLocation?.longitude || (userLocation.latitude === 0 && userLocation.longitude === 0)) return;
    if (!contactLocation?.latitude || !contactLocation?.longitude) return;

    const distanceM = haversineMeters(userLocation, contactLocation);
    if (distanceM > 50000) {
      setRouteCoords([]);
      setRouteInfo(null);
      lastRouteRef.current = '';
      mainMapRef.current?.fitToCoordinates(
        [userLocation, contactLocation],
        { edgePadding: { top: 100, right: 60, bottom: 100, left: 60 }, animated: true },
      );
      return;
    }

    const routeKey = `${userLocation.latitude},${userLocation.longitude}-${contactLocation.latitude},${contactLocation.longitude}-${travelMode}`;
    if (lastRouteRef.current === routeKey) return;
    lastRouteRef.current = routeKey;

    try {
      if (routeRequestRef.current) routeRequestRef.current.abort();
      routeRequestRef.current = new AbortController();

      if (USE_GOOGLE_MAPS) {
        const origin = `${userLocation.latitude},${userLocation.longitude}`;
        const destination = `${contactLocation.latitude},${contactLocation.longitude}`;
        const res = await axios.get(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=${travelMode}&key=${GOOGLE_MAPS_API_KEY}`,
          { signal: routeRequestRef.current.signal },
        );
        const routeRes = res.data?.routes?.[0];
        if (!routeRes) return;
        const decoded = decodePolyline(routeRes.overview_polyline.points);
        setRouteCoords(decoded.filter((_, i) => i % 3 === 0));
        const leg = routeRes.legs?.[0];
        setRouteInfo({ distance: leg?.distance?.text ?? '', duration: leg?.duration?.text ?? '' });
      } else {
        const orsProfile = travelMode === 'walking' ? 'foot-walking' : 'driving-car';
        const res = await axios.post(
          `https://api.openrouteservice.org/v2/directions/${orsProfile}`,
          { coordinates: [[userLocation.longitude, userLocation.latitude], [contactLocation.longitude, contactLocation.latitude]] },
          { headers: { Authorization: ORS_KEY, 'Content-Type': 'application/json' }, signal: routeRequestRef.current.signal },
        );
        const routeRes = res.data?.routes?.[0];
        if (!routeRes) return;
        const decoded = decodePolyline(routeRes.geometry);
        setRouteCoords(decoded.filter((_, i) => i % 3 === 0));
        const summary = routeRes.summary;
        setRouteInfo({ distance: formatDistance(summary.distance), duration: formatDuration(summary.duration) });
      }

      mainMapRef.current?.fitToCoordinates(
        [userLocation, contactLocation],
        { edgePadding: { top: 100, right: 50, bottom: 100, left: 50 }, animated: true },
      );
    } catch (err) {
      if (err?.name !== 'CanceledError' && err?.name !== 'AbortError') {
        console.warn(`ContactHub fetchRoute [${USE_GOOGLE_MAPS ? 'Google' : 'ORS'}] error:`, err?.response?.data ?? err?.message);
      }
    }
  }, [userLocation, contactLocation, travelMode]);

  // Map is always visible on the main screen, so fetch/refresh the route as
  // soon as we have a contact location instead of waiting on a modal open.
  useEffect(() => {
    if (contactLocation) fetchRoute();
  }, [contactLocation, fetchRoute]);

  const handleRegionChangeComplete = newRegion => {
    if (!userData?.latitude || !userData?.longitude) return;
    const latDiff = Math.abs(newRegion.latitude - userLocation.latitude);
    const lngDiff = Math.abs(newRegion.longitude - userLocation.longitude);
    setIsOffCenter(latDiff > 0.002 || lngDiff > 0.002);
  };

  const centerOnUser = () => {
    setIsOffCenter(false);
    const hasContactCoords = Number.isFinite(contactLocation?.latitude) && Number.isFinite(contactLocation?.longitude);

    if (hasContactCoords) {
      mainMapRef.current?.fitToCoordinates(
        [userLocation, contactLocation],
        { edgePadding: { top: 100, right: 50, bottom: 100, left: 50 }, animated: true },
      );
      return;
    }

    mainMapRef.current?.animateToRegion(
      { ...userLocation, latitudeDelta: 0.012, longitudeDelta: 0.012 },
      600,
    );
  };

  // ── Pulse animation while actively listening ──────────────────────────────
  const pulseAnim = useRef(Animated?.Value ? new Animated.Value(1) : null).current;
  useEffect(() => {
    if (!pulseAnim) return;
    if (status === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation(() => pulseAnim.setValue(1));
    }
  }, [status]);

  const spinAnim = useRef(Animated?.Value ? new Animated.Value(0) : null).current;
  useEffect(() => {
    if (!spinAnim) return;
    if (status === 'connecting') {
      spinAnim.setValue(0);
      Animated.loop(Animated.timing(spinAnim, { toValue: 1, duration: 1200, useNativeDriver: true })).start();
    } else {
      spinAnim.stopAnimation(() => spinAnim.setValue(0));
    }
  }, [status]);
  const spinRotate = spinAnim?.interpolate
    ? spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
    : '0deg';

  const handleConnect = useCallback(() => {
    if (!contact || !isConnected) return;
    joinedRoomIdRef.current = `sos-live-${contact.receipent_id}`;
    joinRoom(joinedRoomIdRef.current);
  }, [contact, isConnected, joinRoom]);

  const handleDisconnect = useCallback(() => {
    leaveRoom();
    joinedRoomIdRef.current = null;
  }, [leaveRoom]);

  // ── Auto-connect on landing ────────────────────────────────────────────
  // As soon as we have a contact resolved and the socket is up, kick off the
  // SOS audio connection automatically instead of waiting for a manual tap.
  // Guarded so it only fires once per contact per visit, and won't override
  // a manual disconnect (status won't be 'idle' again unless the user backs
  // out and re-enters, or explicitly disconnects and we intentionally leave
  // it alone since autoConnectAttemptedForRef is already set for this contact).
  useEffect(() => {
    if (!contact || !isConnected) return;
    if (status !== 'idle') return;
    if (autoConnectAttemptedForRef.current === contact.receipent_id) return;

    autoConnectAttemptedForRef.current = contact.receipent_id;
    handleConnect();
  }, [contact, isConnected, status, handleConnect]);

  const meta = STATUS_META[status] ?? STATUS_META.idle;

  if (!contact) {
    return (
      <View style={styles.emptyWrap}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0E1A" />
        <Icon name="person-off" size={40} color="#3D4E6A" />
        <Text style={styles.emptyText}>Contact not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E1A" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="arrow-back-ios-new" size={16} color="#E8EDF5" />
        </TouchableOpacity>

        <View style={styles.headerAvatarWrap}>
          {contact.profile_image ? (
            <Image source={{ uri: contact.profile_image }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatarFallback, { backgroundColor: getAvatarColor(contact.id) }]}>
              <Text style={styles.headerAvatarInitial}>{contact.initial}</Text>
            </View>
          )}
          <View style={[styles.onlineDot, { backgroundColor: contact.isOnline ? '#2ED573' : '#3D4E6A' }]} />
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{contact.name}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {contact.isOnline ? 'Online' : 'Offline'}
            {contact.isStreaming ? ' • Streaming SOS' : ''}
          </Text>
        </View>
      </View>

      {/* ── Audio status bar — professional Connect / Disconnect control ── */}
      <View style={styles.audioBar}>
        <View style={[styles.audioIconWrap, { backgroundColor: `${meta.color}1F` }]}>
          {status === 'connecting' ? (
            <Animated.View style={{ transform: [{ rotate: spinRotate }] }}>
              <Icon name="sync" size={18} color={meta.color} />
            </Animated.View>
          ) : (
            <Animated.View style={{ transform: [{ scale: status === 'listening' ? pulseAnim : 1 }] }}>
              <Icon name={meta.icon} size={18} color={meta.color} />
            </Animated.View>
          )}
        </View>

        <View style={styles.audioInfo}>
          <Text style={styles.audioLabel}>{meta.label}</Text>
          <Text style={styles.audioSubLabel} numberOfLines={1}>{meta.sub}</Text>
        </View>

        {status === 'idle' || status === 'error' ? (
          <TouchableOpacity
            style={[styles.audioActionBtn, styles.audioActionBtnConnect]}
            onPress={handleConnect}
            disabled={!isConnected}
            activeOpacity={0.85}
          >
            <Icon name="headset" size={14} color="#06331F" />
            <Text style={[styles.audioActionText, { color: '#06331F' }]}>CONNECT</Text>
          </TouchableOpacity>
        ) : status === 'connecting' ? (
          <View style={[styles.audioActionBtn, styles.audioActionBtnConnecting]}>
            <Text style={[styles.audioActionText, { color: '#7c6ff7' }]}>CONNECTING</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.audioActionBtn, styles.audioActionBtnDisconnect]}
            onPress={handleDisconnect}
            activeOpacity={0.85}
          >
            <Icon name="stop-circle" size={14} color="#FF3B5C" />
            <Text style={[styles.audioActionText, { color: '#FF3B5C' }]}>DISCONNECT</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Hidden RTCView — needed purely to keep the audio track flowing */}
      {RTCView && remoteStream && (
        <RTCView streamURL={remoteStream.toURL()} style={styles.hiddenRtc} objectFit="cover" />
      )}

      {/* ── MAIN SCREEN CONTENT: full live-location map with directions ──
          This used to be the small floating map that expanded into a modal;
          it's now the primary content area, always visible. ── */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mainMapRef}
          style={styles.mainMap}
          provider={USE_GOOGLE_MAPS ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
          customMapStyle={USE_GOOGLE_MAPS ? darkMapStyle : undefined}
          initialRegion={{
            latitude: contactLocation?.latitude ?? userLocation.latitude,
            longitude: contactLocation?.longitude ?? userLocation.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          onRegionChangeComplete={handleRegionChangeComplete}
        >
          {!USE_GOOGLE_MAPS && (
            <UrlTile
              urlTemplate={`https://api.maptiler.com/maps/night/{z}/{x}/{y}.png?key=${MAP_TILE_API_KEY}`}
              maximumZ={20}
              tileSize={256}
              shouldReplaceMapContent
            />
          )}

          {/* User location */}
          <Circle center={userLocation} radius={150} fillColor="rgba(77,163,255,0.12)" strokeColor="rgba(77,163,255,0.25)" strokeWidth={1.5} />
          <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <View style={styles.userPulseOuter}>
              <View style={styles.userDotOuter} />
            </View>
          </Marker>

          {/* Route polyline — layered for a crisp, professional look */}
          {routeCoords.length > 0 && (
            <>
              <Polyline coordinates={routeCoords} strokeColor="rgba(0,0,0,0.25)" strokeWidth={6} lineCap="round" lineJoin="round" />
              <Polyline coordinates={routeCoords} strokeColor="#4DA3FF" strokeWidth={4} lineCap="round" lineJoin="round" />
              <Polyline coordinates={routeCoords} strokeColor="rgba(130,200,255,0.45)" strokeWidth={2} lineDashPattern={[6, 10]} lineCap="round" />
            </>
          )}

          {/* Contact marker */}
          {contactLocation && (
            <>
              <Circle center={contactLocation} radius={25} fillColor="rgba(255,59,92,0.2)" strokeColor="#FF3B5C" strokeWidth={2} />
              <Marker coordinate={contactLocation} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
                <View style={styles.expandedMarkerWrapper}>
                  <View style={styles.expandedMarkerPin}>
                    <Text style={styles.expandedMarkerText}>{contact.initial}</Text>
                  </View>
                  <View style={styles.expandedMarkerArrow} />
                </View>
              </Marker>
            </>
          )}
        </MapView>

        {routeInfo && (
          <View style={styles.routeInfoBadge}>
            <Icon name={travelMode === 'walking' ? 'directions-walk' : 'directions-car'} size={15} color="#4DA3FF" />
            <Text style={styles.routeInfoText}>{routeInfo.duration}</Text>
            <View style={styles.routeInfoDivider} />
            <Icon name="straighten" size={14} color="#7A8499" />
            <Text style={styles.routeInfoSub}>{routeInfo.distance}</Text>
          </View>
        )}

        {!contactLocation && (
          <View style={styles.mapWaitingBadge}>
            <Icon name="location-searching" size={14} color="#7A8499" />
            <Text style={styles.mapWaitingText}>Waiting for their location…</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.travelModeBtn, travelMode === 'walking' && styles.travelModeBtnActive]}
          onPress={() => setTravelMode(prev => (prev === 'driving' ? 'walking' : 'driving'))}
          activeOpacity={0.8}
        >
          <Icon
            name={travelMode === 'walking' ? 'directions-walk' : 'directions-car'}
            size={20}
            color={travelMode === 'walking' ? '#ffffff' : '#4DA3FF'}
          />
        </TouchableOpacity>

        {isOffCenter && (
          <TouchableOpacity style={styles.recenterBtn} onPress={centerOnUser} activeOpacity={0.8}>
            <Icon name="my-location" size={20} color="#4DA3FF" />
          </TouchableOpacity>
        )}

        <View style={styles.mapStatusOverlay}>
          <Text style={styles.mapStatusName} numberOfLines={1}>{contact.name}'s location</Text>
          <Text style={styles.mapStatusSub}>
            {contact.isOnline ? 'Live • updated moments ago' : 'Last known location'}
          </Text>
        </View>
      </View>

      {/* ── Floating vitals card: heart rate + stress level ── */}
      {hasVitals && (
        <TouchableOpacity
          style={styles.vitalsCard}
          activeOpacity={0.9}
          onPress={() => setVitalsExpanded(true)}
        >
          <View style={styles.vitalsTopRow}>
            <Icon name="favorite" size={13} color="#FF3B5C" />
            <Text style={styles.vitalsLabel}>Heart rate</Text>
            <Icon name="open-in-full" size={11} color="#5a6478" style={styles.vitalsExpandIcon} />
          </View>

          <View style={styles.vitalsBpmRow}>
            <Text style={styles.vitalsBpmValue}>{heartRateBpm ?? '--'}</Text>
            <Text style={styles.vitalsBpmUnit}>bpm</Text>
          </View>

          <View style={[styles.vitalsStressPill]}>
            <View style={[styles.vitalsStressDot]}><Text>{stressMeta?.emoji}</Text></View>
            <Text style={[styles.vitalsStressText, { color: stressMeta?.color }]}>{stressMeta?.label} stress</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* ── Floating "chat" card (small floating screen) — tap to open the
          full chat in a Modal. This takes over the slot/style the mini-map
          used to occupy. ── */}
      <TouchableOpacity
        style={styles.miniChatCard}
        activeOpacity={0.9}
        onPress={() => setChatModalVisible(true)}
      >
        <View style={styles.miniChatAvatarWrap}>
          {contact.profile_image ? (
            <Image source={{ uri: contact.profile_image }} style={styles.miniChatAvatar} />
          ) : (
            <View style={[styles.miniChatAvatarFallback, { backgroundColor: getAvatarColor(contact.id) }]}>
              <Text style={styles.miniChatAvatarInitial}>{contact.initial}</Text>
            </View>
          )}
          <View style={styles.miniChatIconBadge}>
            <Icon name="chat-bubble" size={11} color="#fff" />
          </View>
          {contact.isOnline && <View style={styles.miniChatLiveDot} />}
        </View>

        <Text style={styles.miniChatLabel} numberOfLines={1}>{contact.name}</Text>
        <Text style={styles.miniChatSubLabel} numberOfLines={1}>Tap to open chat</Text>

        <View style={styles.miniChatOverlay}>
          <Icon name="open-in-full" size={11} color="#fff" />
        </View>
      </TouchableOpacity>

      {/* ── Chat Modal — full ConversationList + ChatComposer ── */}
      <Modal
        visible={chatModalVisible}
        animationType="slide"
        onRequestClose={() => setChatModalVisible(false)}
      >
        <View style={styles.chatModalRoot}>
          <StatusBar barStyle="light-content" backgroundColor="#0A0E1A" />

          <View style={styles.chatModalHeader}>
            <TouchableOpacity
              onPress={() => setChatModalVisible(false)}
              style={styles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close" size={18} color="#E8EDF5" />
            </TouchableOpacity>

            <View style={styles.chatModalHeaderInfo}>
              {contact.profile_image ? (
                <Image source={{ uri: contact.profile_image }} style={styles.chatModalAvatar} />
              ) : (
                <View style={[styles.chatModalAvatarFallback, { backgroundColor: getAvatarColor(contact.id) }]}>
                  <Text style={styles.chatModalAvatarInitial}>{contact.initial}</Text>
                </View>
              )}
              <View>
                <Text style={styles.chatModalTitle} numberOfLines={1}>{contact.name}</Text>
                <Text style={styles.chatModalSubtitle} numberOfLines={1}>
                  {contact.isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.chatModalBody}>
            <ConversationList styles={chatBubbleStyles} />
          </View>

          <ChatComposer />
        </View>
      </Modal>

      {/* ── Expanded vitals — reuses your existing ContactStressMonitor as-is ── */}
      <Modal
        visible={vitalsExpanded}
        animationType="slide"
        onRequestClose={() => setVitalsExpanded(false)}
      >
        <View style={styles.healthModalRoot}>
          <StatusBar barStyle="light-content" backgroundColor="#07090F" />

          <View style={styles.healthModalHeader}>
            <TouchableOpacity
              onPress={() => setVitalsExpanded(false)}
              style={styles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close" size={18} color="#E8EDF5" />
            </TouchableOpacity>
            <Text style={styles.healthModalTitle}>{contact.name}'s vitals</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ContactStressMonitor />
        </View>
      </Modal>
    </View>
  );
};

export default ContactHubScreen;