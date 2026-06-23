import { Platform } from 'react-native';
import appColors from '../../theme/appColors';
import appFonts from '../../theme/appFonts';
import { SW, SF } from '../../theme/dimensions';

export const Colors = {
  bg:            appColors.DarkPrimary,
  surface:       appColors.primaryAA,
  surfaceHigh:   appColors.primaryAA,
  surfaceBorder: appColors.primary,
  overlay:       'rgba(0,0,0,0.6)',

  accent:        appColors.primary,
  accentMuted:   appColors.primaryAA,
  accentGlow:    appColors.primary,

  textPrimary:   appColors.white,
  textSecondary: appColors.bodyColor,
  textMuted:     appColors.bodyColor,
  textInverse:   appColors.white,

  threatLow:    '#10B981',
  threatMedium: '#F59E0B',
  threatHigh:   '#EF4444',
  threatLowBg:  'rgba(16,185,129,0.12)',
  threatMedBg:  'rgba(245,158,11,0.12)',
  threatHighBg: 'rgba(239,68,68,0.12)',

  divider:  appColors.primary,
  success:  '#10B981',
  warning:  '#F59E0B',
  error:    '#EF4444',
  inputBg:  appColors.primaryAA,
  shadow:   '#000',
};

export const Typography = {
  heading1: { fontSize: SF(26), fontFamily: appFonts.NunitoBold, color: appColors.white },
  heading2: { fontSize: SF(20), fontFamily: appFonts.NunitoBold, color: appColors.white },
  heading3: { fontSize: SF(16), fontFamily: appFonts.NunitoBold, color: appColors.white },
  body:     { fontSize: SF(14), fontFamily: appFonts.NunitoRegular, lineHeight: 22, color: appColors.bodyColor },
  bodyBold: { fontSize: SF(14), fontFamily: appFonts.NunitoBold, color: appColors.white },
  caption:  { fontSize: SF(12), fontFamily: appFonts.NunitoSemiBold, color: appColors.bodyColor },
  label:    { fontSize: SF(11), fontFamily: appFonts.NunitoSemiBold, color: appColors.bodyColor },
  mono:     { fontSize: SF(12), fontFamily: Platform?.OS === 'ios' ? 'Menlo' : 'monospace', color: appColors.bodyColor },
};

export const Spacing = {
  xs: SW(4), sm: SW(8), md: SW(12), base: SW(16), lg: SW(20), xl: SW(24), xxl: SW(32),
};

export const Radius = {
  sm: SW(6), md: SW(10), lg: SW(14), xl: SW(20), pill: 999,
};

export const Shadow = {
  card:  { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  modal: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 12 },
};

export const ThreatConfig = {
  Low:    { color: '#10B981', bg: 'rgba(16,185,129,0.12)',  icon: '●' },
  Medium: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  icon: '▲' },
  High:   { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   icon: '⬟' },
};