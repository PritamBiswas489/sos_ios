import {useState} from 'react';
import {PermissionsAndroid} from 'react-native';
import {clearValue, getValue} from './localstorage';
import {
  launchImageLibrary,
  ImagePickerResponse,
  ImageLibraryOptions,
} from 'react-native-image-picker';

 
import { deleteAuthTokens } from '@src/config/auth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from 'src/navigation/types';

export const requestLocationPermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Geolocation Permission',
        message: 'Can we access your location?',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    console.log('granted', granted);
    if (granted === 'granted') {
      console.log('You can use Geolocation');
      return true;
    } else {
      console.log('You cannot use Geolocation');
      return false;
    }
  } catch (err) {
    return false;
  }
};

type ImagePickerCallback = (imageUri: string) => void;

export const handleImagePicker = (
  options: ImageLibraryOptions,
  callback: ImagePickerCallback,
) => {
  launchImageLibrary(options, (response: ImagePickerResponse) => {
    if (response.didCancel) {
      console.log('User cancelled image picker');
    } else if (response.errorCode) {
      console.log('Image picker error: ', response.errorMessage);
    } else {
      console.log(response?.assets?.[0])
      const source: string | undefined =
        response.assets && response.assets.length > 0
          ? response.assets[0].uri
          : '';
      if (source) {
        callback(source);
      }
    }
  });
};


export const handleImagePickerAllDetails = (
  options: ImageLibraryOptions,
  callback: (assets: any) => void,
) => {
  launchImageLibrary(options, (response: ImagePickerResponse) => {
    if (response.didCancel) {
      console.log('User cancelled image picker');
    } else if (response.errorCode) {
      console.log('Image picker error: ', response.errorMessage);
    } else {
       
      if (response?.assets?.[0]?.uri) {
        callback(response?.assets?.[0]);
      }
    }
  });
};

export const getServiceMenCredentials = async () => {
  try {
    const servicemenEmail = await getValue('servicemenEmail');
    const servicemenPassword = await getValue('servicemenPassword');
    return servicemenEmail && servicemenPassword ? true : false;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const clearServiceMenCredential = async () => {
  try {
    await clearValue('servicemenEmail');
    await clearValue('servicemenPassword');
    await clearValue('freelancerLogin');
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

//get logged in user type
export const checkLoggedInUserType =  async()=>{
  const getUserType = await getValue('loggedInUserType')
  if(getUserType === 'Provider'){
     return 'Provider'
  }else if(getUserType === 'Seller'){
    return 'Seller'
 }
  return null
}


export function validatePassword(password:string) {
  // Check for minimum length
  if (password.length < 8) {
    return { valid: false, message: "newDeveloper.passwordErrorOne" };
  }

  // Check for mixed case
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  if (!hasUpperCase || !hasLowerCase) {
    return { valid: false, message: "newDeveloper.passwordErrorTwo" };
  }

  // Check for letters
  const hasLetter = /[a-zA-Z]/.test(password);
  if (!hasLetter) {
    return { valid: false, message: "newDeveloper.passwordErrorThree" };
  }

  // Check for numbers
  const hasNumber = /[0-9]/.test(password);
  if (!hasNumber) {
    return { valid: false, message: "newDeveloper.passwordErrorFour" };
  }

  // Check for symbols
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  if (!hasSymbol) {
    return { valid: false, message: "newDeveloper.passwordErrorFive" };
  }

  // Check against a list of compromised passwords
  const compromisedPasswords = [
    "123456", "password", "123456789", "12345678", "12345", "1234567",
    "qwerty", "111111", "1234567890", "123123", "abc123", "password1",
    "1234", "iloveyou", "1q2w3e4r", "admin", "letmein"
  ];
  if (compromisedPasswords.includes(password)) {
    return { valid: false, message: "newDeveloper.passwordErrorSix" };
  }

  return { valid: true, message: "newDeveloper.passwordSuccess" };
}

//unauthorize redirect
export const authAuthorizeRedirect  = async (response:any,navigation:NativeStackNavigationProp<RootStackParamList>) =>{
  if(response?.data?.errors[0]?.code === 'auth-001'){
    clearValue('loggedInUserType')
    await deleteAuthTokens();
    navigation.replace('AuthNavigation');
  }
}

export function isFileProtocol(url:string) {
  const regex = /^file:\/\//;
  return regex.test(url);
}


 