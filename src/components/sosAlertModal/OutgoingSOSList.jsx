import React, { useEffect, useCallback, useRef } from 'react';
import {
  FlatList,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import OutgoingCard from './OutgoingCard';
import { useMySosSessions } from '../../hook/useMySosSessions';

const STATUS_FILTERS = [
  { key: 'active',    label: 'Active',    icon: 'shield-alert-outline',   color: '#4ADE80' },
  { key: 'expired',   label: 'Expired',   icon: 'clock-alert-outline',    color: '#FACC15' },
  { key: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline',   color: '#F87171' },
  { key: 'resolved',  label: 'Resolved',  icon: 'check-circle-outline',   color: '#818CF8' },
];

// Module-level: survives modal close/reopen so we don't re-fetch on every open
let outgoingFetchedPage = 0;

const OutgoingSOSList = ({ onCancel, onResolve }) => {
  const { page, limit, isLoading, status, sos_notification_list, fetchMySosSessions, setPage, setStatus, hasMore, resetSessions } = useMySosSessions();
  // Tracks whether the status effect is firing for the first time on this mount
  const isFirstStatusRender = useRef(true);
  const hasUserScrolledRef = useRef(false);
  const initialPageLoadedRef = useRef(false);

  // Fetch when the page advances; skipped if this page was already fetched
  useEffect(() => {
    if (outgoingFetchedPage === page) return;
    outgoingFetchedPage = page;
    Promise.resolve(fetchMySosSessions(page > 1)).finally(() => {
      if (page === 1) {
        initialPageLoadedRef.current = true;
      }
    }); // append=true for pages beyond the first
  }, [page, fetchMySosSessions]);

  const handleRefresh = useCallback(() => {
    outgoingFetchedPage = 0;
    initialPageLoadedRef.current = false;
    hasUserScrolledRef.current = false;
    resetSessions();
    if (page === 1) {
      fetchMySosSessions(false);
      initialPageLoadedRef.current = true;
      return;
    }
    setPage(1);
  }, [page, resetSessions, setPage, fetchMySosSessions]);

  const handleStatusChange = useCallback((newStatus) => {
    if (newStatus === status || isLoading) return;
    outgoingFetchedPage = 0;
    initialPageLoadedRef.current = false;
    hasUserScrolledRef.current = false;
    resetSessions();
    setPage(1);
    setStatus(newStatus);
  }, [status, isLoading, resetSessions, setPage, setStatus]);

  // Re-fetch when status changes — intentionally skipped on initial mount
  useEffect(() => {
    if (isFirstStatusRender.current) {
      isFirstStatusRender.current = false;
      return;
    }
    outgoingFetchedPage = 0;
    initialPageLoadedRef.current = false;
    hasUserScrolledRef.current = false;
    setPage(1);
    fetchMySosSessions(false);
  }, [status, fetchMySosSessions, setPage]);

  const handleLoadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    if (!initialPageLoadedRef.current) return;
    if (!hasUserScrolledRef.current) return;
    setPage(page + 1);
  }, [isLoading, hasMore, page, setPage]);

  const renderFooter = () => {
    if (isLoading) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color="#4A9EFF" />
        </View>
      );
    }
    if (!hasMore && sos_notification_list.length > 0) {
      return (
        <View style={styles.footer}>
          <Text style={styles.footerText}>No more alerts</Text>
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <Icon name="bell-off-outline" size={48} color="rgba(107,124,153,0.3)" />
        <Text style={styles.emptyText}>No outgoing SOS alerts</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Floating status filter bar */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}>
          {STATUS_FILTERS.map(f => {
            const active = status === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.filterChip,
                  active && { borderColor: f.color, backgroundColor: `${f.color}18` },
                ]}
                onPress={() => handleStatusChange(f.key)}
                activeOpacity={0.75}>
                <Icon
                  name={f.icon}
                  size={13}
                  color={active ? f.color : 'rgba(107,124,153,0.6)'}
                />
                <Text style={[styles.filterChipText, active && { color: f.color }]}>
                  {f.label}
                </Text>
                {active && <View style={[styles.filterActiveDot, { backgroundColor: f.color }]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      <FlatList
        data={sos_notification_list}
        keyExtractor={item => item.id?.toString()}
        renderItem={({ item }) => <OutgoingCard item={item} onCancel={onCancel} onResolve={onResolve} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        onScrollBeginDrag={() => {
          hasUserScrolledRef.current = true;
        }}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />
      <TouchableOpacity
        style={[styles.fab, isLoading && styles.fabDisabled]}
        onPress={handleRefresh}
        disabled={isLoading}
        activeOpacity={0.8}>
        <Icon
          name={isLoading ? 'loading' : 'refresh'}
          size={20}
          color="#fff"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  filterScroll: {
    paddingHorizontal: 14,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(107,124,153,0.2)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    position: 'relative',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(107,124,153,0.6)',
    letterSpacing: 0.2,
  },
  filterActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginLeft: 2,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4A9EFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A9EFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  fabDisabled: {
    backgroundColor: 'rgba(74,158,255,0.3)',
    shadowOpacity: 0,
    elevation: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    color: 'rgba(107,124,153,0.5)',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    color: 'rgba(107,124,153,0.4)',
    fontSize: 12,
  },
});

export default OutgoingSOSList;
