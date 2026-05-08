import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from './style';
import { useSelector, useDispatch } from 'react-redux';
import { chatSelectedTrustedContactActions } from '../../store/redux/chatSelectedTrustedContact.redux';
import { useChatPresence } from '../../context/ChatContext';
 
import appColors from '../../theme/appColors';
import { useUserData } from '../../hook/useUserData';
import { getProfileImage } from '../../config/utility'; 


const ContactAvatarList = ({
  navigation,
  chatContacts,
  fetchChatContacts
}) => {
    const ONLINE_COLOR = '#2ED573';

    const onlineUsers = useChatPresence();
     const [refreshing, setRefreshing] = useState(false);
      const lastOffsetXRef = useRef(0);
      const endReachedFiredRef = useRef(false);
      const flatListRef = useRef(null);
      const lastAutoScrolledIdRef = useRef(null);

     const dispatch = useDispatch();
    
     const chatSelectedTrustedContact = useSelector(state => state.chatSelectedTrustedContact);
     const {userData, hasLicense} = useUserData();
     const usrId = userData?.id;

    

    const selectContact = useCallback(item => {
      dispatch(chatSelectedTrustedContactActions.setSelectedTrustedContact(item));
    }, [dispatch]);

    const navigateToAddContact = useCallback(() => {
      navigation.navigate('AddContact');
    }, [navigation]);

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

    const renderContactItem = useCallback(({ item }) => {
      const isSelected = chatSelectedTrustedContact?.id === item.id;
      const avatarColor = getAvatarColor(item);

      return (
        <TouchableOpacity
          key={item.id}
          style={[styles.avatarItem, isSelected && styles.avatarItemSelected]}
          activeOpacity={0.7}
          onPress={() => selectContact(item)}
        >
          <View style={styles.avatarCircleWrap}>
            <View
              style={[
                styles.avatarCircle,
                {
                  borderColor: isSelected ? appColors.primary : 'rgba(255,255,255,0.35)',
                  backgroundColor: avatarColor,
                },
              ]}
            >
              {item.profile_image ? (
                <Image
                  source={{ uri: item.profile_image }} 
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={[styles.avatarText, isSelected && { fontWeight: 'bold' }]}> 
                  {item.initial}
                </Text>
              )}
            </View>

            {item.isOnline && <View style={styles.onlineDot} />}
          </View>

          <View style={styles.avatarMeta}>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.avatarLabel, isSelected && styles.avatarLabelSelected]}
            >
              {item.name}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }, [chatSelectedTrustedContact?.id, selectContact]);
    const handleRefresh = useCallback(async () => {
      if (refreshing) return;
      console.log('Refreshing contact list...');
      setRefreshing(true);

      try {
        await fetchChatContacts();
      } finally {
        setRefreshing(false);
      }
    }, [refreshing, fetchChatContacts]);

    const handleHorizontalScroll = useCallback((event) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const isMovingRight = contentOffset.x > lastOffsetXRef.current;
      lastOffsetXRef.current = contentOffset.x;
      const distanceFromEnd = contentSize.width - (contentOffset.x + layoutMeasurement.width);
      if (distanceFromEnd <= 5 && isMovingRight && !endReachedFiredRef.current) {
        endReachedFiredRef.current = true;
        handleRefresh();
      }
      if (distanceFromEnd > 40) {
        endReachedFiredRef.current = false;
      }
    }, [handleRefresh]);

    useEffect(() => {
      if (!chatSelectedTrustedContact?.id || !Array.isArray(chatContacts) || chatContacts.length === 0) {
        return;
      }

      if (lastAutoScrolledIdRef.current === chatSelectedTrustedContact.id) {
        return;
      }

      const selectedIndex = chatContacts.findIndex(contact => contact?.id === chatSelectedTrustedContact.id);
      if (selectedIndex < 0) {
        return;
      }

      requestAnimationFrame(() => {
        flatListRef.current?.scrollToIndex({
          index: selectedIndex,
          animated: true,
          viewPosition: 0.5,
        });
      });

      lastAutoScrolledIdRef.current = chatSelectedTrustedContact.id;
    }, [chatContacts, chatSelectedTrustedContact?.id]);

    const handleScrollToIndexFailed = useCallback((info) => {
      const estimatedOffset = Math.max(0, info.averageItemLength * info.index);
      flatListRef.current?.scrollToOffset({ offset: estimatedOffset, animated: true });
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: info.index,
          animated: true,
          viewPosition: 0.5,
        });
      }, 100);
    }, []);

  return (
    <View style={styles.avatarRowContainer}>
      <FlatList
        ref={flatListRef}
        horizontal
        data={chatContacts}
        keyExtractor={item => String(item.id)}
        renderItem={renderContactItem}
        extraData={chatSelectedTrustedContact?.id}
        showsHorizontalScrollIndicator={false}
        style={styles.avatarRow}
        contentContainerStyle={styles.avatarRowContent}
        onScroll={handleHorizontalScroll}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        scrollEventThrottle={16}
        refreshControl={
           <RefreshControl
                      refreshing={refreshing}
                      
                      tintColor="#2ED573"
                      colors={['#2ED573']}
                    />
        }
       
        
        
        ListFooterComponent={
          hasLicense ? (
            <TouchableOpacity
              style={[styles.avatarItem, styles.addItem]}
              activeOpacity={0.7}
              onPress={navigateToAddContact}
            >
              <View style={styles.avatarAdd}>
                <Text style={{ color: '#4DA3FF', fontSize: 20 }}>+</Text>
              </View>
              <View style={styles.avatarMeta}>
                <Text style={styles.avatarLabel}>Add Contact</Text>
                <Text style={styles.avatarPhoneNumber}>Create new chat</Text>
              </View>
            </TouchableOpacity>
          ) : null
        }
      />
      <TouchableOpacity
        onPress={handleRefresh}
        disabled={refreshing}
        style={styles.refreshIconBtn}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Refresh contacts"
      >
        {refreshing
          ? <ActivityIndicator size={16} color={ONLINE_COLOR} />
          : <Icon name="refresh" size={20} color={ONLINE_COLOR} />}
      </TouchableOpacity>
    </View>
  );
};

export default React.memo(ContactAvatarList);
