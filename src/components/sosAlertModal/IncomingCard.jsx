import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProfileImage } from '../../config/utility';
import { useState } from 'react';
import { SOSService } from '../../services/sos.service';
import useToast from '../../hook/useToast';
import Spinner from 'react-native-loading-spinner-overlay';
import AudioPlayerModal from '../audioPlayerModal';
import { getMediaUrlFromRawUrl } from '../../config/utility';
 

// ── Session status config ──────────────────────────────────────────────────
const SESSION_STATUS_CONFIG = {
  active:    { color: '#4ADE80', icon: 'shield-alert-outline',  label: 'Active'    },
  expired:   { color: '#FACC15', icon: 'clock-alert-outline',   label: 'Expired'   },
  cancelled: { color: '#F87171', icon: 'close-circle-outline',  label: 'Cancelled' },
  resolved:  { color: '#818CF8', icon: 'check-circle-outline',  label: 'Resolved'  },
};

// ── My response status config ──────────────────────────────────────────────
const RESPONSE_STATUS_CONFIG = {
  pending:    { color: '#FACC15', icon: 'clock-outline',        label: 'Pending'    },
  accepted:   { color: '#4ADE80', icon: 'check-circle-outline', label: 'Accepted'   },
  on_the_way: { color: '#4A9EFF', icon: 'car-arrow-right',      label: 'On the way' },
  declined:   { color: '#F87171', icon: 'close-circle-outline', label: 'Declined'   },
  failed:     { color: '#EF4444', icon: 'alert-circle-outline',  label: 'Failed to reach'     },
  reached :    { color: '#22C55E', icon: 'check-circle-outline', label: 'Reached'    },
};

const AVATAR_COLORS = ['#4A9EFF', '#4ADE80', '#FACC15', '#F87171', '#818CF8', '#FB923C'];

const formatTime = iso => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const UserAvatar = ({ user, size = 52 }) => {
  const initial = user?.name?.[0]?.toUpperCase() ?? '?';
  const color = AVATAR_COLORS[Number(user?.id ?? 0) % AVATAR_COLORS.length];
  if (user?.profile_photo) {
    return (
      <Image
        source={{ uri: getProfileImage(user.profile_photo) }}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2, borderColor: '#FF3B5C40' },
        ]}
      />
    );
  }
  return (
    <View
      style={[
        styles.avatarFallback,
        {
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: color + '22', borderColor: color,
        },
      ]}>
      <Text style={[styles.avatarInitial, { fontSize: size * 0.38, color }]}>{initial}</Text>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Incoming SOS card
// ---------------------------------------------------------------------------
const IncomingCard = ({ item:incomingItem, navigationRef, onAccept, onDecline, onClose }) => {
  console.log('Rendering IncomingCard with item:', incomingItem);
  const [item, setItem] = useState(incomingItem);
  const [activeAudioUrl, setActiveAudioUrl] = useState('');
  const [isAudioModalVisible, setIsAudioModalVisible] = useState(false);
  const session        = item.sos_session ?? {};
  const sender         = session.user ?? {};
  const audioRecords   = session.audio_records ?? [];
  const sessionStatus  = (session.status ?? 'active').toLowerCase();
  const responseStatus = (item.response_status ?? 'pending').toLowerCase();
  const stressData     = session.stress_data ?? null;
  const stressHR       = stressData?.hr ?? null;
  const stressScore    = stressData?.stress_score ?? null;
  const hasStressData  = stressHR !== null || stressScore !== null;
  const latitude       = stressData?.latitude ?? session.latitude ?? null;
  const longitude      = stressData?.longitude ?? session.longitude ?? null;
  const location       = session?.location;
  const hasLocation    = latitude !== null && longitude !== null;
  
   
  const sCfg =
    SESSION_STATUS_CONFIG[sessionStatus] ?? SESSION_STATUS_CONFIG.active;
  const rCfg =
    RESPONSE_STATUS_CONFIG[responseStatus] ?? RESPONSE_STATUS_CONFIG.pending;
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(false);

  const changeStatus = newStatus => {
    Alert.alert(
      'Confirm Status Update',
      'Are you sure you want to change your response status?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => {
            setLoading(true);
            SOSService.reponseSosNotification(
              { notification_id: item.id, status: newStatus },
              result => {
                setLoading(false);
                if (result.success === false) {
                  console.error('Error updating SOS response status:', result);
                  showError(result?.error ?? 'Failed to update SOS response status');
                } else {
                  setItem(prev => ({ ...prev, response_status: newStatus }));
                  showSuccess('SOS response status updated successfully');
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
    <View style={[styles.card, { borderColor: sCfg.color + '30' }]}>
      <Spinner visible={loading} />
      {/* ── Top row: badge + session status pill ── */}
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <Icon name="shield-alert" size={14} color="#FF3B5C" />
          <Text style={styles.badgeText}>INCOMING SOS #{session.id}</Text>
        </View>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: sCfg.color + '18',
              borderColor: sCfg.color + '50',
            },
          ]}
        >
          <Icon name={sCfg.icon} size={11} color={sCfg.color} />
          <Text style={[styles.statusPillText, { color: sCfg.color }]}>
            {sCfg.label}
          </Text>
        </View>
      </View>

      {/* ── Meta row: time · trigger # · alert # ── */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Icon name="clock-outline" size={12} color="#6B7C99" />
          <Text style={styles.metaText}>{formatTime(session.created_at)}</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <Icon name="repeat-variant" size={12} color="#6B7C99" />
          <Text style={styles.metaText}>
            Trigger #{session.number_of_trigger ?? 1}
          </Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <Icon name="bell-outline" size={12} color="#6B7C99" />
          <Text style={styles.metaText}>Alert #{item.alert_number ?? 1}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* ── Sender profile ── */}
      <View style={styles.profileRow}>
        <UserAvatar user={sender} size={52} />
        <View style={styles.profileInfo}>
          <Text style={styles.senderName} numberOfLines={1}>
            {sender.name ?? 'Unknown'}
          </Text>
          <View
            style={[
              styles.responseBadge,
              {
                backgroundColor: rCfg.color + '18',
                borderColor: rCfg.color + '40',
              },
            ]}
          >
            <Icon name={rCfg.icon} size={11} color={rCfg.color} />
            <Text style={[styles.responseBadgeText, { color: rCfg.color }]}>
              My status: {rCfg.label}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* ── Stress / Vitals snapshot ── */}
      {hasStressData && (
        <>
          <View style={styles.stressRow}>
            {stressHR !== null && (
              <View style={styles.stressCard}>
                <View style={styles.stressIconWrap}>
                  <Icon name="heart-pulse" size={18} color="#FF3B5C" />
                </View>
                <Text style={styles.stressValue}>{stressHR}</Text>
                <Text style={styles.stressUnit}>bpm</Text>
                <Text style={styles.stressLabel}>Heart Rate</Text>
              </View>
            )}
            {stressScore !== null && (
              <View style={[styles.stressCard, styles.stressScoreCard]}>
                <View style={[styles.stressIconWrap, styles.stressScoreIcon]}>
                  <Icon name="brain" size={18} color="#818CF8" />
                </View>
                <Text style={[styles.stressValue, styles.stressScoreValue]}>
                  {stressScore}
                  <Text style={styles.stressScorePercent}>%</Text>
                </Text>
                <Text style={styles.stressUnit}>/ 100</Text>
                <Text style={styles.stressLabel}>Stress Index</Text>
              </View>
            )}
          </View>
          <View style={styles.divider} />
        </>
      )}

      {/* ── Location ── */}
      {hasLocation && (
        <TouchableOpacity
          style={styles.locationRow}
          activeOpacity={0.7}
          onPress={() => {
            if (navigationRef.isReady()) {
              onClose?.();
              navigationRef.navigate('Main', {
                screen: 'MainTabs',
                params: {
                  screen: 'Map',
                  params: { selectedMapRecipentId: item.sos_session?.user?.id },
                },
              });
            }
          }}
        >
          <Icon name="map-marker" size={15} color="#FFA502" />
          <Text style={styles.locationText}>
            {location}
          </Text>
          <Icon name="chevron-right" size={16} color="#FFA502" />
        </TouchableOpacity>
      )}

      {/* ── Accept / Decline (pending only) ── */}
      {responseStatus === 'pending' && sessionStatus === 'active' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.declineBtn}
            onPress={() => changeStatus('declined')}
            activeOpacity={0.7}
          >
            <Icon name="close-circle-outline" size={15} color="#F87171" />
            <Text style={styles.declineBtnText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => changeStatus('accepted')}
            activeOpacity={0.7}
          >
            <Icon name="check-circle-outline" size={15} color="#4ADE80" />
            <Text style={styles.acceptBtnText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}
      {responseStatus === 'accepted' && sessionStatus === 'active' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.declineBtn}
            onPress={() => changeStatus('failed')}
            activeOpacity={0.7}
          >
            <Icon name="alert-circle-outline" size={15} color="#EF4444" />
            <Text style={styles.declineBtnText}>Failed to reach</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => changeStatus('on_the_way')}
            activeOpacity={0.7}
          >
            <Icon name="car-arrow-right" size={15} color="#4A9EFF" />
            <Text style={styles.acceptBtnText}>On the way</Text>
          </TouchableOpacity>
        </View>
      )}
      {responseStatus === 'on_the_way' && sessionStatus === 'active' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.declineBtn}
            onPress={() => changeStatus('failed')}
            activeOpacity={0.7}
          >
            <Icon name="alert-circle-outline" size={15} color="#EF4444" />
            <Text style={styles.declineBtnText}>Failed to reach</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => changeStatus('reached')}
            activeOpacity={0.7}
          >
            <Icon name="check-circle-outline" size={15} color="#22C55E" />
            <Text style={styles.acceptBtnText}>Reached</Text>
          </TouchableOpacity>
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
                    {'Audio record ' + (index + 1)}
                  </Text>
                  <Text style={styles.audioTimeText}>{formatTime(record.created_at)}</Text>
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

      <View style={styles.divider} />

      {/* ── Action buttons ── */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            if (navigationRef.isReady()) {
              onClose?.();
              navigationRef.navigate('Main', {
                screen: 'MainTabs',
                params: {
                  screen: 'Chat',
                  params: { selectedReceipentId: item.sos_session?.user?.id },
                },
              });
            }
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconWrap, styles.actionIconChat]}>
            <Icon name="chat-outline" size={20} color="#4A9EFF" />
          </View>
          <Text style={[styles.actionLabel, { color: '#4A9EFF' }]}>Chat</Text>
        </TouchableOpacity>
        <View style={styles.actionSep} />
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            if (navigationRef.isReady()) {
              onClose?.();
              navigationRef.navigate('Main', {
                screen: 'MainTabs',
                params: {
                  screen: 'AudioStream',
                  params: { selectedReceipentId: item.sos_session?.user?.id },
                },
              });
            }
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconWrap, styles.actionIconAudio]}>
            <Icon name="waveform" size={20} color="#00FF9C" />
          </View>
          <Text style={[styles.actionLabel, { color: '#00FF9C' }]}>Stream</Text>
        </TouchableOpacity>
        <View style={styles.actionSep} />
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            if (navigationRef.isReady()) {
              onClose?.();
              navigationRef.navigate('Main', {
                screen: 'MainTabs',
                params: {
                  screen: 'Map',
                  params: { selectedMapRecipentId: item.sos_session?.user?.id },
                },
              });
            }
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconWrap, styles.actionIconMap]}>
            <Icon name="map-outline" size={20} color="#FFA502" />
          </View>
          <Text style={[styles.actionLabel, { color: '#FFA502' }]}>Map</Text>
        </TouchableOpacity>
        <View style={styles.actionSep} />
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            if (navigationRef.isReady()) {
              onClose?.();
              navigationRef.navigate('Main', {
                screen: 'MainTabs',
                params: {
                  screen: 'Health',
                  params: { selectedHealthRecipentId: item.sos_session?.user?.id },
                },
              });
            }
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconWrap, styles.actionIconHealth]}>
            <Icon name="heart-pulse" size={20} color="#FF3B5C" />
          </View>
          <Text style={[styles.actionLabel, { color: '#FF3B5C' }]}>Health</Text>
        </TouchableOpacity>
      </View>

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
    color: '#FF3B5C',
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
  // profile
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    borderWidth: 1.5,
  },
  avatarFallback: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    gap: 6,
  },
  senderName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  phoneText: {
    color: '#6B7C99',
    fontSize: 12,
  },
  responseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  responseBadgeText: {
    fontSize: 10,
    fontWeight: '600',
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
  // actions
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  actionSep: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconChat:   { backgroundColor: 'rgba(74,158,255,0.12)' },
  actionIconAudio:  { backgroundColor: 'rgba(0,255,156,0.10)'  },
  actionIconMap:    { backgroundColor: 'rgba(255,165,2,0.10)'  },
  actionIconHealth: { backgroundColor: 'rgba(255,59,92,0.12)'  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  // accept / decline
  declineBtn: {
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
  declineBtnText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '700',
  },
  acceptBtn: {
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
  acceptBtnText: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '700',
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
  // stress vitals
  stressRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stressCard: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,59,92,0.25)',
    backgroundColor: 'rgba(255,59,92,0.07)',
  },
  stressScoreCard: {
    borderColor: 'rgba(129,140,248,0.25)',
    backgroundColor: 'rgba(129,140,248,0.07)',
  },
  stressIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,59,92,0.15)',
    marginBottom: 2,
  },
  stressScoreIcon: {
    backgroundColor: 'rgba(129,140,248,0.15)',
  },
  stressValue: {
    color: '#FF3B5C',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stressScoreValue: {
    color: '#818CF8',
  },
  stressScorePercent: {
    fontSize: 14,
    fontWeight: '600',
  },
  stressUnit: {
    color: '#6B7C99',
    fontSize: 11,
    fontWeight: '500',
    marginTop: -2,
  },
  stressLabel: {
    color: '#8AA2C6',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});

export default IncomingCard;

 

 