import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Contacts from 'react-native-contacts';
import Icon from 'react-native-vector-icons/MaterialIcons';

const PhoneContactModal = ({ visible, onSelectContact, onClose }) => {
  const [contacts, setContacts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if (visible) {
      loadContacts();
    }
  }, [visible]);

  const loadContacts = async () => {
    setLoading(true);
    setPermissionDenied(false);
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Contacts Permission',
            message: 'This app needs access to your contacts.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setPermissionDenied(true);
          setLoading(false);
          return;
        }
      }

      const allContacts = await Contacts.getAll();
      const filtered = allContacts
        .filter(c => c.phoneNumbers && c.phoneNumbers.length > 0)
        .sort((a, b) => {
          const nameA = (a.givenName + ' ' + a.familyName).trim().toLowerCase();
          const nameB = (b.givenName + ' ' + b.familyName).trim().toLowerCase();
          return nameA.localeCompare(nameB);
        });
      setContacts(filtered);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSearchText('');
    onClose();
  };

  const handleSelect = contact => {
    const fullName = [contact.givenName, contact.familyName]
      .filter(Boolean)
      .join(' ')
      .trim();
    const phone =
      contact.phoneNumbers[0]?.number?.replace(/\s+/g, '') || '';
    onSelectContact({ name: fullName, phone });
    setSearchText('');
  };

  const filteredContacts = contacts.filter(c => {
    const fullName = [c.givenName, c.familyName]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const phone = c.phoneNumbers[0]?.number || '';
    return (
      fullName.includes(searchText.toLowerCase()) ||
      phone.includes(searchText)
    );
  });

  const getInitial = contact => {
    const name = (contact.givenName || contact.familyName || '?').trim();
    return name.charAt(0).toUpperCase();
  };

  const avatarColors = ['#FF3B5C', '#2F6BFF', '#6A4CFF', '#FFA726', '#2ED573', '#FF6B81'];
  const getAvatarColor = index => avatarColors[index % avatarColors.length];

  const renderItem = ({ item, index }) => {
    const fullName = [item.givenName, item.familyName]
      .filter(Boolean)
      .join(' ')
      .trim() || 'Unknown';
    const phone = item.phoneNumbers[0]?.number || '';

    return (
      <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
        <View style={[styles.avatar, { backgroundColor: getAvatarColor(index) }]}>
          <Text style={styles.avatarText}>{getInitial(item)}</Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{fullName}</Text>
          <Text style={styles.contactPhone}>{phone}</Text>
        </View>
        <Icon name="chevron-right" size={20} color="#6B7C99" />
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Icon name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Select Contact</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Icon name="search" size={18} color="#6B7C99" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or number..."
            placeholderTextColor="#6B7C99"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Icon name="close" size={16} color="#6B7C99" />
            </TouchableOpacity>
          )}
        </View>

        {/* Count */}
        {!loading && !permissionDenied && (
          <Text style={styles.count}>
            {filteredContacts.length} contact
            {filteredContacts.length !== 1 ? 's' : ''}
          </Text>
        )}

        {/* Body */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#ff3b5c" />
            <Text style={styles.loadingText}>Loading contacts...</Text>
          </View>
        ) : permissionDenied ? (
          <View style={styles.centered}>
            <Icon name="block" size={48} color="#FF4757" />
            <Text style={styles.deniedTitle}>Permission Denied</Text>
            <Text style={styles.deniedSubtitle}>
              Allow contacts permission to pick from phonebook.
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadContacts}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredContacts.length === 0 ? (
          <View style={styles.centered}>
            <Icon name="person-search" size={48} color="#6B7C99" />
            <Text style={styles.deniedSubtitle}>No contacts found.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredContacts}
            renderItem={renderItem}
            keyExtractor={(item, index) =>
              item.recordID ? item.recordID.toString() : index.toString()
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0F1A',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 18,
    marginBottom: 8,
    height: 44,
    borderWidth: 1,
    borderColor: '#2A2D3E',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
  count: {
    color: '#6B7C99',
    fontSize: 11,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  contactPhone: {
    color: '#6B7C99',
    fontSize: 12,
    marginTop: 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  loadingText: {
    color: '#6B7C99',
    marginTop: 12,
    fontSize: 14,
  },
  deniedTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 14,
  },
  deniedSubtitle: {
    color: '#6B7C99',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  retryBtn: {
    marginTop: 18,
    backgroundColor: '#ff3b5c',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default PhoneContactModal;
