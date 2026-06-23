/**
 * CreatorMediaSoupContext.jsx
 *
 * Manages the CREATOR (broadcaster) side of mediasoup:
 *   – Joins a room as 'creator'
 *   – Captures microphone and produces audio via a send transport
 *   – Tracks connected listeners
 *   – Exposes mute toggle
 *
 * Usage:
 *   wrap with <CreatorMediaSoupProvider>
 *   consume via  useCreatorMediaSoup()
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
import { mediaDevices } from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';
import { useSocket } from './SocketContext';
import { TURN_SERVER_DOMAIN, TURN_SERVER_USER, TURN_SERVER_PASS } from '../../environment'; // adjust path as needed

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

const CreatorMediaSoupContext = createContext(null);

// ─── Status type: 'idle' | 'connecting' | 'streaming' | 'error' ──────────────

export const CreatorMediaSoupProvider = ({ children }) => {
  const { socket, isConnected, emit } = useSocket();

  // mediasoup refs (not state — no re-renders on change)
  const deviceRef = useRef(null);
  const sendTransportRef = useRef(null);
  const producerRef = useRef(null);
  const localStreamRef = useRef(null);
  const creatorDisconnectTimerRef = useRef(null);
  const transportCleanupRef       = useRef(null); //23-2026

  // Observable state
  const [status, setStatus] = useState('idle');
  const [statusText, setStatusText] = useState('Idle — not connected');
  const [roomId, setRoomId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [iceState, setIceState] = useState('—');
  const [dtlsState, setDtlsState] = useState('—');
  const [logs, setLogs] = useState([]);
  const [connectedListeners, setConnectedListeners] = useState({});

  // ── Logging ──────────────────────────────────────────────────────────────────
  const log = useCallback((msg, type = 'info') => {
    // const ts = new Date().toTimeString().slice(0, 8);
    // setLogs(prev => [...prev.slice(-199), { ts, msg, type }]);
    // console.log(`[Creator][${type.toUpperCase()}] ${msg}`);
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
      } catch (_) { }
    }, 1500);
    return () => clearInterval(interval);
  }, [log]);

  // ── Cleanup ──────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (transportCleanupRef.current) {        // ← ADD THESE 3 LINES
      transportCleanupRef.current();
      transportCleanupRef.current = null;
    }
    if (producerRef.current) { producerRef.current.close(); producerRef.current = null; }
    if (sendTransportRef.current) { sendTransportRef.current.close(); sendTransportRef.current = null; }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    try { InCallManager.stop({ busytone: '' }); } catch (_) {}
    setConnectedListeners({});
    setIceState('—');
    setDtlsState('—');
    setIsMuted(false);
    deviceRef.current = null;
  }, []);

  // ── Start producing ──────────────────────────────────────────────────────────
  const startProducing = useCallback(async (currentRoomId) => {
    try {
      setStatus('connecting');
      setStatusText('Requesting microphone…');
      log('Requesting microphone access…');

      InCallManager.start({ media: 'audio', auto: false, ringback: '' });
      InCallManager.setForceSpeakerphoneOn(false);
      InCallManager.setMicrophoneMute(false);

       const stream = await mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,  // ← add this
          channelCount: 1,    // ← add this
        },
        video: false
      });
      localStreamRef.current = stream;
      const audioTrack = stream.getAudioTracks()[0];
      log(`Microphone granted: ${audioTrack.label}`, 'ok');

      console.log('🔴 CREATOR audioTrack readyState:', audioTrack.readyState);

    // Monitor track ending:
    const checkTrack = setInterval(() => {
      if (audioTrack.readyState === 'ended') {
        console.log('🔴 CREATOR: audioTrack ended — readyState is ended');
        clearInterval(checkTrack);
      }
    }, 2000);

      const tParams = await emitAsync('ms:create-transport', { roomId: currentRoomId, direction: 'send' });
      const iceServersForTransport = tParams.iceServers?.length ? tParams.iceServers : ICE_SERVERS;
      console.log('Using ICE servers:', iceServersForTransport);

      const sendTransport = deviceRef.current.createSendTransport({
        ...tParams,
        iceServers: iceServersForTransport,
        iceTransportPolicy: 'all',
      });
      sendTransportRef.current = sendTransport;
      log(`Send transport created: ${sendTransport.id}`, 'ok');
      transportCleanupRef.current = watchTransport(sendTransport); //23-2026

      sendTransport.on('connect', async ({ dtlsParameters }, cb, eb) => {
        try {
          await emitAsync('ms:connect-transport', { roomId: currentRoomId, transportId: sendTransport.id, dtlsParameters });
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
        codecOptions: {
          opusStereo: false,
          opusDtx: true,
          opusFec: true,
          opusMaxPlaybackRate: 48000,
        },
      });
      producerRef.current = producer;
      // ← add these after:
      producer.on('transportclose', () => {
        console.log('🔴 CREATOR: transportclose fired');
      });
      producer.on('trackended', () => {
        console.log('🔴 CREATOR: trackended fired');
      });

      // ← Add this:
    sendTransport.on('connectionstatechange', (state) => {
      console.log('🔴 CREATOR sendTransport connectionstatechange:', state);
    });

    sendTransport.on('icegatheringstatechange', (state) => {
      console.log('🔴 CREATOR sendTransport icegatheringstatechange:', state);
    });
      log('Producer ready ✓', 'ok');

      setStatus('streaming');
      setStatusText('Live — streaming audio');
    } catch (err) {
      log(`startProducing error: ${err.message}`, 'error');
      setStatus('error');
      setStatusText(`${err.message}`);
    }
  }, [emitAsync, log, watchTransport]);

  // ── Join room (always as 'creator') ─────────────────────────────────────────
  const joinRoom = useCallback(async (targetRoomId, sosId) => {
    if (!isConnected || !socket) {
      log('Socket not connected — cannot join room', 'error');
      return;
    }

    setRoomId(targetRoomId);
    setStatus('connecting');
    setStatusText('Connecting to room…');
    log(`Joining room "${targetRoomId}" as creator…`);

    try {
      const joinRes = await emitAsync('ms:join-room', { roomId: targetRoomId, role: 'creator', sosId });
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

      await startProducing(targetRoomId);
    } catch (err) {
      log(`joinRoom error: ${err.message}`, 'error');
      setStatus('error');
      setStatusText(`${err.message}`);
    }
  }, [isConnected, socket, emitAsync, log, startProducing]);

  // ── Leave room ───────────────────────────────────────────────────────────────
  const leaveRoom = useCallback(() => {
    cleanup();
    setStatus('idle');
    setStatusText('Idle — not connected');
    setRoomId(null);
    log('Left room', 'warn');
  }, [cleanup, log]);

  // ── Mute toggle ──────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const producer = producerRef.current;
    if (!producer) return;
    const next = !isMuted;
    setIsMuted(next);
    if (next) { producer.pause(); log('Microphone muted', 'info'); }
    else { producer.resume(); log('Microphone unmuted', 'info'); }
  }, [isMuted, log]);

  // ── Socket events ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onListenerJoined = data => setConnectedListeners(prev => ({ ...prev, [data.userId]: data }));
    const onListenerLeft = data => setConnectedListeners(prev => {
      const updated = { ...prev };
      delete updated[data.userId];
      return updated;
    });

    socket.on('listener-joined', onListenerJoined);
    socket.on('listener-left', onListenerLeft);

    return () => {
      socket.off('listener-joined', onListenerJoined);
      socket.off('listener-left', onListenerLeft);
    };
  }, [socket]);

  // ── Cleanup on socket disconnect ─────────────────────────────────────────────
  useEffect(() => {
    if (!isConnected && status !== 'idle') {
      console.log('🔴 CREATOR: socket disconnected — waiting 5s before cleanup');
      creatorDisconnectTimerRef.current = setTimeout(() => {
        if (!isConnected) {
          console.log('🔴 CREATOR: still disconnected after 5s — cleaning up');
          cleanup();
          setStatus('idle');
          setStatusText('Disconnected');
          setRoomId(null);
        }
      }, 5000);
    } else if (isConnected) {
      if (creatorDisconnectTimerRef.current) {
        clearTimeout(creatorDisconnectTimerRef.current);
        creatorDisconnectTimerRef.current = null;
      }
    }
  }, [isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  
  //23-2026: Cleanup on unmount
  useEffect(() => {
    return () => {
      if (creatorDisconnectTimerRef.current) clearTimeout(creatorDisconnectTimerRef.current);
      // Also stop any lingering transport interval
      if (transportCleanupRef.current) transportCleanupRef.current();
    };
  }, []);
  //23-2026 end

  const value = {
    status,
    statusText,
    roomId,
    isMuted,
    iceState,
    dtlsState,
    logs,
    localStream: localStreamRef.current,
    connectedListeners,
    joinRoom,
    leaveRoom,
    toggleMute,
    clearLogs,
  };

  return (
    <CreatorMediaSoupContext.Provider value={value}>
      {children}
    </CreatorMediaSoupContext.Provider>
  );
};

export const useCreatorMediaSoup = () => {
  const context = useContext(CreatorMediaSoupContext);
  if (!context) throw new Error('useCreatorMediaSoup must be used within CreatorMediaSoupProvider');
  return context;
};

export default CreatorMediaSoupContext;
