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
import { LoginService } from '../../services/login.service';
import useToast from '../../hook/useToast';
import { countries } from '../../config/countries';
import { setAuthTokens } from '../../config/auth';
import useUserAuth from '../../hook/useUserAuth';
import MaskInput from 'react-native-mask-input';

export const getFlagEmoji = countryCode => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const getDeviceCountryCode = () => {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const parts = locale.split('-');
    return parts[parts.length - 1].toUpperCase();
  } catch {
    return null;
  }
};

// Step indicator component
const StepDots = ({ current }) => (
  <View style={styles.stepDots}>
    {[0, 1, 2].map(i => (
      <View
        key={i}
        style={[styles.stepDot, current === i && styles.stepDotActive]}
      />
    ))}
  </View>
);

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
  );
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showError, showSuccess } = useToast();
  const [licPart3, setLicPart3] = useState('');
  const [currentStep, setCurrentStep] = useState(0); // 0=mobile, 1=license, 2=otp
  const [licenseData, setLicenseData] = useState({});
  const [resendIn, setResendIn] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputs = useRef([]);
  const licRef3 = useRef(null);

  useEffect(() => {
    if (deviceCountryCode) {
      const match = countries.find(c => c.code === deviceCountryCode);
      if (match) setSelectedCountry(match);
      if (deviceCountryCode === 'IN') {
        setUserPhone('9830990065');
        setLicPart3('000001');
      }
    }
  }, [deviceCountryCode]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const intervalId = setInterval(() => {
      setResendIn(prev => {
        if (prev <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalId);
  }, [resendIn]);

  const handleSelectCountry = country => {
    setSelectedCountry(country);
    setIsCountryModalVisible(false);
  };

  const handleCloseCountryModal = () => {
    setIsCountryModalVisible(false);
  };

  const handleOTP = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) {
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

  const handleResendOtp = () => {
    if (resendIn > 0 || isLoading) return;
    getLoginOtp();
  };

  const getLoginOtp = async () => {
    setIsLoading(true);
    try {
      const phoneRegex = /^[0-9]{10,15}$/;
      if (!phoneRegex.test(userPhone)) {
        showError('Invalid phone number', 'Please enter a valid phone number.');
        setIsLoading(false);
        return;
      }
      let requestPhone = userPhone.trim();
      if (requestPhone.startsWith('0')) {
        requestPhone = requestPhone.slice(1);
      }
      const fullPhoneNumber = `${selectedCountry.dial_code}${requestPhone}`;
      const payload = { phoneNumber: fullPhoneNumber };
      if (licPart3) {
        payload.licenseNumber = `KBY-${licPart3}`;
      }
      const requestOtp = await new Promise((resolve, reject) => {
        LoginService.requestOtp(payload, response => {
          if (response.success === true) {
            resolve(response);
          } else {
            reject(new Error(response?.error || 'OTP request failed'));
          }
        });
      });
      setIsLoading(false);
      showSuccess('OTP sent', requestOtp?.data?.message || 'Check your phone for the code.');
      setIsGetOtp(true);
      setCurrentStep(2);
      setResendIn(30);
      const splitOtpCode = requestOtp?.data?.data?.otpCode?.split('');
      if (splitOtpCode) setOtp(splitOtpCode);
    } catch (error) {
      setIsLoading(false);
      showError('Request failed', error?.message || 'Unable to send OTP. Please try again.');
    }
  };

  const verifyOtp = async () => {
    setIsLoading(true);
    try {
      const enteredOtp = otp.join('');
      if (enteredOtp.length < 4) {
        showError('Incomplete OTP', 'Please enter all 4 digits.');
        setIsLoading(false);
        return;
      }
      let requestPhone = userPhone.trim();
      if (requestPhone.startsWith('0')) {
        requestPhone = requestPhone.slice(1);
      }
      const verifyPayload = {
        phoneNumber: `${selectedCountry.dial_code}${requestPhone}`,
        otp: enteredOtp,
      };
      await new Promise((resolve, reject) => {
        LoginService.verifyOtp(verifyPayload, response => {
          if (response.success === true) {
            resolve(response);
          } else {
            reject(new Error(response?.error || 'OTP verification failed'));
          }
        });
      });
      const processUserLogin = await new Promise((resolve, reject) => {
        LoginService.processLogin(
          { phoneNumber: `${selectedCountry.dial_code}${requestPhone}` },
          response => {
            if (response.success === true) {
              resolve(response);
            } else {
              reject(new Error(response?.error || 'Login processing failed'));
            }
          },
        );
      });
      const accessToken = processUserLogin?.data?.data?.accessToken;
      const refreshToken = processUserLogin?.data?.data?.refreshToken;
      await setAuthTokens(accessToken, refreshToken);
      setIsLoading(false);
      showSuccess('Signed in', 'Welcome!');
      uAuth.login(true);
      navigation.replace('Process', { action: 'retrieveDataAfterLogin' });
    } catch (error) {
      setIsLoading(false);
      showError('Verification failed', error?.message || 'Unable to verify OTP. Please try again.');
    }
  };
  const checkMobilehasLicense = async () => {
    setIsLoading(true);
    try {
      let requestPhone = userPhone.trim();
      if (requestPhone.startsWith('0')) {
        requestPhone = requestPhone.slice(1);
      }
      const fullPhoneNumber = `${selectedCountry.dial_code}${requestPhone}`;
      const payload = { phoneNumber: fullPhoneNumber };
      const checkLicenseResponse = await new Promise((resolve, reject) => {
        LoginService.checkMobileHasLicense(payload, response => {
          if (response.success === true) {
            resolve(response);
          } else {
            reject(new Error(response?.error || 'License check failed'));
          }
        });
      });
      setIsLoading(false);
      if (checkLicenseResponse?.data?.data?.licenseKey 
        && checkLicenseResponse?.data?.data?.licenseKey !== null 
        && checkLicenseResponse?.data?.data?.licenseKey !== '') {
        setLicenseData(checkLicenseResponse?.data?.data);
        setCurrentStep(1);
      } else{
        getLoginOtp();
        setCurrentStep(2);
      }
    } catch (error) {
      setIsLoading(false);
      showError('Check failed', error?.message || 'Unable to check license. Please try again.');
    }
  };
  const validdateLicenseAndGetOtp = async () => {
    if (!licPart3 || licPart3.length !== 6) {
      showError('Invalid License', 'Please enter a valid license number.');
      return;
    }
    const fullLicenseNumber = `KBY-${licPart3}`;
    if(licenseData?.licenseKey && licenseData?.licenseKey !== fullLicenseNumber) {
      showError('License Mismatch', 'The entered license number does not match our records.');
      return;
    }
    getLoginOtp();
    setCurrentStep(2);
  }

  const stepTitles = ['Welcome', 'License number', 'Verify identity'];
  const stepSubs = ['SIGN IN · SECURE LOGIN', 'ENTER YOUR LICENSE ID', 'CHECK YOUR PHONE'];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* LOGO */}
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}>
          <Icon name="security" size={26} color="#fff" />
        </View>
        <Text style={styles.appName}>
          KobyTech<Text style={styles.appNameAccent}>SilentGuard</Text>
        </Text>
        <Text style={styles.tagline}>PERSONAL SILENT ASSISTANT</Text>
      </View>

      {/* STEP DOTS */}
      <StepDots current={currentStep} />

      {/* WELCOME */}
      <Text style={styles.welcome}>{stepTitles[currentStep]}</Text>
      <Text style={styles.subtitle}>{stepSubs[currentStep]}</Text>

      {/* ── STEP 0: MOBILE NUMBER ── */}
      {currentStep === 0 && (
        <>
          <Text style={styles.label}>MOBILE NUMBER</Text>
          <View style={styles.inputBox}>
            <TouchableOpacity onPress={() => setIsCountryModalVisible(true)}>
              <Text style={styles.country}>
                {getFlagEmoji(selectedCountry.code)} {selectedCountry.dial_code}
              </Text>
            </TouchableOpacity>
            <View style={styles.phoneDivider} />
            <TextInput
              placeholder="1234567890"
              placeholderTextColor="#2e3f5a"
              style={styles.input}
              keyboardType="phone-pad"
              maxLength={15}
              value={userPhone}
              onChangeText={setUserPhone}
            />
          </View>
          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={checkMobilehasLicense}
            >
              <Text style={styles.loginText}>Continue</Text>
              <Icon name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ── STEP 1: LICENSE ── */}
      {currentStep === 1 && (
        <>
          <View style={styles.licensePanel}>
            <View style={styles.licensePanelAccent} />
            <View style={styles.licensePanelHeader}>
              <View style={styles.licensePanelHeaderLeft}>
                <Icon name="badge" size={14} color="#e63559" />
                <Text style={styles.licensePanelTitle}>LICENSE NUMBER</Text>
              </View>
            </View>
            <View style={styles.licenseInnerRow}>
              <View style={[styles.licenseFieldWrap, { flex: 1.1 }]}>
                <TextInput
                  style={[styles.licenseInput, styles.licenseInputDisabled]}
                  value="KBY"
                  editable={false}
                  selectTextOnFocus={false}
                />
              </View>
              <Text style={styles.licenseSep}>—</Text>
              <View style={[styles.licenseFieldWrap, { flex: 1.8 }]}>
                <MaskInput
                  value={licPart3}
                  placeholder="######"
                  placeholderTextColor="#2e3f5a"
                  keyboardType="number-pad"
                  ref={licRef3}
                  style={styles.licenseInput}
                  onChangeText={(masked) => setLicPart3(masked)}
                  mask={[/\d/, /\d/, /\d/, /\d/, /\d/, /\d/]}
                />
              </View>
            </View>
            <View style={styles.licensePreviewRow}>
              <Text style={styles.licensePreviewLabel}>FULL ID</Text>
              <Text style={styles.licensePreviewValue}>
                {`KBY-${licPart3 || '······'}`}
              </Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.loginBtn, styles.secondaryBtn]}
              onPress={() => setCurrentStep(0)}
            >
              <Icon name="arrow-back" size={18} color="#7a9ab8" />
              <Text style={[styles.loginText, styles.secondaryBtnText]}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.loginBtn, { flex: 1 }]}
              onPress={validdateLicenseAndGetOtp}
            >
              <Text style={styles.loginText}>Get OTP</Text>
              <Icon name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ── STEP 2: OTP ── */}
      {currentStep === 2 && (
        <>
          <View style={styles.otpDivider}>
            <View style={styles.otpDividerLine} />
            <Text style={styles.otpDividerText}>VERIFY OTP</Text>
            <View style={styles.otpDividerLine} />
          </View>

          <Text style={styles.label}>ONE-TIME PASSWORD</Text>
          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => (inputs.current[index] = ref)}
                style={[
                  styles.otpBox,
                  activeIndex === index && styles.otpBoxActive,
                  digit !== '' && styles.otpBoxFilled,
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                placeholder="—"
                placeholderTextColor="#2e3f5a"
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

          <View style={styles.termsRow}>
            <Icon name="check-box" size={16} color="#e63559" />
            <Text style={styles.termsText}>
              I agree to the Terms of Service and Privacy Policy
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.loginBtn, styles.secondaryBtn]}
              onPress={() => {
                setIsGetOtp(false);
                setOtp(['', '', '', '']);
                setCurrentStep(1);
              }}
            >
              <Icon name="arrow-back" size={18} color="#7a9ab8" />
              <Text style={[styles.loginText, styles.secondaryBtnText]}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.loginBtn, { flex: 1 }]}
              onPress={verifyOtp}
            >
              <Icon name="verified-user" size={16} color="#fff" />
              <Text style={styles.loginText}>Verify & sign in</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.resendContainer}>
            <TouchableOpacity
              style={[
                styles.resendLinkWrap,
                (resendIn > 0 || isLoading) && styles.resendLinkWrapDisabled,
              ]}
              onPress={handleResendOtp}
              disabled={resendIn > 0 || isLoading}
            >
              <Icon
                name="refresh"
                size={14}
                color={resendIn > 0 || isLoading ? '#4e6280' : '#e66070'}
              />
              <Text
                style={[
                  styles.resendLink,
                  (resendIn > 0 || isLoading) && styles.resendLinkDisabled,
                ]}
              >
                {resendIn > 0
                  ? `Resend OTP in 00:${String(resendIn).padStart(2, '0')}`
                  : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </View>
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
        textContent="Processing…"
        textStyle={{ color: '#fff' }}
      />
    </ScrollView>
  );
};

export default LoginScreen;