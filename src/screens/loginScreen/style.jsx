import { StyleSheet } from 'react-native';
import appColors from '../../theme/appColors';
import appFonts from '../../theme/appFonts';
import { SH, SW, SF } from '../../theme/dimensions';

export default StyleSheet.create({
  // ─── Layout ───────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: '#0d1526',
  },
  contentContainer: {
    paddingHorizontal: SW(22),
    paddingBottom: SH(32),
  },

  // ─── Logo ─────────────────────────────────────────────────────────────────
  logoContainer: {
    alignItems: 'center',
    marginTop: SH(64),
    marginBottom: SH(28),
  },
  logoBox: {
    width: SW(56),
    height: SH(56),
    borderRadius: SW(16),
    backgroundColor: '#e63559',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SW(12),
  },
  appName: {
    fontSize: SF(22),
    fontFamily: appFonts.NunitoBlack,
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  appNameAccent: {
    color: '#e63559',
  },
  tagline: {
    fontSize: SF(10),
    color: '#4e6280',
    marginTop: SW(4),
    letterSpacing: SW(2.5),
  },

  // ─── Step dots ────────────────────────────────────────────────────────────
  stepDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SW(6),
    marginBottom: SH(22),
  },
  stepDot: {
    width: SW(6),
    height: SW(6),
    borderRadius: SW(3),
    backgroundColor: '#1e2e4a',
  },
  stepDotActive: {
    width: SW(18),
    borderRadius: SW(3),
    backgroundColor: '#e63559',
  },

  // ─── Welcome ──────────────────────────────────────────────────────────────
  welcome: {
    color: '#ffffff',
    fontSize: SF(22),
    fontFamily: appFonts.NunitoBold,
    lineHeight: SH(28),
  },
  subtitle: {
    color: '#4e6280',
    fontSize: SF(10),
    marginTop: SW(4),
    marginBottom: SH(6),
    letterSpacing: SW(1.8),
  },

  // ─── Field label ──────────────────────────────────────────────────────────
  label: {
    color: '#4e6280',
    fontSize: SF(10),
    marginTop: SW(20),
    marginBottom: SH(8),
    letterSpacing: SW(1.5),
  },

  // ─── Phone input ──────────────────────────────────────────────────────────
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230,53,89,0.35)',
    backgroundColor: '#111d33',
    borderRadius: SW(14),
    paddingHorizontal: SW(14),
    height: SH(52),
  },
  country: {
    color: '#ffffff',
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(14),
    paddingRight: SW(10),
  },
  phoneDivider: {
    width: 1,
    height: SH(22),
    backgroundColor: '#1e2e4a',
    marginRight: SW(10),
  },
  input: {
    flex: 1,
    color: '#ffffff',
    height: '100%',
    fontSize: SF(15),
    paddingVertical: 0,
  },

  // ─── Buttons ──────────────────────────────────────────────────────────────
  bottomActions: {
    marginTop: SH(28),
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SW(10),
    marginTop: SH(24),
  },
  loginBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SW(6),
    backgroundColor: '#e63559',
    borderRadius: SW(14),
    height: SH(50),
    paddingHorizontal: SW(16),
  },
  loginText: {
    color: '#ffffff',
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(14),
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1e2e4a',
  },
  secondaryBtnText: {
    color: '#7a9ab8',
  },

  // ─── License panel ────────────────────────────────────────────────────────
  licensePanel: {
    borderWidth: 1,
    borderColor: 'rgba(230,53,89,0.3)',
    backgroundColor: '#111d33',
    borderRadius: SW(14),
    overflow: 'hidden',
    marginTop: SH(18),
  },
  licensePanelAccent: {
    height: SH(2),
    backgroundColor: '#e63559',
    width: '100%',
  },
  licensePanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SW(14),
    paddingTop: SH(12),
    paddingBottom: SH(8),
  },
  licensePanelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SW(6),
  },
  licensePanelTitle: {
    color: '#c8d5ea',
    fontSize: SF(10),
    fontFamily: appFonts.NunitoBold,
    letterSpacing: SW(1.5),
  },
  licenseInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SW(14),
    paddingBottom: SH(12),
    gap: SW(8),
  },
  licenseFieldWrap: {
    backgroundColor: '#0d1526',
    borderRadius: SW(10),
    borderWidth: 1,
    borderColor: '#1a2640',
    overflow: 'hidden',
  },
  licenseInput: {
    color: '#ffffff',
    height: SH(46),
    width: '100%',
    textAlign: 'center',
    fontSize: SF(16),
    fontFamily: appFonts.NunitoBold,
    letterSpacing: SW(2),
    paddingHorizontal: SW(4),
  },
  licenseInputDisabled: {
    color: '#e63559',
    backgroundColor: 'rgba(230,53,89,0.1)',
  },
  licenseSep: {
    color: 'rgba(230,53,89,0.5)',
    fontSize: SF(18),
    fontWeight: 'bold',
  },
  licensePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SW(8),
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: SH(8),
    borderTopWidth: 0.5,
    borderTopColor: '#1a2640',
  },
  licensePreviewLabel: {
    color: '#2e3f5a',
    fontSize: SF(9),
    fontFamily: appFonts.NunitoBold,
    letterSpacing: SW(1.5),
  },
  licensePreviewValue: {
    color: '#e63559',
    fontSize: SF(13),
    fontFamily: appFonts.NunitoBold,
    letterSpacing: SW(2.5),
  },

  // ─── OTP divider ──────────────────────────────────────────────────────────
  otpDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SH(10),
    marginBottom: SH(4),
  },
  otpDividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: '#1e2e4a',
  },
  otpDividerText: {
    fontSize: SF(11),
    color: '#4e6280',
    fontFamily: appFonts.NunitoBold,
    letterSpacing: SW(1.5),
    paddingHorizontal: SW(12),
  },

  // ─── OTP boxes ────────────────────────────────────────────────────────────
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SW(10),
    marginTop: SH(4),
  },
  otpBox: {
    flex: 1,
    height: SH(56),
    borderRadius: SW(12),
    backgroundColor: '#111d33',
    color: '#ffffff',
    textAlign: 'center',
    fontSize: SF(22),
    fontFamily: appFonts.NunitoBold,
    borderWidth: 1,
    borderColor: '#1e2e4a',
    paddingVertical: 0,
    includeFontPadding: false,
  },
  otpBoxActive: {
    borderColor: 'rgba(230,53,89,0.7)',
    backgroundColor: 'rgba(230,53,89,0.08)',
  },
  otpBoxFilled: {
    borderColor: 'rgba(230,53,89,0.5)',
    backgroundColor: 'rgba(230,53,89,0.06)',
  },

  // ─── Terms ────────────────────────────────────────────────────────────────
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SW(8),
    marginTop: SH(18),
  },
  termsText: {
    color: '#4e6280',
    fontSize: SF(11),
    flex: 1,
    lineHeight: SH(17),
  },

  // ─── Resend ───────────────────────────────────────────────────────────────
  resendContainer: {
    alignItems: 'center',
    marginTop: SH(16),
  },
  resendLinkWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SW(6),
    paddingVertical: SH(7),
    paddingHorizontal: SW(14),
    borderRadius: SW(10),
    backgroundColor: 'rgba(230,53,89,0.07)',
    borderWidth: 0.5,
    borderColor: 'rgba(230,53,89,0.25)',
  },
  resendLinkWrapDisabled: {
    backgroundColor: 'transparent',
    borderColor: '#1e2e4a',
  },
  resendLink: {
    color: '#e66070',
    fontSize: SF(12),
    fontFamily: appFonts.NunitoBold,
  },
  resendLinkDisabled: {
    color: '#4e6280',
  },
});