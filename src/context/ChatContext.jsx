import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { AppState } from 'react-native';
import { useSelector } from 'react-redux';
import { useSocket } from './SocketContext';
import { useChatContacts } from '../hook/useChatContacts';
import { displayRemoteNotification } from '../services/notification.service';
import { useUserData } from '../hook/useUserData';
import api from '../config/authApi.config';
const ChatContext = createContext(null);
const ChatMessagesContext = createContext(null);
const ChatTypingContext = createContext(null);
const ChatPresenceContext = createContext(null);
const ChatActionsContext = createContext(null);

const initialState = {
  /** Object<chatId, Message[]> — chatId is recipientId for 1-on-1 or groupId for groups */
  conversations: {},
  /** Object<chatId, { userId, userName }> — who is currently typing */
  typingIndicators: {},
  /** Object<messageId, 'sent'|'delivered'|'read'> */
  messageStatuses: {},
  /** Object<userId, boolean> */
  onlineUsers: {},
  /** Object<chatId, { page, limit, hasMore, loading }> */
  pagination: {},
};

const sortMessagesByTime = messages => {
  return [...messages].sort((a, b) => {
    const getTime = message => {
      const raw =
        message?.timestamp ||
        message?.createdAt ||
        message?.created_at ||
        message?.sentAt ||
        message?.sent_at ||
        0;
      const parsed = new Date(raw).getTime();
      return Number.isNaN(parsed) ? 0 : parsed;
    };
    return getTime(a) - getTime(b);
  });
};

const mergeUniqueMessages = (baseMessages, incomingMessages) => {
  const combined = [...baseMessages, ...incomingMessages];
  const seen = new Set();
  const deduped = [];

  for (const msg of combined) {
    const key =
      msg?.id ||
      `${msg?.senderId || ''}-${msg?.text || ''}-${
        msg?.timestamp || msg?.createdAt || ''
      }`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(msg);
  }

  return sortMessagesByTime(deduped);
};

const chatReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_MESSAGE': {
      const { chatId, message } = action;
      const existing = state.conversations[chatId] || [];
      if (existing.some(m => m.id === message.id)) return state;
      const d = {
        ...state,
        conversations: {
          ...state.conversations,
          [chatId]: [...existing, message],
        },
      };
      //console.log('===============================================');
      //console.log(d);
      //console.log("ChatProvider: Updated conversations state:", d.conversations);
      return d;
    }
    case 'LOAD_MESSAGES': {
      const { chatId, messages } = action;
      return {
        ...state,
        conversations: { ...state.conversations, [chatId]: messages },
      };
    }
    case 'PREPEND_MESSAGES': {
      const { chatId, messages } = action;
      const existing = state.conversations[chatId] || [];
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [chatId]: mergeUniqueMessages(messages, existing),
        },
      };
    }
    case 'SET_PAGINATION': {
      const { chatId, pagination } = action;
      return {
        ...state,
        pagination: {
          ...state.pagination,
          [chatId]: {
            ...(state.pagination[chatId] || {}),
            ...pagination,
          },
        },
      };
    }
    case 'UPDATE_MESSAGE_STATUS': {
      const { messageId, status } = action;
      return {
        ...state,
        messageStatuses: { ...state.messageStatuses, [messageId]: status },
      };
    }
    case 'UPDATE_MESSAGE': {
      const { chatId, messageId, updates } = action;
      const existing = state.conversations[chatId] || [];
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [chatId]: existing.map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg,
          ),
        },
      };
    }
    case 'SET_TYPING': {
      const { chatId, userId, userName, isTyping } = action;
      const current = { ...state.typingIndicators };
      if (isTyping) {
        current[chatId] = { userId, userName };
      } else {
        delete current[chatId];
      }
      return { ...state, typingIndicators: current };
    }
    case 'SET_ONLINE': {
      const { userId, online } = action;
      return {
        ...state,
        onlineUsers: { ...state.onlineUsers, [userId]: online },
      };
    }
    default:
      return state;
  }
};

export const ChatProvider = ({ children }) => {
  //console.log('=====================================');
  //console.log('ChatProvider initialized');
  //console.log('=====================================');

  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { on, off, emit, isConnected } = useSocket();
  const typingTimers = useRef({});
  const { userData } = useUserData();
  const { contactList } = useChatContacts();
  const currentUserId = userData?.id;
  const currentScreenName = useSelector(state => state.currentScreen?.name);
  const chatSelectedTrustedContact = useSelector(
    state => state.chatSelectedTrustedContact,
  );
  const currentScreenRef = useRef(currentScreenName);
  const lastKnownScreenRef = useRef(currentScreenName);
  const chatSelectedTrustedContactRef = useRef(chatSelectedTrustedContact);

  useEffect(() => {
    currentScreenRef.current = currentScreenName;
    lastKnownScreenRef.current = currentScreenName;
  }, [currentScreenName]);

  useEffect(() => {
    const handleAppStateChange = nextState => {
      if (nextState === 'active') {
        currentScreenRef.current = lastKnownScreenRef.current;
      } else {
        console.log('App going to background, clearing current screen ref');
        currentScreenRef.current = null;
      }
    };
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, []);
  useEffect(() => {
    chatSelectedTrustedContactRef.current = chatSelectedTrustedContact;
  }, [chatSelectedTrustedContact]);

  useEffect(() => {
    if (!isConnected) {
      return;
    }
    const handleNewMessage = async message => {
      console.log('New Message:', message);
      if (
        !message?.isSelf &&
        ((currentScreenRef.current !== 'Chat' ||
          (chatSelectedTrustedContactRef.current.roomId !== message.roomId &&
            currentScreenRef.current === 'Chat')) && message?.senderId !== currentUserId)
      ) {
        const senderName = message?.senderName;
        ('New Message');
        const messageText = message?.text || 'You have a new message';

        await displayRemoteNotification({
          data: {
            type: 'chat',
            messageType: 'CHAT',
            title: senderName,
            body: messageText,
            senderId: message?.senderId,
          },
        }).catch(() => {});
      }

      const chatId = message.roomId; // Assuming message has roomId to identify conversation
      dispatch({ type: 'ADD_MESSAGE', chatId, message });
      // Auto-acknowledge delivery
      if (!message.isSelf) {
        emit(
          'message:delivered',
          JSON.stringify({
            messageId: message.id,
            senderId: message.senderId,
          }),
        ).catch(() => {});
      }
    };
    // Message status updates
    const handleStatus = ({ messageId, status }) => {
      dispatch({ type: 'UPDATE_MESSAGE_STATUS', messageId, status });
    };

    // Typing indicators
    const handleTypingStart = ({ userId, userName, chatWith, roomId }) => {
      const chatId = roomId;
      // console.log('===============================================');
      // console.log(`User ${userName} (${userId}) started typing in chat ${chatId}`);
      // console.log('===============================================');
      dispatch({
        type: 'SET_TYPING',
        chatId,
        userId,
        userName,
        isTyping: true,
      });
    };

    const handleTypingStop = ({ userId, chatWith, roomId }) => {
      const chatId = roomId;
      dispatch({ type: 'SET_TYPING', chatId, userId, isTyping: false });
    };

    // Online presence
    const handleOnline = ({ userId }) => {
      console.log(`User ${userId} is online`);
      dispatch({ type: 'SET_ONLINE', userId, online: true });
    };

    const handleOffline = ({ userId }) => {
      dispatch({ type: 'SET_ONLINE', userId, online: false });
    };
    const unsubs = [
      // setup event listeners
      on('message:new', handleNewMessage),
      on('typing:start', handleTypingStart),
      on('typing:stop', handleTypingStop),
      on('user:online', handleOnline),
      on('user:offline', handleOffline),
      on('message:status', handleStatus),
    ];
    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [isConnected, on, off, emit]);

  useEffect(() => {
    if (!isConnected || !currentUserId) return;

    const list = contactList;
    if (!Array.isArray(list) || list.length === 0) return;

    const userIds = [
      ...new Set(
        list
          .map(contact => {
            if (contact?.user_id === currentUserId)
              return contact?.trusted_user_id;
            if (contact?.trusted_user_id === currentUserId)
              return contact?.user_id;
            return null;
          })
          .filter(Boolean),
      ),
    ];

    if (userIds.length === 0) return;

    emit('presence:subscribe', JSON.stringify({ userIds }))
      .then(statuses => {
        if (!Array.isArray(statuses)) return;
        statuses.forEach(status => {
          if (!status?.userId) return;
          dispatch({
            type: 'SET_ONLINE',
            userId: status.userId,
            online: !!status.online,
          });
        });
      })
      .catch(() => {});
  }, [isConnected, currentUserId, contactList, emit]);

  const sendMessage = useCallback(
    async (
      roomId,
      recipientId,
      text,
      media = null,
      location = null,
      replyTo = null,
    ) => {
      const payload = { roomId, recipientId, text };
      if (media) {
        payload.mediaUrl = media.url;
        payload.mediaType = media.mediaType;
      }
      if (location?.latitude && location?.longitude) {
        payload.locationJson = location;
      }
      if (replyTo) {
        payload.replyTo = replyTo;
      }
      //console.log('===============================================');
      //console.log('ChatProvider: Sending message with payload:', payload);
      //console.log('===============================================');
      const response = await emit('message:send', JSON.stringify(payload));
      if (response?.message) {
        dispatch({
          type: 'ADD_MESSAGE',
          chatId: roomId,
          message: response.message,
        });
      }
      return response;
    },
    [emit],
  );

  const loadMessages = useCallback(
    async (roomId, page = 1, limit = 20) => {
      if (!roomId) {
        return { ok: false, error: 'roomId is required' };
      }
      console.log('===============================================');
      console.log(
        `ChatProvider: Loading messages for roomId=${roomId}, page=${page}, limit=${limit}`,
      );
      console.log('===============================================');

      dispatch({
        type: 'SET_PAGINATION',
        chatId: roomId,
        pagination: { page, limit, loading: true },
      });

      try {
        const payload = { roomId, page, limit };
        const response = await api.get('/chat/chat-history', {
          params: payload,
        });

        const messages = response?.data?.data || [];

        const normalizedMessages = Array.isArray(messages) ? messages : [];

        if (page <= 1) {
          dispatch({
            type: 'LOAD_MESSAGES',
            chatId: roomId,
            messages: sortMessagesByTime(normalizedMessages),
          });
        } else {
          dispatch({
            type: 'PREPEND_MESSAGES',
            chatId: roomId,
            messages: normalizedMessages,
          });
        }

        const hasMore =
          typeof response?.hasMore === 'boolean'
            ? response.hasMore
            : normalizedMessages.length >= limit;

        dispatch({
          type: 'SET_PAGINATION',
          chatId: roomId,
          pagination: { page, limit, hasMore, loading: false },
        });

        return { ok: true, messages: normalizedMessages, hasMore, response };
      } catch (error) {
        dispatch({
          type: 'SET_PAGINATION',
          chatId: roomId,
          pagination: { page, limit, loading: false },
        });
        return { ok: false, error, messages: [] };
      }
    },
    [emit],
  );

  const sendTyping = useCallback(
    roomId => {
      const key = roomId;
      // Clear existing timer
      if (typingTimers.current[key]) {
        clearTimeout(typingTimers.current[key]);
      } else {
        // First keystroke — emit start
        const payload = JSON.stringify({ roomId });
        emit('typing:start', payload).catch(() => {});
      }
      // Auto-stop after debounce
      typingTimers.current[key] = setTimeout(() => {
        const payload = JSON.stringify({ roomId });
        emit('typing:stop', payload).catch(() => {});
        delete typingTimers.current[key];
      }, 1500);
    },
    [emit],
  );

  const markAsRead = useCallback(
    async (messageIds, senderId) => {
      if (!messageIds.length) return;
      await emit('message:read', JSON.stringify({ messageIds, senderId }));
    },
    [emit],
  );

  const updateMessage = useCallback((chatId, messageId, updates) => {
    dispatch({ type: 'UPDATE_MESSAGE', chatId, messageId, updates });
  }, []);

  const messagesValue = useMemo(
    () => ({
      conversations: state.conversations,
      messageStatuses: state.messageStatuses,
      pagination: state.pagination,
    }),
    [state.conversations, state.messageStatuses, state.pagination],
  );

  const typingValue = useMemo(
    () => state.typingIndicators,
    [state.typingIndicators],
  );

  const presenceValue = useMemo(() => state.onlineUsers, [state.onlineUsers]);

  const actionsValue = useMemo(
    () => ({
      sendMessage,
      loadMessages,
      sendTyping,
      markAsRead,
      updateMessage,
    }),
    [sendMessage, loadMessages, sendTyping, markAsRead, updateMessage],
  );

  const value = useMemo(
    () => ({
      ...messagesValue,
      typingIndicators: typingValue,
      onlineUsers: presenceValue,
      ...actionsValue,
    }),
    [messagesValue, typingValue, presenceValue, actionsValue],
  );

  return (
    <ChatContext.Provider value={value}>
      <ChatActionsContext.Provider value={actionsValue}>
        <ChatPresenceContext.Provider value={presenceValue}>
          <ChatTypingContext.Provider value={typingValue}>
            <ChatMessagesContext.Provider value={messagesValue}>
              {children}
            </ChatMessagesContext.Provider>
          </ChatTypingContext.Provider>
        </ChatPresenceContext.Provider>
      </ChatActionsContext.Provider>
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};

export const useChatMessages = () => {
  const ctx = useContext(ChatMessagesContext);
  if (!ctx) throw new Error('useChatMessages must be used within ChatProvider');
  return ctx;
};

export const useChatTyping = () => {
  const ctx = useContext(ChatTypingContext);
  if (!ctx) throw new Error('useChatTyping must be used within ChatProvider');
  return ctx;
};

export const useChatPresence = () => {
  const ctx = useContext(ChatPresenceContext);
  if (!ctx) throw new Error('useChatPresence must be used within ChatProvider');
  return ctx;
};

export const useChatActions = () => {
  const ctx = useContext(ChatActionsContext);
  if (!ctx) throw new Error('useChatActions must be used within ChatProvider');
  return ctx;
};

export default ChatContext;
