import React, { useEffect, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AUTO_DISMISS_MS = 4000;

const InAppNotificationBanner = ({ visible, title, body, onClose }) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const autoDismissTimer = useRef(null);

  useEffect(() => {
    if (visible) {
      // slide in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 6,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      autoDismissTimer.current = setTimeout(() => {
        dismiss();
      }, AUTO_DISMISS_MS);
    }

    return () => {
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
      }
    };
  }, [visible]);

  const dismiss = () => {
    if (autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
    });
  };

  if (!visible) {
    return null;
  }

  const topOffset = Platform.OS === 'ios' ? insets.top + 8 : 12;

  return (
    <Animated.View
      style={[
        styles.banner,
        { top: topOffset, transform: [{ translateY }], opacity },
      ]}
    >
      <View style={styles.iconWrap}>
        <Icon name="notifications" size={22} color="#FF3B5C" />
      </View>

      <View style={styles.textWrap}>
        {!!title && (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        )}
        {!!body && (
          <Text style={styles.body} numberOfLines={2}>
            {body}
          </Text>
        )}
      </View>

      <TouchableOpacity onPress={dismiss} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Icon name="close" size={18} color="rgba(255,255,255,0.6)" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E1A33',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#FF3B5C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
  },
  iconWrap: {
    marginRight: 10,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  body: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    lineHeight: 17,
  },
  closeBtn: {
    marginLeft: 10,
    padding: 2,
  },
});

export default InAppNotificationBanner;
