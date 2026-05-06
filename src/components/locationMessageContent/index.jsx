import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const parseMessageLocation = locationJson => {
  if (!locationJson) return null;

  let parsedLocation = locationJson;
  if (typeof locationJson === 'string') {
    try {
      parsedLocation = JSON.parse(locationJson);
    } catch {
      return null;
    }
  }

  const latitude = Number(parsedLocation?.latitude ?? parsedLocation?.lat);
  const longitude = Number(
    parsedLocation?.longitude ?? parsedLocation?.lng ?? parsedLocation?.lon,
  );

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
};

const LocationMessageContent = ({ item, isSelfMessage, styles, onOpenLocationInMaps }) => {
  const location = parseMessageLocation(item?.locationJson);
  if (!location) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[
        styles.locationMessageCard,
        isSelfMessage ? styles.locationMessageCardRight : styles.locationMessageCardLeft,
      ]}
      onPress={() => onOpenLocationInMaps?.(location.latitude, location.longitude)}
    >
      <View style={styles.locationMessageHeader}>
        <View style={styles.locationPinBadge}>
          <Icon name="location-on" size={16} color="#FFFFFF" />
        </View>
        <View style={styles.locationMessageHeaderTextBlock}>
          <Text style={styles.locationMessageTitle}>Current Location Shared</Text>
          <Text style={styles.locationMessageSubtitle}>Tap to open in Maps</Text>
        </View>
      </View>

      <View style={styles.locationCoordsRow}>
        <Text style={styles.locationCoordsLabel}>LAT</Text>
        <Text style={styles.locationCoordsValue}>{location.latitude.toFixed(5)}</Text>
        <Text style={[styles.locationCoordsLabel, styles.locationCoordsLabelSpacing]}>LNG</Text>
        <Text style={styles.locationCoordsValue}>{location.longitude.toFixed(5)}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default React.memo(LocationMessageContent);
