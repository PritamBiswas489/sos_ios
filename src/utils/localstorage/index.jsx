import AsyncStorage from '@react-native-async-storage/async-storage';

const setValue = async (key, value) => {
  const item = await AsyncStorage.setItem(key, value);
  return item;
};

const getValue = async (val) => {
  const item = await AsyncStorage.getItem(val);
  return item;
};

const clearValue = async (key) => {
  await AsyncStorage.removeItem(key);
};

export {setValue, getValue, clearValue};
