import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from './style';
import { useNavigation } from '@react-navigation/native';
import CountryListModal from '../../components/countryListModal';
import { countries } from '../../config/countries';
import PhoneContactModal from '../../components/phoneContactModal';
import { Alert } from 'react-native';
import useToast from '../../hook/useToast';
import { TrustedContactService } from '../../services/trustedContact.service';
import { useDispatch } from 'react-redux';
import { trustedContactOutgongRequestActions } from '../../store/redux/trustedContactOutgongRequest.redux';
import { useOutgoingRequests } from '../../hook/useOutgoingRequests';
import { useTrustedContactActions } from '../../context/TrustedProviderContext';
import { useContactTab } from '../../hook/useContactTab';

const getFlagEmoji = countryCode => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};
const getDeviceCountryCode = () => {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale; // e.g., "en-NG"
    const parts = locale.split('-');
    return parts[parts.length - 1].toUpperCase();
  } catch {
    return null;
  }
};

const AddContactsScreen = () => {
  const navigation = useNavigation();
  const {showError, showSuccess} = useToast();
  const [relationship, setRelationship] = useState('Friend');
  const [sosAlert, setSosAlert] = useState(true);
  const [shareLocation, setShareLocation] = useState(true);
  const relations = ['Family', 'Friend', 'Colleague', 'Other'];
  const [selectedCountry, setSelectedCountry] = useState({
    name: 'Nigeria',
    code:  'NG',
    dial_code: '+234',
  });
  const dispatch = useDispatch();
  const trustedContactActions = useTrustedContactActions();
  const [userPhone, setUserPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [isPhoneBookModalVisible, setIsPhoneBookModalVisible] = useState(false);
  const [fullName, setFullName] = useState('');
   const [deviceCountryCode, setDeviceCountryCode] = useState(
      getDeviceCountryCode() || 'NG',
    ); // Default to 'NG' if detection fails
    const {  setCurrentTab } = useContactTab();
 

    useEffect(() => {
      if (deviceCountryCode) {
        const match = countries.find(c => c.code === deviceCountryCode);
        if (match) setSelectedCountry(match);
        console.log(
          'Detected country code:',
          deviceCountryCode,
          'Selected country:',
          match,
        );
         
      }
    }, [deviceCountryCode]);

  const handleSelectCountry = country => {
    setSelectedCountry(country);
    setIsCountryModalVisible(false);
  };

  const handleSelectPhoneContact = ({ name, phone }) => {
    setFullName(name);
    // Strip leading + and country code by attempting to match a known dial code,
    // otherwise just set the raw number so the user can adjust.
    const matched = [selectedCountry, ...countries].find(
      c => phone.startsWith(c.dial_code),
    );
    if (matched) {
      setSelectedCountry(matched);
      setUserPhone(phone.slice(matched.dial_code.length).replace(/\D/g, ''));
    } else {
      setUserPhone(phone.replace(/\D/g, ''));
    }
    setIsPhoneBookModalVisible(false);
  };
  const handleSaveContact = async () => {
    if (!fullName.trim() || !userPhone.trim()) {
      showError('Please fill in all required fields');
      return;
    }
    let requestPhone = userPhone.trim();
    if (requestPhone.startsWith('0')) {
      requestPhone = requestPhone.slice(1);
    }
    setIsLoading(true);
    const fullPhone = `${selectedCountry.dial_code}${requestPhone}`;
    const contactData = {
      name: fullName,
      mobile_number: fullPhone,
      relationship: relationship.toLowerCase(),
      sos_alert: sosAlert,
      share_location: shareLocation,
    };

    console.log('Constructed contact data:', contactData);
    try {
      const sendRequest = await trustedContactActions.sendTrustedContactRequest(contactData);
      console.log('Send request response:', sendRequest);
      showSuccess('SUCCESS', 'Trusted contact request sent successfully');
      setCurrentTab('outgoing');  
      navigation.goBack();
    } catch (error) {
      showError(error?.message || 'Failed to send trusted contact request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.title}>Add Contact</Text>
          <Text style={styles.subtitle}>ADD TRUSTED CONTACT</Text>
        </View>

        <Icon name="person" size={24} color="#6B7C99" />
      </View>

      {/* FULL NAME */}

      <Text style={styles.label}>FULL NAME</Text>

      <View style={styles.inputBoxActive}>
        <Icon name="person" size={18} color="#6B7C99" />
        <TextInput
          style={styles.input}
          placeholder="Vision John"
          placeholderTextColor="#A4B0BE"
          value={fullName}
          onChangeText={setFullName}
        />
      </View>

      {/* MOBILE */}

      <Text style={styles.label}>MOBILE NUMBER</Text>

      <TouchableOpacity
        style={styles.phonebookBtn}
        onPress={() => setIsPhoneBookModalVisible(true)}
      >
        <Icon name="contacts" size={16} color="#2F6BFF" />
        <Text style={styles.phonebookBtnText}>Pick from Phonebook</Text>
      </TouchableOpacity>

      <View style={styles.inputBox}>
        <TouchableOpacity onPress={() => setIsCountryModalVisible(true)}>
          <Text style={styles.country}>
            {getFlagEmoji(selectedCountry.code)} {selectedCountry.dial_code}
          </Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="1234567890"
          placeholderTextColor="#A4B0BE"
          keyboardType="phone-pad"
          maxLength={15}
          value={userPhone}
          onChangeText={setUserPhone}
        />
      </View>

      <CountryListModal
        visible={isCountryModalVisible}
        onSelectCountry={handleSelectCountry}
        onClose={() => setIsCountryModalVisible(false)}
      />

      <PhoneContactModal
        visible={isPhoneBookModalVisible}
        onSelectContact={handleSelectPhoneContact}
        onClose={() => setIsPhoneBookModalVisible(false)}
      />

      {/* RELATIONSHIP */}

      <Text style={styles.label}>RELATIONSHIP</Text>

      <View style={styles.relationRow}>
        {relations.map(item => (
          <TouchableOpacity
            key={item}
            style={[
              styles.relationTab,
              relationship === item && styles.relationTabActive,
            ]}
            onPress={() => setRelationship(item)}
          >
            <Text
              style={[
                styles.relationText,
                relationship === item && styles.relationTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SOS ALERT */}
      <View style={styles.toggleCard}>
        <View style={styles.toggleLeft}>
          <Icon name="notifications" size={18} color="#FF4757" />
          <View style={styles.toggleLeftInner}>
            <Text style={styles.toggleTitle}>SOS Alerts</Text>
            <Text style={styles.toggleSubtitle}>
              Notify on emergency trigger
            </Text>
          </View>
        </View>

        <Switch
          value={sosAlert}
          onValueChange={setSosAlert}
          trackColor={{ true: '#2ED573' }}
        />
      </View>

      {/* SHARE LOCATION */}

      <View style={styles.toggleCard}>
        <View style={styles.toggleLeft}>
          <Icon name="location-pin" size={18} color="#FF4757" />
          <View style={styles.toggleLeftInner}>
            <Text style={styles.toggleTitle}>Share Location</Text>
            <Text style={styles.toggleSubtitle}>
              Live GPS during emergencies
            </Text>
          </View>
        </View>

        <Switch
          value={shareLocation}
          onValueChange={setShareLocation}
          trackColor={{ true: '#2ED573' }}
        />
      </View>

      {/* SAVE BUTTON */}

      <TouchableOpacity onPress={handleSaveContact} style={styles.saveBtn} disabled={isLoading}>
        {isLoading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.saveText}>Saving...</Text>
          </View>
        ) : (
          <Text style={styles.saveText}>✓ Save Trusted Contact</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.cancel}>Cancel</Text>
      </TouchableOpacity>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
};

export default AddContactsScreen;
