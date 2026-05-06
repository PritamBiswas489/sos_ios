import Toast from 'react-native-toast-message';

const useToast = () => {
  const showError = (title, message) => {
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
    });
  };

  const showSuccess = (title, message) => {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
    });
  };

  const showInfo = (title, message) => {
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
    });
  };

  const hideToast = () => {
    Toast.hide();
  };

  return { showError, showSuccess, showInfo, hideToast };
};

export default useToast;
