import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import { io } from 'socket.io-client';
import { AppState } from 'react-native';
import { useSelector } from 'react-redux';
import { getAuthTokens, setAuthTokens } from '../config/auth';
import { getAppUrl } from '../config/utility';
import { useUserData } from '../hook/useUserData';
 

const SocketContext = createContext(null);

const SOCKET_CONFIG = {
    SOCKET_URL: getAppUrl(),
    RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 2000,
};

export const SocketProvider = ({children}) => {
        const {userData} = useUserData();
        const chatContactList = useSelector(state => state.chatContactList);
        const isAuthenticated = Boolean(userData?.id);
        const socketRef = useRef(null);
        const appState = useRef(AppState.currentState);
        const [token, setToken] = useState(null);
        const [refreshToken, setRefreshToken] = useState(null);
        // Refs hold latest tokens so token:refreshed never triggers socket reconnect
        const tokenRef = useRef(null);
        const refreshTokenRef = useRef(null);
        const [isConnected, setIsConnected] = useState(false);
        const [connectionError, setConnectionError] = useState(null);
         

        useEffect(() => {
          console.log("=============== Chat Contact List Updated ======================");
          console.log('Chat Contact List:', chatContactList);
          console.log("=====================================================");
          if(isAuthenticated && socketRef.current?.connected) {
            console.log("=============== Emitting chatContactList:update ======================");
            if(chatContactList?.contact_list?.length > 0){
                for(const contact of chatContactList.contact_list){
                   const roomId = [contact.user_id, contact.trusted_user_id].sort().join(':');
                   console.log(`Emitting update for room ${roomId} with contact:`, contact);
                   socketRef.current.emit('join:room', JSON.stringify({roomId}));
                }
            }
          }

        }, [chatContactList, isConnected, isAuthenticated]);

        useEffect(() => {
            let isMounted = true;

            const loadToken = async () => {
                try {
                    const {accessToken, refreshToken: rt} = await getAuthTokens();
                    if (!isMounted) return;
                    tokenRef.current = accessToken || null;
                    refreshTokenRef.current = rt || null;
                    setToken(accessToken || null);
                    setRefreshToken(rt || null);
                } catch (error) {
                    if (!isMounted) return;
                    setToken(null);
                    setRefreshToken(null);
                    setConnectionError('Unable to load auth token');
                }
            };

            if (isAuthenticated) {
                loadToken();
            } else {
                setToken(null);
                setRefreshToken(null);
            }

            return () => {
                isMounted = false;
            };
        }, [isAuthenticated]);

        useEffect(() => {
            if (!isAuthenticated || !token) {
                if (socketRef.current) {
                    socketRef.current.disconnect();
                    socketRef.current = null;
                    setIsConnected(false);
                }
                return;
            }

            const socket = io(SOCKET_CONFIG.SOCKET_URL, {
                auth: {token: tokenRef.current, refreshToken: refreshTokenRef.current},
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: SOCKET_CONFIG.RECONNECT_ATTEMPTS,
                reconnectionDelay: SOCKET_CONFIG.RECONNECT_DELAY,
                forceNew: true,
            });

            socket.on('connect', () => {
                console.log("=============== CONNECTED ======================");
                console.log('[Socket] Connected:', socket.id);
                setIsConnected(true);
                setConnectionError(null);
            });

            socket.on('disconnect', reason => {
                console.log("=============== DISCONNECTED ======================");
                console.log('[Socket] Disconnected:', reason);
                setIsConnected(false);
            });

            socket.on('connect_error', err => {
                console.log("=============== CONNECTION ERROR ======================");
                console.log('[Socket] Connection error:', err.message);
                setConnectionError(err.message);
                setIsConnected(false);
            });

            socket.on('token:refreshed', async payload => {
                try {
                    const {accessToken, refreshToken: newRefreshToken} = payload || {};
                    if (!accessToken || !newRefreshToken) {
                        console.log('[Socket] token:refreshed received invalid payload');
                        return;
                    }
                    console.log('[Socket] Token refreshed by server');
                    await setAuthTokens(accessToken, newRefreshToken);
                    // Update refs only — avoids triggering socket reconnect via useEffect
                    tokenRef.current = accessToken;
                    refreshTokenRef.current = newRefreshToken;
                    socket.auth = {token: accessToken, refreshToken: newRefreshToken};
                } catch (error) {
                    console.log('[Socket] Failed to process token:refreshed', error?.message || error);
                }
            });

            socketRef.current = socket;

            return () => {
                socket.disconnect();
                socketRef.current = null;
                setIsConnected(false);
            };
        }, [isAuthenticated, token]);

        useEffect(() => {
    if (!isAuthenticated || !token || !socketRef.current) return;

    const handleAppStateChange = nextAppState => {
        const prevAppState = appState.current;
        appState.current = nextAppState;

        const comingToForeground =
            prevAppState?.match(/inactive|background/) &&
            nextAppState === 'active';

        if (comingToForeground && !socketRef.current?.connected) {
            socketRef.current.connect();
        }
    };

    const pingInterval = setInterval(() => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('ping');
        }
    }, 25000);

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
        subscription.remove();
        clearInterval(pingInterval);
    };

}, [isAuthenticated, token]);

    const emit = useCallback((event, data) => {
        return new Promise((resolve, reject) => {
            if (!socketRef.current?.connected) {
                return reject(new Error('Socket not connected'));
            }
            let settled = false;
            const timer = setTimeout(() => {
                if (settled) return;
                settled = true;
                reject(new Error('Socket emit timeout'));
            }, 10000);

            socketRef.current.emit(event, data, response => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                if (response?.success === false) {
                    reject(new Error(response.error || 'Socket event failed'));
                } else {
                    resolve(response);
                }
            });
        });
    }, []);

    // Fire-and-forget emit — no ack callback, no pending promise.
    // Use this for high-frequency events (e.g. location:update) where the server never acks.
    const emitNoAck = useCallback((event, data) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit(event, data);
        }
    }, []);

    const on = useCallback((event, handler) => {
        socketRef.current?.on(event, handler);
        return () => socketRef.current?.off(event, handler);
    }, []);

    const off = useCallback((event, handler) => {
        socketRef.current?.off(event, handler);
    }, []);

    const value = {
            socket: socketRef.current,
            isConnected,
            connectionError,
            emit,
            emitNoAck,
            on,
            off,
        };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};


export default SocketContext;
