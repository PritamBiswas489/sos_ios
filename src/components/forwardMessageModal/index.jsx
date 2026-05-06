import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import { useChatContacts } from '../../hook/useChatContacts';
import { useChatPresence } from '../../context/ChatContext';
import styles from './style';
import { useUserData } from '../../hook/useUserData';

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
  const key = `${item?.id ?? ''}-${item?.name ?? ''}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

const ForwardMessageModal = ({ visible, item, onClose, onSend }) => {
  const [searchText, setSearchText] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const { contactList, fetchChatContacts } = useChatContacts();
  const onlineUsers = useChatPresence();
  const {userData} = useUserData();
  const currentUserId = userData?.id;

  // Same processing logic as ContactAvatarList
  const allContacts = useMemo(() => {
    if (!contactList || contactList.length === 0) return [];

    const trustedContacts = [];
    const otherContacts = [];

    for (const contact of contactList) {
      const roomId = [contact.user_id, contact.trusted_user_id].sort().join(':');
      if (contact.user_id === currentUserId) {
        const displayName = contact.nickname || contact.trusted_contact?.name || contact.relationship || '?';
        trustedContacts.push({
          id: contact.id,
          name: displayName,
          initial: displayName.charAt(0).toUpperCase(),
          isOnline: onlineUsers[contact.trusted_user_id] || false,
          receipent_id: contact.trusted_user_id,
          phone_number: contact.trusted_contact?.phone_number,
          roomId,
        });
      } else if (contact.trusted_user_id === currentUserId) {
        const displayName =
          contact?.inviter?.name || contact?.inviter?.phone_number || contact?.relationship || '?';
        otherContacts.push({
          id: contact.id,
          name: displayName,
          initial: displayName.charAt(0).toUpperCase(),
          phone_number: contact?.inviter?.phone_number,
          isOnline: onlineUsers[contact.user_id] || false,
          receipent_id: contact.user_id,
          roomId,
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
  }, [contactList, currentUserId, onlineUsers]);

  useEffect(() => {
    if (visible && allContacts.length === 0) {
      fetchChatContacts();
    }
  }, [visible, fetchChatContacts, allContacts.length]);

  const contacts = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return allContacts;
    return allContacts.filter(c => c.name.toLowerCase().includes(query));
  }, [allContacts, searchText]);

  const handleToggle = useCallback(id => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  }, []);

  const handleSend = useCallback(() => {
    const selected = allContacts.filter(c => selectedIds.includes(c.id));
    if (onSend) {
      onSend(selected, item);
    }
    setSelectedIds([]);
    setSearchText('');
    onClose();
  }, [selectedIds, allContacts, item, onSend, onClose]);

  const handleClose = useCallback(() => {
    setSelectedIds([]);
    setSearchText('');
    onClose();
  }, [onClose]);

  const renderContact = useCallback(
    ({ item: contact }) => {
      const avatarColor = getAvatarColor(contact);
      const isSelected = selectedIds.includes(contact.id);
      const statusColor = contact.isOnline ? '#2ED573' : '#7A8499';

      return (
        <TouchableOpacity
          activeOpacity={0.78}
          style={styles.contactRow}
          onPress={() => handleToggle(contact.id)}
        >
          <View style={[styles.contactAvatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.contactAvatarText}>{contact.initial}</Text>
            <View style={[styles.onlineDot, { backgroundColor: statusColor }]} />
          </View>

          <View style={styles.contactInfo}>
            <Text style={styles.contactName} numberOfLines={1}>
              {contact.name}
            </Text>
            {contact.phone_number ? (
              <Text style={styles.contactPhone} numberOfLines={1}>
                {contact.phone_number}
              </Text>
            ) : null}
          </View>

          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Icon name="check" size={14} color="#FFFFFF" />}
          </View>
        </TouchableOpacity>
      );
    },
    [selectedIds, handleToggle],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Forward to</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              activeOpacity={0.8}
            >
              <Icon name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Message preview */}
          {item && (item.text || item.mediaType) && (
            <View style={styles.previewBox}>
              <Icon
                name={item.mediaType ? 'attachment' : 'chat-bubble-outline'}
                size={14}
                color="#8FA3C8"
                style={styles.previewIcon}
              />
              <Text style={styles.previewText} numberOfLines={2}>
                {item.text || item.mediaType}
              </Text>
            </View>
          )}

          {/* Search */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={18} color="#8FA3C8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts..."
              placeholderTextColor="#4A5568"
              value={searchText}
              onChangeText={setSearchText}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')} activeOpacity={0.8}>
                <Icon name="cancel" size={16} color="#8FA3C8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Contact list */}
          <FlatList
            data={contacts}
            keyExtractor={contact => String(contact.id)}
            renderItem={renderContact}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyWrapper}>
                <Icon name="group" size={30} color="#8FA3C8" />
                <Text style={styles.emptyText}>No contacts found</Text>
              </View>
            }
          />

          {/* Send button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.sendBtn,
                selectedIds.length === 0 && styles.sendBtnDisabled,
              ]}
              activeOpacity={0.85}
              onPress={handleSend}
              disabled={selectedIds.length === 0}
            >
              <Icon name="send" size={16} color="#FFFFFF" style={styles.sendIcon} />
              <Text style={styles.sendBtnText}>
                {selectedIds.length > 0
                  ? `Send to ${selectedIds.length} contact${selectedIds.length > 1 ? 's' : ''}`
                  : 'Send'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default React.memo(ForwardMessageModal);
