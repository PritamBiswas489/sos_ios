import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import IncomingSOSList from './IncomingSOSList';
import OutgoingSOSList from './OutgoingSOSList';

// ---------------------------------------------------------------------------
// Dummy data
// ---------------------------------------------------------------------------
export const DUMMY_INCOMING_SOS = [
  {
    id: 'in1',
    name: 'Sarah Johnson',
    phone: '+1 (555) 234-7890',
    avatar: null,
    initials: 'SJ',
    location: 'Times Square, New York',
    time: '2 min ago',
    status: 'Active',
  },
  {
    id: 'in2',
    name: 'Michael Torres',
    phone: '+1 (555) 876-3421',
    avatar: null,
    initials: 'MT',
    location: 'Central Park, New York',
    time: '5 min ago',
    status: 'Active',
  },
  {
    id: 'in3',
    name: 'Emily Chen',
    phone: '+1 (555) 543-9812',
    avatar: null,
    initials: 'EC',
    location: 'Brooklyn Bridge, New York',
    time: '8 min ago',
    status: 'Pending',
  },
];

export const DUMMY_OUTGOING_SOS = [
  {
    id: 'out1',
    name: 'David Williams',
    phone: '+1 (555) 112-6543',
    avatar: null,
    initials: 'DW',
    location: 'Manhattan Ave, New York',
    time: '3 min ago',
    respondedBy: 2,
  },
  {
    id: 'out2',
    name: 'Contact Group B',
    phone: '+1 (555) 789-0012',
    avatar: null,
    initials: 'CB',
    location: 'Queens Blvd, New York',
    time: '10 min ago',
    respondedBy: 0,
  },
];

// Legacy export kept for backward compat with App.jsx
export const DUMMY_SOS_VICTIMS = DUMMY_INCOMING_SOS;

// ---------------------------------------------------------------------------
// Animated tab bar
// ---------------------------------------------------------------------------
const TabBar = ({ activeTab, onSelect }) => {
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(indicatorAnim, {
      toValue: activeTab === 'incoming' ? 0 : 1,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [activeTab, indicatorAnim]);

  const indicatorLeft = indicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '50%'],
  });

  return (
    <View style={styles.tabBarWrap}>
      <View style={styles.tabBar}>
        <Animated.View style={[styles.tabIndicator, { left: indicatorLeft }]} />
        <TouchableOpacity style={styles.tabBtn} onPress={() => onSelect('incoming')} activeOpacity={0.8}>
          <Icon name="arrow-down-circle-outline" size={15} color={activeTab === 'incoming' ? '#FF3B5C' : '#6B7C99'} />
          <Text style={[styles.tabLabel, activeTab === 'incoming' && styles.tabLabelActive]}>
            Incoming SOS
          </Text>
         
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBtn} onPress={() => onSelect('outgoing')} activeOpacity={0.8}>
          <Icon name="arrow-up-circle-outline" size={15} color={activeTab === 'outgoing' ? '#4A9EFF' : '#6B7C99'} />
          <Text style={[styles.tabLabel, activeTab === 'outgoing' && styles.tabLabelOutgoingActive]}>
            Outgoing SOS
          </Text>
          
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------
const SOSAlertModal = ({
  visible = false,
  onClose,
  navigationRef,
  onAcceptSOS,
  onDeclineSOS,
  onOpened,
}) => {
  

  const [activeTab, setActiveTab] = useState('incoming');
  const [listReady, setListReady] = useState(false);
  const slideAnim = useRef(new Animated.Value(60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 2,
      onPanResponderGrant: () => {
        dragY.setOffset(0);
        dragY.setValue(0);
      },
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) dragY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        dragY.flattenOffset();
        if (gs.dy > 80) {
          Animated.timing(dragY, { toValue: 600, duration: 220, useNativeDriver: true }).start(() => onCloseRef.current?.());
        } else {
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => {
        dragY.flattenOffset();
        Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start();
      },
    }),
  ).current;

  const combinedTranslateY = useMemo(
    () => Animated.add(slideAnim, dragY),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (visible) {
      dragY.setValue(0);
      setActiveTab('incoming');
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start(() => { setListReady(true); onOpened?.(); });
    } else {
      setListReady(false);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 60, duration: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => { dragY.setValue(0); slideAnim.setValue(60); });
    }
  }, [visible, slideAnim, opacityAnim, dragY]);

  const isIncoming = activeTab === 'incoming';

  // Keep modal mounted after first open — avoids Android re-mount cost on every open
  const hasMountedRef = useRef(false);
  if (visible) hasMountedRef.current = true;
  if (!hasMountedRef.current) return null;
   

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}>
      <Animated.View
        style={[styles.overlay, { opacity: opacityAnim }]}
        pointerEvents={visible ? 'auto' : 'none'}>
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: combinedTranslateY }], opacity: opacityAnim },
          ]}>

          {/* Drag handle */}
          <View style={styles.dragHandleWrap} {...panResponder.panHandlers}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.sosBadge}>
                <Icon name="alert-circle" size={18} color="#FF3B5C" />
                <Text style={styles.sosBadgeText}>SOS ALERT</Text>
              </View>
              
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Icon name="close" size={20} color="#6B7C99" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <TabBar
            activeTab={activeTab}
            
            onSelect={setActiveTab}
          />

          {/* Alert strip */}
          <View style={[styles.alertStrip, !isIncoming && styles.alertStripBlue]}>
            <Icon
              name={isIncoming ? 'shield-alert-outline' : 'send-circle-outline'}
              size={14}
              color={isIncoming ? '#FF3B5C' : '#4A9EFF'}
            />
            <Text style={[styles.alertStripText, !isIncoming && { color: '#4A9EFF' }]}>
              {isIncoming
                ? 'Emergency response required — tap an action to respond'
                : 'Your SOS alerts — track responses from your trusted contacts'}
            </Text>
          </View>

          {/* List */}
          <View style={{ flex: 1 }}>
            {!listReady ? (
              <View style={styles.listLoader}>
                <ActivityIndicator size="large" color="#FF3B5C" />
              </View>
            ) : isIncoming ? (
              <IncomingSOSList
                navigationRef={navigationRef}
                onAccept={onAcceptSOS}
                onDecline={onDeclineSOS}
                onClose={onClose}
              />
            ) : (
              <OutgoingSOSList />
            )}
          </View>

        
         
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 11, 27, 0.88)',
    justifyContent: 'flex-end',
  },
  sheet: {
    flex: 1,
    backgroundColor: '#0E1A33',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255,59,92,0.2)',
    overflow: 'hidden',
  },

  // Drag handle
  dragHandleWrap: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 40,
  },
  dragHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerLeft: { flex: 1 },
  sosBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sosBadgeText: {
    color: '#FF3B5C',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: '#6B7C99',
    fontSize: 13,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tab bar
  tabBarWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#071022',
    borderRadius: 14,
    padding: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '50%',
    backgroundColor: '#0E1A33',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7C99',
  },
  tabLabelActive: {
    color: '#FF3B5C',
  },
  tabLabelOutgoingActive: {
    color: '#4A9EFF',
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },

  // Alert strip
  alertStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,59,92,0.07)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,59,92,0.13)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 12,
  },
  alertStripBlue: {
    backgroundColor: 'rgba(74,158,255,0.07)',
    borderColor: 'rgba(74,158,255,0.13)',
  },
  alertStripText: {
    color: '#FF3B5C',
    fontSize: 11,
    flex: 1,
    opacity: 0.85,
  },

  // List loader
  listLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Footer
  dismissBtn: {
    margin: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,59,92,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,92,0.25)',
    alignItems: 'center',
  },
  dismissText: {
    color: '#FF3B5C',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default SOSAlertModal;
