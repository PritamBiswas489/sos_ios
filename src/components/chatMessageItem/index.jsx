import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MessageMediaContent from '../messageMediaContent';
import ReplyPreview from '../replyPreview';
import LocationMessageContent from '../locationMessageContent';

const ChatMessageItem = ({
  item,
  styles,
  ReplySwipeWrapper,
  onReplyPress,
  onMenuToggle,
  onPressReplyTarget,
  onOpenLocationInMaps,
  handleOpenImageModal,
  handleOpenVideoModal,
  handleOpenAudioModal,
  handleOpenDocument,
  renderStatusIcon,
}) => {
  const isMediaOnlyMessage = chatItem => {
    const hasMedia = !!chatItem?.mediaUrl;
    const hasText = !!chatItem?.text?.trim?.();
    const hasLocation = !!chatItem?.locationJson;
    const hasReply = !!(chatItem?.reply_to_message || chatItem?.replyTo);
    return hasMedia && !hasText && !hasLocation && !hasReply;
  };

  const renderMessageActions = (chatItem, isSelfMessage) => {
    const actionRowStyle = isSelfMessage
      ? styles.messageActionsRowRight
      : styles.messageActionsRowLeft;

    return (
      <View style={[styles.messageActionsRow, actionRowStyle]}>
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => onMenuToggle(chatItem)}
          style={styles.messageActionButton}
        >
          <Icon name="more-vert" size={16} color="#D7E3FF" />
        </TouchableOpacity>
      </View>
    );
  };

  if (item.type === 'day') {
    return <Text style={styles.dayLabel}>{item.text}</Text>;
  }

  if (item.type === 'sos') {
    return (
      <View style={styles.sosContainer}>
        <View style={styles.sosCard}>
          <View style={styles.sosBadge}>
            <Text style={styles.sosBadgeText}>SOS TRIGGERED</Text>
          </View>

          <Text style={styles.sosMessage}>
            I need help! Sending my live location now.
          </Text>
        </View>
      </View>
    );
  }

  if (item.type === 'left') {
    const isMediaOnly = isMediaOnlyMessage(item);

    return (
      <ReplySwipeWrapper item={item} onSwipeReply={onReplyPress} enabled={item.type === 'left'}>
        <View style={styles.bubbleLeftWrapper}>
          <View style={styles.messageRowLeft}>
            <View style={[styles.bubbleLeft, isMediaOnly && styles.bubbleMediaOnly]}>
              <ReplyPreview
                item={item}
                isSelfMessage={false}
                styles={styles}
                onPressReplyTarget={onPressReplyTarget}
              />
              <LocationMessageContent
                item={item}
                isSelfMessage={false}
                styles={styles}
                onOpenLocationInMaps={onOpenLocationInMaps}
              />
              <MessageMediaContent
                item={item}
                styles={styles}
                compact={isMediaOnly}
                onOpenImageModal={handleOpenImageModal}
                onOpenVideoModal={handleOpenVideoModal}
                onOpenAudioModal={handleOpenAudioModal}
                onOpenDocument={handleOpenDocument}
              />
              {!!item.text && <Text style={styles.messageText}>{item.text}</Text>}
            </View>

            {renderMessageActions(item, false)}
          </View>

          <View style={styles.messageFooterLeft}>
            <View style={item.avatarStyle}>
              <Text style={styles.avatarSmallText}>{item.avatarText}</Text>
            </View>
            <Text style={styles.timeLeftInline}>{item.time}</Text>
          </View>
        </View>
      </ReplySwipeWrapper>
    );
  }

  if (item.type === 'right') {
    const isMediaOnly = isMediaOnlyMessage(item);

    return (
      <ReplySwipeWrapper item={item} onSwipeReply={onReplyPress} enabled={item.type === 'right'}>
        <View>
          <View style={styles.messageRowRight}>
            {renderMessageActions(item, true)}

            <View style={[styles.bubbleRight, isMediaOnly && styles.bubbleMediaOnly]}>
              <ReplyPreview
                item={item}
                isSelfMessage
                styles={styles}
                onPressReplyTarget={onPressReplyTarget}
              />
              <LocationMessageContent
                item={item}
                isSelfMessage
                styles={styles}
                onOpenLocationInMaps={onOpenLocationInMaps}
              />
              <MessageMediaContent
                item={item}
                styles={styles}
                compact={isMediaOnly}
                onOpenImageModal={handleOpenImageModal}
                onOpenVideoModal={handleOpenVideoModal}
                onOpenAudioModal={handleOpenAudioModal}
                onOpenDocument={handleOpenDocument}
              />
              {!!item.text && <Text style={styles.messageText}>{item.text}</Text>}
            </View>

            <View style={styles.avatarSmallPink}>
              <Text style={styles.avatarSmallText}>{item.avatarText}</Text>
            </View>
          </View>

          <View style={styles.messageStatusRow}>
            <Text style={styles.timeRight}>{item.time}</Text>
            {renderStatusIcon(item.status)}
          </View>
        </View>
      </ReplySwipeWrapper>
    );
  }

  return null;
};

// Custom comparison for React.memo to avoid unnecessary re-renders
function areEqual(prevProps, nextProps) {
  const pi = prevProps.item;
  const ni = nextProps.item;
  return (
    pi.id === ni.id &&
    pi.text === ni.text &&
    pi.status === ni.status &&
    pi.mediaUrl === ni.mediaUrl &&
    pi.mediaType === ni.mediaType &&
    pi.time === ni.time &&
    pi.locationJson === ni.locationJson &&
    pi.replyTargetId === ni.replyTargetId &&
    pi.avatarText === ni.avatarText &&
    // Compare reply_to_message by content, not reference (buildConversationItems creates new objects each run)
    pi.reply_to_message?.text === ni.reply_to_message?.text &&
    pi.reply_to_message?.mediaType === ni.reply_to_message?.mediaType &&
    pi.reply_to_message?.locationJson === ni.reply_to_message?.locationJson &&
    prevProps.styles === nextProps.styles &&
    prevProps.ReplySwipeWrapper === nextProps.ReplySwipeWrapper
  );
}

export default React.memo(ChatMessageItem, areEqual);
