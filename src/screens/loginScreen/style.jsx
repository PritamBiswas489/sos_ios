import { StyleSheet } from 'react-native';
import appColors from '../../theme/appColors';
import appFonts from '../../theme/appFonts';
import { SH, SW, SF } from '../../theme/dimensions';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.DarkPrimary,
    paddingHorizontal: SW(20),
  },

  backBtn: {
    marginTop: SH(16),
    alignSelf: 'flex-start',
    padding: SW(4),
  },

  logoContainer: {
    alignItems: 'center',
    marginTop: SH(70),
  },

  logoBox: {
    width: SW(60),
    height: SH(60),
    borderRadius: SW(18),
    backgroundColor: appColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SW(10),
  },

  appName: {
    fontSize: SF(24),
    fontFamily: appFonts.NunitoBlack,
    color: appColors.white,
  },

  tagline: {
    fontSize: SF(11),
    color: appColors.bodyColor,
    marginTop: SW(4),
    letterSpacing: SW(2),
  },

  welcome: {
    color: appColors.white,
    fontSize: SF(18),
    fontFamily: appFonts.NunitoBold,
    marginTop: SH(40),
  },

  subtitle: {
    color: appColors.bodyColor,
    fontSize: SF(11),
    marginTop: SW(3),
  },

  label: {
    color: appColors.bodyColor,
    fontSize: SF(10),
    marginTop: SW(22),
  },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.7,
    borderColor: appColors.primary,
    backgroundColor: appColors.primaryAA,
    borderRadius: 14,
    paddingHorizontal: SW(10),
    marginTop: 8,
  },

  country: {
    color: appColors.white,
    marginRight: SW(8),
  },

  input: {
    flex: 1,
    color: appColors.white,
    height: SH(41),
  },

  inputBoxDark: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColors.secondary,
    borderRadius: 14,
    paddingHorizontal: SW(10),
    marginTop: SW(8),
  },
  otpBoxArea: {
    position: 'relative',
    marginTop: SH(30),
    justifyContent: 'center',
    flexDirection: 'row',
  },
  otpBoxLine: {
    height: SH(0.5),
    width: '100%',
    backgroundColor: appColors.bodyColor,
    position: 'absolute',
    top: '50%',
    // zIndex: -1,
  },
  otpTitle: {
    color: appColors.bodyColor,
    fontSize: SF(12),
    textAlign: 'center',
    fontFamily: appFonts.NunitoBold,
    backgroundColor: appColors.DarkPrimary,
    paddingHorizontal: SW(10),
    zIndex: 1,
  },

  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SH(12),
  },

  otpBox: {
    width: SW(50),
    height: SH(50),
    borderRadius: 10,
    backgroundColor: appColors.secondary,
    color: appColors.white,
    textAlign: 'center',
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#1E2A44',
  },

  activeOtp: {
    borderColor: appColors.primary,
  },

  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },

  termsText: {
    color: appColors.bodyColor,
    fontSize: SF(10),
    marginLeft: SW(4),
    flex: 1,
  },

  loginBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appColors.primary,
    borderRadius: 16,
    padding: SW(14),
    marginTop: SW(25),
  },

  loginText: {
    color: appColors.white,
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(14),
  },

  resend: {
    textAlign: 'center',
    color: appColors.bodyColor,
    marginTop: SW(12),
    fontSize: SF(12),
  },

  licensePanel: {
    borderWidth: 0.7,
    borderColor: 'rgba(255,59,92,0.35)',
    backgroundColor: appColors.primaryAA,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: SH(20),
  },

  licensePanelAccent: {
    height: SH(3),
    backgroundColor: appColors.primary,
    width: '100%',
  },

  licensePanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SW(12),
    paddingTop: SH(10),
    paddingBottom: SH(8),
  },

  licensePanelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  licensePanelTitle: {
    color: appColors.white,
    fontSize: SF(11),
    fontFamily: appFonts.NunitoBold,
    letterSpacing: SW(1.5),
    marginLeft: SW(5),
  },

  licenseChip: {
    backgroundColor: 'rgba(255,59,92,0.15)',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(255,59,92,0.5)',
    paddingHorizontal: SW(8),
    paddingVertical: SW(2),
  },

  licenseChipText: {
    color: appColors.primary,
    fontSize: SF(9),
    fontFamily: appFonts.NunitoBold,
    letterSpacing: SW(1),
  },

  licenseInnerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: SW(12),
    paddingBottom: SH(10),
  },

  licenseFieldWrap: {
    backgroundColor: appColors.secondary,
    borderRadius: 10,
    borderWidth: 0.7,
    borderColor: '#1E2A44',
    alignItems: 'center',
    overflow: 'hidden',
  },

  licenseInput: {
    color: appColors.white,
    height: SH(46),
    width: '100%',
    textAlign: 'center',
    fontSize: SF(16),
    fontFamily: appFonts.NunitoBold,
    letterSpacing: SW(2),
    paddingHorizontal: SW(4),
  },

  licenseInputDisabled: {
    color: appColors.primary,
    backgroundColor: 'rgba(255,59,92,0.12)',
  },

  licenseSegLabel: {
    color: '#3a4a66',
    fontSize: SF(8),
    fontFamily: appFonts.NunitoBold,
    letterSpacing: SW(1),
    textAlign: 'center',
    paddingBottom: SW(4),
  },

  licenseSep: {
    color: 'rgba(255,59,92,0.6)',
    fontSize: SF(18),
    fontWeight: 'bold',
    marginHorizontal: SW(5),
    marginTop: SH(12),
  },

  licensePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: SH(7),
    borderTopWidth: 0.5,
    borderTopColor: '#1E2A44',
  },

  licensePreviewLabel: {
    color: '#3a4a66',
    fontSize: SF(9),
    fontFamily: appFonts.NunitoBold,
    letterSpacing: SW(1.5),
    marginRight: SW(8),
  },

  licensePreviewValue: {
    color: appColors.primary,
    fontSize: SF(13),
    fontFamily: appFonts.NunitoBold,
    letterSpacing: SW(2.5),
  },
});
