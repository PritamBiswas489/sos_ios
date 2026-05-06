/**
 * ListenerMediaSoupContext.jsx
 *
 * Manages the LISTENER (receiver) side of mediasoup:
 *   – Joins a room as 'listener'
 *   – Sets up a receive transport and consumes the creator's audio track
 *   – Waits for the creator to start if not yet streaming
 *   – Exposes remoteStream for RTCView playback
 *
 * Usage:
 *   wrap with <ListenerMediaSoupProvider>
 *   consume via  useListenerMediaSoup()
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Device } from 'mediasoup-client';
import { ReactNative106 } from 'mediasoup-client/lib/handlers/ReactNative106';
import { MediaStream } from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';
import { useSocket } from './SocketContext';
import { useChatContacts } from '../hook/useChatContacts';
import { useUserData } from '../hook/useUserData';
import { TURN_SERVER_DOMAIN , TURN_SERVER_USER, TURN_SERVER_PASS} from '../../environment'; // adjust path as needed

// ─── ICE servers ──────────────────────────────────────────────────────────────
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: [
      `turn:${TURN_SERVER_DOMAIN}:3478`,
      `turn:${TURN_SERVER_DOMAIN}:3478?transport=tcp`,
      `turns:${TURN_SERVER_DOMAIN}:5349`,
    ],
    username: TURN_SERVER_USER,
    credential: TURN_SERVER_PASS,
  },
];

const ListenerMediaSoupContext = createContext(null);

// ─── Status type: 'idle' | 'connecting' | 'listening' | 'waiting' | 'error' ──

export const ListenerMediaSoupProvider = ({ children }) => {
  const { socket, isConnected, emit } = useSocket();

  // mediasoup refs
  const deviceRef        = useRef(null);
  const recvTransportRef = useRef(null);
  const consumerRef      = useRef(null);
  const remoteStreamRef  = useRef(null);

  // Active room stored in a ref so socket handlers always see the latest value
  const activeRoomIdRef = useRef(null);

  // Observable state
  const [status, setStatus]         = useState('idle');
  const [statusText, setStatusText] = useState('Idle — not connected');
  const [roomId, setRoomId]         = useState(null);
  const [iceState, setIceState]     = useState('—');
  const [dtlsState, setDtlsState]   = useState('—');
  const [logs, setLogs]             = useState([]);
  const [remoteStream, setRemoteStream] = useState(null);
  const [currentStreamingRoomIds, setCurrentStreamingRoomIds] = useState({});
  const { contactList } = useChatContacts();
  const {userData} = useUserData();
  const currentUserId = userData?.id;
  // ── Logging ──────────────────────────────────────────────────────────────────
  const log = useCallback((msg, type = 'info') => {
    const ts = new Date().toTimeString().slice(0, 8);
    setLogs(prev => [...prev.slice(-199), { ts, msg, type }]);
    console.log(`[Listener][${type.toUpperCase()}] ${msg}`);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  // ── emitAsync helper ─────────────────────────────────────────────────────────
  const emitAsync = useCallback((event, data) => emit(event, data), [emit]);

  // ── Transport stats / state watcher ─────────────────────────────────────────
  const watchTransport = useCallback(transport => {
    transport.on('connectionstatechange', state => {
      log(`Transport state: ${state}`, state === 'connected' ? 'ok' : state === 'failed' ? 'error' : 'info');
    });
    const interval = setInterval(async () => {
      if (!transport || transport.closed) { clearInterval(interval); return; }
      try {
        const stats = await transport.getStats();
        stats.forEach(report => {
          if (report.type === 'transport') {
            setIceState(report.iceState || '—');
            setDtlsState(report.dtlsState || '—');
          }
        });
      } catch (_) {}
    }, 1500);
    return () => clearInterval(interval);
  }, [log]);

  // ── Cleanup ──────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (consumerRef.current)      { consumerRef.current.close();       consumerRef.current = null; }
    if (recvTransportRef.current) { recvTransportRef.current.close();  recvTransportRef.current = null; }
    remoteStreamRef.current = null;
    setRemoteStream(null);
    InCallManager.setSpeakerphoneOn(false);
    InCallManager.stop();
    setIceState('—');
    setDtlsState('—');
    deviceRef.current = null;
  }, []);

  // ── Start consuming ──────────────────────────────────────────────────────────
  const startConsuming = useCallback(async (currentRoomId) => {
    try {
      if (!deviceRef.current) {
        throw new Error('mediasoup Device not initialised — please retry');
      }
      setStatus('connecting');
      setStatusText('Setting up receive transport…');

      const tParams = await emitAsync('ms:create-transport', { roomId: currentRoomId, direction: 'recv' });
      const iceServersForRecv = tParams.iceServers?.length ? tParams.iceServers : ICE_SERVERS;

      const recvTransport = deviceRef.current.createRecvTransport({
        ...tParams,
        iceServers: iceServersForRecv,
        iceTransportPolicy: 'all',
      });
      recvTransportRef.current = recvTransport;
      log(`Recv transport created: ${recvTransport.id}`, 'ok');
      watchTransport(recvTransport);

      recvTransport.on('connect', async ({ dtlsParameters }, cb, eb) => {
        try {
          await emitAsync('ms:connect-transport', { roomId: currentRoomId, transportId: recvTransport.id, dtlsParameters });
          log('Recv transport connected', 'ok');
          cb();
        } catch (e) { eb(e); }
      });

      const cParams = await emitAsync('ms:consume', {
        roomId: currentRoomId,
        rtpCapabilities: deviceRef.current.rtpCapabilities,
      });
      const consumer = await recvTransport.consume(cParams);
      consumerRef.current = consumer;
      log(`Consumer ready — kind: ${consumer.kind}, id: ${consumer.id}`, 'ok');

      await emitAsync('ms:resume-consumer', { roomId: currentRoomId });
      log('Consumer resumed — audio flowing', 'ok');

      const stream = new MediaStream([consumer.track]);
      remoteStreamRef.current = stream;
      setRemoteStream(stream);

      InCallManager.start({ media: 'audio', auto: true });
      InCallManager.setSpeakerphoneOn(true);

      setStatus('listening');
      setStatusText('Listening — receiving audio');
    } catch (err) {
      log(`startConsuming error: ${err.message}`, 'error');
      setStatus('error');
      setStatusText(`${err.message}`);
    }
  }, [emitAsync, log, watchTransport]);

  // ── Join room (always as 'listener') ────────────────────────────────────────
  const joinRoom = useCallback(async (targetRoomId) => {
    if (!isConnected || !socket) {
      log('Socket not connected — cannot join room', 'error');
      return;
    }

    activeRoomIdRef.current = targetRoomId;
    setRoomId(targetRoomId);
    setStatus('connecting');
    setStatusText('Connecting to room…');
    log(`Joining room "${targetRoomId}" as listener…`);

    try {
      const joinRes = await emitAsync('ms:join-room', { roomId: targetRoomId, role: 'listener' });
      if (joinRes?.error) {
        log(`join-room error: ${joinRes.error}`, 'error');
        setStatus('error');
        setStatusText(`${joinRes.error}`);
        return;
      }

      log('Router RTP capabilities received', 'ok');

      const device = new Device({ handlerFactory: ReactNative106.createFactory() });
      await device.load({ routerRtpCapabilities: joinRes.rtpCapabilities });
      deviceRef.current = device;
      log('mediasoup Device loaded', 'ok');

      if (joinRes.hasProducer) {
        log('Producer already active — consuming now…', 'info');
        await startConsuming(targetRoomId);
      } else {
        setStatus('waiting');
        setStatusText('Waiting for creator to stream…');
        log('Waiting for creator to start…', 'info');
      }
    } catch (err) {
      log(`joinRoom error: ${err.message}`, 'error');
      setStatus('error');
      setStatusText(`${err.message}`);
    }
  }, [isConnected, socket, emitAsync, log, startConsuming]);

  // ── Leave room ───────────────────────────────────────────────────────────────
  const leaveRoom = useCallback(() => {
    cleanup();
    activeRoomIdRef.current = null;
    setStatus('idle');
    setStatusText('Idle — not connected');
    setRoomId(null);
    log('Left room', 'warn');
  }, [cleanup, log]);

  // ── Socket events ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onNewProducer = async ({roomId}) => {
      log('Creator started streaming — consuming…', 'info');
      const currentRoom = activeRoomIdRef.current;
      // Guard: if device isn't loaded yet, joinRoom will call startConsuming
      // after loading the device (hasProducer will be true by then)

        
      if (currentRoom && deviceRef.current) {
        await startConsuming(currentRoom);
      }
      setCurrentStreamingRoomIds(prev => ({ ...prev, [roomId]: true })); // Mark this room as having an active stream
    };

    const onCreatorLeft = (payload) => {
      
      log('Creator left the room', 'warn');
      if (consumerRef.current)      { consumerRef.current.close();      consumerRef.current = null; }
      if (recvTransportRef.current) { recvTransportRef.current.close(); recvTransportRef.current = null; }
      setRemoteStream(null);
      if(payload?.roomId) {
         setCurrentStreamingRoomIds(prev => ({ ...prev, [payload.roomId]: false })); // Mark this room as no longer having an active stream
      }
      // Mark this room as no longer having an active stream
      leaveRoom();
    };

    const onProducerClosed = () => {
      log('Producer closed by server', 'warn');
      setStatus('idle');
      setStatusText('Stream ended');
      setRemoteStream(null);
    };

    socket.on('ms:new-producer',    onNewProducer);
    socket.on('creator-left',       onCreatorLeft);
    socket.on('ms:producer-closed', onProducerClosed);

    return () => {
      socket.off('ms:new-producer',    onNewProducer);
      socket.off('creator-left',       onCreatorLeft);
      socket.off('ms:producer-closed', onProducerClosed);
    };
  }, [socket, startConsuming, leaveRoom, log]);

  // ── Cleanup on socket disconnect ─────────────────────────────────────────────
  useEffect(() => {
    if (!isConnected && status !== 'idle') {
      cleanup();
      activeRoomIdRef.current = null;
      setStatus('idle');
      setStatusText('Disconnected');
      setRoomId(null);
    }
  }, [isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
      if (!isConnected || !currentUserId) return;
  
      const list = contactList;
      if (!Array.isArray(list) || list.length === 0) return;
  
      const roomIds = [
        ...new Set(
          list
            .map(contact => {
              if (contact?.user_id === currentUserId)
                return `sos-live-${contact?.trusted_user_id}`;
              if (contact?.trusted_user_id === currentUserId)
                return `sos-live-${contact?.user_id}`; 
              return null;
            })
            .filter(Boolean),
        ),
      ];
  
      if (roomIds.length === 0) return;
      console.log('Checking streaming status for rooms:', roomIds);
      emit('ms:check-rooms-has-creator', { roomIds })
        .then(statuses => { 
            console.log('Received streaming status for rooms:', statuses?.rooms);
           setCurrentStreamingRoomIds(statuses?.rooms || {});
        })
        .catch(() => {});
    }, [isConnected, currentUserId, contactList, emit]);

  const value = {
    status,
    statusText,
    roomId,
    iceState,
    dtlsState,
    logs,
    remoteStream,
    joinRoom,
    leaveRoom,
    clearLogs,
    currentStreamingRoomIds,
  };

  return (
    <ListenerMediaSoupContext.Provider value={value}>
      {children}
    </ListenerMediaSoupContext.Provider>
  );
};

export const useListenerMediaSoup = () => {
  const context = useContext(ListenerMediaSoupContext);
  if (!context) throw new Error('useListenerMediaSoup must be used within ListenerMediaSoupProvider');
  return context;
};

export default ListenerMediaSoupContext;
