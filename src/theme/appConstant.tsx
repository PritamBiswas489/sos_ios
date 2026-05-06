import {env} from '../../environment';
type AppEnvType = keyof typeof env.appUrls;
import {Dimensions, PixelRatio, Platform} from 'react-native';

export let SCREEN_HEIGHT = Dimensions.get('window').height;
export let SCREEN_WIDTH = Dimensions.get('window').width;

export const IsIOS = Platform.OS === 'ios';
export const IsAndroid = Platform.OS === 'android';

export const windowHeight = (height: number | string): number => {
  const tempHeight = typeof height === 'number' ? height : parseFloat(height);
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * tempHeight) / 100);
};

export const windowWidth = (width: number | string): number => {
  const tempWidth = typeof width === 'number' ? width : parseFloat(width);
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * tempWidth) / 100);
};

export const fontSizes = {
  FONT1: windowWidth(1),
  FONT2: windowWidth(2),
  FONT2HALF: windowWidth(2.5),
  FONT3: windowWidth(3),
  FONT3HALF: windowWidth(3.5),
  FONT4: windowWidth(4),
  FONT4HALF: windowWidth(4.5),
  FONT5: windowWidth(5),
  FONT5HALF: windowWidth(5.5),
  FONT6: windowWidth(6),
  FONT6HALF: windowWidth(6.5),
  FONT7: windowWidth(7),
  FONT7HALF: windowWidth(7.5),
  FONT8: windowWidth(8),
  FONT9: windowWidth(9),
  FONT9HALF: windowWidth(9.5),
  FONT10: windowWidth(10),
  FONT10HALF: windowWidth(10.5),
  FONT12: windowWidth(12),
  FONT12HALF: windowWidth(12.5),
  FONT13: windowWidth(13),
};

export const getAppUrl = () => {
  const {type, appUrls} = env;
  return appUrls[type as AppEnvType].apiUrl;
};

export const formatPhoneNumber = (phoneNumber: string): string => {
  if (phoneNumber.startsWith('0')) {
    return phoneNumber.substring(1); // Remove the first character
  }
  return phoneNumber;
};

export const getColor = (initials: string): string => {
  const colors = [
    '#ffcccc',
    '#ffcc99',
    '#ccffcc',
    '#ccffff',
    '#e0ccff',
    '#ffb3e6',
  ];
  const index = initials.charCodeAt(0) % colors.length;
  return colors[index];
};

export const sanitizePhoneNumber = (phone: string): string => {
  return phone.replace(/[^0-9]/g, '');
};
export const isNumericString = (value: string): boolean => {
  return /^[0-9]+$/.test(value);
};

export const getInitials = (name: string): string => {
  const names = name.split(' ');
  if (names.length === 0) {
    return '';
  }
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  return (
    names[0].charAt(0).toUpperCase() +
    names[names.length - 1].charAt(0).toUpperCase()
  );
};

export const truncate = (s: string | undefined | null, max = 40) => {
  if (!s) return '';
  const chars = Array.from(String(s)); // avoids cutting emoji/surrogate pairs
  return chars.length <= max ? s : chars.slice(0, max).join('') + '…';
};

export const getFormattedNumber = (rawNumber: string): string => {
  return rawNumber.replace(/\s+/g, '');
};

export const getCustomDescription = (item: any): string => {
  if (item.walletPayment) return 'Topup';

  if (item.transfer) {
    if (item.transfer.status === 'rejected') {
      return item.type === 'credit' ? 'Send - Rejected' : 'Sent';
    }

    return item.type === 'credit' ? 'Received' : 'Sent';
  }

  if (item.transferRequest) {
    return item.type === 'credit' ? 'Received' : 'Sent';
  }

  return item.description ?? 'Unknown';
};

export const formatNumber = (value: string) => {
  // Remove non-digit characters
  let numericValue = value.replace(/[^0-9]/g, '');

  if (numericValue === '') return '';

  // Add commas
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const formattedAmountNumber = (value: string) => {
  if (!value) return '';
  // keep only digits and dots
  const cleaned = String(value).replace(/[^\d.]/g, '');

  // split on dot, keep first dot as decimal separator and join the rest
  const parts = cleaned.split('.');
  const intPart = parts.shift() ?? '';
  const decPart = parts.length ? parts.join('') : '';

  // format integer part with commas
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return decPart ? `${intFormatted}.${decPart}` : intFormatted;
};

export const sanitizeAmount = (
  input: unknown,
  returnNumber = false,
): string | number => {
  if (input === null || input === undefined) return returnNumber ? 0 : '';

  const s = String(input).trim();
  if (s === '') return returnNumber ? 0 : '';

  // Remove anything except digits and dots
  const cleaned = s.replace(/[^\d.]/g, '');

  // If there are multiple dots, keep the first and concatenate the rest
  const parts = cleaned.split('.');
  let final = '';
  if (parts.length === 1) {
    final = parts[0];
  } else {
    final = parts.shift() + '.' + parts.join('');
  }

  // Remove leading zeros but keep "0" or "0.xxx"
  // Convert "00012" -> "12", preserve "0" and "0.12"
  final = final.replace(/^0+([1-9])/, '$1');

  // If final is empty or just a dot -> invalid
  if (final === '' || final === '.') return returnNumber ? 0 : '';

  return returnNumber ? Number(final) : final;
};

// export const getCustomDescription = (item: any): string => {
//   if (item.walletPayment) {
//     return 'Topup';
//   }

//   if (item.transfer) {
//     if (item.transfer.status === 'rejected') {
//       if (item.type === 'debit') {
//         return 'Sent';
//       } else if (item.type === 'credit') {
//         return 'Send - Rejected';
//       }
//       return 'Send - Rejected';
//     }

//     if (item.type === 'debit') {
//       return 'Sent';
//     } else if (item.type === 'credit') {
//       return 'Received';
//     }

//     return 'Transfer';
//   }

//   if (item.transferRequest) {
//     if (item.type === 'debit') {
//       return 'Sent';
//     } else if (item.type === 'credit') {
//       return 'Received';
//     }

//     return 'Transfer Request';
//   }

//   return item.description ?? 'Unknown';
// };

import EUFlag from '@src/assets/images/curency/eu.svg';
import IsraelFlag from '@src/assets/images/curency/il.svg';
import USFlag from '@src/assets/images/curency/us.svg';
import {SW} from './dimensions';
export const currencyOptions = [
  {
    label: 'ILS',
    value: 'ILS',
    icon: () => <IsraelFlag width={SW(26)} height={SW(26)} />,
  },
  {
    label: 'USD',
    value: 'USD',
    icon: () => <USFlag width={SW(26)} height={SW(26)} />,
  },
  {
    label: 'EUR',
    value: 'EUR',
    icon: () => <EUFlag width={SW(26)} height={SW(26)} />,
  },
];

export const getNotificationIconColorStatus = (type: string) => {
  switch (type) {
    case 'TRANSFER':
      return {
        iconSet: 'Feather',
        iconName: 'bell',
        iconColor: '#fff',
        iconBg: '#FF9800',
      };
    case 'TRANSFER_ACCEPTED':
      return {
        iconSet: 'Feather',
        iconName: 'check-circle',
        iconColor: '#4CAF50', // green
        iconBg: '#E8F5E9',
      };
    case 'pending':
      return {
        iconSet: 'MaterialIcons',
        iconName: 'access-time',
        iconColor: '#fff',
        iconBg: '#FF9800',
      };
    case 'accepted':
      return {
        iconSet: 'Feather',
        iconName: 'check-circle',
        iconColor: '#4CAF50', // orange
        iconBg: '#E8F5E9',
      };
    case 'approved':
      return {
        iconSet: 'Feather',
        iconName: 'check-circle',
        iconColor: '#4CAF50', // orange
        iconBg: '#E8F5E9',
      };

    case 'rejected':
      return {
        iconSet: 'Feather',
        iconName: 'check-circle',
        iconColor: '#F44336', // red
        iconBg: '#FFEBEE',
      };
    case 'TRANSFER_REJECTION':
      return {
        iconSet: 'Feather',
        iconName: 'x-circle',
        iconColor: '#F44336', // red
        iconBg: '#FFEBEE',
      };
    case 'TRANSFER_REQUEST_REJECTION':
      return {
        iconSet: 'Feather',
        iconName: 'x-circle',
        iconColor: '#F44336', // red
        iconBg: '#FFEBEE',
      };
    case 'TRANSFER_REJECTION_BY_SENDER':
      return {
        iconSet: 'Feather',
        iconName: 'x-circle',
        iconColor: '#F44336', // red
        iconBg: '#FFEBEE',
      };
    case 'SENDER_TRANSFER_REQUEST_REJECTION':
      return {
        iconSet: 'Feather',
        iconName: 'x-circle',
        iconColor: '#F44336', // red
        iconBg: '#FFEBEE',
      };

    default:
      return {
        iconSet: 'Feather',
        iconName: 'bell',
        iconColor: '#9E9E9E',
        iconBg: '#F5F5F5',
      };
  }
};

import Profile from '@src/assets/images/setting/Profile.svg';
import DarkMenu from '@src/assets/images/setting/dark.svg';
import Document from '@src/assets/images/setting/Document.svg';
import Heart from '@src/assets/images/setting/Heart.svg';
import Wallet from '@src/assets/images/setting/Wallet.svg';
import Notification from '@src/assets/images/setting/Notification.svg';
import Language from '@src/assets/images/setting/Language.svg';
import AboutUs from '@src/assets/images/setting/AboutUs.svg';
import Support from '@src/assets/images/setting/Support.svg';
import Logout from '@src/assets/images/setting/Logout.svg';
import Contact from '@src/assets/images/setting/contact.svg';
import Feedback from '@src/assets/images/setting/feedback.svg';

import VectorIcon from '@src/utils/VectoreIcons';

export const settingsMenuItems = [
  {
    icon: <Profile height={SW(16)} width={SW(16)} />,
    text: 'settingsScreen.settingsMenu.personalInfo',
    bg: '#e9e7ff',
    screen: 'PersonalInfoScreen',
  },
  {
    icon: <DarkMenu height={SW(16)} width={SW(16)} />,
    text: 'settingsScreen.settingsMenu.darkMode',
    bg: '#E0F7FA',
    screen: 'darkMode',
  },
  {
    icon: <Document height={SW(16)} width={SW(16)} />,
    text: 'settingsScreen.settingsMenu.KYCStatus',
    bg: '#ffeaea',
    screen: 'VerificationScreen',
  },
  {
    icon: <Heart height={SW(16)} width={SW(16)} />,
    text: 'settingsScreen.settingsMenu.security',
    bg: '#e1f5ff',
    screen: 'SecuirtySettingsScreen',
  },
  {
    icon: <Wallet height={SW(16)} width={SW(16)} />,
    text: 'settingsScreen.settingsMenu.paymentMethods',
    bg: '#f7e7ff',
    screen: 'PaymentMethodsScreen',
  },
  {
    icon: <Notification height={SW(16)} width={SW(16)} />,
    text: 'settingsScreen.settingsMenu.getNotifications',
    bg: '#fff3da',
    screen: 'NotificationSettingScreen',
  },
  {
    icon: <Language height={SW(16)} width={SW(16)} />,
    text: 'settingsScreen.settingsMenu.language',
    bg: '#fceaea',
    screen: 'LanguageScreen',
  },
  {
    icon: <AboutUs height={SW(16)} width={SW(16)} />,
    text: 'settingsScreen.settingsMenu.faq',
    bg: '#fdf2e9',
    screen: 'FaqScreen',
  },
  {
    icon: <Support height={SW(16)} width={SW(16)} />,
    text: 'settingsScreen.settingsMenu.termsConditions',
    bg: '#f7e7ff',
    screen: 'Terms',
  },
  {
    icon: <Support height={SW(16)} width={SW(16)} />,
    text: 'settingsScreen.settingsMenu.privacyPolicy',
    bg: '#fdf2e9',
    screen: 'PrivacyPolicyScreen',
  },
  {
    icon: <Feedback height={SW(16)} width={SW(16)} />,
    text: 'settingsScreen.settingsMenu.feedbackScreen',
    bg: '#fff3da',
    screen: 'FeedbackScreen',
  },
  {
    icon: <Contact height={SW(16)} width={SW(16)} />,
    text: 'settingsScreen.settingsMenu.contactus',
    bg: '#d1f5f1',
    screen: 'SupportScreen',
  },
  {
    icon: <Logout height={SW(16)} width={SW(16)} />,
    text: 'settingsScreen.settingsMenu.Logout',
    bg: '#e1f5ff',
    screen: 'Logout', // Can use a special flag to handle logout
  },
];

// Safe int parser (handles string | number and NaN)
export const toInt = (v: unknown, fallback = 0): number => {
  const n =
    typeof v === 'number' ? Math.trunc(v) : Number.parseInt(String(v), 10);
  return Number.isNaN(n) ? fallback : n;
};

export const capitalize = (s: string) => {
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const toE164 = (cc: string | number, ph: string | number) => {
  const ccStr = String(cc).replace(/[^\d]/g, ''); // keep digits only
  let phStr = String(ph).trim();

  // if phone already starts with +, trust it and just normalize
  if (phStr.startsWith('+')) {
    return `+${phStr.replace(/[^\d]/g, '')}`;
  }

  // otherwise, strip non-digits from local number
  phStr = phStr.replace(/[^\d]/g, '');

  return `+${ccStr}${phStr}`;
};
