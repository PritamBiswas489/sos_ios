/**
 * MediaSoupContext.jsx
 *
 * Handles all mediasoup-client logic: joining a room, producing (creator),
 * consuming (listener), mute, volume, and transport lifecycle.
 *
 * Depends on SocketContext for the live socket connection.
 *
 * Install deps:
 *   npm install mediasoup-client
 *   npx pod-install   (iOS)
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
import { mediaDevices, MediaStream } from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';
import { useSocket } from './SocketContext'; // adjust path as needed
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

// ─── Context ──────────────────────────────────────────────────────────────────
const MediaSoupContext = createContext(null);

// ─── Status type ─────────────────────────────────────────────────────────────
// 'idle' | 'connecting' | 'streaming' | 'listening' | 'waiting' | 'error'

export const MediaSoupProvider = ({ children }) => {
  const { socket, isConnected, emit } = useSocket();

  // mediasoup objects (not state — no re-renders on change)
  const deviceRef        = useRef(null);
  const sendTransportRef = useRef(null);
  const recvTransportRef = useRef(null);
  const producerRef      = useRef(null);
  const consumerRef      = useRef(null);
  const localStreamRef   = useRef(null);
  const remoteStreamRef  = useRef(null);

  // Observable state
  const [status, setStatus]           = useState('idle');   // see above
  const [statusText, setStatusText]   = useState('Idle — not connected');
  const [roomId, setRoomId]           = useState(null);
  const [role, setRole]               = useState(null);     // 'creator' | 'listener'
  const [isMuted, setIsMuted]         = useState(false);
  const [iceState, setIceState]       = useState('—');
  const [dtlsState, setDtlsState]     = useState('—');
  const [iceServers, setIceServers]   = useState(ICE_SERVERS);
  const [logs, setLogs]               = useState([]);
  const [remoteStream, setRemoteStream] = useState(null);   // MediaStream for listener playback
  const [connectedListeners, setConnectedListeners] = useState({}); // Count of connected listeners (creator only) 
  // ─── Logging ────────────────────────────────────────────────────────────────
  const log = useCallback((msg, type = 'info') => {
    const ts = new Date().toTimeString().slice(0, 8);
    setLogs(prev => [...prev.slice(-199), { ts, msg, type }]);
    console.log(`[MediaSoup][${type.toUpperCase()}] ${msg}`);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  // ─── emitAsync helper (uses SocketContext's emit which already acks) ─────────
  const emitAsync = useCallback(
    (event, data) => emit(event, data),
    [emit],
  );

  // ─── Transport stats polling ─────────────────────────────────────────────────
  const watchTransport = useCallback(transport => {
    transport.on('connectionstatechange', state => {
      log(`Transport connection state: ${state}`, state === 'connected' ? 'ok' : state === 'failed' ? 'error' : 'info');
    });

    const interval = setInterval(async () => {
      if (!transport || transport.closed) {
        clearInterval(interval);
        return;
      }
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

    // return cleanup in case caller needs it
    return () => clearInterval(interval);
  }, [log]);

  // ─── Cleanup ────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (producerRef.current)      { producerRef.current.close();      producerRef.current = null; }
    if (consumerRef.current)      { consumerRef.current.close();       consumerRef.current = null; }
    if (sendTransportRef.current) { sendTransportRef.current.close();  sendTransportRef.current = null; }
    if (recvTransportRef.current) { recvTransportRef.current.close();  recvTransportRef.current = null; }
    if (localStreamRef.current)   {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
     
    remoteStreamRef.current = null;
    setRemoteStream(null);
    InCallManager.setSpeakerphoneOn(false);
    setConnectedListeners({});
    InCallManager.stop();
    setIceState('—');
    setDtlsState('—');
    setIsMuted(false);
    deviceRef.current = null;
  }, []);

  // ─── Creator: produce audio ──────────────────────────────────────────────────
  const startProducing = useCallback(async (currentRoomId) => {
    try {
      setStatus('connecting');
      setStatusText('Requesting microphone…');
      log('Requesting microphone access…');

      // React Native: use react-native-webrtc's getUserMedia
      const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      const audioTrack = stream.getAudioTracks()[0];
      log(`Microphone granted: ${audioTrack.label}`, 'ok');

      // Create send transport
      const tParams = await emitAsync('ms:create-transport', { roomId: currentRoomId, direction: 'send' });
      const iceServersForTransport = tParams.iceServers?.length ? tParams.iceServers : ICE_SERVERS;

      const sendTransport = deviceRef.current.createSendTransport({
        ...tParams,
        iceServers: iceServersForTransport,
        iceTransportPolicy: 'all',
      });
      sendTransportRef.current = sendTransport;
      log(`Send transport created: ${sendTransport.id}`, 'ok');

      watchTransport(sendTransport);

      sendTransport.on('connect', async ({ dtlsParameters }, cb, eb) => {
        try {
          await emitAsync('ms:connect-transport', {
            roomId: currentRoomId,
            transportId: sendTransport.id,
            dtlsParameters,
          });
          log('Send transport connected', 'ok');
          cb();
        } catch (e) { eb(e); }
      });

      sendTransport.on('produce', async ({ kind, rtpParameters }, cb, eb) => {
        try {
          const { id } = await emitAsync('ms:produce', { roomId: currentRoomId, kind, rtpParameters });
          log(`Producing ${kind} — id: ${id}`, 'ok');
          cb({ id });
        } catch (e) { eb(e); }
      });

      const producer = await sendTransport.produce({
        track: audioTrack,
        codecOptions: { opusStereo: false, opusDtx: true },
      });
      producerRef.current = producer;
      log('Producer ready ✓', 'ok');

      setStatus('streaming');
      setStatusText('Live — streaming audio');
    } catch (err) {
      log(`startProducing error: ${err.message}`, 'error');
      setStatus('error');
      setStatusText(`${err.message}`);
    }
  }, [emitAsync, log, watchTransport]);

  // ─── Listener: consume audio ─────────────────────────────────────────────────
  const startConsuming = useCallback(async (currentRoomId) => {
    try {
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
          await emitAsync('ms:connect-transport', {
            roomId: currentRoomId,
            transportId: recvTransport.id,
            dtlsParameters,
          });
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

      // Expose the MediaStream for the listener screen
      const stream = new MediaStream([consumer.track]);
      remoteStreamRef.current = stream;
      setRemoteStream(stream);

      // Force audio to loudspeaker — 'video' mode defaults to speaker on Android/iOS
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

  // ─── Join room ──────────────────────────────────────────────────────────────
  const joinRoom = useCallback(async (targetRoomId, targetRole, sosId) => {
    if (!isConnected || !socket) {
      log('Socket not connected — cannot join room', 'error');
      return;
    }
    console.log("joinRommsosId", sosId);

    setRoomId(targetRoomId);
    setRole(targetRole);
    setStatus('connecting');
    setStatusText('Connecting to room…');
    log(`Joining room "${targetRoomId}" as ${targetRole}…`);

    try {
      // 1. Join room — get router RTP capabilities
      const joinRes = await emitAsync('ms:join-room', { roomId: targetRoomId, role: targetRole, sosId });
      if (joinRes?.error) {
        log(`join-room error: ${joinRes.error}`, 'error');
        setStatus('error');
        setStatusText(`${joinRes.error}`);
        return;
      }

      log('Router RTP capabilities received', 'ok');
      setIceServers(ICE_SERVERS);

      // 2. Load mediasoup Device
      const device = new Device({ handlerFactory: ReactNative106.createFactory() });
      await device.load({ routerRtpCapabilities: joinRes.rtpCapabilities });
      deviceRef.current = device;
      log('mediasoup Device loaded', 'ok');

      // 3. Role-specific flow
      if (targetRole === 'creator') {
        await startProducing(targetRoomId);
      } else {
        if (joinRes.hasProducer) {
          log('Producer already active — consuming now…', 'info');
          await startConsuming(targetRoomId);
        } else {
          setStatus('waiting');
          setStatusText('Waiting for creator to stream…');
          log('Waiting for creator to start…', 'info');
        }
      }
    } catch (err) {
      log(`joinRoom error: ${err.message}`, 'error');
      setStatus('error');
      setStatusText(`${err.message}`);
    }
  }, [isConnected, socket, emitAsync, log, startProducing, startConsuming]);

  // ─── Leave room ─────────────────────────────────────────────────────────────
  const leaveRoom = useCallback(() => {
    cleanup();
    setStatus('idle');
    setStatusText('Idle — not connected');
    setRoomId(null);
    setRole(null);
    log('Left room', 'warn');
  }, [cleanup, log]);

  // ─── Mute toggle ────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const producer = producerRef.current;
    if (!producer) return;
    const next = !isMuted;
    setIsMuted(next);
    if (next) {
      producer.pause();
      log('Microphone muted', 'info');
    } else {
      producer.resume();
      log('Microphone unmuted', 'info');
    }
  }, [isMuted, log]);

  // ─── Socket event listeners ──────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onNewProducer = async () => {
      log('Creator started streaming — consuming…', 'info');
      if (role === 'listener' && roomId) {
        await startConsuming(roomId);
      }
    };
    const onListenerJoined = (data) => {
      setConnectedListeners(prev => ({ ...prev, [data.userId]: data }));
    }
    const onListenerLeft = (data) => {      
      setConnectedListeners(prev => {
        const updated = { ...prev };
        delete updated[data.userId];
        return updated;
      });
    }
    const onCreatorLeft = () => {
      log('Creator left the room', 'warn');
      setStatus('idle');
      setStatusText('Creator ended the stream');
      setIceState('—');
      setDtlsState('—');
      if (consumerRef.current) { consumerRef.current.close(); consumerRef.current = null; }
      if (recvTransportRef.current) { recvTransportRef.current.close(); recvTransportRef.current = null; }
      setRemoteStream(null);
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
    socket.on('listener-joined',onListenerJoined);
    socket.on('listener-left',onListenerLeft); // Reuse the same handler to update the list

    return () => {
      socket.off('ms:new-producer',    onNewProducer);
      socket.off('creator-left',       onCreatorLeft);
      socket.off('ms:producer-closed', onProducerClosed);
      socket.off('listener-joined',    onListenerJoined);
      socket.off('listener-left',      onListenerLeft);
    };
  }, [socket, role, roomId, startConsuming, log]);

  // ─── Cleanup on socket disconnect ───────────────────────────────────────────
  useEffect(() => {
    if (!isConnected && status !== 'idle') {
      cleanup();
      setStatus('idle');
      setStatusText('Disconnected');
      setRoomId(null);
      setRole(null);
    }
  }, [isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Context value ──────────────────────────────────────────────────────────
  const value = {
    // State
    status,        // 'idle' | 'connecting' | 'streaming' | 'listening' | 'waiting' | 'error'
    statusText,
    roomId,
    role,
    isMuted,
    iceState,
    dtlsState,
    iceServers,
    logs,
    remoteStream,  // MediaStream — attach to RTCView (listener side)
    localStream: localStreamRef.current, // MediaStream — mic (creator side)

    // Actions
    joinRoom,
    leaveRoom,
    toggleMute,
    clearLogs,
    connectedListeners
  };

  return (
    <MediaSoupContext.Provider value={value}>
      {children}
    </MediaSoupContext.Provider>
  );
};

export const useMediaSoup = () => {
  const context = useContext(MediaSoupContext);
  if (!context) {
    throw new Error('useMediaSoup must be used within MediaSoupProvider');
  }
  return context;
};

export default MediaSoupContext;
