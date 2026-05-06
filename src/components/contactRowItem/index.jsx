import React, { memo, useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from './style';

const ContactRowItem = memo(({ item, actions, onActionPress, getAvatarColor, getProfileImageUri }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleKebabPress = useCallback(() => {
    setMenuOpen(prev => !prev);
  }, []);

  const handleActionPress = useCallback(
    actionKey => {
      setMenuOpen(false);
      onActionPress(actionKey, item);
    },
    [onActionPress, item],
  );

  const initial = item.displayName?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <View style={styles.contactRow}>
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: getAvatarColor(item) }]}>
        {item.profileImage ? (
          <Image
            source={{ uri: item.profileImage }}
            style={styles.avatarImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.avatarText}>{initial}</Text>
        )}
      </View>

      {/* Info */}
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.displayName}</Text>
        <Text style={styles.contactRelation}>{item.relationship}</Text>
        <Text style={styles.contactDetails}>{item.phoneNumber}</Text>
      </View>

      {/* Three-dot menu */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.kebabButton} onPress={handleKebabPress}>
          <Icon name="more-vert" size={22} color="#A4B0BE" />
        </TouchableOpacity>

        {menuOpen && (
          <View style={styles.dropdownMenu}>
            {actions.map(action => (
              <TouchableOpacity
                key={action.key}
                style={styles.dropdownItem}
                onPress={() => handleActionPress(action.key)}
              >
                <Icon name={action.icon} size={16} color={action.color} />
                <Text style={[styles.dropdownItemText, { color: action.color }]}>
                  {action.key.charAt(0).toUpperCase() + action.key.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
});

export default ContactRowItem;
