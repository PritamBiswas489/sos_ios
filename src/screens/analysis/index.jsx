import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import styles from './style';
import appColors from '../../theme/appColors';
import { useUserData } from '../../hook/useUserData';
import { SOSService } from '../../services/sos.service';
import { StressDataService } from '../../services/stressData.service';
import { useChatContacts } from '../../hook/useChatContacts';


// ── Constants ────────────────────────────────────────────────────────────────
const STRESS_LEVEL_COLORS = ['#00E5A0', '#7EE8A2', '#FFD166', '#FF8C42', '#FF3366'];
const STRESS_LEVEL_LABELS = ['Relaxed', 'Low', 'Moderate', 'High', 'Critical'];

// ── Helpers ───────────────────────────────────────────────────────────────────
const timeAgo = iso => {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const stressColor = level => STRESS_LEVEL_COLORS[level] ?? appColors.bodyColor;
const stressLabel = (stateLabel, level) => stateLabel ?? STRESS_LEVEL_LABELS[level] ?? 'Unknown';
 

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function StatChip({ label, count, color, icon }) {
  return (
    <View style={[styles.statChip, { borderColor: color + '33' }]}>
      <View style={[styles.statChipIcon, { backgroundColor: color + '1A' }]}>
        <Icon name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.statChipCount, { color }]}>{count}</Text>
      <Text style={styles.statChipLabel}>{label}</Text>
    </View>
  );
}

function SessionRow({ session, isLast }) {
  const STATUS_META = {
    active:    { label: 'Active',    color: appColors.primary },
    resolved:  { label: 'Resolved',  color: '#00E5A0' },
    cancelled: { label: 'Cancelled', color: appColors.yellow },
    expired:   { label: 'Expired',   color: appColors.bodyColor },
  };
  const meta = STATUS_META[session.status] ?? STATUS_META.expired;

  // Resolve location display — try every plausible field name
  const locationName =
    session.location ??
   
    null;

  const lat = session.latitude ?? session.lat ?? session.location?.latitude ?? session.location?.lat ?? null;
  const lng = session.longitude ?? session.lng ?? session.location?.longitude ?? session.location?.lng ?? null;

  const locationDisplay =
    locationName ??
    (lat != null && lng != null
      ? `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`
      : 'Location unavailable');

  const hasRealLocation = locationName != null || (lat != null && lng != null);

  return (
    <View style={[styles.sessionRow, !isLast && styles.sessionRowBorder]}>
      <View style={[styles.sessionDot, { backgroundColor: meta.color }]} />
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionId} numberOfLines={1}>
          SOS #{String(session.id ?? '—').slice(-6)}
        </Text>
        <View style={styles.sessionLocRow}>
          <Icon
            name={hasRealLocation ? 'location-on' : 'location-off'}
            size={11}
            color={hasRealLocation ? appColors.bodyColor : appColors.bodyColor + '66'}
          />
          <Text
            style={[styles.sessionLoc, !hasRealLocation && { fontStyle: 'italic', opacity: 0.5 }]}
           
          >
            {locationDisplay}
          </Text>
        </View>
        <Text style={styles.sessionTime}>{timeAgo(session.created_at)}</Text>
      </View>
      <View style={[styles.sessionBadge, { backgroundColor: meta.color + '1A', borderColor: meta.color + '44' }]}>
        <Text style={[styles.sessionBadgeText, { color: meta.color }]}>{meta.label}</Text>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
const AnalysisScreen = () => {
  const navigation = useNavigation();
  const { userData } = useUserData();

   

  // Local state
  const [sosCounts, setSosCounts] = useState({ active: 0, resolved: 0, cancelled: 0, expired: 0 });
  const [recentSessions, setRecentSessions] = useState([]);
  const [latestStress, setLatestStress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { contactList } = useChatContacts();

  const loadData = useCallback(async () => {
    const statuses = ['active', 'resolved', 'cancelled', 'expired'];
    const allSessions = [];
    const newCounts = { active: 0, resolved: 0, cancelled: 0, expired: 0 };

    await Promise.allSettled([
      ...statuses.map(
        status =>
          new Promise(res => {
            SOSService.fetchMySosSessions({ limit: 10, page: 1, status }, result => {
              if (result.success) {
                const rows = result.data?.data?.sessions ?? [];
                newCounts[status] =  result.data?.data?.total;
                allSessions.push(...rows.map(s => ({ ...s, status })));
              }
              res();
            });
          }),
      ),
      new Promise(res => {
        StressDataService.getLatest(r => {
          if (r.success) setLatestStress(r.data);
          res();
        });
      }),
    ]);

    setSosCounts({ ...newCounts });
    allSessions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setRecentSessions(allSessions.slice(0, 5));
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, [loadData]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalSos = sosCounts.active + sosCounts.resolved + sosCounts.cancelled + sosCounts.expired;
  const isLicenseActive = userData?.licenses?.status === 'active';

  const stressLvl = latestStress?.stress_level ?? -1;
  const stressColorVal = stressColor(stressLvl);
  const stressLabelVal = stressLabel(latestStress?.stress_state, stressLvl);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={appColors.DarkPrimary} />
        <ActivityIndicator size="large" color={appColors.primary} />
        <Text style={styles.loadingText}>Loading analytics…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={appColors.DarkPrimary} />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back-ios" size={20} color={appColors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={appColors.primary}
            colors={[appColors.primary]}
          />
        }
      >

        {/* ── Profile Card ──────────────────────────────────────────────── */}
        <LinearGradient
          colors={['#1A2744', '#0E1A33']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <LinearGradient colors={[appColors.primary, '#FF6B8A']} style={styles.profileAvatar}>
            <Text style={styles.profileInitial}>
              {(userData?.name ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>

          <View style={styles.profileMid}>
            <Text style={styles.profileName}>{userData?.name ?? 'User'}</Text>
            <Text style={styles.profileSub} numberOfLines={1}>
              {userData?.email ?? userData?.phone_number ?? '—'}
            </Text>
            <View style={styles.badgeRow}>
              
              <View style={[styles.badge, {
                backgroundColor: isLicenseActive ? '#00E5A022' : appColors.yellow + '22',
                borderColor:     isLicenseActive ? '#00E5A044' : appColors.yellow + '44',
              }]}>
                <IconMC
                  name={isLicenseActive ? 'shield-check' : 'shield-off'}
                  size={10}
                  color={isLicenseActive ? '#00E5A0' : appColors.yellow}
                />
                <Text style={[styles.badgeText, { color: isLicenseActive ? '#00E5A0' : appColors.yellow, marginLeft: 3 }]}>
                  {isLicenseActive ? 'Licensed' : 'No License'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.profileStats}>
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatNum}>{totalSos}</Text>
              <Text style={styles.profileStatLbl}>SOS</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatNum}>{contactList.length}</Text>
              <Text style={styles.profileStatLbl}>Contacts</Text>
            </View>

          </View>
        </LinearGradient>

        {/* ── License Panel ─────────────────────────────────────────────── */}
        <LinearGradient
          colors={
            isLicenseActive
              ? ['#0A2A1F', '#0D3326']
              : ['#2A1A0A', '#331E0D']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.licenseCard}
        >
          {/* top row */}
          <View style={styles.licenseTitleRow}>
            <View style={styles.licenseIconWrap}>
              <IconMC
                name={isLicenseActive ? 'shield-star' : 'shield-off'}
                size={22}
                color={isLicenseActive ? '#00E5A0' : appColors.yellow}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.licenseTitleLabel}>LICENSE KEY</Text>
            </View>
            <View style={[
              styles.licenseStatusPill,
              {
                backgroundColor: isLicenseActive ? '#00E5A022' : appColors.yellow + '22',
                borderColor:     isLicenseActive ? '#00E5A066' : appColors.yellow + '66',
              },
            ]}>
              <View style={[
                styles.licenseStatusDot,
                { backgroundColor: isLicenseActive ? '#00E5A0' : appColors.yellow },
              ]} />
              <Text style={[
                styles.licenseStatusText,
                { color: isLicenseActive ? '#00E5A0' : appColors.yellow },
              ]}>
                {isLicenseActive ? 'ACTIVE' : 'INACTIVE'}
              </Text>
            </View>
          </View>

          {/* key display */}
          <View style={styles.licenseKeyBox}>
            <Text style={styles.licenseKeyValue} numberOfLines={1} adjustsFontSizeToFit>
              {userData?.licenses?.license_key ?? '— Not Assigned —'}
            </Text>
          </View>

         
        </LinearGradient>

        {/* ── SOS Sessions ─────────────────────────────────────────────── */}
        <View style={styles.card}>
          <SectionHeader
            title="SOS Sessions"
            subtitle={totalSos > 0 ? `${totalSos} sessions total` : 'No sessions yet'}
          />

          <View style={styles.statChipGrid}>
            <StatChip label="Active"    count={sosCounts.active}    color={appColors.primary} icon="crisis-alert" />
            <StatChip label="Resolved"  count={sosCounts.resolved}  color="#00E5A0"           icon="check-circle" />
            <StatChip label="Cancelled" count={sosCounts.cancelled} color={appColors.yellow}  icon="cancel" />
            <StatChip label="Expired"   count={sosCounts.expired}   color={appColors.bodyColor} icon="timer-off" />
          </View>

          {recentSessions.length > 0 ? (
            <>
              <Text style={styles.subLabel}>Recent Activity</Text>
              {recentSessions.map((s, i) => (
                <SessionRow key={s.id ?? i} session={s} isLast={i === recentSessions.length - 1} />
              ))}
            </>
          ) : (
            <View style={styles.emptyState}>
              <IconMC name="alert-circle-outline" size={32} color={appColors.bodyColor} />
              <Text style={styles.emptyText}>No SOS sessions found</Text>
            </View>
          )}
        </View>



        {/* ── Stress Snapshot ──────────────────────────────────────────── */}
        <View style={styles.card}>
          <SectionHeader title="Latest Stress Snapshot" />

          {latestStress ? (
            <View style={styles.stressRow}>
              <View style={[styles.stressStateBox, { borderColor: stressColorVal + '55', backgroundColor: stressColorVal + '12' }]}>
                <Text style={[styles.stressStateLbl, { color: stressColorVal }]}>{stressLabelVal}</Text>
                <Text style={styles.stressStateSub}>State</Text>
              </View>

              <View style={styles.stressDividerV} />

              <View style={styles.stressStat}>
                <IconMC name="heart-pulse" size={15} color={appColors.primary} />
                <Text style={styles.stressStatVal}>
                  {latestStress.current_hr ?? '—'}
                  <Text style={styles.stressStatUnit}> bpm</Text>
                </Text>
                <Text style={styles.stressStatLbl}>Heart Rate</Text>
              </View>

              <View style={styles.stressDividerV} />

              <View style={styles.stressStat}>
                <IconMC name="gauge" size={15} color={appColors.yellow} />
                <Text style={styles.stressStatVal}>
                  {latestStress.stress_score ?? '—'}
                  <Text style={styles.stressStatUnit}>/100</Text>
                </Text>
                <Text style={styles.stressStatLbl}>Score</Text>
              </View>

              <View style={styles.stressDividerV} />

              <View style={styles.stressStat}>
                <IconMC name="pulse" size={15} color="#00E5A0" />
                <Text style={styles.stressStatVal}>
                  {typeof latestStress.rmssd === 'number'
                    ? latestStress.rmssd.toFixed(1)
                    : '—'}
                  <Text style={styles.stressStatUnit}> ms</Text>
                </Text>
                <Text style={styles.stressStatLbl}>RMSSD</Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <IconMC name="heart-off-outline" size={32} color={appColors.bodyColor} />
              <Text style={styles.emptyText}>No stress reading recorded yet</Text>
            </View>
          )}

          {latestStress && (
            <View style={styles.stressFooter}>
              <IconMC
                name={latestStress.source === 'ble' ? 'bluetooth' : 'google-fit'}
                size={13}
                color={appColors.bodyColor}
              />
              <Text style={styles.stressFooterText}>
                {latestStress.source === 'ble' ? 'BLE Device' : 'Google Fit'} · {timeAgo(latestStress.created_at)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

export default AnalysisScreen;

