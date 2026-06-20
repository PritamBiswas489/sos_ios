import { Platform } from 'react-native';
export const Colors = {
  // Base surfaces
  bg:          '#0A0E1A',
  surface:     '#111827',
  surfaceHigh: '#1A2235',
  surfaceBorder:'#1E2D45',
  overlay:     'rgba(10,14,26,0.92)',

  // Accent
  accent:      '#E53E6D',
  accentMuted: 'rgba(229,62,109,0.15)',
  accentGlow:  'rgba(229,62,109,0.35)',

  // Text
  textPrimary:   '#F0F4FF',
  textSecondary: '#8A9BB5',
  textMuted:     '#4A5568',
  textInverse:   '#0A0E1A',

  // Status
  threatLow:    '#10B981',
  threatMedium: '#F59E0B',
  threatHigh:   '#EF4444',
  threatLowBg:  'rgba(16,185,129,0.12)',
  threatMedBg:  'rgba(245,158,11,0.12)',
  threatHighBg: 'rgba(239,68,68,0.12)',

  // Utility
  divider:  '#1E2D45',
  success:  '#10B981',
  warning:  '#F59E0B',
  error:    '#EF4444',
  inputBg:  '#0F1928',
  shadow:   '#000',
};

export const Typography = {
  heading1: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5, color: Colors.textPrimary },
  heading2: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3, color: Colors.textPrimary },
  heading3: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2, color: Colors.textPrimary },
  body:     { fontSize: 14, fontWeight: '400', lineHeight: 22, color: Colors.textSecondary },
  bodyBold: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  caption:  { fontSize: 12, fontWeight: '500', letterSpacing: 0.3, color: Colors.textMuted },
  label:    { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: Colors.textMuted },
  mono:     { fontSize: 12, fontFamily: Platform?.OS === 'ios' ? 'Menlo' : 'monospace', color: Colors.textSecondary },
};

export const Spacing = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32,
};

export const Radius = {
  sm: 6, md: 10, lg: 14, xl: 20, pill: 999,
};

export const Shadow = {
  card: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  modal: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.7,
    shadowRadius: 40,
    elevation: 20,
  },
};

export const ThreatConfig = {
  Low:    { color: Colors.threatLow,    bg: Colors.threatLowBg,  icon: '●' },
  Medium: { color: Colors.threatMedium, bg: Colors.threatMedBg,  icon: '▲' },
  High:   { color: Colors.threatHigh,   bg: Colors.threatHighBg, icon: '⬟' },
};
