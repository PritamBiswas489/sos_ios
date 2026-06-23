import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, Switch } from 'react-native';
import styles from './style';
import MapView, { Marker, Circle, Polyline, UrlTile, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MapAvatarList from '../../components/mapAvatarList';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useUserData } from '../../hook/useUserData';
import { useSelector, useDispatch } from 'react-redux';
import { useContactLocations } from '../../hook/useContactLocations';
import { useChatPresence } from '../../context/ChatContext';
import { useChatContacts } from '../../hook/useChatContacts';
import { mapSelectedContactActions } from '../../store/redux/mapSelectedContact.redux';
import { getProfileImage } from '../../config/utility';
import axios from 'axios';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { useLocation } from '../../context/LocationContext';
import { GOOGLE_MAPS_API_KEY } from '../../../environment';
import { MAP_TILE_API_KEY, ORS_KEY, USE_GOOGLE_MAPS } from '../../../environment';

// ─── OpenRouteService free API key ────────────────────────────────────────────
// Get yours free at: https://openrouteservice.org/dev/#/signup


// ─── OSM Tile URL (completely free, no key needed) ────────────────────────────


// ─── Dark map style (only applied when Google Maps is enabled) ────────────────
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5a7a9a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a1628' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#0d1f38' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#0f2847' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0a1e34' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#3a5a7a' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1a3a60' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#0f2545' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#4a7aaa' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#0c2240' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#040c18' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#1a3a5a' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#060f0a' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#1a3a28' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry.fill', stylers: [{ color: '#0c1e38' }] },
];

// ─── Decode encoded polyline (works for both Google & ORS) ───────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDistance = meters => meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
const haversineMeters = (a, b) => {
  const R = 6371000;
  const toRad = v => (v * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
};
const formatDuration = seconds => {
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h} hr ${m} min`;
};

// ─────────────────────────────────────────────────────────────────────────────
const MapScreen = ({ route }) => {
  const mapRef = useRef(null);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { userData } = useUserData();
  const { updateCurrentLocation, updateMyGprsLocation } = useLocation();
  const selectedMapRecipentId = route?.params?.selectedMapRecipentId;
  const [normalizedSelectedMapRecipentId, setNormalizedSelectedMapRecipentId] = useState(null);
  const hasAutoSelectedFromParamRef = useRef(false);
  const onlineUsers = useChatPresence();
  const usrId = userData?.id;
  const { contactList: chatContactList, fetchChatContacts } = useChatContacts();

  // ╔══════════════════════════════════════════════════════════╗
  // ║          GOOGLE MAP TOGGLE — main switch                ║
  // ║  true  → PROVIDER_GOOGLE + Google Directions + Places   ║
  // ║  false → PROVIDER_DEFAULT + OSM tiles + ORS directions  ║
  // ╚══════════════════════════════════════════════════════════╝

  const [useGoogleMap, setUseGoogleMap] = useState(USE_GOOGLE_MAPS);

  // ─── Nominatim search state (used only when useGoogleMap = false) ─────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchDebounceRef = useRef(null);
  const searchAbortRef = useRef(null);
  const lastRouteRef = useRef('');
  const routeRequestRef = useRef(null);

  // Clear route + search whenever provider is switched
  useEffect(() => {
    lastRouteRef.current = '';
    setRouteCoords([]);
    setRouteInfo(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  }, [useGoogleMap]);

  useEffect(() => {
    hasAutoSelectedFromParamRef.current = false;
    setNormalizedSelectedMapRecipentId(
      selectedMapRecipentId == null ? null : String(selectedMapRecipentId),
    );
  }, [selectedMapRecipentId]);

  const mappedMapContacts = useMemo(() => {
    const list = chatContactList;
    if (!list || list.length === 0) return [];
    const trustedContacts = [];
    const otherContacts = [];
    for (const contact of list) {
      const roomid = [contact.user_id, contact.trusted_user_id].sort().join(':');
      if (contact.user_id === usrId) {
        const displayName = contact.nickname || contact.trusted_contact.name || contact.relationship || '?';
        trustedContacts.push({
          id: contact.id,
          name: displayName,
          initial: displayName?.charAt(0).toUpperCase(),
          isOnline: onlineUsers[contact.trusted_user_id] || false,
          receipent_id: contact.trusted_user_id,
          phone_number: contact.trusted_contact.phone_number,
          roomId: roomid,
          profile_image: contact?.trusted_contact?.profile_photo ? getProfileImage(contact.trusted_contact.profile_photo) : null,
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
          profile_image: contact?.inviter?.profile_photo ? getProfileImage(contact.inviter.profile_photo) : null,
        });
      }
    }
    const filteredOtherContacts = otherContacts.filter(oc => !trustedContacts.some(tc => tc.roomId === oc.roomId));
    return [...trustedContacts, ...filteredOtherContacts].sort((a, b) => {
      if (a.isOnline === b.isOnline) return 0;
      return a.isOnline ? -1 : 1;
    });
  }, [chatContactList, usrId, onlineUsers]);

  useEffect(() => {
    if (mappedMapContacts.length === 0) return;
    if (normalizedSelectedMapRecipentId && !hasAutoSelectedFromParamRef.current) {
      hasAutoSelectedFromParamRef.current = true;
      const contactToSelect = mappedMapContacts.find(c => String(c.receipent_id) === normalizedSelectedMapRecipentId);
      dispatch(mapSelectedContactActions.setMapSelectedContact(contactToSelect ?? mappedMapContacts[0]));
      return;
    }
    const stillExists = mapSelectedContact?.id ? mappedMapContacts.some(c => c.id === mapSelectedContact.id) : false;
    if (!stillExists) {
      dispatch(mapSelectedContactActions.setMapSelectedContact(mappedMapContacts[0]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappedMapContacts, normalizedSelectedMapRecipentId, dispatch]);

  const [CONTACT_MARKER, setContactMarkers] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [travelMode, setTravelMode] = useState('driving');
  const [menuOpen, setMenuOpen] = useState(false);

  const userLocation = useMemo(() => ({
    latitude: userData?.latitude ?? 0,
    longitude: userData?.longitude ?? 0,
  }), [userData?.latitude, userData?.longitude]);

  const { contactLocations } = useContactLocations();
  const mapSelectedContact = useSelector(state => state.mapSelectedContact);

  const selectedContactLocation = useMemo(() => {
    if (!contactLocations || !mapSelectedContact?.receipent_id) return null;
    return contactLocations[mapSelectedContact.receipent_id] ?? null;
  }, [contactLocations, mapSelectedContact?.receipent_id]);

  // Release route + search memory when screen loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        lastRouteRef.current = '';
        setRouteCoords([]);
        setRouteInfo(null);
        setSearchResults([]);
        setShowResults(false);
        if (routeRequestRef.current) routeRequestRef.current.abort();
      };
    }, []),
  );

  useEffect(() => {
    if (selectedContactLocation) {
      setContactMarkers({
        coordinate: { latitude: selectedContactLocation.latitude, longitude: selectedContactLocation.longitude },
        color: '#FF3B5C',
      });
    } else {
      setContactMarkers(null);
      setRouteCoords([]);
      setRouteInfo(null);
    }
  }, [selectedContactLocation]);

  // ╔══════════════════════════════════════════════════════════╗
  // ║     ROUTE FETCHING — switches API based on toggle       ║
  // ╚══════════════════════════════════════════════════════════╝
  const fetchRoute = useCallback(async () => {
    console.log('Fetching route with Google Directions API...');
    if (!userLocation?.latitude || !userLocation?.longitude || (userLocation.latitude === 0 && userLocation.longitude === 0)) return;
    if (!selectedContactLocation?.latitude || !selectedContactLocation?.longitude ) return;

    // Skip if contact is more than 200 km away
    const distanceM = haversineMeters(
      { latitude: userLocation.latitude, longitude: userLocation.longitude },
      { latitude: selectedContactLocation.latitude, longitude: selectedContactLocation.longitude },
    );
    if (distanceM > 200000) {
      setRouteCoords([]);
      setRouteInfo(null);
      lastRouteRef.current = '';
      mapRef.current?.fitToCoordinates(
        [
          userLocation,
          {
            latitude: selectedContactLocation.latitude,
            longitude: selectedContactLocation.longitude,
          },
        ],
        { edgePadding: { top: 120, right: 80, bottom: 220, left: 80 }, animated: true },
      );
      return;
    }
    const routeKey =
      `${userLocation.latitude},${userLocation.longitude}-` +
      `${selectedContactLocation.latitude},${selectedContactLocation.longitude}-` +
      `${travelMode}`;
    if (lastRouteRef.current === routeKey) return;
    lastRouteRef.current = routeKey;

    try {
      if (routeRequestRef.current) routeRequestRef.current.abort();
      routeRequestRef.current = new AbortController();

      if (useGoogleMap) {
        // ── Google Directions API ──────────────────────────────────────────
        const origin = `${userLocation.latitude},${userLocation.longitude}`;
        const destination = `${selectedContactLocation.latitude},${selectedContactLocation.longitude}`;
        const res = await axios.get(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=${travelMode}&key=${GOOGLE_MAPS_API_KEY}`,
          { signal: routeRequestRef.current.signal },
        );
        const route = res.data?.routes?.[0];
        if (!route) return;
        const decoded = decodePolyline(route.overview_polyline.points);
        // Keep every 3rd point — reduces memory 60-70% with negligible visual loss
        const filterRate = distanceM > 50000 ? 10 : 3; 
        const points = decoded.filter((_, i) => i % filterRate === 0);
        const leg = route.legs?.[0];
        setRouteCoords(points);
        setRouteInfo({
          distance: leg?.distance?.text ?? '',
          duration: leg?.duration?.text ?? '',
        });
      } else {
        // ── OpenRouteService API ───────────────────────────────────────────
        const orsProfile = travelMode === 'walking' ? 'foot-walking' : 'driving-car';
        const res = await axios.post(
          `https://api.openrouteservice.org/v2/directions/${orsProfile}`,
          {
            coordinates: [
              [userLocation.longitude, userLocation.latitude],
              [selectedContactLocation.longitude, selectedContactLocation.latitude],
            ],
          },
          {
            headers: {
              Authorization: ORS_KEY,
              'Content-Type': 'application/json',
            },
            signal: routeRequestRef.current.signal,
          },
        );
        const route = res.data?.routes?.[0];
        if (!route) return;
        const decoded = decodePolyline(route.geometry);
        const points = decoded.filter((_, i) => i % 3 === 0);
        const summary = route.summary;
        setRouteCoords(points);
        setRouteInfo({
          distance: formatDistance(summary.distance),
          duration: formatDuration(summary.duration),
        });
      }

      mapRef.current?.fitToCoordinates(
        [userLocation, { latitude: selectedContactLocation.latitude, longitude: selectedContactLocation.longitude }],
        { edgePadding: { top: 120, right: 60, bottom: 220, left: 60 }, animated: true },
      );
    } catch (err) {
      if (err?.name !== 'CanceledError' && err?.name !== 'AbortError') {
        console.warn(`fetchRoute [${useGoogleMap ? 'Google' : 'ORS'}] error:`, err?.response?.data ?? err?.message);
      }
    }
  }, [userLocation, selectedContactLocation, travelMode, useGoogleMap]);

  useEffect(() => {
    if (selectedContactLocation) fetchRoute();
  }, [fetchRoute]);

  useFocusEffect(
    useCallback(() => {
      if (selectedContactLocation) fetchRoute();
    }, [fetchRoute, selectedContactLocation]),
  );

  // Cancel any in-flight route request on unmount
  useEffect(() => {
    return () => { if (routeRequestRef.current) routeRequestRef.current.abort(); };
  }, []);

  // ─── Map pan / zoom helpers ───────────────────────────────────────────────
  const [isOffCenter, setIsOffCenter] = useState(false);
  const currentRegionRef = useRef({
    latitude: userData?.latitude ?? 0,
    longitude: userData?.longitude ?? 0,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  });

  const centerOnUser = () => {
    setIsOffCenter(false);
    mapRef.current?.animateToRegion({ ...userLocation, latitudeDelta: 0.012, longitudeDelta: 0.012 }, 600);
  };

  const handleZoomIn = () => {
    const r = currentRegionRef.current;
    mapRef.current?.animateToRegion({ ...r, latitudeDelta: r.latitudeDelta / 2, longitudeDelta: r.longitudeDelta / 2 }, 300);
  };

  const handleZoomOut = () => {
    const r = currentRegionRef.current;
    mapRef.current?.animateToRegion({ ...r, latitudeDelta: r.latitudeDelta * 2, longitudeDelta: r.longitudeDelta * 2 }, 300);
  };

  const handleRegionChangeComplete = newRegion => {
    currentRegionRef.current = newRegion;
    if (!userData?.latitude || !userData?.longitude) return;
    const latDiff = Math.abs(newRegion.latitude - userLocation.latitude);
    const lngDiff = Math.abs(newRegion.longitude - userLocation.longitude);
    setIsOffCenter(latDiff > 0.002 || lngDiff > 0.002);
  };

  // ─── Google Places handler ────────────────────────────────────────────────
  const handleGooglePlaceSelect = (data, details) => {
    if (!details?.geometry?.location) return;
    const { lat, lng } = details.geometry.location;
    updateCurrentLocation({ latitude: lat, longitude: lng });
  };

  // ─── Nominatim search handlers ────────────────────────────────────────────
  const handleSearchChange = text => {
    setSearchQuery(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (text.length < 2) { setSearchResults([]); setShowResults(false); return; }

    searchDebounceRef.current = setTimeout(async () => {
      try {
        if (searchAbortRef.current) searchAbortRef.current.abort();
        searchAbortRef.current = new AbortController();
        const res = await axios.get(
          `https://api.maptiler.com/geocoding/${encodeURIComponent(text)}.json?key=${MAP_TILE_API_KEY}`,
          { signal: searchAbortRef.current.signal },
        );
        const features = res.data?.features ?? [];
        setSearchResults(features);
        setShowResults(true);
      } catch (err) {
        if (err?.name !== 'CanceledError' && err?.name !== 'AbortError') {
          console.warn('Maptiler geocoding error:', err?.message);
        }
      }
    }, 350);
  };
  const handleNominatimPlaceSelect = place => {
    // Maptiler returns [longitude, latitude] in coordinates
    const lng = place.geometry.coordinates[0];
    const lat = place.geometry.coordinates[1];

    updateCurrentLocation({ latitude: lat, longitude: lng });
    // mapRef.current?.animateToRegion(
    //   { latitude: lat, longitude: lng, latitudeDelta: 0.012, longitudeDelta: 0.012 },
    //   600,
    // );
    setSearchQuery(place.place_name);  // ← place_name not display_name
    setShowResults(false);
    setSearchResults([]);
  };
  const chooseCurrentLocation = () => {
    updateMyGprsLocation();
    setSearchQuery('');
    setShowResults(false);
  };

  const [region] = useState({
    latitude: userData?.latitude ?? 0,
    longitude: userData?.longitude ?? 0,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  });

  const navigateToChatRoom = () => {
    if (!mapSelectedContact) return;
    navigation.navigate('Main', {
      screen: 'MainTabs',
      params: { screen: 'Chat', params: { selectedReceipentId: mapSelectedContact?.receipent_id } },
    });
  };

  const navigateAudioRoom = () => {
    if (!mapSelectedContact) return;
    navigation.navigate('Main', {
      screen: 'MainTabs',
      params: { screen: 'AudioStream', params: { selectedReceipentId: mapSelectedContact.receipent_id } },
    });
  };

  const navigateHealthRoom = () => {
    if (!mapSelectedContact) return;
    navigation.navigate('Main', {
      screen: 'MainTabs',
      params: { screen: 'Health', params: { selectedHealthRecipentId: mapSelectedContact.receipent_id } },
    });
  };





  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <>
        {/* ══════════════════════════════════════════════════════
            MAP
            useGoogleMap ON  → PROVIDER_GOOGLE, darkMapStyle
            useGoogleMap OFF → PROVIDER_DEFAULT, OSM UrlTile
            ══════════════════════════════════════════════════════ */}
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={useGoogleMap ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
          mapType={useGoogleMap ? 'standard' : 'none'}
          customMapStyle={useGoogleMap ? darkMapStyle : undefined}
          initialRegion={region}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          toolbarEnabled={false}
          cacheEnabled={true}
          moveOnMarkerPress={false}
          onRegionChangeComplete={handleRegionChangeComplete}
        >
          {/* OSM tile layer — only when Google is OFF */}
          {!useGoogleMap && (
            <UrlTile
              urlTemplate={`https://api.maptiler.com/maps/night/{z}/{x}/{y}.png?key=${MAP_TILE_API_KEY}`}
              maximumZ={20}
              tileSize={256}
              shouldReplaceMapContent={true}
            />
          )}

          {/* Accuracy radius */}
          <Circle
            center={userLocation}
            radius={150}
            fillColor="rgba(0, 180, 150, 0.12)"
            strokeColor="rgba(0, 200, 170, 0.25)"
            strokeWidth={1.5}
          />

          {/* User location dot */}
          <Marker
            coordinate={userLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={styles.userPulseOuter}>
              <View style={styles.userPulseMid}>
                <View style={styles.userDotOuter}>
                  <View style={styles.userDot} />
                </View>
              </View>
            </View>
          </Marker>

          {/* Contact marker */}
          {CONTACT_MARKER && (
            <Marker
              coordinate={CONTACT_MARKER.coordinate}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={false}
            >
              <View style={styles.markerWrapper}>
                <View
                  style={[
                    styles.markerPin,
                    { backgroundColor: CONTACT_MARKER.color },
                  ]}
                >
                  <Text style={styles.markerPinText}>i</Text>
                </View>
                <View
                  style={[
                    styles.markerArrow,
                    { borderTopColor: CONTACT_MARKER.color },
                  ]}
                />
              </View>
            </Marker>
          )}

          {/* Route polyline — same UI regardless of which API fetched it */}
          {routeCoords.length > 0 && (
            <>
              <Polyline
                coordinates={routeCoords}
                strokeColor="rgba(0,0,0,0.25)"
                strokeWidth={6}
                lineCap="round"
                lineJoin="round"
              />
              <Polyline
                coordinates={routeCoords}
                strokeColor="#4DA3FF"
                strokeWidth={4}
                lineCap="round"
                lineJoin="round"
              />
              <Polyline
                coordinates={routeCoords}
                strokeColor="rgba(130,200,255,0.45)"
                strokeWidth={2}
                lineDashPattern={[6, 10]}
                lineCap="round"
              />
            </>
          )}

          {/* Route endpoint highlights */}
          {routeCoords.length > 0 && selectedContactLocation && (
            <>
              <Circle
                center={userLocation}
                radius={25}
                fillColor="rgba(77,163,255,0.25)"
                strokeColor="#4DA3FF"
                strokeWidth={2}
              />
              <Circle
                center={{
                  latitude: selectedContactLocation.latitude,
                  longitude: selectedContactLocation.longitude,
                }}
                radius={25}
                fillColor="rgba(255,59,92,0.2)"
                strokeColor="#FF3B5C"
                strokeWidth={2}
              />
            </>
          )}
        </MapView>

        {/* ROUTE INFO BADGE */}
        {routeInfo && (
          <View style={styles.routeInfoBadge}>
            <Icon
              name={
                travelMode === 'walking' ? 'directions-walk' : 'directions-car'
              }
              size={15}
              color="#4DA3FF"
            />
            <Text style={styles.routeInfoText}>{routeInfo.duration}</Text>
            <View style={styles.routeInfoDivider} />
            <Icon name="straighten" size={14} color="#7A8499" />
            <Text style={styles.routeInfoSub}>{routeInfo.distance}</Text>
          </View>
        )}

        {/* RECENTER BUTTON */}
        {isOffCenter && (
          <TouchableOpacity
            style={styles.recenterBtn}
            onPress={centerOnUser}
            activeOpacity={0.8}
          >
            <Icon name="my-location" size={20} color="#4DA3FF" />
          </TouchableOpacity>
        )}

        {/* TRAVEL MODE BUTTON */}
        <TouchableOpacity
          style={[
            styles.travelModeBtn,
            travelMode === 'walking' && styles.travelModeBtnActive,
          ]}
          onPress={() =>
            setTravelMode(prev => (prev === 'driving' ? 'walking' : 'driving'))
          }
          activeOpacity={0.8}
        >
          <Icon
            name={
              travelMode === 'walking' ? 'directions-walk' : 'directions-car'
            }
            size={20}
            color={travelMode === 'walking' ? '#ffffff' : '#4DA3FF'}
          />
        </TouchableOpacity>



        {/* ZOOM CONTROLS */}
        <View style={styles.zoomControls}>
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={handleZoomIn}
            activeOpacity={0.7}
          >
            <Icon name="add" size={22} color="#4DA3FF" />
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={handleZoomOut}
            activeOpacity={0.7}
          >
            <Icon name="remove" size={22} color="#4DA3FF" />
          </TouchableOpacity>
        </View>

        {/* ══════════════════════════════════════════════════════
            SEARCH BAR
            useGoogleMap ON  → GooglePlacesAutocomplete
            useGoogleMap OFF → TextInput + Nominatim dropdown
            ══════════════════════════════════════════════════════ */}
        <View style={styles.searchBarWrapper}>
          {useGoogleMap ? (
            // ── Google Places ───────────────────────────────────────────────
            <GooglePlacesAutocomplete
              placeholder="Select your current location"
              fetchDetails
              onPress={handleGooglePlaceSelect}
              query={{ key: GOOGLE_MAPS_API_KEY, language: 'en' }}
              styles={{
                container: styles.placesContainer,
                textInputContainer: styles.placesInputContainer,
                textInput: styles.placesInput,
                listView: styles.placesList,
                row: styles.placesRow,
                description: styles.placesDescription,
                poweredContainer: { display: 'none' },
                powered: { display: 'none' },
              }}
              renderLeftButton={() => (
                <View style={styles.searchIconBg}>
                  <Icon name="search" size={16} color="#4DA3FF" />
                </View>
              )}
              renderRightButton={() => (
                <TouchableOpacity
                  style={styles.searchBtn}
                  onPress={chooseCurrentLocation}
                  activeOpacity={0.7}
                >
                  <Icon name="near-me" size={16} color="#4DA3FF" />
                </TouchableOpacity>
              )}
              enablePoweredByContainer={false}
              debounce={300}
              minLength={2}
            />
          ) : (
            // ── Nominatim (OSM) Search ──────────────────────────────────────
            <>
              <View style={styles.placesInputContainer}>
                <View style={styles.searchIconBg}>
                  <Icon name="search" size={16} color="#4DA3FF" />
                </View>
                <TextInput
                  style={styles.placesInput}
                  placeholder="Select your current location"
                  placeholderTextColor="#7A8499"
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  onFocus={() =>
                    searchResults.length > 0 && setShowResults(true)
                  }
                />
                <TouchableOpacity
                  style={styles.searchBtn}
                  onPress={chooseCurrentLocation}
                  activeOpacity={0.7}
                >
                  <Icon name="near-me" size={16} color="#4DA3FF" />
                </TouchableOpacity>
              </View>

              {showResults && searchResults.length > 0 && (
                <FlatList
                  style={styles.placesList}
                  keyboardShouldPersistTaps="handled"
                  data={searchResults}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.placesRow}
                      onPress={() => handleNominatimPlaceSelect(item)}
                      activeOpacity={0.7}
                    >
                      <Icon
                        name="place"
                        size={14}
                        color="#4DA3FF"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.placesDescription} numberOfLines={2}>
                        {item.place_name} {/* ← was item.display_name */}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={item => item.id.toString()} // ← was item.place_id
                />
              )}
            </>
          )}
        </View>

        {/* CONTACT QUICK ACTIONS BAR */}
        {mapSelectedContact?.receipent_id && (
          <View
            style={{
              position: 'absolute',
              top: 120,
              left: 20,
              zIndex: 9,
              alignItems: 'flex-start',
              pointerEvents: 'box-none',
            }}
          >
            <View
              style={{
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'rgba(15, 20, 35, 0.82)',
                borderRadius: 28,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
                paddingHorizontal: 4,
                paddingVertical: 4,
                gap: 2,
              }}
            >
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={navigateToChatRoom}
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 6,
                  paddingVertical: 10,
                  borderRadius: 22,
                }}
              >
                <Icon name="chat" size={16} color="#60A6FF" />
              </TouchableOpacity>

              <View style={{ height: 1, width: 28, backgroundColor: 'rgba(255,255,255,0.1)' }} />

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={navigateAudioRoom}
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 6,
                  paddingVertical: 10,
                  borderRadius: 22,
                }}
              >
                <Icon name="mic" size={16} color="#60A6FF" />
              </TouchableOpacity>

              <View style={{ height: 1, width: 28, backgroundColor: 'rgba(255,255,255,0.1)' }} />

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={navigateHealthRoom}
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 6,
                  paddingVertical: 10,
                  borderRadius: 22,
                }}
              >
                <Icon name="favorite" size={16} color="#AA3CFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* LOCATION CARD */}
        <View style={styles.locationCard}>
          <View style={styles.cardHandle} />
          <MapAvatarList
            navigation={navigation}
            chatContacts={mappedMapContacts}
            fetchChatContacts={fetchChatContacts}
          />
        </View>
      </>
    </View>
  );
};

// ─── Inline styles for the toggle widget ─────────────────────────────────────
const googleToggleStyle = {
  wrapper: {
    position: 'absolute',
    top: 80,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,22,40,0.85)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
  },
  label: {
    color: '#9ab',
    fontSize: 11,
    fontWeight: '600',
  },
};

export default MapScreen;
