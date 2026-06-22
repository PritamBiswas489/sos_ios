import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

const OlderConversationLoader = ({ visible, styles }) => {
  return (
    <View style={{ height: visible ? 'auto' : 0, overflow: 'hidden' }}>
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color="#2ED573" animating={visible} />
      </View>
    </View>
  );
};

export default React.memo(OlderConversationLoader);
