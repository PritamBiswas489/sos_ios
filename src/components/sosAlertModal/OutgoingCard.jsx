import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet , Alert} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PulseDot } from './shared';
import { getProfileImage } from '../../config/utility';
import { useState } from 'react';
import Spinner from 'react-native-loading-spinner-overlay';
import { SOSService } from '../../services/sos.service';
import useToast from '../../hook/useToast';
import AudioPlayerModal from '../audioPlayerModal';
import { getMediaUrlFromRawUrl } from '../../config/utility';


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const STATUS_CONFIG = {
  active:    { color: '#4ADE80', icon: 'shield-alert-outline',  label: 'ACTIVE' },
  expired:   { color: '#FACC15', icon: 'clock-alert-outline',   label: 'EXPIRED' },
  cancelled: { color: '#F87171', icon: 'close-circle-outline',  label: 'CANCELLED' },
  resolved:  { color: '#818CF8', icon: 'check-circle-outline',  label: 'RESOLVED' },
};

const RESPONSE_STATUS_CONFIG = {
  pending:    { color: '#FACC15', icon: 'clock-outline',        label: 'Pending'    },
  accepted:   { color: '#4ADE80', icon: 'check-circle-outline', label: 'Accepted'   },
  on_the_way: { color: '#4A9EFF', icon: 'car-arrow-right',      label: 'On the way' },
  declined:   { color: '#F87171', icon: 'close-circle-outline', label: 'Declined'   },
  failed:     { color: '#EF4444', icon: 'alert-circle-outline',  label: 'Failed to reach'     },
  reached :    { color: '#22C55E', icon: 'check-circle-outline', label: 'Reached'    },
};

const STAT_ITEMS = [
  { key: 'pending', label: 'Pending', color: '#FACC15', icon: 'clock-outline' },
  { key: 'responded', label: 'Responded', color: '#4A9EFF', icon: 'reply-outline' },
  { key: 'onTheWay', label: 'On the way', color: '#38BDF8', icon: 'car-arrow-right' },
  { key: 'reached', label: 'Reached', color: '#22C55E', icon: 'map-marker-check-outline' },
  { key: 'failed', label: 'Failed', color: '#EF4444', icon: 'alert-circle-outline' },
  { key: 'declined', label: 'Declined', color: '#F87171', icon: 'close-circle-outline' },
];

const AVATAR_COLORS = ['#FF3B5C', '#4A9EFF', '#00FF9C', '#FFA502', '#A855F7'];

const formatTime = iso => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
};

const ContactAvatar = ({ user, size = 34 }) => {
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? '?';
  const color = AVATAR_COLORS[(user?.id?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
  if (user?.profile_photo) {
    return (
      <Image
        source={{ uri: getProfileImage(user.profile_photo) }}
        style={[styles.contactAvatar, { width: size, height: size, borderRadius: size / 2, borderColor: color }]}
      />
    );
  }
  return (
    <View style={[styles.contactAvatarFallback, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '22', borderColor: color }]}>
      <Text style={[styles.contactAvatarInitial, { color, fontSize: size * 0.38 }]}>{initial}</Text>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Outgoing SOS card — my SOS session
// ---------------------------------------------------------------------------
const OutgoingCard = ({ item:outgoingItem, onCancel, onResolve }) => {
  const [item, setItem] = useState(outgoingItem);
  const [activeAudioUrl, setActiveAudioUrl] = useState('');
  const [isAudioModalVisible, setIsAudioModalVisible] = useState(false);
  const status = item.status ?? 'active';
  const stressData = item.stress_data ?? null;
  const location = item.location ?? null;
  const stressHR = stressData?.hr ?? null;
  const stressScore = stressData?.stress_score ?? null;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;
  const isActive = status === 'active';
  const [isLoading, setLoading] = useState(false);
  const { showError, showSuccess } = useToast();

  const notifications = item.notifications ?? [];
  const respondedCount = item.numberofResponded ?? 0;
  const onWayCount = item.numberOnTheWay ?? 0;
  const reachedCount = item.numberReached ?? 0;
  const failedCount = item.numberFailed ?? 0;
  const declinedCount = item.numberDeclined ?? 0;
  const pendingCount = item.numberPending ?? 0;
  const audioRecords = item.audio_records ?? [];
   
  const stats = {
    pending: pendingCount,
    responded: respondedCount,
    onTheWay: onWayCount,
    reached: reachedCount,
    failed: failedCount,
    declined: declinedCount,
  };

  const changeStatus = newStatus => {
      Alert.alert(
        'Confirm Status Update',
        'Are you sure you want to change your SOS session status?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Confirm',
            onPress: () => {
              setLoading(true);
              SOSService.changeMySosSessionStatus(
                { session_id: item.id, status: newStatus },
                result => {
                  setLoading(false);
                  if (result.success === false) {
                    console.error('Error updating SOS session status:', result);
                    showError(result?.error ?? 'Failed to update SOS session status');
                  } else {
                    setItem(prev => ({ ...prev, status: newStatus }));
                    showSuccess('SOS session status updated successfully');
                  }
                },
              );
            },
          },
        ],
        { cancelable: true },
      );
    };

  const handleOpenAudio = audioUrl => {
    if (!audioUrl) {
      showError('Audio file is not available');
      return;
    }
    setActiveAudioUrl(audioUrl);
    setIsAudioModalVisible(true);
  };

  const handleCloseAudio = () => {
    setIsAudioModalVisible(false);
    setActiveAudioUrl('');
  };

  return (
    <View style={[styles.card, { borderColor: cfg.color + '30' }]}>
      <Spinner visible={isLoading} />
      {/* ── Top row: badge + status pill ── */}
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          {isActive && <PulseDot color={cfg.color} />}
          <Text style={[styles.badgeText, { color: cfg.color }]}>MY SOS ALERT #{item.id}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: cfg.color + '18', borderColor: cfg.color + '40' }]}>
          <Icon name={cfg.icon} size={11} color={cfg.color} />
          <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* ── Meta ── */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Icon name="clock-outline" size={12} color="#6B7C99" />
          <Text style={styles.metaText}>{formatTime(item.created_at)}</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <Icon name="bell-ring-outline" size={12} color="#6B7C99" />
          <Text style={styles.metaText}>Trigger #{item.number_of_trigger ?? 1}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* ── Stress / Vitals snapshot ── */}
      {(stressHR !== null || stressScore !== null) && (
        <>
          <View style={styles.stressPanel}>
            <View style={styles.stressPanelHeader}>
              <Icon name="heart-pulse" size={13} color="#FF3B5C" />
              <Text style={styles.stressPanelTitle}>VITALS AT TRIGGER</Text>
            </View>
            <View style={styles.stressMetrics}>
              {stressHR !== null && (
                <View style={styles.stressMetricCard}>
                  <View style={[styles.stressMetricIcon, { backgroundColor: 'rgba(255,59,92,0.15)' }]}>
                    <Icon name="heart-pulse" size={18} color="#FF3B5C" />
                  </View>
                  <Text style={[styles.stressMetricValue, { color: '#FF3B5C' }]}>{stressHR}</Text>
                  <Text style={styles.stressMetricUnit}>bpm</Text>
                  <Text style={styles.stressMetricLabel}>Heart Rate</Text>
                </View>
              )}
              {stressHR !== null && stressScore !== null && (
                <View style={styles.stressMetricSep} />
              )}
              {stressScore !== null && (
                <View style={styles.stressMetricCard}>
                  <View style={[styles.stressMetricIcon, { backgroundColor: 'rgba(129,140,248,0.15)' }]}>
                    <Icon name="brain" size={18} color="#818CF8" />
                  </View>
                  <Text style={[styles.stressMetricValue, { color: '#818CF8' }]}>
                    {stressScore}<Text style={styles.stressMetricPercent}>%</Text>
                  </Text>
                  <Text style={styles.stressMetricUnit}>/ 100</Text>
                  <Text style={styles.stressMetricLabel}>Stress Index</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.divider} />
        </>
      )}

      {/* ── Location ── */}
      {!!location && (
        <View style={styles.locationRow}>
          <Icon name="map-marker" size={15} color="#FFA502" />
          <Text style={styles.locationText}>{location}</Text>
        </View>
      )}

      <View style={styles.statsSection}>
        <Text style={styles.statsHeading}>Response summary</Text>
        <View style={styles.statsGrid}>
          {STAT_ITEMS.map(stat => (
            <View
              key={stat.key}
              style={[styles.statCard, { borderColor: `${stat.color}33`, backgroundColor: `${stat.color}14` }]}
            >
              <View style={styles.statCardTop}>
                <Icon name={stat.icon} size={14} color={stat.color} />
                <Text style={[styles.statCardValue, { color: stat.color }]}>{stats[stat.key]}</Text>
              </View>
              <Text style={styles.statCardLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Notified contacts ── */}
      {notifications.length > 0 && (
        <View style={styles.contactsSection}>
          <View style={styles.divider} />
          <Text style={styles.contactsLabel}>Alerted contacts</Text>
          {notifications.map(n => {
            const rCfg = RESPONSE_STATUS_CONFIG[n.response_status] || RESPONSE_STATUS_CONFIG.pending;
            return (
              <View key={n.id} style={styles.contactRow}>
                <ContactAvatar user={n.to_user} size={34} />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName} numberOfLines={1}>{n.to_user?.name ?? 'Unknown'}</Text>
                 
                </View>
                <View style={[styles.responseBadge, { backgroundColor: rCfg.color + '18', borderColor: rCfg.color + '40' }]}>
                  <Icon name={rCfg.icon} size={11} color={rCfg.color} />
                  <Text style={[styles.responseBadgeText, { color: rCfg.color }]}>
                    {rCfg.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* ── Audio records ── */}
      {audioRecords.length > 0 && (
        <View style={styles.audioSection}>
          <View style={styles.divider} />
          <View style={styles.audioHeaderRow}>
            <Text style={styles.audioLabel}>Audio records</Text>
            <View style={styles.audioCountPill}>
              <Icon name="waveform" size={11} color="#4A9EFF" />
              <Text style={styles.audioCountText}>{audioRecords.length}</Text>
            </View>
          </View>
          {audioRecords.map((record, index) => (
            <View key={record.id?.toString() ?? record.file_url} style={styles.audioRow}>
              <View style={styles.audioMetaWrap}>
                <View style={styles.audioIconBubble}>
                  <Icon name="music-note" size={14} color="#7EC0FF" />
                </View>
                <View style={styles.audioTextWrap}>
                  <Text style={styles.audioFileName} numberOfLines={1}>
                    { 'Audio record '+ (index + 1) }
                  </Text>
                  <Text style={styles.audioTimeText}>
                    {formatTime(record.created_at)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.audioPlayBtn}
                onPress={() => handleOpenAudio(getMediaUrlFromRawUrl(record.file_url))}
                activeOpacity={0.8}
              >
                <Icon name="play" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* ── Action buttons (active only) ── */}
      {isActive && (
        <>
          <View style={styles.divider} />
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => changeStatus('cancelled')} activeOpacity={0.7}>
              <Icon name="close-circle-outline" size={15} color="#F87171" />
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resolveBtn} onPress={() => changeStatus('resolved')} activeOpacity={0.7}>
              <Icon name="check-circle-outline" size={15} color="#4ADE80" />
              <Text style={styles.resolveBtnText}>Resolved</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <AudioPlayerModal
        visible={isAudioModalVisible}
        audioUrl={activeAudioUrl}
        onClose={handleCloseAudio}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#071022',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  // top row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // meta
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#6B7C99',
    fontSize: 12,
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(107,124,153,0.25)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  // location
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,165,2,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,165,2,0.2)',
  },
  locationText: {
    color: '#FFA502',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  // stats
  statsSection: {
    gap: 10,
  },
  statsHeading: {
    color: '#6B7C99',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '31%',
    minWidth: 92,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
  },
  statCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statCardLabel: {
    color: '#D1D9E6',
    fontSize: 11,
    fontWeight: '600',
  },
  // contacts
  contactsSection: {
    gap: 10,
  },
  audioSection: {
    gap: 10,
  },
  audioHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  audioLabel: {
    color: '#6B7C99',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  audioCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(74,158,255,0.35)',
    backgroundColor: 'rgba(74,158,255,0.15)',
  },
  audioCountText: {
    color: '#7EC0FF',
    fontSize: 10,
    fontWeight: '700',
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(126,192,255,0.22)',
    backgroundColor: 'rgba(126,192,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 10,
  },
  audioMetaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  audioIconBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,158,255,0.18)',
  },
  audioTextWrap: {
    flex: 1,
    gap: 2,
  },
  audioFileName: {
    color: '#D9E8FF',
    fontSize: 12,
    fontWeight: '600',
  },
  audioTimeText: {
    color: '#8AA2C6',
    fontSize: 11,
  },
  audioPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A9EFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  contactsLabel: {
    color: '#6B7C99',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactAvatar: {
    borderWidth: 1.5,
  },
  contactAvatarFallback: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactAvatarInitial: {
    fontWeight: '700',
  },
  contactInfo: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    color: '#D1D9E6',
    fontSize: 13,
    fontWeight: '600',
  },
  contactPhone: {
    color: '#6B7C99',
    fontSize: 11,
  },
  responseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  responseBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  // actions
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.2)',
  },
  cancelBtnText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '700',
  },
  resolveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(74,222,128,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.2)',
  },
  resolveBtnText: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '700',
  },
  // stress vitals panel
  stressPanel: {
    borderWidth: 1,
    borderColor: 'rgba(255,59,92,0.20)',
    backgroundColor: 'rgba(255,59,92,0.05)',
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  stressPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stressPanelTitle: {
    color: '#FF3B5C',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  stressMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stressMetricCard: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  stressMetricSep: {
    width: 1,
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginHorizontal: 8,
  },
  stressMetricIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  stressMetricValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stressMetricPercent: {
    fontSize: 14,
    fontWeight: '600',
  },
  stressMetricUnit: {
    color: '#6B7C99',
    fontSize: 11,
    fontWeight: '500',
    marginTop: -2,
  },
  stressMetricLabel: {
    color: '#8AA2C6',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});

export default OutgoingCard;
