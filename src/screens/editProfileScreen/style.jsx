import { StyleSheet } from 'react-native';
import appColors from '../../theme/appColors';
import appFonts from '../../theme/appFonts';
import { SH, SW, SF } from '../../theme/dimensions';

export default StyleSheet.create({

  // ─── Root ────────────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: appColors.DarkPrimary,
  },

  content: {
    paddingHorizontal: SW(18),
    // paddingTop is set dynamically via useSafeAreaInsets in index.jsx
    paddingBottom: SH(32),
  },

  // ─── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SH(22),
  },

  backButton: {
    width: SW(36),
    height: SW(36),
    borderRadius: SW(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.whiteTransparent,
    borderWidth: 0.7,
    borderColor: appColors.whiteBdrTransparent,
  },

  headerTextWrap: {
    marginLeft: SW(10),
    flex: 1,
  },

  title: {
    color: appColors.white,
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(18),
  },

  subtitle: {
    color: appColors.bodyColor,
    fontFamily: appFonts.NunitoSemiBold,
    fontSize: SF(10),
    letterSpacing: 0.6,
    marginTop: SH(2),
  },

  // ─── Card ────────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: appColors.whiteTransparent,
    borderWidth: 0.7,
    borderColor: appColors.whiteBdrTransparent,
    borderRadius: SW(16),
    paddingHorizontal: SW(16),
    paddingVertical: SH(20),
  },

  // ─── Avatar section ──────────────────────────────────────────────────────────
  avatarSection: {
    alignItems: 'center',
    marginBottom: SH(22),
    paddingBottom: SH(18),
    borderBottomWidth: 0.7,
    borderBottomColor: appColors.whiteBdrTransparent,
  },

  avatarWrap: {
    width: SW(96),
    height: SW(96),
    borderRadius: SW(48),
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: appColors.primary,
    backgroundColor: appColors.primaryAA,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
  },

  avatarInitial: {
    color: appColors.white,
    fontSize: SF(30),
    fontFamily: appFonts.NunitoBold,
    fontWeight: '700',
  },

  uploadHint: {
    color: appColors.bodyColor,
    fontSize: SF(11),
    fontFamily: appFonts.NunitoSemiBold,
    marginTop: SH(10),
  },

  uploadButton: {
    marginTop: SH(10),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SW(14),
    paddingVertical: SH(8),
    borderRadius: SW(20),
    backgroundColor: 'rgba(47,107,255,0.10)',
    borderWidth: 0.7,
    borderColor: 'rgba(47,107,255,0.35)',
  },

  uploadButtonText: {
    color: '#4DA3FF',
    marginLeft: SW(6),
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(12),
  },

  // ─── Field labels ─────────────────────────────────────────────────────────────
  label: {
    color: appColors.bodyColor,
    fontSize: SF(10),
    fontFamily: appFonts.NunitoSemiBold,
    letterSpacing: 0.5,
    marginTop: SH(14),
    marginBottom: SH(6),
  },

  // ─── Input ───────────────────────────────────────────────────────────────────
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.7,
    borderColor: appColors.primary,
    borderRadius: SW(14),
    backgroundColor: appColors.primaryAA,
    paddingHorizontal: SW(12),
    minHeight: SH(50),
  },

  input: {
    flex: 1,
    color: appColors.white,
    fontSize: SF(14),
    marginLeft: SW(8),
    fontFamily: appFonts.NunitoRegular,
  },

  // ─── Submit button ────────────────────────────────────────────────────────────
  submitBtn: {
    backgroundColor: appColors.primary,
    borderRadius: SW(14),
    marginTop: SH(24),
    minHeight: SH(52),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  submitText: {
    color: appColors.white,
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(14),
  },

  // ─── Info text ────────────────────────────────────────────────────────────────
  infoText: {
    color: appColors.bodyColor,
    marginTop: SH(14),
    fontSize: SF(11),
    textAlign: 'center',
    fontFamily: appFonts.NunitoRegular,
    lineHeight: SF(17),
    paddingHorizontal: SW(8),
  },
});