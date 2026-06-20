import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TextInput,
  StyleSheet, SafeAreaView, StatusBar, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../components/abuserReport/theme';
import AbuserReportCard from '../../components/abuserReport/AbuserReportCard.jsx';
import AbuserDetailsModal from '../../components/abuserReport/AbuserDetailsModal.jsx';
import api from '../../config/authApi.config';
import { useNavigation } from '@react-navigation/native';

// ─── Constants ────────────────────────────────────────────────────────────────
// api.baseURL is already: <appUrl>/api-mobile/auth
// so we only need the remaining path segment here
const API_PATH   = '/abuser-report/get-my-reports';
const PAGE_LIMIT = 50;
const FILTERS    = ['All', 'High', 'Medium', 'Low'];

// ─── Normaliser ───────────────────────────────────────────────────────────────
const normaliseReport = (raw) => ({
  id:                  raw.id,
  abuser: {
    fullName:  raw.abuser?.full_name  ?? '—',
    aliasName: raw.abuser?.alias_name ?? null,
    gender:    raw.abuser?.gender     ?? null,
    dob:       raw.abuser?.dob        ?? null,
    phone:     raw.abuser?.phone      ?? null,
    email:     raw.abuser?.email      ?? null,
    address:   raw.abuser?.address    ?? null,
    photo:     raw.abuser?.photo      ?? null,
  },
  abuseType:          raw.abuse_type          ?? null,
  incidentDate:       raw.incident_date        ?? null,
  incidentLocation:   raw.incident_location    ?? null,
  description:        raw.description          ?? null,
  witnessInformation: raw.witness_information  ?? null,
  threatLevel:        raw.threat_level         ?? 'Low',
  historyOfViolence:  raw.history_of_violence  ?? false,
  weaponAccess:       raw.weapon_access        ?? false,
  restrainingOrder:   raw.restraining_order    ?? false,
  notes:              raw.notes                ?? null,
  evidenceFiles:      raw.evidence_files       ?? [],
  createdAt:          raw.created_at           ?? null,
});

// ─── Hook ─────────────────────────────────────────────────────────────────────
const useReports = () => {
  const [reports, setReports]       = useState([]);
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(true);
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState(null);
  const fetchingRef                 = useRef(false);

  const fetchPage = useCallback(async (pageNum, isRefresh = false) => {
    // Guard: skip if a fetch is already in-flight
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);

    try {
      // `api` interceptor auto-attaches Bearer token + refreshToken headers
      const res = await api.get(API_PATH, {
        params: { page: pageNum, limit: PAGE_LIMIT },
      });

      const raw        = Array.isArray(res?.data?.data) ? res.data.data : [];
      const normalised = raw.map(normaliseReport);

      if (isRefresh) {
        setReports(normalised);
        setPage(2);
      } else {
        setReports(prev => [...prev, ...normalised]);
        setPage(prev => prev + 1);
      }

      // When server returns fewer records than the page size → no more pages
      setHasMore(normalised.length === PAGE_LIMIT);
    } catch (err) {
      // err.message is already cleaned up by the authApi interceptor
      setError(err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      fetchingRef.current = false;
    }
  }, []);

  // Initial load on mount
  React.useEffect(() => { fetchPage(1, true); }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading && !refreshing) fetchPage(page);
  }, [hasMore, loading, refreshing, page, fetchPage]);

  const refresh = useCallback(() => fetchPage(1, true), [fetchPage]);

  return { reports, setReports, loading, refreshing, error, hasMore, loadMore, refresh };
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ReportListScreen() {
  const { reports, setReports, loading, refreshing, error, loadMore, refresh } = useReports();
  const navigation = useNavigation();

  const [selectedReport, setSelectedReport] = useState(null);
  const [modalVisible, setModalVisible]     = useState(false);
  const [search, setSearch]                 = useState('');
  const [activeFilter, setActiveFilter]     = useState('All');

  const filtered = useMemo(() => {
    let list = reports;
    if (activeFilter !== 'All') list = list.filter(r => r.threatLevel === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.abuser?.fullName?.toLowerCase().includes(q) ||
        r.abuseType?.toLowerCase().includes(q) ||
        r.abuser?.aliasName?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [reports, search, activeFilter]);

  const openModal  = (report) => { setSelectedReport(report); setModalVisible(true); };
  const closeModal = ()       => setModalVisible(false);

  // Remove deleted report instantly — no refetch needed
  const handleDeleted = useCallback((deletedId) => {
    setReports(prev => prev.filter(r => String(r.id) !== String(deletedId)));
    if (selectedReport && String(selectedReport.id) === String(deletedId)) {
      setModalVisible(false);
      setSelectedReport(null);
    }
  }, [selectedReport]);

  // ── List sub-renders
  const renderItem = useCallback(
    ({ item }) => (
      <AbuserReportCard
        report={item}
        onPress={() => openModal(item)}
        onDeleted={handleDeleted}
      />
    ),
    [handleDeleted],
  );

  const renderHeader = () => (
    <View>
      {/* Search bar */}
      {/* <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, alias, or type…"
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          selectionColor={Colors.accent}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View> */}

      {/* Filter pills */}
      {/* <View style={styles.filterRow}>
        {FILTERS.map(f => {
          const active = activeFilter === f;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[styles.filterPill, active && styles.filterPillActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          );
        })}
        <Text style={styles.countBadge}>
          {filtered.length} report{filtered.length !== 1 ? 's' : ''}
        </Text>
      </View> */}

      {/* Inline error banner */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText} numberOfLines={2}>⚠️  {error}</Text>
          <TouchableOpacity onPress={refresh} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  const renderEmpty = () => {
    // Don't flash "no results" while the first load is still in-flight
    if (loading && !refreshing) return null;
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📂</Text>
        <Text style={styles.emptyTitle}>No reports found</Text>
        <Text style={styles.emptyBody}>
          {error ? 'Failed to load reports.' : 'Try adjusting your search or filter.'}
        </Text>
      </View>
    );
  };

  // Spinner at the bottom while loading the next page
  const renderFooter = () => {
    if (!loading || refreshing) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={Colors.accent} size="small" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* ── Page Header ── */}
      <View style={styles.pageHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Abuser Reports</Text>
          <Text style={styles.headerSubtitle}>Incident & threat records</Text>
        </View>

        {/* Right spacer keeps title truly centred */}
        <View style={styles.backBtn} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        // ── Scroll pagination ──────────────────────────────────────────────
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        // ── Pull-to-refresh ────────────────────────────────────────────────
        refreshing={refreshing}
        onRefresh={refresh}
      />

      <AbuserDetailsModal
        visible={modalVisible}
        report={selectedReport}
        onClose={closeModal}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  // ── Page header ──
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'left',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.bg,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 20,

    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: {
    fontSize: 26, color: Colors.textPrimary,
    lineHeight: 30, marginTop: -2,
    fontWeight: '300',
  },
  headerCenter: { flex: 1, alignItems: 'left' ,marginLeft: 20 },
  headerTitle: {
    fontSize: 18, fontWeight: '700',
    color: Colors.textPrimary, letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11, color: Colors.textMuted,
    marginTop: 1, letterSpacing: 0.3,
  },
  list: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xxl },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.divider,
    paddingHorizontal: Spacing.base, marginBottom: Spacing.md,
    marginTop: Spacing.base,
  },
  searchIcon:  { fontSize: 15, marginRight: Spacing.sm },
  searchInput: { flex: 1, height: 46, color: Colors.textPrimary, fontSize: 14 },
  clearBtn:    { color: Colors.textMuted, fontSize: 14, padding: Spacing.sm },

  filterRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm, marginBottom: Spacing.base,
  },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.pill,
    borderWidth: 1, borderColor: Colors.divider, backgroundColor: Colors.surface,
  },
  filterPillActive: { backgroundColor: Colors.accentMuted, borderColor: Colors.accent },
  filterText:       { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  filterTextActive: { color: Colors.accent, fontWeight: '700' },
  countBadge:       { marginLeft: 'auto', ...Typography.caption, color: Colors.textMuted },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#3B1414', borderRadius: Radius.md,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    marginBottom: Spacing.base,
  },
  errorText: { color: '#FF8080', fontSize: 13, flex: 1 },
  retryBtn:  { marginLeft: Spacing.sm, paddingHorizontal: Spacing.sm },
  retryText: { color: Colors.accent, fontWeight: '700', fontSize: 13 },

  footer:     { paddingVertical: Spacing.lg, alignItems: 'center' },
  empty:      { alignItems: 'center', paddingTop: 60 },
  emptyIcon:  { fontSize: 42, marginBottom: Spacing.base },
  emptyTitle: { ...Typography.heading3, color: Colors.textSecondary, marginBottom: Spacing.sm },
  emptyBody:  { ...Typography.body },
});
