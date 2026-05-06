import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Linking,
  Modal,
  PanResponder,
  PermissionsAndroid,
  Platform,
  RefreshControl,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  DeviceEventEmitter,
} from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ImagePreviewModal from '../imagePreviewModal';
import VideoPlayerModal from '../videoPlayerModal';
import AudioPlayerModal from '../audioPlayerModal';
import ChatMessageItem from '../chatMessageItem';
import OlderConversationLoader from '../olderConversationLoader';
import ForwardMessageModal from '../forwardMessageModal';
import ReplyMessageModal from '../replyMessageModal';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useChatActions, useChatMessages } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import useToast from '../../hook/useToast';
import { selectedReplyMessageActions } from '../../store/redux/selectedReplyMessage.redux';
import { useUserData } from '../../hook/useUserData';
import { formatDateSeparator, formatMessageTime } from '../../config/utility';
 
const NUMBER_OF_MESSAGES_TO_LOAD = 50; 
const getMessageTimestamp = message => {
  return (
    message?.timestamp ||
    message?.createdAt ||
    message?.created_at ||
    message?.sentAt ||
    message?.sent_at ||
    message?.updatedAt ||
    null
  );
};

const getDateKey = timestamp => {
  if (!timestamp) return 'unknown-date';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'unknown-date';
  return date.toISOString().split('T')[0];
};

 

const getReplyTargetId = message => {
  const replyObject = message?.reply_to_message;

  const targetId =
    replyObject?.id ??
    message?.reply_to_message_id ??
    message?.replyToId ??
    message?.reply_to_id ??
    (typeof message?.replyTo === 'string' || typeof message?.replyTo === 'number'
      ? message.replyTo
      : message?.replyTo?.id);

  if (targetId === null || targetId === undefined) return null;
  return String(targetId);
};

const buildConversationItems = (messages, selectedContact, statuses = {}, styles) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  const sortedMessages = [...messages].sort((firstMessage, secondMessage) => {
    const firstTime = new Date(getMessageTimestamp(firstMessage) || 0).getTime();
    const secondTime = new Date(getMessageTimestamp(secondMessage) || 0).getTime();
    return firstTime - secondTime;
  });

  const items = [];
  let lastDateKey = null;

  sortedMessages.forEach(message => {
    const timestamp = getMessageTimestamp(message);
    const dateKey = getDateKey(timestamp);
    const computedMessageId =
      message?.id ?? `${getMessageTimestamp(message) || 'no-time'}-${message?.text || message?.message || 'msg'}`;
    const replyToMessage = message?.reply_to_message || null;
    const replyTargetId = getReplyTargetId(message);

    if (dateKey !== lastDateKey) {
      items.push({
        id: `date-${dateKey}`,
        type: 'day',
        text: formatDateSeparator(timestamp),
      });
      lastDateKey = dateKey;
    }

    items.push({
      id: String(computedMessageId),
      type: message?.isSelf ? 'right' : 'left',
      locationJson: message?.locationJson || null,
      text: message?.text || message?.message || '',
      mediaUrl: message?.mediaUrl || message?.media_url || null,
      mediaType: message?.mediaType || message?.media_type || null,
      replyTo: message?.replyTo || null,
      replyTargetId,
      time: formatMessageTime(timestamp),
      status: statuses[message?.id] || message?.status || null,
      reply_to_message: replyToMessage,
      avatarStyle: message?.isSelf ? undefined : styles.avatarSmallBlue,
      avatarText: message?.isSelf
        ? 'Y'
        : (selectedContact?.initial || selectedContact?.name?.charAt(0) || 'U'),
    });
  });

  return items;
};

const renderStatusIcon = status => {
  if (!status) return null;

  if (status === 'read') {
    return <Icon name="done-all" size={14} color="#2ED573" style={{ marginLeft: 4 }} />;
  }
  if (status === 'delivered') {
    return <Icon name="done-all" size={14} color="#8FA3C8" style={{ marginLeft: 4 }} />;
  }
  if (status === 'sent') {
    return <Icon name="done" size={14} color="#8FA3C8" style={{ marginLeft: 4 }} />;
  }
  return null;
};

const renderMessageActionButton = (styles, iconName, onPress) => {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={styles.messageActionButton}
    >
      <Icon name={iconName} size={14} color="#D7E3FF" />
    </TouchableOpacity>
  );
};

const renderMessageActionButtonSecondary = (styles, iconName, onPress) => {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={[styles.messageActionButton, styles.messageActionButtonSecondary]}
    >
      <Icon name={iconName} size={14} color="#D7E3FF" />
    </TouchableOpacity>
  );
};

const ReplySwipeWrapper = React.memo(({
  children,
  item,
  onSwipeReply,
  enabled = true,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;

  const resetPosition = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 6,
      speed: 16,
    }).start();
  }, [translateX]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          if (!enabled) return false;
          const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
          return isHorizontal && gestureState.dx > 6;
        },
        onPanResponderMove: (_, gestureState) => {
          if (!enabled) return;
          const dx = Math.max(0, Math.min(gestureState.dx, 90));
          translateX.setValue(dx);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (enabled && gestureState.dx > 62) {
            onSwipeReply?.(item);
          }
          resetPosition();
        },
        onPanResponderTerminate: () => {
          resetPosition();
        },
      }),
    [enabled, item, onSwipeReply, resetPosition, translateX],
  );

  return (
    <Animated.View
      style={{ transform: [{ translateX }] }}
      {...(enabled ? panResponder.panHandlers : {})}
    >
      {children}
    </Animated.View>
  );
});

const ConversationList = ({
  styles,
}) => {
  const navigation = useNavigation();
  const flatListRef = useRef(null);
  const loadedRoomIdsRef = useRef(new Set());
  const shouldScrollAfterLoadRef = useRef(false);
  const pendingAutoScrollPassesRef = useRef(0);
  const wasConnectedRef = useRef(false);
  const AUTO_SCROLL_PASSES = 6;
  const [refreshing, setRefreshing] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const lastSeenMessageKeyRef = useRef(null);
  const lastBannerEventKeyRef = useRef('');
  const lastReadBatchKeyRef = useRef('');
  const didInitialRoomScrollRef = useRef(false);
  const dispatch = useDispatch();
  const replyingItem = useSelector(state => state.selectedReplyMessage);
//   console.log("replyingItem", replyingItem);

  const [forwardingItem, setForwardingItem] = useState(null);
  const [menuItem, setMenuItem] = useState(null);
  const menuItemRef = useRef(null);
   

  const { loadMessages, markAsRead, sendMessage:sendMessageToRecipent } = useChatActions();
    const { isConnected } = useSocket();
  const { showSuccess, showError } = useToast();
  const { conversations, pagination, messageStatuses } = useChatMessages();
  const chatSelectedTrustedContact = useSelector(state => state.chatSelectedTrustedContact);
  const {userData} = useUserData();
  const selectedContact = chatSelectedTrustedContact;
  const currentUserId = userData?.id;
  const currentRoomId = selectedContact?.roomId;
  const currentRoomPagination = pagination?.[currentRoomId] || {};
  const isHistoryLoading = !!currentRoomPagination.loading;
  const hasMoreHistory = currentRoomPagination.hasMore !== false;


  const currentRoomConversations = useMemo(
    () =>
      (conversations?.[currentRoomId] || []).map(message => ({
        ...message,
        isSelf:
          typeof message?.isSelf === 'boolean'
            ? message.isSelf
            : message?.senderId === currentUserId,
      })),
    [conversations, currentRoomId, currentUserId],
  );

  const [activeImageUrl, setActiveImageUrl] = useState('');
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState('');
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [activeAudioUrl, setActiveAudioUrl] = useState('');
  const [isAudioModalVisible, setIsAudioModalVisible] = useState(false);

  const handleOpenImageModal = useCallback(imageUrl => {
    if (!imageUrl) return;
    setActiveImageUrl(imageUrl);
    setIsImageModalVisible(true);
  }, []);

  const handleCloseImageModal = useCallback(() => {
    setIsImageModalVisible(false);
    setActiveImageUrl('');
  }, []);

  const handleOpenVideoModal = useCallback(videoUrl => {
    if (!videoUrl) return;
    setActiveVideoUrl(videoUrl);
    setIsVideoModalVisible(true);
  }, []);

  const handleCloseVideoModal = useCallback(() => {
    setIsVideoModalVisible(false);
    setActiveVideoUrl('');
  }, []);

  const handleOpenAudioModal = useCallback(audioUrl => {
    if (!audioUrl) return;
    setActiveAudioUrl(audioUrl);
    setIsAudioModalVisible(true);
  }, []);

  const handleCloseAudioModal = useCallback(() => {
    setIsAudioModalVisible(false);
    setActiveAudioUrl('');
  }, []);

  const handleOpenDocument = useCallback(async documentUrl => {
    if (!documentUrl) return false;

    try {
      let finalUrl = documentUrl.trim();

      if (!finalUrl.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:/)) {
        if (finalUrl.startsWith('//')) {
          finalUrl = 'https:' + finalUrl;
        } else if (finalUrl.startsWith('/')) {
          finalUrl = 'https:' + finalUrl;
        } else {
          finalUrl = 'https://' + finalUrl;
        }
      }

      // Request Android storage permission for API < 29
      if (Platform.OS === 'android' && Platform.Version < 29) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission denied', 'Storage permission is required to download files.');
          return;
        }
      }

      const fileName = finalUrl.split('/').pop()?.split('?')[0] || `document_${Date.now()}`;
      const downloadDir =
        Platform.OS === 'ios'
          ? RNBlobUtil.fs.dirs.DocumentDir
          : RNBlobUtil.fs.dirs.DownloadDir;
      const filePath = `${downloadDir}/${fileName}`;

      showSuccess('Downloading', `Saving ${fileName}...`);

      await RNBlobUtil.config({
        path: filePath,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          title: fileName,
          description: 'Downloading document...',
          mime: 'application/octet-stream',
          mediaScannable: true,
          path: filePath,
        },
      }).fetch('GET', finalUrl);

      if (Platform.OS === 'ios') {
        await RNBlobUtil.ios.openDocument(filePath);
      } else {
        showSuccess('Download complete', `${fileName} saved to Downloads.`);
      }
      return true;
    } catch {
      Alert.alert('Download error', 'Unable to download this document. Please try again.');
      return false;
    }
  }, [showSuccess]);

  const forwardMessage = useCallback(async (contacts, item) => {
    //sendMessageToRecipent
       console.log('Forwarding message/item:', item);
       console.log('Forwarding to contacts:', contacts);

       if(contacts.length > 0){
         for(const contact of contacts){
            const roomId = contact.roomId;
            const recipientId = contact.receipent_id;
            const text = item.text;
            const media = item.mediaUrl ? { url: item.mediaUrl, mediaType: item.mediaType } : null;
            const location = item.locationJson ? item.locationJson : null;
            try {
                await sendMessageToRecipent(roomId, recipientId, text, media, location);
                showSuccess('Success', `Message forwarded to ${contact.name}`);
            } catch (error) {
                console.log(`Error forwarding message to ${contact.name} (ID: ${contact.id}):`, error);
                showError('Failed', `Failed to forward message to ${contact.name}`);
            }
         }
       }
  },[]);

  const handleOpenLocationInMaps = useCallback(async (latitude, longitude) => {
    const mapLabel = encodeURIComponent('Shared Location');
    const url = Platform.select({
      ios: `http://maps.apple.com/?ll=${latitude},${longitude}&q=${mapLabel}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${mapLabel})`,
      default: `https://maps.google.com/?q=${latitude},${longitude}`,
    });

    if (!url) {
      Alert.alert('Map error', 'Unable to open map for this location.');
      return;
    }

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Map error', 'Unable to open map for this location.');
    }
  }, []);

  const handleReplyPress = useCallback(item => {
    dispatch(selectedReplyMessageActions.setSelectedReplyMessage(item));
  }, [dispatch]);

  const handleForwardPress = useCallback(item => {
    setForwardingItem(item);
  }, []);

  const handleForwardClose = useCallback(() => {
    setForwardingItem(null);
  }, []);

  const handleOpenMap = useCallback(() => {
    if (!selectedContact?.receipent_id) return;
    navigation.navigate('Main', {
      screen: 'MainTabs',
      params: {
        screen: 'Map',
        params: { selectedMapRecipentId: selectedContact.receipent_id },
      },
    });
  }, [navigation, selectedContact?.receipent_id]);

  const handleOpenAudio = useCallback(() => {
    if (!selectedContact?.receipent_id) return;
    navigation.navigate('Main', {
      screen: 'MainTabs',
      params: {
        screen: 'AudioStream',
        params: { selectedReceipentId: selectedContact.receipent_id },
      },
    });
  }, [navigation, selectedContact?.receipent_id]);

  const handleOpenHealth = useCallback(() => {
    if (!selectedContact?.receipent_id) return;
    navigation.navigate('Main', { 
      screen: 'MainTabs',
      params: {
        screen: 'Health',
        params: { selectedHealthRecipentId: selectedContact.receipent_id },
      },
    });
  }, [navigation, selectedContact?.receipent_id]);

  const handleReplyClose = useCallback(() => {
    dispatch(selectedReplyMessageActions.resetState());
  }, [dispatch]);

  const handleMenuClose = useCallback(() => {
    menuItemRef.current = null;
    setMenuItem(null);
  }, []);

  const handleMenuToggle = useCallback(item => {
    menuItemRef.current = item;
    setMenuItem(item);
  }, []);

  const stableItemCacheRef = useRef({});
  const chatItems = useMemo(() => {
    const rawItems = buildConversationItems(
      currentRoomConversations,
      selectedContact,
      messageStatuses,
      styles,
    );
    const newCache = {};
    const result = rawItems.map(item => {
      const prev = stableItemCacheRef.current[item.id];
      if (
        prev &&
        prev.type === item.type &&
        prev.text === item.text &&
        prev.status === item.status &&
        prev.mediaUrl === item.mediaUrl &&
        prev.mediaType === item.mediaType &&
        prev.time === item.time &&
        prev.locationJson === item.locationJson &&
        prev.replyTargetId === item.replyTargetId &&
        prev.avatarText === item.avatarText
      ) {
        newCache[item.id] = prev;
        return prev;
      }
      newCache[item.id] = item;
      return item;
    });
    stableItemCacheRef.current = newCache;
    return result;
  }, [currentRoomConversations, selectedContact, messageStatuses, styles]);

  const messageIndexById = useMemo(() => {
    const idToIndex = new Map();
    chatItems.forEach((chatItem, index) => {
      if (chatItem?.type !== 'day' && chatItem?.id) {
        idToIndex.set(String(chatItem.id), index);
      }
    });
    return idToIndex;
  }, [chatItems]);

   

  const isInitialConversationLoading =
    isHistoryLoading && currentRoomConversations.length === 0;
  const isLoadingOlderConversations =
    isHistoryLoading && currentRoomConversations.length > 0 && (currentRoomPagination.page || 1) > 1;

  const handleScroll = useCallback(event => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const threshold = 150;
    const nearBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;

    setIsNearBottom(nearBottom);
    setShowScrollToBottom(!nearBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setShowScrollToBottom(false);
  }, []);

  const scrollToBottomImmediate = useCallback(() => {
    const runScroll = () => {
      flatListRef.current?.scrollToEnd({ animated: false });
    };

    requestAnimationFrame(() => {
      runScroll();
      requestAnimationFrame(runScroll);
      setTimeout(runScroll, 40);
      setTimeout(runScroll, 120);
    });
  }, []);

  useEffect(() => {
    if (!currentRoomConversations.length) return;

    const lastMessage = currentRoomConversations[currentRoomConversations.length - 1];
    const lastMessageKey =
      lastMessage?.id || `${getMessageTimestamp(lastMessage) || 'no-time'}-${lastMessage?.text || lastMessage?.message || ''}`;

    if (lastMessageKey === lastSeenMessageKeyRef.current) {
      return;
    }

    const isIncomingMessage = !lastMessage?.isSelf;
    if (isIncomingMessage && !isNearBottom) {
      const bannerEventKey = `${currentRoomId || 'unknown-room'}:${lastMessageKey}`;
      if (bannerEventKey !== lastBannerEventKeyRef.current) {
        lastBannerEventKeyRef.current = bannerEventKey;
        DeviceEventEmitter.emit('chat:new-message-banner', {
          title: selectedContact?.name || 'New Message',
          body: lastMessage?.text || lastMessage?.message || 'You have received a new message.',
        });
      }
    }

    if (isNearBottom) {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      });
    }

    lastSeenMessageKeyRef.current = lastMessageKey;
  }, [currentRoomConversations, isNearBottom, selectedContact, currentRoomId]);

  

   useEffect(() => {
    if (!currentRoomId) return;
    const roomKey = String(currentRoomId);

    if (loadedRoomIdsRef.current.has(roomKey)) return; // ✅ use ref
    loadedRoomIdsRef.current.add(roomKey);              // ✅ use ref
    shouldScrollAfterLoadRef.current = true;
    pendingAutoScrollPassesRef.current = AUTO_SCROLL_PASSES;
    didInitialRoomScrollRef.current = false;

    loadMessages(currentRoomId, 1, NUMBER_OF_MESSAGES_TO_LOAD).catch(() => {});
  }, [currentRoomId, loadMessages]);


const focusCallback = useCallback(() => {
  if (!currentRoomId || !currentRoomConversations?.length) return;

  const unreadMessages = currentRoomConversations.filter(msg => {
    const isIncoming = !msg.isSelf;
    const messageStatus = msg?.status || messageStatuses[msg?.id];
    const isUnread = messageStatus !== 'read';
    return isIncoming && isUnread;
  });

  if (unreadMessages.length > 0) {
    const messagesById = unreadMessages.map(m => m?.id).filter(Boolean).sort();
    const senderId = unreadMessages[0]?.senderId || selectedContact?.receipent_id;
    const unreadBatchKey = `${currentRoomId}:${senderId || 'unknown'}:${messagesById.join(',')}`;

    if (unreadBatchKey === lastReadBatchKeyRef.current) return;

    if (messagesById.length > 0 && senderId) {
      lastReadBatchKeyRef.current = unreadBatchKey;
      markAsRead(messagesById, senderId).catch(() => {});
    }
  } else {
    lastReadBatchKeyRef.current = '';
  }
}, [currentRoomId, currentRoomConversations, messageStatuses, selectedContact, markAsRead]);

 
useFocusEffect(focusCallback);

  const handleRefresh = useCallback(async () => {
    if (!currentRoomId || isHistoryLoading || !hasMoreHistory) {
      return;
    }

    setRefreshing(true);
    try {
      const nextPage = (currentRoomPagination.page || 1) + 1;
      await loadMessages(currentRoomId, nextPage, currentRoomPagination.limit || NUMBER_OF_MESSAGES_TO_LOAD);
    } finally {
      setRefreshing(false);
    }
  }, [currentRoomId, isHistoryLoading, hasMoreHistory, currentRoomPagination.page, currentRoomPagination.limit, loadMessages]);

  useEffect(() => {
    const lastRoomMessage = currentRoomConversations[currentRoomConversations.length - 1];
    const baselineKey = lastRoomMessage
      ? (lastRoomMessage?.id || `${getMessageTimestamp(lastRoomMessage) || 'no-time'}-${lastRoomMessage?.text || lastRoomMessage?.message || ''}`)
      : null;

    lastSeenMessageKeyRef.current = baselineKey;
    lastBannerEventKeyRef.current = baselineKey
      ? `${currentRoomId || 'unknown-room'}:${baselineKey}`
      : '';

    setShowScrollToBottom(false);
    setIsNearBottom(true);
    didInitialRoomScrollRef.current = false;
  }, [currentRoomId]);

  const scrollToRepliedMessage = useCallback((replyTargetId) => {
    if (!replyTargetId) return;

    const targetIndex = messageIndexById.get(String(replyTargetId));
    if (targetIndex === undefined) {
      
      return;
    }

    flatListRef.current?.scrollToIndex({
      index: targetIndex,
      animated: true,
      viewPosition: 0.5,
    });
  }, [messageIndexById]);

  const renderChatItem = useCallback(({ item }) => {
    return (
      <ChatMessageItem
        item={item}
        styles={styles}
        ReplySwipeWrapper={ReplySwipeWrapper}
        onReplyPress={handleReplyPress}
        onMenuToggle={handleMenuToggle}
        onPressReplyTarget={scrollToRepliedMessage}
        onOpenLocationInMaps={handleOpenLocationInMaps}
        handleOpenImageModal={handleOpenImageModal}
        handleOpenVideoModal={handleOpenVideoModal}
        handleOpenAudioModal={handleOpenAudioModal}
        handleOpenDocument={handleOpenDocument}
        renderStatusIcon={renderStatusIcon}
      />
    );
  }, [
    styles,
    handleReplyPress,
    handleMenuToggle,
    scrollToRepliedMessage,
    handleOpenLocationInMaps,
    handleOpenImageModal,
    handleOpenVideoModal,
    handleOpenAudioModal,
    handleOpenDocument,
  ]);

const handleReload = useCallback(() => {
    if (!currentRoomId) return;
    const roomKey = String(currentRoomId);
    loadedRoomIdsRef.current.delete(roomKey); // ✅ use ref
  shouldScrollAfterLoadRef.current = true;
    pendingAutoScrollPassesRef.current = AUTO_SCROLL_PASSES;
    didInitialRoomScrollRef.current = false;
    loadMessages(currentRoomId, 1, NUMBER_OF_MESSAGES_TO_LOAD).catch(() => {});
  }, [currentRoomId, loadMessages, AUTO_SCROLL_PASSES]);

  useEffect(() => {
    const reconnected = !wasConnectedRef.current && isConnected;

    if (reconnected && currentRoomId ) {
      
      const roomKey = String(currentRoomId);
      loadedRoomIdsRef.current.delete(roomKey);
      shouldScrollAfterLoadRef.current = true;
      pendingAutoScrollPassesRef.current = AUTO_SCROLL_PASSES;
      didInitialRoomScrollRef.current = false;
      loadMessages(currentRoomId, 1, NUMBER_OF_MESSAGES_TO_LOAD).catch(() => {});
    }

    wasConnectedRef.current = isConnected;
  }, [isConnected, currentRoomId, loadMessages, AUTO_SCROLL_PASSES]);

  const keyExtractor = useCallback(item => String(item.id), []);

  const renderListHeader = useCallback(
    () => <OlderConversationLoader visible={isLoadingOlderConversations} styles={styles} />,
    [isLoadingOlderConversations, styles],
  );

  const contentContainerStyle = useMemo(
    () => [
      styles.chatContent,
      chatItems.length === 0 && styles.chatContentEmpty,
    ],
    [styles.chatContent, styles.chatContentEmpty, chatItems.length],
  );

  const handleFlatListScroll = useCallback(
    event => {
      if (menuItemRef.current !== null) handleMenuClose();
      handleScroll(event);
    },
    [handleMenuClose, handleScroll],
  );

  const handleScrollToIndexFailed = useCallback(info => {
    flatListRef.current?.scrollToOffset({
      offset: Math.max(0, info.averageItemLength * info.index),
      animated: true,
    });
  }, []);

  const handleContentSizeChange = useCallback(() => {
    if (
      !shouldScrollAfterLoadRef.current ||
      chatItems.length === 0
    ) {
      return;
    }

    scrollToBottomImmediate();
    setShowScrollToBottom(false);

    pendingAutoScrollPassesRef.current = Math.max(
      0,
      pendingAutoScrollPassesRef.current - 1,
    );
    if (pendingAutoScrollPassesRef.current <= 0) {
      shouldScrollAfterLoadRef.current = false;
      pendingAutoScrollPassesRef.current = 0;
    }
  }, [chatItems.length, scrollToBottomImmediate]);

  const renderNoConversation = useCallback(() => {
    if (isInitialConversationLoading) {
      return (
        <View style={styles.historyLoaderScreen}>
          <View style={styles.historyLoaderCard}>
            <ActivityIndicator size="small" color="#2ED573" />
            <Text style={styles.historyLoaderTitle}>Loading conversation...</Text>
            <Text style={styles.historyLoaderSubtitle}>Fetching earlier messages for this chat.</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.emptyStateWrapper}>
        <View style={styles.emptyStateIconCircle}>
          <Icon name="chat-bubble-outline" size={32} color="#8FA3C8" />
        </View>
        <Text style={styles.emptyStateTitle}>No conversations yet</Text>
        <Text style={styles.emptyStateSubtitle}>
          Start a conversation with {selectedContact?.name || 'this contact'}. Your messages will appear here.
        </Text>
        <TouchableOpacity
          onPress={handleReload}
          activeOpacity={0.8}
          style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, backgroundColor: 'rgba(46,213,115,0.15)', borderWidth: 1, borderColor: '#2ED573' }}
        >
          <Icon name="refresh" size={16} color="#2ED573" />
          <Text style={{ color: '#2ED573', fontSize: 13 }}>Reload</Text>
        </TouchableOpacity>
      </View>
    );
  }, [isInitialConversationLoading, styles, selectedContact?.name, handleReload]);

  return (
    <>
      <FlatList
        ref={flatListRef}
        data={chatItems}
        keyExtractor={keyExtractor}
        renderItem={renderChatItem}
        showsVerticalScrollIndicator={false}
        style={styles.chatScroll}
        contentContainerStyle={contentContainerStyle}
        windowSize={10}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={15}
        removeClippedSubviews={Platform.OS === 'android'}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderNoConversation}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
        onScroll={handleFlatListScroll}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={100}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2ED573"
            colors={['#2ED573']}
          />
        }
      />

      <ImagePreviewModal
        visible={isImageModalVisible}
        imageUrl={activeImageUrl}
        onClose={handleCloseImageModal}
      />

      <VideoPlayerModal
        visible={isVideoModalVisible}
        videoUrl={activeVideoUrl}
        onClose={handleCloseVideoModal}
      />

      <AudioPlayerModal
        visible={isAudioModalVisible}
        audioUrl={activeAudioUrl}
        onClose={handleCloseAudioModal}
      />

      {showScrollToBottom && (
        <TouchableOpacity style={styles.scrollToBottomBtn} onPress={scrollToBottom} activeOpacity={0.85}>
          <Icon name="keyboard-arrow-down" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {selectedContact?.receipent_id && (
        <View
          style={{
            position: 'absolute',
            top: 12,
            left: 0,
            right: 0,
            zIndex: 10,
            alignItems: 'center',
            pointerEvents: 'box-none',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
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
              onPress={handleOpenMap}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 22,
                gap: 3,
              }}
            >
              <Icon name="map" size={16} color="#34D399" />
              
            </TouchableOpacity>

            <View style={{ width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.1)' }} />

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleOpenAudio}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 22,
                gap: 3,
              }}
            >
              <Icon name="mic" size={16} color="#60A6FF" />
             
            </TouchableOpacity>

            <View style={{ width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.1)' }} />

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleOpenHealth}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 22,
                gap: 3,
              }}
            >
              <Icon name="favorite" size={16} color="#AA3CFF" />
              
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ForwardMessageModal
        visible={forwardingItem !== null}
        item={forwardingItem}
        onClose={handleForwardClose}
        onSend={forwardMessage}
      />

      <ReplyMessageModal
        visible={replyingItem?.id ? true : false}
        item={replyingItem}
        onClose={handleReplyClose}
      />

      <Modal
        visible={menuItem !== null}
        transparent
        animationType="fade"
        onRequestClose={handleMenuClose}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={handleMenuClose}>
          <View style={styles.messageActionModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.messageActionModalSheet}>
                <View style={styles.messageActionModalHandle} />

                <TouchableOpacity
                  activeOpacity={0.82}
                  style={styles.messageActionModalItem}
                  onPress={() => {
                    handleMenuClose();
                    handleReplyPress(menuItem);
                  }}
                >
                  <View style={styles.messageActionModalIconWrap}>
                    <Icon name="reply" size={18} color="#60A6FF" />
                  </View>
                  <Text style={styles.messageActionModalText}>Reply</Text>
                </TouchableOpacity>

                <View style={styles.messageActionModalDivider} />

                <TouchableOpacity
                  activeOpacity={0.82}
                  style={styles.messageActionModalItem}
                  onPress={() => {
                    handleMenuClose();
                    handleForwardPress(menuItem);
                  }}
                >
                  <View style={styles.messageActionModalIconWrap}>
                    <Icon name="forward" size={18} color="#60A6FF" />
                  </View>
                  <Text style={styles.messageActionModalText}>Forward</Text>
                </TouchableOpacity>

                <View style={styles.messageActionModalDivider} />

            
                <TouchableOpacity
                  activeOpacity={0.82}
                  style={[styles.messageActionModalItem, styles.messageActionModalCancelItem]}
                  onPress={handleMenuClose}
                >
                  <Text style={styles.messageActionModalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

export default React.memo(ConversationList);
