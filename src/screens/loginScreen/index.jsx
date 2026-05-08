import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Spinner from 'react-native-loading-spinner-overlay';
import { useNavigation } from '@react-navigation/native';
import styles from './style';
import CountryListModal from '../../components/countryListModal';
import { Alert } from 'react-native';
import { LoginService } from '../../services/login.service';
import useToast from '../../hook/useToast';
import { countries } from '../../config/countries';
import { setAuthTokens } from '../../config/auth'; 
import useUserAuth from '../../hook/useUserAuth';

export const getFlagEmoji = countryCode => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};
const getDeviceCountryCode = () => {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale; // e.g., "en-NG"
    const parts = locale.split('-');
    return parts[parts.length - 1].toUpperCase();
  } catch {
    return null;
  }
};
const LoginScreen = () => {
  const navigation = useNavigation();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isGetOtp, setIsGetOtp] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({
    name: 'Nigeria',
    code: 'NG',
    dial_code: '+234',
  });
  const [userPhone, setUserPhone] = useState('');
  const uAuth = useUserAuth();
  const [deviceCountryCode, setDeviceCountryCode] = useState(
    getDeviceCountryCode() || 'NG',
  ); // Default to 'NG' if detection fails
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    if (deviceCountryCode) {
      const match = countries.find(c => c.code === deviceCountryCode);
      if (match) setSelectedCountry(match);
      console.log(
        'Detected country code:',
        deviceCountryCode,
        'Selected country:',
        match,
      );
      if (deviceCountryCode === 'IN') {
        setUserPhone('9830990065');
        setLicPart2('08')
        setLicPart3('000001');
      }
    }
  }, [deviceCountryCode]);
  const handleSelectCountry = country => {
    console.log('Selected Country:', country);
    setSelectedCountry(country);
    setIsCountryModalVisible(false);
  };
  const handleCloseCountryModal = () => {
    setIsCountryModalVisible(false);
  };
  const [activeIndex, setActiveIndex] = useState(0);
  const inputs = useRef([]);
  const [licPart2, setLicPart2] = useState('');
  const [licPart3, setLicPart3] = useState('');
  const licRef2 = useRef(null);
  const licRef3 = useRef(null);

  const handleOTP = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputs.current[index + 1].focus();
      setActiveIndex(index + 1);
    }
  };

  const handleBackspace = (value, index) => {
    if (value === '' && index > 0) {
      inputs.current[index - 1].focus();
      setActiveIndex(index - 1);
    }
  };
  const openCountryModal = () => {
    setIsCountryModalVisible(true);
  };
  const getLoginOtp = async () => {
    setIsLoading(true);
    try {
      const phoneRegex = /^[0-9]{10,15}$/;
      if (!phoneRegex.test(userPhone)) {
        showError('Invalid Phone Number', 'Please enter a valid phone number.');
        setIsLoading(false);
        return;
      }
      //remove leading zero if present
      let requestPhone = userPhone.trim();
      if (requestPhone.startsWith('0')) {
        requestPhone = requestPhone.slice(1);
      }

      const fullPhoneNumber = `${selectedCountry.dial_code}${requestPhone}`;
      const payload = { phoneNumber: fullPhoneNumber };
      let licenseNumber = null;
      if (licPart2 && licPart3) {
        licenseNumber = `KBY-${licPart2}-${licPart3}`;
        payload.licenseNumber = licenseNumber;
      }
      const requestOtp = await new Promise((resolve, reject) => {
        LoginService.requestOtp(payload, response => {
          console.log('OTP Request Response:', response);
          if (response.success === true) {
            resolve(response);
          } else {
            reject(new Error(response?.error || 'OTP request failed'));
          }
        });
      });
      setIsLoading(false);
      showSuccess(
        'SUCCESS',
        requestOtp?.data?.message || 'OTP sent successfully',
      );
      console.log('otpCode', requestOtp?.data?.data?.otpCode);
      setIsGetOtp(true);
      const splitItpCode = requestOtp?.data?.data?.otpCode.split('');
      setOtp(splitItpCode);
    } catch (error) {
      console.log('OTP Request Error:', error);
      setIsLoading(false);
      showError(
        'OTP Request Failed',
        error?.message || 'Unable to request OTP. Please try again.',
      );
    }
    // Proceed with OTP request
  };
  const verfiyOtp = async () => {
    setIsLoading(true);
    try {
      const enteredOtp = otp.join('');
      if (enteredOtp.length < 4) {
        showError('Invalid OTP', 'Please enter the complete 4-digit OTP.');
        return;
      }
      // Proceed with OTP verification (e.g., API call)
      //remove leading zero if present
      let requestPhone = userPhone.trim();
      if (requestPhone.startsWith('0')) {
        requestPhone = requestPhone.slice(1);
      }
      const verifyPayload = {
        phoneNumber: `${selectedCountry.dial_code}${requestPhone}`,
        otp: enteredOtp,
      };
      const verifyOtp = await new Promise((resolve, reject) => {
        LoginService.verifyOtp(verifyPayload, response => {
          console.log('OTP Verify Response:', response);
          if (response.success === true) {
            resolve(response);
          } else {
            reject(
              new Error(response?.error || 'OTP verification failed'),
            );
          }
        });
      });
     const processUserLogin = await new Promise((resolve, reject) => {
        LoginService.processLogin({ phoneNumber: `${selectedCountry.dial_code}${requestPhone}` }, response => {
          console.log('Process Login Response:', response);
          if (response.success === true) {
              resolve(response);
          } else {
            reject(
              new Error(response?.error || 'Login processing failed'),
            );
          }
        });
     });
      const accessToken = processUserLogin?.data?.data?.accessToken; 
      const refreshToken = processUserLogin?.data?.data?.refreshToken;
      await setAuthTokens(accessToken, refreshToken);
      console.log('Access Token:', accessToken);
      console.log('Refresh Token:', refreshToken);
      const userData = processUserLogin?.data?.data?.user;
      console.log('User Data:', userData);
      setIsLoading(false);
      showSuccess(
        'SUCCESS',
        'OTP verified successfully and login processed',
      );
       uAuth.login(true);
       navigation.replace('Process',{action: 'retrieveDataAfterLogin'});
    } catch (error) {
      setIsLoading(false);
      console.error('OTP Verify Error:', error);
      showError(
        'OTP Verification Failed',
        error?.message || 'Unable to verify OTP. Please try again.',
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* BACK BUTTON */}

      {/* LOGO */}
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}>
          <Icon name="security" size={28} color="#fff" />
        </View>

        <Text style={styles.appName}>
          KobyTech<Text style={{ color: '#ff3b5c' }}>SilentGuard</Text>
        </Text>
        <Text style={styles.tagline}>PERSONAL SILENT ASSISTANT</Text>
      </View>
      {/* WELCOME */}
      <Text style={styles.welcome}>Welcome</Text>
      <Text style={styles.subtitle}>SIGN IN TO CONTINUE · SECURE LOGIN</Text>

      {/* MOBILE */}
      <Text style={styles.label}>MOBILE NUMBER</Text>

      <View style={styles.inputBox}>
        <TouchableOpacity onPress={openCountryModal} disabled={isGetOtp}>
          <Text style={[styles.country, isGetOtp && { opacity: 0.4 }]}>
            {getFlagEmoji(selectedCountry.code)} {selectedCountry.dial_code}
          </Text>
        </TouchableOpacity>
        <TextInput
          placeholder="1234567890"
          placeholderTextColor="#6B7C99"
          style={styles.input}
          keyboardType="phone-pad"
          maxLength={15}
          value={userPhone}
          onChangeText={text => {
            setUserPhone(text);
          }}
          editable={isGetOtp ? false : true}
        />
      </View>

      {/* LICENSE NUMBER */}
      <View style={[styles.licensePanel, isGetOtp && { opacity: 0.5 }]}>
        {/* Accent top bar */}
        <View style={styles.licensePanelAccent} />

        {/* Header */}
        <View style={styles.licensePanelHeader}>
          <View style={styles.licensePanelHeaderLeft}>
            <Icon name="badge" size={15} color="#ff3b5c" />
            <Text style={styles.licensePanelTitle}>LICENSE NUMBER</Text>
          </View>
         
        </View>

        {/* Fields row */}
        <View style={styles.licenseInnerRow}>
          {/* Field 1 — KBY (disabled) */}
          <View style={[styles.licenseFieldWrap, { flex: 1.1 }]}>
            <TextInput
              style={[styles.licenseInput, styles.licenseInputDisabled]}
              value="KBY"
              editable={false}
              selectTextOnFocus={false}
            />
           
          </View>

          <Text style={styles.licenseSep}>—</Text>

          {/* Field 2 — e.g. 08 */}
          <View style={[styles.licenseFieldWrap, { flex: 1.5 }]}>
            <TextInput
              ref={licRef2}
              style={styles.licenseInput}
              placeholder="08"
              placeholderTextColor="#3a4a66"
              keyboardType="number-pad"
              editable={!isGetOtp}
              value={licPart2}
              onChangeText={text => {
                setLicPart2(text);
                
              }}
            />
            
          </View>

          <Text style={styles.licenseSep}>—</Text>

          {/* Field 3 — e.g. 000003 */}
          <View style={[styles.licenseFieldWrap, { flex: 1.5 }]}>
            <TextInput
              ref={licRef3}
              style={styles.licenseInput}
              placeholder="000003"
              placeholderTextColor="#3a4a66"
              keyboardType="number-pad"
              editable={!isGetOtp}
              value={licPart3}
              onChangeText={text => setLicPart3(text)}
            />
             
          </View>
        </View>

        {/* Live preview */}
        <View style={styles.licensePreviewRow}>
          <Text style={styles.licensePreviewLabel}>FULL ID</Text>
          <Text style={styles.licensePreviewValue}>
            {`KBY-${licPart2 || '··'}-${licPart3 || '······'}`}
          </Text>
        </View>
      </View>

      {!isGetOtp && (
        <TouchableOpacity style={styles.loginBtn} onPress={getLoginOtp}>
          <Icon name="sms" size={18} color="#fff" />
          <Text style={styles.loginText}> Get OTP</Text>
        </TouchableOpacity>
      )}

      {isGetOtp && (
        <>
          <View style={styles.otpBoxArea}>
            <Text style={styles.otpTitle}>VERIFY OTP</Text>
            <View style={styles.otpBoxLine}></View>
          </View>
          <Text style={styles.label}>ONE-TIME PASSWORD</Text>
          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => (inputs.current[index] = ref)}
                style={[
                  styles.otpBox,
                  activeIndex === index && styles.activeOtp,
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                placeholder="-"
                placeholderTextColor="#6B7C99"
                onFocus={() => setActiveIndex(index)}
                onChangeText={value => handleOTP(value, index)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace') {
                    handleBackspace('', index);
                  }
                }}
              />
            ))}
          </View>

          {/* TERMS */}
          <View style={styles.termsRow}>
            <Icon name="check-box" size={18} color="#ff3b5c" />

            <Text style={styles.termsText}>
              I agree to Terms of Service and Privacy Policy
            </Text>
          </View>

          {/* BUTTON */}
          <TouchableOpacity style={styles.loginBtn} onPress={verfiyOtp}>
            <Icon name="verified-user" size={18} color="#fff" />
            <Text style={styles.loginText}> Verify & Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => {
              if (isGetOtp) {
                setIsGetOtp(false);
                setOtp(['', '', '', '']);
              }
            }}
          >
            <Icon name="arrow-back" size={24} color="#fff" />
            <Text style={{ color: '#fff', marginLeft: 8 }}>Edit Number</Text>
          </TouchableOpacity>

          {/* RESEND */}
          {/* <Text style={styles.resend}>Didn't receive OTP? Resend in 00:42</Text> */}
        </>
      )}

      <CountryListModal
        visible={isCountryModalVisible}
        onSelectCountry={handleSelectCountry}
        onClose={handleCloseCountryModal}
      />

      <View style={{ height: 60 }} />
      <Spinner
        visible={isLoading}
        textContent={'Processing...'}
        textStyle={{ color: '#FFF' }}
      />
    </ScrollView>
  );
};

export default LoginScreen;
