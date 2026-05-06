import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useSocket } from './SocketContext';
import { useTrustedContacts } from '../hook/useTrustedContacts';
import { useChatContacts } from '../hook/useChatContacts';
import { useIncommingRequests } from '../hook/useIncommingRequests';
import { useOutgoingRequests } from '../hook/useOutgoingRequests';

const TrustedProviderContext = createContext(null);

export const TrustedContactsProvider = ({ children }) => {
  const { on, off, emit, isConnected } = useSocket();
  const { fetchTrustedContacts } = useTrustedContacts();
  const { fetchChatContacts } = useChatContacts();
  const { fetchIncommingRequests } = useIncommingRequests();
  const { fetchOutgoingRequests } = useOutgoingRequests();

  useEffect(() => {
    if (!isConnected) return;
    const handleTrustedContactRequestSent = async data => {
      console.log("Trusted contact request sent event received:", data);
      fetchOutgoingRequests();
      fetchChatContacts();
    };
    const handleTrustedContactRequestReceived = async data => {
      fetchIncommingRequests();
      fetchChatContacts();
    };
    const handleTrustedContactRequestAcceptedOrDeleted = async data => {
      fetchTrustedContacts();
      fetchChatContacts();
      fetchIncommingRequests();
      fetchOutgoingRequests();
    };

    const unsubs = [
     on( 'trustedContactRequest:sent', handleTrustedContactRequestSent),
     on( 'trustedContactRequest:received', handleTrustedContactRequestReceived),
     on( 'trustedContactRequest:accepted', handleTrustedContactRequestAcceptedOrDeleted),
     on( 'trustedContactRequest:deleted', handleTrustedContactRequestAcceptedOrDeleted),
    ];

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [on, off, emit, isConnected]);

  const sendTrustedContactRequest = useCallback(
    async payload => {
        console.log("=============== Sending Trusted Contact Request ======================");
        console.log('Payload:', payload);
        console.log("=====================================================");
      const response = await emit(
        'send:trustedContactRequest',
        JSON.stringify(payload),
      );
      return response;
    },
    [emit],
  );

  const acceptTrustedContactRequest = useCallback(
    async payload => {
      const response = await emit(
        'accept:trustedContactRequest',
        JSON.stringify(payload),
      );
      return response;
    },
    [emit],
  );

  const deleteTrustedContactRequest = useCallback(
    async payload => {
      const response = await emit(
        'delete:trustedContactRequest',
        JSON.stringify(payload),
      );
      return response;
    },
    [emit],
  );

  const value = useMemo(
    () => ({
      sendTrustedContactRequest,
      acceptTrustedContactRequest,
      deleteTrustedContactRequest,
    }),
    [
      sendTrustedContactRequest,
      acceptTrustedContactRequest,
      deleteTrustedContactRequest,
    ],
  );

  return (
    <TrustedProviderContext.Provider value={value}>
      {children}
    </TrustedProviderContext.Provider>
  );
};
export const useTrustedContactActions = () => {
  const context = useContext(TrustedProviderContext);
  if (!context) {
    throw new Error('useTrustedContactActions must be used within a TrustedContactsProvider');
  }
  return context;
};
export default TrustedProviderContext;
