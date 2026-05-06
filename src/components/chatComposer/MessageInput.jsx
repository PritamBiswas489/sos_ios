import React, { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef,  } from 'react';
import { TextInput } from 'react-native';
import { useSelector } from 'react-redux';
import { useChatActions } from '../../context/ChatContext';
import styles from './style';

const TYPING_DEBOUNCE_MS = 1000;

const MessageInput = forwardRef(({}, ref) => {
  const [value, setValue] = useState('');
  const valueRef = useRef('');
  const typingDebounceRef = useRef(null);

  const chatActions = useChatActions();
  const currentRoomId = useSelector(state => state.chatSelectedTrustedContact?.roomId);

  useImperativeHandle(ref, () => ({
    getMessage: () => valueRef.current,
    clearMessage: () => {
      setValue('');
      valueRef.current = '';
    },
  }));

  const handleChangeText = useCallback(
    text => {
      setValue(text);
      valueRef.current = text;
      if (!currentRoomId || !text.trim()) return;
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = setTimeout(() => {
        chatActions.sendTyping(currentRoomId);
      }, TYPING_DEBOUNCE_MS);
    },
    [currentRoomId, chatActions],
  );

  useEffect(() => {
    return () => {
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    };
  }, []);

  return (
    

    <TextInput
      style={styles.input}
      placeholder={"Type a message ..."}
      placeholderTextColor="#6B7C99"
      value={value}
      onChangeText={handleChangeText}
      multiline
      textAlignVertical="top"
      scrollEnabled
    />
  );
});

export default React.memo(MessageInput);
