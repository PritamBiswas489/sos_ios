import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

const OlderConversationLoader = ({ visible, styles }) => {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.historyLoaderInline}>
      <ActivityIndicator size="small" color="#2ED573" />
      <Text style={styles.historyLoaderInlineText}>Loading older messages...</Text>
    </View>
  );
};

export default React.memo(OlderConversationLoader);
