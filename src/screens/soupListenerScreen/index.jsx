/**
 * ListenerScreen.jsx
 *
 * The receiver screen. Joins a room as 'listener', consumes the creator's
 * audio stream via mediasoup recv transport, and plays it through the device.
 *
 * Uses react-native-webrtc's RTCView (audio-only; RTCView just wires the track).
 * For audio-only playback you can use InCallManager or a plain Sound if RTCView
 * is not needed visually — the remoteStream is exposed on the context either way.
 *
 * Expects both SocketProvider and MediaSoupProvider in the tree above it.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useSocket } from '../../context/SocketContext';
import { useListenerMediaSoup } from '../../context/ListenerMediaSoupContext';
import AudioVisualizer from '../../components/audioVisualizer';

// ─── Optional: react-native-webrtc RTCView for audio track attachment ─────────
let RTCView;
try {
  RTCView = require('react-native-webrtc').RTCView;
} catch (_) {
  RTCView = null;
}

// ─── Colour tokens ────────────────────────────────────────────────────────────
const C = {
  bg:       '#0d0d0f',
  surface:  '#17171a',
  surface2: '#1f1f24',
  border:   '#2a2a30',
  text:     '#e8e8ed',
  muted:    '#6b6b7a',
  accent:   '#7c6ff7',
  red:      '#ef4444',
  green:    '#22c55e',
  amber:    '#f59e0b',
};

// ─── Status badge config ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  idle:       { label: 'IDLE',       dotColor: C.border, badgeColor: C.muted,  badgeBg: C.surface2 },
  connecting: { label: 'CONNECTING', dotColor: C.accent, badgeColor: C.accent, badgeBg: 'rgba(124,111,247,.15)' },
  listening:  { label: '● LISTENING',dotColor: C.green,  badgeColor: C.green,  badgeBg: 'rgba(34,197,94,.15)' },
  waiting:    { label: 'WAITING',    dotColor: C.amber,  badgeColor: C.amber,  badgeBg: 'rgba(245,158,11,.15)' },
  error:      { label: 'ERROR',      dotColor: C.red,    badgeColor: C.red,    badgeBg: 'rgba(239,68,68,.15)' },
};

const LOG_COLORS = {
  info:  C.accent,
  ok:    C.green,
  warn:  C.amber,
  error: C.red,
};

export default function ListenerScreen() {
  const { isConnected } = useSocket();
  const {
    status,
    statusText,
    roomId: activeRoomId,
    iceState,
    dtlsState,
    iceServers,
    logs,
    remoteStream,
    joinRoom,
    leaveRoom,
    clearLogs,
  } = useListenerMediaSoup();

  const [roomInput, setRoomInput]   = useState('test-room');
  const [volume, setVolume]         = useState(1.0);

  const isInRoom    = status !== 'idle' && status !== 'error';
  const isListening = status === 'listening';
  const cfg         = STATUS_CONFIG[status] ?? STATUS_CONFIG.idle;

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleJoin = useCallback(() => {
    const id = roomInput.trim() || 'test-room';
    joinRoom(id);
  }, [roomInput, joinRoom]);

  const handleLeave = useCallback(() => {
    leaveRoom();
  }, [leaveRoom]);

  // Volume steps: 0 → 0.25 → 0.5 → 0.75 → 1.0 (cycle)
  const cycleVolume = useCallback(() => {
    setVolume(prev => {
      const steps = [0, 0.25, 0.5, 0.75, 1.0];
      const idx   = steps.findIndex(s => Math.abs(s - prev) < 0.01);
      return steps[(idx + 1) % steps.length];
    });
  }, []);

  const volumeLabel = `🔊 ${Math.round(volume * 100)}%`;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🎧 Listener</Text>
          <View style={[styles.socketPill, { borderColor: isConnected ? C.green : C.border }]}>
            <Text style={[styles.socketPillText, { color: isConnected ? C.green : C.muted }]}>
              {isConnected ? '⬤ Socket Connected' : '⬤ Socket Disconnected'}
            </Text>
          </View>
        </View>

        {/* ── Status card ── */}
        <View style={styles.card}>
          <View style={[styles.liveDot, { backgroundColor: cfg.dotColor }]} />
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>Status</Text>
            <Text style={styles.statusValue}>{statusText}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: cfg.badgeBg }]}>
            <Text style={[styles.badgeText, { color: cfg.badgeColor }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* ── Stats strip ── */}
        <View style={styles.statsRow}>
          {[
            { label: 'Role',       value: isInRoom ? '🎧 Listener' : '—' },
            { label: 'Room',       value: activeRoomId ?? '—' },
            { label: 'ICE State',  value: iceState },
            { label: 'DTLS State', value: dtlsState },
          ].map(({ label, value }) => (
            <View key={label} style={styles.statBox}>
              <Text style={styles.statLabel}>{label}</Text>
              <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
            </View>
          ))}
        </View>

        {/* ── Visualizer ── */}
        <AudioVisualizer
          active={isListening}
          color="#22c55e"
          label="Received Audio"
          height={64}
        />

        {/* ── Hidden RTCView for audio pipeline (audio-only streams) ── */}
        {RTCView && remoteStream && (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.rtcHidden}
            objectFit="cover"
          />
        )}

        {/* ── Room setup ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ROOM SETUP</Text>
          <Text style={styles.fieldLabel}>Room ID</Text>
          <TextInput
            style={[styles.input, isInRoom && styles.inputDisabled]}
            value={roomInput}
            onChangeText={setRoomInput}
            placeholder="Enter room ID"
            placeholderTextColor={C.muted}
            editable={!isInRoom}
            autoCapitalize="none"
          />
        </View>

        {/* ── Connect / Leave ── */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, (isInRoom || !isConnected) && styles.btnDisabled]}
            onPress={handleJoin}
            disabled={isInRoom || !isConnected}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>Connect &amp; Listen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnGhost, !isInRoom && styles.btnDisabled]}
            onPress={handleLeave}
            disabled={!isInRoom}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnText, { color: C.text }]}>Leave Room</Text>
          </TouchableOpacity>
        </View>

        {/* ── Volume ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AUDIO CONTROLS</Text>
          <TouchableOpacity
            style={[styles.btn, styles.btnGhost, !isListening && styles.btnDisabled]}
            onPress={cycleVolume}
            disabled={!isListening}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnText, { color: C.text }]}>{volumeLabel}</Text>
          </TouchableOpacity>
          <View style={styles.volumeBarTrack}>
            <View style={[styles.volumeBarFill, { width: `${volume * 100}%` }]} />
          </View>
          <Text style={styles.volumeHint}>Tap to cycle volume: 0% → 25% → 50% → 75% → 100%</Text>
        </View>

        {/* ── ICE servers ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ICE SERVERS</Text>
          {iceServers.flatMap((s, si) =>
            (Array.isArray(s.urls) ? s.urls : [s.urls]).map((url, ui) => {
              const isSTUN = url.startsWith('stun');
              const isTURN = url.startsWith('turn') || url.startsWith('turns');
              return (
                <View key={`${si}-${ui}`} style={styles.iceItem}>
                  <View style={[styles.iceDot, { backgroundColor: isSTUN ? C.amber : isTURN ? C.accent : C.border }]} />
                  <Text style={styles.iceText} numberOfLines={1}>{url}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* ── Log ── */}
        <View style={styles.logWrap}>
          <View style={styles.logHeader}>
            <Text style={styles.logHeaderText}>EVENT LOG</Text>
            <TouchableOpacity onPress={clearLogs}>
              <Text style={styles.logClear}>Clear</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.logList} nestedScrollEnabled>
            {logs.length === 0
              ? <Text style={styles.logEmpty}>No events yet…</Text>
              : [...logs].reverse().map((item, i) => (
                  <View key={String(i)} style={styles.logEntry}>
                    <Text style={styles.logTs}>{item.ts}</Text>
                    <Text style={[styles.logMsg, { color: LOG_COLORS[item.type] ?? C.text }]}>{item.msg}</Text>
                  </View>
                ))
            }
          </ScrollView>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: C.bg },
  scroll:          { flex: 1 },
  scrollContent:   { padding: 16, gap: 14 },

  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  headerTitle:     { fontSize: 20, fontWeight: '700', color: C.text },
  socketPill:      { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  socketPillText:  { fontSize: 11, fontWeight: '600' },

  card:            { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  liveDot:         { width: 14, height: 14, borderRadius: 7 },
  statusInfo:      { flex: 1 },
  statusLabel:     { fontSize: 12, color: C.muted },
  statusValue:     { fontSize: 15, fontWeight: '600', color: C.text, marginTop: 2 },
  badge:           { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:       { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },

  statsRow:        { flexDirection: 'row', gap: 8 },
  statBox:         { flex: 1, backgroundColor: C.surface, borderRadius: 8, borderWidth: 1, borderColor: C.border, padding: 10 },
  statLabel:       { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.7 },
  statValue:       { fontSize: 13, fontWeight: '700', color: C.text, marginTop: 4 },

  rtcHidden:       { position: 'absolute', width: 1, height: 1, opacity: 0 },

  section:         { gap: 8 },
  sectionTitle:    { fontSize: 11, fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  fieldLabel:      { fontSize: 12, color: C.muted },
  input:           { backgroundColor: C.surface2, borderRadius: 8, borderWidth: 1, borderColor: C.border, color: C.text, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  inputDisabled:   { opacity: 0.5 },

  buttonRow:       { flexDirection: 'row', gap: 10 },
  btn:             { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnPrimary:      { backgroundColor: C.accent },
  btnGhost:        { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border },
  btnDisabled:     { opacity: 0.4 },
  btnText:         { fontSize: 14, fontWeight: '700', color: '#fff' },

  volumeBarTrack:  { height: 4, backgroundColor: C.surface2, borderRadius: 2, overflow: 'hidden' },
  volumeBarFill:   { height: '100%', backgroundColor: C.accent, borderRadius: 2 },
  volumeHint:      { fontSize: 11, color: C.muted },

  iceItem:         { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface2, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  iceDot:          { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  iceText:         { fontSize: 12, color: C.muted, flex: 1 },

  logWrap:         { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  logHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  logHeaderText:   { fontSize: 11, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.7 },
  logClear:        { fontSize: 12, color: C.muted },
  logList:         { maxHeight: 220, padding: 12 },
  logEntry:        { flexDirection: 'row', gap: 10, marginBottom: 4 },
  logTs:           { fontSize: 11, color: C.muted, flexShrink: 0, fontFamily: 'monospace' },
  logMsg:          { fontSize: 11, flex: 1, fontFamily: 'monospace' },
  logEmpty:        { fontSize: 12, color: C.muted, textAlign: 'center', paddingVertical: 16 },
});
