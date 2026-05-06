import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const truncateByWordLimit = (value, wordLimit = 12) => {
  if (!value || typeof value !== 'string') return '';
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length <= wordLimit) return words.join(' ');
  return `${words.slice(0, wordLimit).join(' ')}...`;
};

const getReplyPreviewContent = replyMessage => {
  if (!replyMessage) return null;

  if (typeof replyMessage === 'string') {
    return {
      title: 'Reply to message',
      text: truncateByWordLimit(replyMessage),
    };
  }

  const replyText = replyMessage?.text || replyMessage?.message;
  if (replyText) {
    return {
      title: 'Reply to message',
      text: truncateByWordLimit(replyText),
    };
  }

  const replyMediaType = replyMessage?.mediaType || replyMessage?.media_type;
  if (replyMediaType === 'image') {
    return { title: 'Reply to image', text: 'Image attachment' };
  }
  if (replyMediaType === 'video') {
    return { title: 'Reply to video', text: 'Video attachment' };
  }
  if (replyMediaType === 'audio') {
    return { title: 'Reply to audio', text: 'Audio attachment' };
  }
  if (replyMediaType === 'document') {
    return { title: 'Reply to document', text: 'Document attachment' };
  }

  if (replyMessage?.locationJson || replyMessage?.location_json) {
    return { title: 'Reply to location', text: 'Shared location' };
  }

  return { title: 'Reply to message', text: 'Message' };
};

const ReplyPreview = ({ item, isSelfMessage, styles, onPressReplyTarget }) => {
  const replyData = item?.reply_to_message || item?.replyTo;
  const targetId = item?.replyTargetId;
  const preview = getReplyPreviewContent(replyData);

  if (!preview) return null;

  const content = (
    <View
      style={[
        styles.replyPreviewBox,
        isSelfMessage ? styles.replyPreviewBoxRight : styles.replyPreviewBoxLeft,
      ]}
    >
      <Text style={styles.replyPreviewTitle}>{preview.title}</Text>
      <Text style={styles.replyPreviewText} numberOfLines={2}>
        {preview.text}
      </Text>
    </View>
  );

  if (!targetId) {
    return content;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => onPressReplyTarget?.(targetId)}
    >
      {content}
    </TouchableOpacity>
  );
};

export default React.memo(ReplyPreview);
