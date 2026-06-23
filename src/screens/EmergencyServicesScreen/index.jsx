import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  SafeAreaView,
  Platform,
  Animated,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { SW, SH, SF } from '../../theme/dimensions';
import appColors from '../../theme/appColors';
import appFonts from '../../theme/appFonts';
import { GOOGLE_MAPS_API_KEY } from '../../../environment';
import { EmergencyService } from '../../services/emergency.service';
import { getLocationName } from '../../services/addressFetch.service';
import { useLocation } from '../../context/LocationContext';
import { useFocusEffect } from '@react-navigation/native';

// ─── Icons as SVG-style Unicode / emoji fallbacks ────────────────────────────
// In a real project swap these with react-native-vector-icons or similar.
const Icon = ({ name, size = 18, color = '#fff' }) => {
  const map = {
    arrowBack: '←',
    back: '‹',
    search: '🔍',
    locate: '◎',
    police: '🚔',
    hospital: '🏥',
    ambulance: '🚑',
    fire: '🚒',
    disaster: '🆘',
    blood: '🩸',
    pharmacy: '💊',
    urgentCare: '👩‍⚕️',
    trauma: '🏥',
    shelter: '🚨',
    roadside: '🔧',
    helpline: '☎️',
    pickup: '🚑',
    flood: '🌊',
    serviceOffice: '⚡',
    child: '🧒',
    women: '👩',
    phone: '📞',
    navigate: '➤',
    pin: '📍',
    location: '📍',
    close: '✕',
    user: '👤',
    id: '🪪',
    mail: '✉',
    call: '📲',
    address: '🏠',
    emergency: '🚨',
  };
  return (
    <Text style={{ fontSize: size, color, lineHeight: size + 4 }}>
      {map[name] || '•'}
    </Text>
  );
};

const renderPlaceSuggestionRow = rowData => {
  const title =
    rowData?.structured_formatting?.main_text ||
    rowData?.description ||
    rowData?.formatted_address ||
    '';
  const subtitle = rowData?.structured_formatting?.secondary_text || '';

  return (
    <View style={styles.placeSuggestionRow}>
      <Text style={styles.placeSuggestionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.placeSuggestionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'medical-emergency', label: 'Medical Emergency', icon: 'ambulance' },
  { id: 'police-station', label: 'Police Station', icon: 'police' },
  { id: 'fire-station', label: 'Fire Station', icon: 'fire' },
  { id: 'disaster-relief-center', label: 'Disaster Relief Center', icon: 'disaster' },
  { id: 'blood-bank', label: 'Blood Bank', icon: 'blood' },
  { id: 'pharmacy-24x7', label: 'Pharmacy (24x7)', icon: 'pharmacy' },
  { id: 'urgent-care-center', label: 'Urgent Care Center', icon: 'urgentCare' },
  { id: 'trauma-center', label: 'Trauma Center', icon: 'trauma' },
  { id: 'emergency-shelter', label: 'Emergency Shelter', icon: 'shelter' },
  { id: 'roadside-assistance', label: 'Roadside Assistance', icon: 'roadside' },
  { id: 'emergency-helpline', label: 'Emergency Helpline', icon: 'helpline' },
  { id: 'ambulance-pickup-point', label: 'Ambulance Pickup Point', icon: 'pickup' },
  { id: 'flood-cyclone-shelter', label: 'Flood/Cyclone Shelter', icon: 'flood' },
  { id: 'emergency-service-office', label: 'Emergency Service Office', icon: 'serviceOffice' },
  { id: 'child-help-center', label: 'Child Help Center', icon: 'child' },
  { id: 'womens-safety-center', label: "Women's Safety Center", icon: 'women' },
];

const SERVICES = [
  // {
  //   id: '1',
  //   name: 'Emergency Station Nigeria',
  //   address: '40 NTA Rd, Port Harcourt',
  //   distance: '3.08 km',
  // },
  // {
  //   id: '2',
  //   name: 'ODC MEDICS',
  //   address: 'No 123 Owoloma, Haruk Estate Link Road, Port Harcourt',
  //   distance: '3.96 km',
  // },
  // {
  //   id: '3',
  //   name: 'C.Bennett Specialist Hospital',
  //   address: '100 Shell location Road, Apirikom Road, Port Harcourt',
  //   distance: '4.67 km',
  // },
  // {
  //   id: '4',
  //   name: 'Emergency Response Services Nigeria Limited',
  //   address: '394 Ikwerre Rd, Port Harcourt',
  //   distance: '5.22 km',
  // },
  // {
  //   id: '5',
  //   name: 'College of Emergency And Paramedic Studies',
  //   address: '394 Ikwerre Rd, Port Harcourt',
  //   distance: '5.22 km',
  // },
  // {
  //   id: '6',
  //   name: 'Emergency Response Service Group',
  //   address: 'Emergency House, Ikwerre Rd, Port Harcourt',
  //   distance: '5.46 km',
  // },
  // {
  //   id: '7',
  //   name: 'PALMARS Hospital',
  //   address: 'Ikwerre Rd, Port Harcourt',
  //   distance: '6.23 km',
  // },
];

// ─── STATUS BADGE HELPER ─────────────────────────────────────────────────────
const STATUS_CONFIG = {
  approved: { color: '#22C55E', bg: '#0F2A1A', label: 'Approved' },
  pending:  { color: '#EAB308', bg: '#1A1A0A', label: 'Pending'  },
  rejected: { color: '#E63946', bg: '#1A0A0A', label: 'Rejected' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { color: '#8891A4', bg: '#1C2130', label: status };
  return (
    <View style={{ backgroundColor: cfg.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: cfg.color + '55' }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: cfg.color }}>{cfg.label}</Text>
    </View>
  );
};

// ─── REQUEST LIST TAB ─────────────────────────────────────────────────────────
const RequestListTab = () => {
  const [requests, setRequests]       = useState([]);
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(true);
  const [loading, setLoading]         = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const loadingRef                    = useRef(false);
  const LIMIT                         = 10;

  const loadPage = (pageNum, isRefresh = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (isRefresh) setRefreshing(true); else setLoading(true);

    EmergencyService.fetchMyRequestedServices(pageNum, LIMIT, res => {
      loadingRef.current = false;
      if (isRefresh) setRefreshing(false); else setLoading(false);

      if (res.success) {
        const items = res.data?.data || [];
        if (isRefresh) {
          setRequests(items);
          setPage(1);
        } else {
          setRequests(prev => [...prev, ...items]);
        }
        setHasMore(items.length === LIMIT);
      } else {
        console.log('❌ Request list error:', res.error);
      }
    });
  };

  useEffect(() => { loadPage(1, true); }, []);

  const handleRefresh = () => {
    setHasMore(true);
    loadPage(1, true);
  };

  const handleEndReached = () => {
    console.log('handleEndReached called.');
    if (!hasMore || loadingRef.current) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadPage(nextPage);
  };

  const renderItem = ({ item }) => (
    <View style={styles.reqCard}>
      <View style={styles.reqCardHeader}>
        <Text style={styles.reqCardName} numberOfLines={1}>{item.locationName}</Text>
        <StatusBadge status={item.status} />
      </View>
      <Text style={styles.reqCardAddress} numberOfLines={2}>{item.address}</Text>
      <View style={styles.reqCardFooter}>
        <View style={styles.reqCardMeta}>
          <Text style={styles.reqCardIcon}>🚨</Text>
          <Text style={styles.reqCardType}>{item.serviceType?.replace(/-/g, ' ')}</Text>
        </View>
        <View style={styles.reqCardMeta}>
          <Text style={styles.reqCardIcon}>📞</Text>
          <Text style={styles.reqCardPhone}>{item.phoneNumber}</Text>
        </View>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return <View style={{ height: 20 }} />;
    return (
      <View style={styles.reqLoadingFooter}>
        <Text style={styles.reqLoadingText}>Loading more…</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    !loading ? (
      <View style={styles.reqEmptyState}>
        <Text style={styles.reqEmptyIcon}>📋</Text>
        <Text style={styles.reqEmptyTitle}>No Requests Yet</Text>
        <Text style={styles.reqEmptySubtitle}>Your submitted emergency location requests will appear here.</Text>
      </View>
    ) : null
  );

  return (
    <FlatList
       
      data={requests}
      keyExtractor={item => String(item.id)}
      renderItem={renderItem}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.reqListContent}
      showsVerticalScrollIndicator={false}
    />
  );
};

// ─── RegisterEmergencyModal ────────────────────────────────────────────────────
const RegisterEmergencyModal = ({ visible, onClose, onSubmit }) => {
  const [activeTab, setActiveTab]     = useState('new');   // 'new' | 'list'
  const [form, setForm] = useState({
    phoneNumber: '',
    location: '',
    address: '',
    categoryId: '',
    placeId: '',
    latitude: null,
    longitude: null,
  });
  const [submitted, setSubmitted] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const selectedCategory = CATEGORIES.find(cat => cat.id === form.categoryId);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationSelect = (data, details) => {
    const placeName =
      details?.name || data?.structured_formatting?.main_text || data?.description || '';
    const formattedAddress =
      details?.formatted_address || data?.description || '';
    const latitude = details?.geometry?.location?.lat ?? null;
    const longitude = details?.geometry?.location?.lng ?? null;
    const placeId = details?.place_id || data?.place_id || '';
    const placePhoneNumber =
      details?.formatted_phone_number || details?.international_phone_number || '';

    setForm(prev => ({
      ...prev,
      location: placeName,
      address: formattedAddress,
      latitude,
      longitude,
      placeId,
      phoneNumber: placePhoneNumber,
    }));

    console.log('Selected place details:', {
      placeName,
      formattedAddress,
      latitude,
      longitude,
      placeId,
      placePhoneNumber,
    });
  };

  const isFormValid =
    form.phoneNumber.trim().length > 0 &&
    form.location.trim().length > 0 &&
    form.categoryId.trim().length > 0;

  const handleSubmit = () => {
    if (!isFormValid) {
      return;
    }
    const payload = {
      locationName: form.location,
      latitude: form.latitude,
      longitude: form.longitude,
      address: form.address,
      phoneNumber: form.phoneNumber,
      placeId: form.placeId,
      serviceType: form.categoryId,
    };
    const response = EmergencyService.submitEmergencyCall(payload, res => {
      console.log('Emergency call submission response:', res);
      if (res.success === true) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setForm({
            phoneNumber: '',
            location: '',
            address: '',
            categoryId: '',
            placeId: '',
            latitude: null,
            longitude: null,
          });
          setCategoryOpen(false);
          onClose();
        }, 2000);
        setFormSubmitting(false);
      } else {
        console.log('❌ Error submitting emergency call:', res.error || 'Unknown error');
        setFormSubmitting(false);
        Alert.alert('Submission failed', res.error || 'Unable to submit emergency call. Please try again.');
      }
    })
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Handle bar */}
          <View style={styles.modalHandle} />

          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <View style={styles.modalIconBadge}>
                <Text style={styles.modalIconText}>🚨</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.modalTitle}>Emergency Location</Text>
                <Text style={styles.modalSubtitle}>
                  Register or track emergency locations
                </Text>
              </View>
            </View>
            <TouchableOpacity disabled={formSubmitting} style={styles.modalCloseBtn} onPress={onClose}>
              <Icon name="close" size={14} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'new' && styles.tabBtnActive]}
              onPress={() => setActiveTab('new')}
              activeOpacity={0.8}>
              <Text style={[styles.tabBtnText, activeTab === 'new' && styles.tabBtnTextActive]}>
                New Request
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'list' && styles.tabBtnActive]}
              onPress={() => setActiveTab('list')}
              activeOpacity={0.8}>
              <Text style={[styles.tabBtnText, activeTab === 'list' && styles.tabBtnTextActive]}>
                My Requests
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {activeTab === 'list' ? (
            <View style={styles.modalBody}>
              <RequestListTab />
            </View>
          ) : (
          <FlatList
            data={[{ id: 'modal-form' }]}
            keyExtractor={item => item.id}
            style={styles.modalBody}
            contentContainerStyle={styles.modalBodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderItem={() =>
              submitted ? (
                <View style={styles.successBox}>
                  <Text style={styles.successIcon}>✅</Text>
                  <Text style={styles.successTitle}>Request Submitted!</Text>
                  <Text style={styles.successMsg}>
                    Your emergency call has been registered. Help is on the way.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>
                      <Icon name="address" size={13} color="#00C49A" />
                      {'  '}Select from Google Places
                    </Text>
                    <GooglePlacesAutocomplete
                      placeholder="Search location"
                      fetchDetails
                      onPress={handleLocationSelect}
                      renderRow={renderPlaceSuggestionRow}
                      isRowScrollable={false}
                      query={{ key: GOOGLE_MAPS_API_KEY, language: 'en' }}
                      textInputProps={{
                        value: form.location,
                        onChangeText: value => handleChange('location', value),
                        placeholderTextColor: '#4B5563',
                      }}
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
                      enablePoweredByContainer={false}
                      debounce={300}
                      minLength={2}
                    />
                  </View>


                  {form.address ? (
                    <View style={styles.fieldGroup}><Text style={styles.fieldLabel}>
                      <Icon name="location" size={13} color="#00C49A" />
                      {'  '}Address
                    </Text>
                      <Text style={styles.addressText}>{form.address}</Text>
                    </View>
                  ) : null}



                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>
                      <Icon name="call" size={13} color="#00C49A" />
                      {'  '}Phone Number
                    </Text>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="+234 800 000 0000"
                      placeholderTextColor="#4B5563"
                      keyboardType="phone-pad"
                      value={form.phoneNumber}
                      onChangeText={v => handleChange('phoneNumber', v)}
                    />
                  </View>



                  <View style={[styles.fieldGroup, styles.dropdownFieldGroup]}>
                    <Text style={styles.fieldLabel}>
                      <Icon name="emergency" size={13} color="#00C49A" />
                      {'  '}Category
                    </Text>
                    <TouchableOpacity
                      style={styles.dropdownBtn}
                      onPress={() => setCategoryOpen(prev => !prev)}
                      activeOpacity={0.8}>
                      <View style={styles.dropdownBtnContent}>
                        {selectedCategory ? (
                          <Icon name={selectedCategory.icon} size={15} color={C.teal} />
                        ) : (
                          <Icon name="emergency" size={15} color={C.sub} />
                        )}
                        <Text
                          style={[
                            styles.dropdownBtnText,
                            !selectedCategory && styles.dropdownPlaceholder,
                          ]}>
                          {selectedCategory?.label || 'Select category'}
                        </Text>
                      </View>
                      <Text style={styles.dropdownCaret}>{categoryOpen ? '▴' : '▾'}</Text>
                    </TouchableOpacity>

                    {categoryOpen && (
                      <View style={styles.dropdownMenu}>
                        <ScrollView
                          nestedScrollEnabled
                          showsVerticalScrollIndicator={false}
                          keyboardShouldPersistTaps="handled">
                          {CATEGORIES.map(cat => (
                            <TouchableOpacity
                              key={cat.id}
                              style={styles.dropdownOption}
                              onPress={() => {
                                handleChange('categoryId', cat.id);
                                setCategoryOpen(false);
                              }}
                              activeOpacity={0.8}>
                              <View style={styles.dropdownOptionRow}>
                                <Icon name={cat.icon} size={15} color={C.teal} />
                                <Text style={styles.dropdownOptionText}>{cat.label}</Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, !isFormValid && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    activeOpacity={0.85}
                    disabled={!isFormValid || formSubmitting}>
                    <Text style={styles.submitBtnText}>Submit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.cancelBtn} disabled={formSubmitting} onPress={onClose}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <View style={{ height: 16 }} />
                </>
              )
            }
          />
          )}
        </View>
      </View>
    </Modal>
  );
};

// ─── ServiceCard ──────────────────────────────────────────────────────────────
const ServiceCard = ({ item, onCall, onNavigate }) => (
  <View style={styles.card}>
    <View style={styles.cardLeft}>
      <Text style={styles.distance}>{item.distance_km}Km</Text>
      <Icon name="pin" size={16} color="#00C49A" />
    </View>
    <View style={styles.cardBody}>
      <Text style={styles.cardName}>{item.locationName}</Text>
      <Text style={styles.cardAddress}>{item.address}</Text>
    </View>
    <View style={styles.cardActions}>
      <TouchableOpacity style={styles.callBtn} onPress={() => onCall(item)} activeOpacity={0.8}>
        <Icon name="phone" size={16} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.navBtn} onPress={() => onNavigate(item)} activeOpacity={0.8}>
        <Icon name="navigate" size={14} color="#fff" />
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const EmergencyServicesScreen = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeRadius, setActiveRadius] = useState(10);
  const { getCurrentPosition, currentLocation } = useLocation();
  const [currentlatitude, setCurrentLatitude] = useState(null);
  const [currentlongitude, setCurrentLongitude] = useState(null);
  const [currentLocationName, setCurrentLocationName] = useState(null);
  const [nearbyServices, setNearbyServices] = useState([]);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {

    const fetchLocation = async () => {
      try {
        if (currentLocation?.latitude != null && currentLocation?.longitude != null) {
          setCurrentLatitude(currentLocation.latitude);
          setCurrentLongitude(currentLocation.longitude);
        } else {
          const position = await getCurrentPosition();
          if (position?.latitude != null && position?.longitude != null) {
            setCurrentLatitude(position.latitude);
            setCurrentLongitude(position.longitude);
          }
        }

      } catch (error) {
      }
    };
    fetchLocation();

  }, [currentLocation?.latitude, currentLocation?.longitude, getCurrentPosition])
  const locatemylocation = async () => {
    setSearch('');
    const position = await getCurrentPosition();
    if (position?.latitude != null && position?.longitude != null) {
      setCurrentLatitude(position.latitude);
      setCurrentLongitude(position.longitude);
    }
  }

  const handleSearchLocationSelect = (data, details) => {
    const latitude = details?.geometry?.location?.lat;
    const longitude = details?.geometry?.location?.lng;
    const locationLabel =
      details?.formatted_address || details?.name || data?.description || '';

    setSearch(locationLabel);
    if (locationLabel) {
      setCurrentLocationName(locationLabel);
    }

    if (latitude != null && longitude != null) {
      setCurrentLatitude(latitude);
      setCurrentLongitude(longitude);
    }
  };

  const makeCall = (phoneNumber) => {
    const url = `tel:${phoneNumber}`;

    Linking.canOpenURL(url)
      .then(supported => {
        if (!supported) {
          Alert.alert('Error', 'Phone calls are not supported on this device.');
          return;
        }
        return Linking.openURL(url);
      })
      .catch(err => console.error('Call error:', err));
  };
  const navigateTo = (latitude, longitude) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}`,
    });

    Linking.canOpenURL(url)
      .then(supported => {
        if (!supported) {
          Alert.alert('Error', 'Navigation is not supported on this device.');
          return;
        }
        return Linking.openURL(url);
      })
      .catch(err => console.error('Navigation error:', err));
  }

  const fetchNearbyServices = async () => {
    console.log("activeCategory3445", activeCategory);
    return new Promise((resolve) => {
      EmergencyService.fetchNearbyServices(
        currentlatitude,
        currentlongitude,
        activeRadius,
        activeCategory,
        (res) => {
          if (res.success) {
            resolve(res?.data?.data || []);
          } else {
            console.log('❌ Error fetching nearby services:', res.error || 'Unknown error');
            resolve([]);
          }
        }
      );
    });
  };

  const handleReload = async () => {
    if (currentlatitude == null || currentlongitude == null || reloading) {
      return;
    }

    setReloading(true);
    try {
      const services = await fetchNearbyServices();
      setNearbyServices(services);
    } finally {
      setReloading(false);
    }
  };
  useEffect(() => {
    if (currentlatitude == null || currentlongitude == null) {
      return;
    }
    const fetchLocationName = async () => {
      try {
        const locationName = await getLocationName(currentlatitude, currentlongitude);
        setCurrentLocationName(locationName);
      } catch (error) {
        console.warn('Error fetching location name:', error.message);
      }
    };
    fetchLocationName();


  }, [currentlatitude, currentlongitude]); 

  useEffect(() => {

    if (currentlatitude == null || currentlongitude == null) {
      return;
    }
    console.log("activeCategory", activeCategory);

    let isMounted = true;

    const loadLocationAndServices = async () => {

      const services = await fetchNearbyServices();

      if (!isMounted) {
        return;
      }
      setNearbyServices(services);
      console.log('Fetched emergency services:', services);
    };

    loadLocationAndServices();

    return () => {
      isMounted = false;
    };

  }, [currentlatitude, currentlongitude, activeCategory, activeRadius]);


  const EmptyState = ({ radius }) => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconRing}>
        <Text style={styles.emptyIconInner}>📍</Text>
      </View>
      <Text style={styles.emptyTitle}>No Services Found</Text>
      <Text style={styles.emptySubtitle}>
        No emergency services available within {radius} km of your location.
      </Text>

      <TouchableOpacity style={styles.emptyHint} onPress={handleReload} activeOpacity={0.8}>
        <Text style={styles.emptyHintText}>Reload</Text>
      </TouchableOpacity>
    </View>
  );








  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0F14" />

      {/* Header */}
      <View>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Icon name="arrowBack" size={24} color={appColors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Emergency Services</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Icon name="search" size={15} color="#6B7280" />
            <View style={styles.searchPlacesWrapper}>
              <GooglePlacesAutocomplete
              placeholder="Search location"
                fetchDetails
                onPress={handleSearchLocationSelect}
                renderRow={renderPlaceSuggestionRow}
                isRowScrollable={false}
                query={{ key: GOOGLE_MAPS_API_KEY, language: 'en' }}
                textInputProps={{
                  value: search,
                  onChangeText: setSearch,
                  placeholderTextColor: '#4B5563',
                }}
                styles={{
                  container: styles.searchPlacesContainer,
                  textInputContainer: styles.searchPlacesTextInputContainer,
                  textInput: styles.searchInput,
                  listView: styles.searchPlacesList,
                  row: styles.searchPlacesRow,
                  description: styles.searchPlacesDescription,
                  poweredContainer: { display: 'none' },
                  powered: { display: 'none' },
                }}
                enablePoweredByContainer={false}
                debounce={300}
                minLength={2}
              />
            </View>
          </View>
          <TouchableOpacity style={styles.locateBtn} onPress={locatemylocation} activeOpacity={0.8}>
            <Icon name="locate" size={40} color="#00C49A" />
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}>
          <TouchableOpacity
            key="all"
            style={[
              styles.catChip,
              activeCategory === 'all' && styles.catChipActive,
            ]}
            onPress={() => setActiveCategory('all')}
            activeOpacity={0.8}>
            <Icon
              name="emergency"
              size={14}
              color={activeCategory === 'all' ? '#fff' : '#9CA3AF'}
            />
            <Text
              style={[
                styles.catLabel,
                activeCategory === 'all' && styles.catLabelActive,
              ]}>
              All
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.catChip,
                activeCategory === cat.id && styles.catChipActive,
              ]}
              onPress={() => setActiveCategory(cat.id)}
              activeOpacity={0.8}>
              <Icon
                name={cat.icon}
                size={14}
                color={activeCategory === cat.id ? '#fff' : '#9CA3AF'}
              />
              <Text
                style={[
                  styles.catLabel,
                  activeCategory === cat.id && styles.catLabelActive,
                ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results Label */}
        <View style={styles.resultsRow}>
          {currentLocationName ? <Text style={styles.resultsLabel}>
            Results:{' '}
            <Text style={styles.resultsLocation}>{currentLocationName}</Text>
          </Text> : ''}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.radiusRow}>
          {[5, 10, 15, 20, 25, 30].map(km => (
            <TouchableOpacity
              key={km}
              style={[
                styles.radiusChip,
                activeRadius === km && styles.radiusChipActive,
              ]}
              onPress={() => { setActiveRadius(km); }}
              activeOpacity={0.8}>
              <Text style={[
                styles.radiusChipText,
                activeRadius === km && styles.radiusChipTextActive,
              ]}>
                {km} km
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Emergency Call Banner */}
        <TouchableOpacity
          style={styles.emergencyBanner}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}>
          <Text style={styles.emergencyBannerIcon}>🚨</Text>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.emergencyBannerTitle}>Request to register an Emergency Call</Text>
            <Text style={styles.emergencyBannerSub}>
              Log your emergency details for faster response
            </Text>
          </View>
          <Text style={styles.emergencyBannerArrow}>›</Text>
        </TouchableOpacity>
      </View>
      {/* List */}
      <FlatList
        style={{ flex: 1 }}
        data={nearbyServices}
        keyExtractor={(item, index) => String(item?.id || item?.placeId || item?.name || index)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={reloading}
        onRefresh={handleReload}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<EmptyState radius={activeRadius} />}
        renderItem={({ item }) => (
          <ServiceCard
            item={item}
            onCall={s => makeCall(item?.phoneNumber)}
            onNavigate={s =>  navigateTo(item?.latitude, item?.longitude) }
          />
        )}
      />


      {/* Modal */}
      <RegisterEmergencyModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={() => { setModalVisible(false); setShowSuccess(true); }}
      />

    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const C = {
  bg: appColors.DarkPrimary,
  surface: '#161A22',
  card: '#1C2130',
  border: '#252C3B',
  teal: appColors.primary,
  tealDark: '#007F65',
  red: '#E63946',
  text: '#F1F5F9',
  sub: '#8891A4',
  muted: '#4B5563',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Header — mirrors AddContactsScreen exactly
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SW(18),
    paddingTop: SW(48),
    marginBottom: SW(20),
  },
  headerTextWrap: {
    flex: 1,
    marginLeft: SW(10),
  },
  headerTitle: {
    color: appColors.white,
    fontSize: SF(17),
    fontFamily: appFonts.NunitoBold,
  },
  headerSubtitle: {
    color: appColors.bodyColor,
    fontSize: SF(10),
    fontFamily: appFonts.NunitoSemiBold,
  },

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 10,
    zIndex: 2000,
    elevation: 20,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: C.border,
    gap: 8,
    zIndex: 2001,
    overflow: 'visible',
  },
  searchPlacesWrapper: {
    flex: 1,
    zIndex: 2002,
  },
  searchPlacesContainer: {
    flex: 1,
    zIndex: 2003,
  },
  searchPlacesTextInputContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 0,
  },
  searchInput: {
    flex: 1,
    color: C.text,
    fontSize: 14,
    backgroundColor: C.surface,
    marginLeft: 0,
    marginRight: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    height: 44,
  },
  searchPlacesList: {
    position: 'absolute',
    top: 46,
    left: -24,
    right: 0,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    maxHeight: 220,
    zIndex: 2500,
    elevation: 24,
  },
  searchPlacesRow: {
    backgroundColor: C.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
  },
  searchPlacesDescription: {
    color: C.text,
    fontSize: 13,
    flexShrink: 1,
    flexWrap: 'wrap',
    lineHeight: 18,
  },
  locateBtn: {
    width: 46,
    height: 46,
    backgroundColor: C.surface,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.teal + '44',
  },

  // Categories
  catRow: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 30,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 6,
    borderWidth: 1,
    borderColor: C.border,
    height: SH(40)
  },
  catChipActive: {
    backgroundColor: C.teal,
    borderColor: C.teal,
  },
  catLabel: { fontSize: 13, fontWeight: '600', color: C.sub },
  catLabelActive: { color: '#000' },

  // Results row
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  resultsLabel: { fontSize: 13, fontWeight: '600', color: C.sub },
  resultsLocation: { color: C.text, fontWeight: '700' },
  resultsCount: { fontSize: 12, color: C.teal, fontWeight: '600' },

  // Emergency banner
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#1A0A0A',
    borderWidth: 1,
    borderColor: C.red + '55',
    borderRadius: 14,
    padding: 14,
  },
  emergencyBannerIcon: { fontSize: 22 },
  emergencyBannerTitle: { fontSize: 13, fontWeight: '700', color: '#FF6B6B' },
  emergencyBannerSub: { fontSize: 11, color: C.sub, marginTop: 2 },
  emergencyBannerArrow: { fontSize: 22, color: '#FF6B6B' },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  separator: { height: 1, backgroundColor: C.border },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 0,
  },
  cardLeft: {
    alignItems: 'center',
    width: 52,
    marginRight: 12,
  },
  distance: {
    fontSize: 10,
    fontWeight: '700',
    color: C.teal,
    marginBottom: 4,
    textAlign: 'center',
  },
  cardBody: { flex: 1, marginRight: 10 },
  cardName: { fontSize: 14, fontWeight: '700', color: C.text, lineHeight: 20 },
  cardAddress: { fontSize: 11, color: C.sub, marginTop: 3, lineHeight: 15 },
  cardActions: { flexDirection: 'row', gap: 8 },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.tealDark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: C.red,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: C.red,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  fabText: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#12151F',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: C.border,
    borderBottomWidth: 0,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
  },
  modalTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#2A0A0A',
    borderWidth: 1,
    borderColor: C.red + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconText: { fontSize: 22 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  modalSubtitle: { fontSize: 12, color: C.sub, marginTop: 2 },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 0 },
  modalBody: { flexGrow: 0 },
  modalBodyContent: { padding: 20 },

  // Form fields
  fieldGroup: { marginBottom: 16 },
  dropdownFieldGroup: {
    zIndex: 20,
    elevation: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.sub,
    marginBottom: 7,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  fieldInput: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.text,
    fontSize: 14,
  },
  placesContainer: {
    flex: 0,
  },
  placesInputContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 0,
  },
  placesInput: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    height: 48,
    color: C.text,
    fontSize: 14,
    marginLeft: 0,
    marginRight: 0,
  },
  placesList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    maxHeight: 180,
  },
  placesRow: {
    backgroundColor: C.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  placesDescription: {
    color: C.text,
    fontSize: 13,
    flexShrink: 1,
    flexWrap: 'wrap',
    lineHeight: 18,
  },
  placeSuggestionRow: {
    paddingVertical: 2,
  },
  placeSuggestionTitle: {
    color: C.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  placeSuggestionSubtitle: {
    color: C.sub,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },

  // Dropdown
  dropdownBtn: {
    minHeight: 48,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownBtnContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownBtnText: {
    color: C.text,
    fontSize: 14,
    flex: 1,
    paddingRight: 10,
  },
  dropdownPlaceholder: {
    color: C.muted,
  },
  dropdownCaret: {
    color: C.sub,
    fontSize: 14,
  },
  dropdownMenu: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    maxHeight: 220,
    overflow: 'hidden',
    zIndex: 30,
    elevation: 30,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  dropdownOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownOptionText: {
    color: C.text,
    fontSize: 13,
  },
  textArea: {
    height: 90,
    paddingTop: 12,
  },

  // Priority
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  priorityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  priorityLow: { backgroundColor: '#0F2A1A', borderColor: '#22C55E44' },
  priorityMedium: { backgroundColor: '#1A1A0A', borderColor: '#EAB30844' },
  priorityHigh: { backgroundColor: '#1A0F0A', borderColor: '#F9731644' },
  priorityCritical: { backgroundColor: '#1A0A0A', borderColor: C.red + '88' },
  priorityText: { fontSize: 12, fontWeight: '700', color: C.text },

  // Submit
  submitBtn: {
    backgroundColor: C.red,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: C.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  submitBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  cancelBtnText: { fontSize: 14, color: C.sub, fontWeight: '600' },

  // Success
  successBox: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  successIcon: { fontSize: 56, marginBottom: 16 },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.teal,
    marginBottom: 10,
  },
  successMsg: {
    fontSize: 14,
    color: C.sub,
    textAlign: 'center',
    lineHeight: 22,
  },
  addressText: {
    color: appColors.white
  },
  // Success overlay
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4,5,8,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successCard: {
    backgroundColor: "#1B1F2A",
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: "#262B38",
  },
  checkWrap: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: "#3DDC97",
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(61, 220, 151, 0.14)',
    borderWidth: 1.5,
    borderColor: '#3DDC97',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#3DDC97',
    fontSize: 34,
    fontWeight: '700',
  },
  successTitle: {
    color: '#F2F4F8',
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 6,
  },
  successSubtitle: {
    color: '#9AA3B5',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
  },
  successButton: {
    backgroundColor: '#5B8CFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  successButtonText: {
    color: '#0B0D12',
    fontSize: 14,
    fontWeight: '700',
  },
  // Radius filter
  radiusRow: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: SH(10),
    flexDirection: 'row',
  },
  radiusChip: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    height: SH(36),
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  radiusChipActive: {
    backgroundColor: C.teal,
    borderColor: C.teal,
  },
  radiusChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.sub,
  },
  radiusChipTextActive: {
    color: '#000',
  },
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    borderColor: C.teal + '44',
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyIconInner: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: C.sub,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyHint: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.teal + '55',
    backgroundColor: C.teal + '12',
  },
  emptyHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.teal,
    letterSpacing: 0.2,
  },

  // ─── Tabs ─────────────────────────────────────────────────────────────────
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 4,
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: C.teal,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.sub,
  },
  tabBtnTextActive: {
    color: '#000',
  },

  // ─── Request List ─────────────────────────────────────────────────────────
  reqListContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 150,
    flexGrow: 1,
    
  },
  reqCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  reqCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  reqCardName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
  reqCardAddress: {
    fontSize: 12,
    color: C.sub,
    lineHeight: 18,
    marginBottom: 10,
  },
  reqCardFooter: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  reqCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reqCardIcon: {
    fontSize: 12,
  },
  reqCardType: {
    fontSize: 11,
    color: C.teal,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  reqCardPhone: {
    fontSize: 11,
    color: C.sub,
    fontWeight: '500',
  },
  reqLoadingFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  reqLoadingText: {
    fontSize: 13,
    color: C.muted,
  },
  reqEmptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  reqEmptyIcon: {
    fontSize: 40,
    marginBottom: 14,
  },
  reqEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 8,
  },
  reqEmptySubtitle: {
    fontSize: 13,
    color: C.sub,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EmergencyServicesScreen;