import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from './style';
import { useSelector, useDispatch } from 'react-redux';
import { healthSelectedContactActions } from '../../store/redux/healthSelectedContact.redux';
import appColors from '../../theme/appColors';
import { useChatPresence } from '../../context/ChatContext';
import { useChatContacts } from '../../hook/useChatContacts';
import { useUserData } from '../../hook/useUserData';
import { getProfileImage } from '../../config/utility';
import { STRESS_STATE, useStress } from '../../context/StressContext';

const AVATAR_COLORS = [
  '#2F6BFF', '#FF3B5C', '#2ED573', '#FFA726',
  '#6A4CFF', '#00BCD4', '#8BC34A', '#E91E63',
];

const getAvatarColor = item => {
  const key = `${item?.id ?? ''}-${item?.name ?? ''}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const ContactItem = React.memo(({ item, isSelected, selectContact }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const stressLevel = item?.stressLevel ?? 0;
  const stressState = Object.values(STRESS_STATE).find(s => s.level === stressLevel) ?? null;
  const isCritical = stressLevel >= 4;

  useEffect(() => {
    if (!isCritical) {
      pulseAnim.setValue(1);
      shakeAnim.setValue(0);
      glowAnim.setValue(0);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 550, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 550, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );

    const shake = Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 4, duration: 65, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -4, duration: 65, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 3, duration: 65, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -3, duration: 65, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 65, useNativeDriver: true }),
        Animated.delay(2400),
      ]),
    );

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 700, useNativeDriver: false }),
      ]),
    );

    pulse.start();
    shake.start();
    glow.start();

    return () => {
      pulse.stop();
      shake.stop();
      glow.stop();
    };
  }, [isCritical, glowAnim, pulseAnim, shakeAnim]);

  const avatarColor = getAvatarColor(item);

  const criticalBorderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FF3366', '#FF8C42'],
  });

  const circleBorderColor = isCritical
    ? criticalBorderColor
    : isSelected
    ? appColors.primary
    : 'rgba(255,255,255,0.35)';

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }, { translateX: shakeAnim }] }}>
      <TouchableOpacity
        style={[
          styles.avatarItem,
          isSelected && styles.avatarItemSelected,
          isCritical && styles.avatarItemCritical,
        ]}
        activeOpacity={0.7}
        onPress={() => selectContact(item)}
      >
        <View style={styles.avatarCircleWrap}>
          <Animated.View
            style={[
              styles.avatarCircle,
              { borderColor: circleBorderColor, backgroundColor: avatarColor },
            ]}
          >
            {item.profile_image ? (
              <Image
                source={{ uri: item.profile_image }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={[styles.avatarText, isSelected && { fontWeight: 'bold' }]}>
                {item.initial}
              </Text>
            )}
          </Animated.View>

          {stressState && (
            <View style={[styles.emojiBadge, isCritical && styles.emojiBadgeCritical]}>
              <Icon name="favorite" size={11} color={stressState.color} />
            </View>
          )}

          {item.isOnline && <View style={styles.onlineDot} />}
          {item.isStreaming && (
            <View style={styles.streamingBadge}>
              <Icon name="graphic-eq" size={9} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.avatarMeta}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.avatarLabel, isSelected && styles.avatarLabelSelected]}
          >
            {item.name}
          </Text>
          
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const MeButton = React.memo(({ currentUser, isMe, onPress, stressState }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;

  const isCritical = (stressState?.level ?? -1) >= 4;

  useEffect(() => {
    if (!isCritical) {
      pulseAnim.setValue(1);
      shakeAnim.setValue(0);
      glowAnim.setValue(0);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 550, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 550, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    const shake = Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue:  4, duration: 65, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -4, duration: 65, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue:  3, duration: 65, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -3, duration: 65, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue:  0, duration: 65, useNativeDriver: true }),
        Animated.delay(2400),
      ]),
    );
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 700, useNativeDriver: false }),
      ]),
    );

    pulse.start(); shake.start(); glow.start();
    return () => { pulse.stop(); shake.stop(); glow.stop(); };
  }, [isCritical, glowAnim, pulseAnim, shakeAnim]);

  const criticalBorder = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FF3366', '#FF8C42'],
  });

  const initial = currentUser?.name?.[0]?.toUpperCase() ?? 'M';

  return (
    <Animated.View style={[
      styles.meBtnWrap,
      isMe && styles.meBtnWrapSelected,
      { transform: [{ scale: pulseAnim }, { translateX: shakeAnim }] },
    ]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[isCritical && styles.meBtnCritical]}
      >
        {isMe ? (
          <LinearGradient
            colors={['#1A6EFF', '#00C2FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.meBtnGradient}
          >
            <View style={styles.meBtnAvatarWrap}>
              <View style={styles.meBtnAvatar}>
                {currentUser?.profile_photo ? (
                  <Image source={{ uri: getProfileImage(currentUser.profile_photo) }} style={styles.meBtnAvatarImg} />
                ) : (
                  <Text style={styles.meBtnAvatarInitial}>{initial}</Text>
                )}
              </View>
              {stressState && (
                <View style={[styles.emojiBadge, isCritical && styles.emojiBadgeCritical]}>
                  <Icon name="favorite" size={11} color={stressState.color} />
                </View>
              )}
            </View>
            <Text style={styles.meBtnTextActive}>Me</Text>
          </LinearGradient>
        ) : (
          <View style={styles.meBtnIdle}>
            <View style={styles.meBtnAvatarWrap}>
              <Animated.View style={[
                styles.meBtnAvatarIdle,
                isCritical && { borderColor: criticalBorder },
              ]}>
                {currentUser?.profile_photo ? (
                  <Image source={{ uri: getProfileImage(currentUser.profile_photo) }} style={styles.meBtnAvatarImg} />
                ) : (
                  <Text style={styles.meBtnAvatarInitialIdle}>{initial}</Text>
                )}
              </Animated.View>
              {stressState && (
                <View style={[styles.emojiBadge, isCritical && styles.emojiBadgeCritical]}>
                  <Icon name="favorite" size={11} color={stressState.color} />
                </View>
              )}
            </View>
            <Text style={styles.meBtnTextIdle}>Me</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

const HealthAvatarList = ({ chatContacts, fetchChatContacts }) => {
    const ONLINE_COLOR = '#2ED573';

     const [refreshing, setRefreshing] = useState(false);
      const lastOffsetXRef = useRef(0);
      const endReachedFiredRef = useRef(false);
      const flatListRef = useRef(null);
      const lastAutoScrolledIdRef = useRef(null);

     const dispatch = useDispatch();
     const healthSelectedContact = useSelector(state => state.healthSelectedContact);
     console.log("healthSelectedContact?", healthSelectedContact?.item?.id);
    const {userData: currentUser}= useUserData();
     const {hasLicense} = useUserData();

    const isMe =  healthSelectedContact?.isMe;

    const selectMe = useCallback(() => {
      console.log('Selected Me');
      dispatch(healthSelectedContactActions.setHealthSelectedContact({isMe: true, item: null}));
    }, [dispatch]);
    const selectContact = useCallback((item) => {
      console.log('Selected contact:', item);
     dispatch(healthSelectedContactActions.setHealthSelectedContact({isMe: false, item}));
    }, [dispatch]);

    const { contactsLastHealthData, stress } = useStress();

    const renderContactItem = useCallback(({ item }) => {
      
      return (
        <ContactItem
          item={item}
          isSelected={healthSelectedContact?.item?.id === item.id}
          selectContact={selectContact}
          
        />
      );
    }, [healthSelectedContact?.item?.id, selectContact, contactsLastHealthData]);
    const handleRefresh = useCallback(async () => {
      if (refreshing) return;
      console.log('Refreshing contact list...');
      setRefreshing(true);

      try {
        await fetchChatContacts();
      } finally {
        setRefreshing(false);
      }
    }, [refreshing, fetchChatContacts]);

    const handleHorizontalScroll = useCallback((event) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const isMovingRight = contentOffset.x > lastOffsetXRef.current;
      lastOffsetXRef.current = contentOffset.x;
      const distanceFromEnd = contentSize.width - (contentOffset.x + layoutMeasurement.width);
      if (distanceFromEnd <= 5 && isMovingRight && !endReachedFiredRef.current) {
        endReachedFiredRef.current = true;
        handleRefresh();
      }
      if (distanceFromEnd > 40) {
        endReachedFiredRef.current = false;
      }
    }, [handleRefresh]);

    useEffect(() => {
      if (!healthSelectedContact?.item?.id || !Array.isArray(chatContacts) || chatContacts.length === 0) {
        return;
      }

      if (lastAutoScrolledIdRef.current === healthSelectedContact.item.id) {
        return;
      }

      const selectedIndex = chatContacts.findIndex(contact => contact?.id === healthSelectedContact.item.id);
      if (selectedIndex < 0) {
        return;
      }

      requestAnimationFrame(() => {
        flatListRef.current?.scrollToIndex({
          index: selectedIndex,
          animated: true,
          viewPosition: 0.5,
        });
      });

      lastAutoScrolledIdRef.current = healthSelectedContact.item.id;
    }, [chatContacts, healthSelectedContact?.item?.id]);

    const handleScrollToIndexFailed = useCallback((info) => {
      const estimatedOffset = Math.max(0, info.averageItemLength * info.index);
      flatListRef.current?.scrollToOffset({ offset: estimatedOffset, animated: true });
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: info.index,
          animated: true,
          viewPosition: 0.5,
        });
      }, 100);
    }, []);

  return (
    <View style={styles.avatarRowContainer}>
      {/* ── Me button ── */}
     {hasLicense && <MeButton
        currentUser={currentUser}
        isMe={isMe}
        onPress={selectMe}
        stressState={stress?.state ?? null}
      />}

      <FlatList
        ref={flatListRef}
        horizontal
        data={chatContacts}
        keyExtractor={item => String(item.id)}
        renderItem={renderContactItem}
        extraData={healthSelectedContact?.item?.id}
        showsHorizontalScrollIndicator={false}
        style={styles.avatarRow}
        contentContainerStyle={styles.avatarRowContent}
        onScroll={handleHorizontalScroll}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        scrollEventThrottle={16}
        refreshControl={
           <RefreshControl
                      refreshing={refreshing}
                      
                      tintColor="#2ED573"
                      colors={['#2ED573']}
                    />
        }
       
        
        
       
      />
      {/* <TouchableOpacity
        onPress={handleRefresh}
        disabled={refreshing}
        style={styles.refreshIconBtn}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Refresh contacts"
      >
        {refreshing
          ? <ActivityIndicator size={16} color={ONLINE_COLOR} />
          : <Icon name="refresh" size={20} color={ONLINE_COLOR} />}
      </TouchableOpacity> */}
    </View>
  );
};

export default React.memo(HealthAvatarList);
