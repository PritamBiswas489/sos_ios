import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { io } from 'socket.io-client';
import { AppState } from 'react-native';
import { useSelector } from 'react-redux';
import { getAuthTokens, setAuthTokens } from '../config/auth';
import { getAppUrl } from '../config/utility';
import { useUserData } from '../hook/useUserData';

const SocketContext = createContext(null);

const SOCKET_CONFIG = {
    SOCKET_URL: getAppUrl(),
    RECONNECT_ATTEMPTS: 10,        // increased — VPN needs more retries
    RECONNECT_DELAY: 2000,
    RECONNECT_DELAY_MAX: 10000,    // cap backoff so it doesn't wait forever
    EMIT_TIMEOUT_MS: 10000,
    PING_INTERVAL_MS: 25000,
    TOKEN_DEBOUNCE_MS: 800,        // prevents rapid socket rebuild on VPN toggle
};

// ─── helpers ────────────────────────────────────────────────────────────────

function debounce(fn, ms) {
    let timer = null;
    const debounced = (...args) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            fn(...args);
        }, ms);
    };
    debounced.cancel = () => {
        if (timer) clearTimeout(timer);
        timer = null;
    };
    return debounced;
}

// ─── provider ───────────────────────────────────────────────────────────────

export const SocketProvider = ({ children }) => {
    const { userData } = useUserData();
    const chatContactList = useSelector(state => state.chatContactList);
    const isAuthenticated = Boolean(userData?.id);

    const socketRef = useRef(null);
    const appState = useRef(AppState.currentState);

    const [token, setToken] = useState(null);
    const tokenRef = useRef(null);
    const refreshTokenRef = useRef(null);

    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const [socketInstance, setSocketInstance] = useState(null);

    // Registry so listeners survive socket rebuilds (VPN reconnect)
    const listenerRegistryRef = useRef(new Map());

    // Tracks previous isConnected so join:room only fires on transition → true
    const wasConnected = useRef(false);

    // ── 1. Load tokens (debounced to survive rapid VPN toggling) ──────────────
    useEffect(() => {
        let isMounted = true;

        const loadToken = debounce(async () => {
            try {
                const { accessToken, refreshToken: rt } = await getAuthTokens();
                if (!isMounted) return;
                tokenRef.current = accessToken || null;
                refreshTokenRef.current = rt || null;
                setToken(accessToken || null);
            } catch (error) {
                if (!isMounted) return;
                console.warn('[Socket] Unable to load auth tokens:', error?.message);
                setToken(null);
                setConnectionError('Unable to load auth token');
            }
        }, SOCKET_CONFIG.TOKEN_DEBOUNCE_MS);

        if (isAuthenticated) {
            loadToken();
        } else {
            tokenRef.current = null;
            refreshTokenRef.current = null;
            setToken(null);
        }

        return () => {
            isMounted = false;
            loadToken.cancel();
        };
    }, [isAuthenticated]);

    // ── 2. Socket lifecycle ───────────────────────────────────────────────────
    useEffect(() => {
        // Always tear down existing socket before creating a new one
        // prevents double-socket when token changes mid-reconnect
        if (socketRef.current) {
            socketRef.current.removeAllListeners();
            socketRef.current.disconnect();
            socketRef.current = null;
            setSocketInstance(null);
            setIsConnected(false);
        }

        if (!isAuthenticated || !token) return;

        const socket = io(SOCKET_CONFIG.SOCKET_URL, {
            auth: { token: tokenRef.current, refreshToken: refreshTokenRef.current },
            // iOS VPN fix: websocket only — polling can be blocked by VPN tunnel on iOS
            transports: ['websocket'],
            upgrade: false,
            reconnection: true,
            reconnectionAttempts: SOCKET_CONFIG.RECONNECT_ATTEMPTS,
            reconnectionDelay: SOCKET_CONFIG.RECONNECT_DELAY,
            reconnectionDelayMax: SOCKET_CONFIG.RECONNECT_DELAY_MAX,
            // smooths reconnect storms after VPN switch
            randomizationFactor: 0.5,
            // shorter than EMIT_TIMEOUT_MS so connect_error fires before
            // any in-flight emit can timeout in an ambiguous state
            timeout: 8000,
        });

        socket.on('connect', () => {
            console.log('[Socket] Connected:', socket.id);
            setIsConnected(true);
            setConnectionError(null);
        });

        socket.on('disconnect', reason => {
            console.log('[Socket] Disconnected:', reason);
            setIsConnected(false);
            // socket.io auto-reconnects for server-side disconnects;
            // for transport errors on VPN it will also retry
        });

        socket.on('connect_error', err => {
            console.warn('[Socket] Connection error:', err.message);
            setConnectionError(err.message);
            setIsConnected(false);
        });

        // Token refresh pushed from server — update refs only, never state
        // so this never triggers a socket rebuild useEffect
        socket.on('token:refreshed', async payload => {
            try {
                const { accessToken, refreshToken: newRefreshToken } = payload || {};
                if (!accessToken || !newRefreshToken) {
                    console.warn('[Socket] token:refreshed — invalid payload, ignoring');
                    return;
                }
                await setAuthTokens(accessToken, newRefreshToken);
                tokenRef.current = accessToken;
                refreshTokenRef.current = newRefreshToken;
                socket.auth = { token: accessToken, refreshToken: newRefreshToken };
                console.log('[Socket] Token refreshed silently');
            } catch (error) {
                console.warn('[Socket] Failed to store refreshed tokens:', error?.message);
            }
        });

        socketRef.current = socket;

        // Replay all consumer listeners onto the new socket instance
        // so handlers registered via on() survive VPN-triggered socket rebuilds
        for (const [event, handlers] of listenerRegistryRef.current) {
            for (const handler of handlers) {
                socket.on(event, handler);
            }
        }

        setSocketInstance(socket);

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
            socketRef.current = null;
            setSocketInstance(null);
            setIsConnected(false);
        };
    }, [isAuthenticated, token]);

    // ── 3. Join rooms — only fires on connection transition → true ────────────
    useEffect(() => {
        const justConnected = isConnected && !wasConnected.current;
        wasConnected.current = isConnected;

        if (!justConnected || !isAuthenticated) return;

        const currentSocket = socketRef.current;
        if (!currentSocket?.connected) return;

        const contacts = chatContactList?.contact_list;
        if (!contacts?.length) return;

        console.log('[Socket] Rejoining', contacts.length, 'rooms after connect');
        for (const contact of contacts) {
            const roomId = [contact.user_id, contact.trusted_user_id].sort().join(':');
            currentSocket.emit('join:room', JSON.stringify({ roomId }));
        }
    }, [chatContactList, isConnected, isAuthenticated]);

    // ── 4. Foreground reconnect + keepalive ping ──────────────────────────────
    useEffect(() => {
        if (!isAuthenticated || !token) return;

        const handleAppStateChange = nextAppState => {
            const prevAppState = appState.current;
            appState.current = nextAppState;

            const comingToForeground =
                prevAppState?.match(/inactive|background/) &&
                nextAppState === 'active';

            if (comingToForeground) {
                // Snapshot ref — avoids race if socket useEffect cleanup fires concurrently
                const currentSocket = socketRef.current;
                if (currentSocket && !currentSocket.connected) {
                    console.log('[Socket] App foregrounded — reconnecting');
                    currentSocket.connect();
                }
            }
        };

        const pingInterval = setInterval(() => {
            // Snapshot ref — avoids race where socketRef becomes null
            // between the connected check and the emit
            const currentSocket = socketRef.current;
            if (currentSocket?.connected) {
                currentSocket.emit('ping');
            }
        }, SOCKET_CONFIG.PING_INTERVAL_MS);

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
            clearInterval(pingInterval);
        };
    }, [isAuthenticated, token]);

    // ── 5. emit — with ack, timeout, and mid-flight disconnect handling ────────
    const emit = useCallback((event, data) => {
        return new Promise((resolve, reject) => {
            const currentSocket = socketRef.current;
            if (!currentSocket?.connected) return reject(new Error('Socket not connected'));

            let settled = false;
            const settle = (fn, val) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                currentSocket.off('disconnect', onDisconnect);
                fn(val);
            };

            // Reject immediately if socket drops mid-emit instead of waiting full timeout
            const onDisconnect = () => settle(reject, new Error('Socket disconnected mid-emit'));
            currentSocket.once('disconnect', onDisconnect);

            const timer = setTimeout(
                () => settle(reject, new Error(`Socket emit timeout: ${event}`)),
                SOCKET_CONFIG.EMIT_TIMEOUT_MS
            );

            currentSocket.emit(event, data, response => {
                if (response?.success === false) {
                    settle(reject, new Error(response.error || 'Socket event failed'));
                } else {
                    settle(resolve, response);
                }
            });
        });
    }, []);

    // ── 6. emitNoAck — fire-and-forget for high-frequency events ─────────────
    const emitNoAck = useCallback((event, data) => {
        const currentSocket = socketRef.current;
        if (currentSocket?.connected) {
            currentSocket.emit(event, data);
        }
    }, []);

    // ── 7. on / off ───────────────────────────────────────────────────────────
    const on = useCallback((event, handler) => {
        // Register in registry so it survives socket rebuilds
        if (!listenerRegistryRef.current.has(event)) {
            listenerRegistryRef.current.set(event, new Set());
        }
        listenerRegistryRef.current.get(event).add(handler);

        // Attach to current socket if available
        socketRef.current?.on(event, handler);

        return () => {
            listenerRegistryRef.current.get(event)?.delete(handler);
            // Capture current instance — cleanup must remove from the socket
            // it was registered on, not whatever socketRef.current is at cleanup time
            socketRef.current?.off(event, handler);
        };
    }, []);

    const off = useCallback((event, handler) => {
        listenerRegistryRef.current.get(event)?.delete(handler);
        socketRef.current?.off(event, handler);
    }, []);

    // ── 8. Context value — memoised to prevent unnecessary consumer re-renders ─
    const value = useMemo(() => ({
        socket: socketInstance,
        isConnected,
        connectionError,
        emit,
        emitNoAck,
        on,
        off,
    }), [socketInstance, isConnected, connectionError, emit, emitNoAck, on, off]);

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

// ─── hook ────────────────────────────────────────────────────────────────────

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

export default SocketContext;
