import { StyleSheet } from 'react-native';
import appColors from '../../theme/appColors';
import appFonts from '../../theme/appFonts';
import { SH, SW, SF } from '../../theme/dimensions';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.DarkPrimary,
  },

  content: {
    paddingHorizontal: SW(18),
    paddingTop: SH(18),
    paddingBottom: SH(28),
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SH(20),
  },

  backButton: {
    width: SW(36),
    height: SW(36),
    borderRadius: SW(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.whiteTransparent,
    borderWidth: 1,
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
    fontSize: SF(11),
    marginTop: SH(2),
  },

  card: {
    backgroundColor: appColors.whiteTransparent,
    borderWidth: 1,
    borderColor: appColors.whiteBdrTransparent,
    borderRadius: SW(16),
    paddingHorizontal: SW(14),
    paddingVertical: SH(16),
  },

  avatarSection: {
    alignItems: 'center',
    marginBottom: SH(16),
  },

  avatarWrap: {
    width: SW(96),
    height: SW(96),
    borderRadius: SW(48),
    borderWidth: 2,
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

  uploadHint: {
    color: appColors.bodyColor,
    fontSize: SF(11),
    fontFamily: appFonts.NunitoSemiBold,
    marginTop: SH(8),
  },

  uploadButton: {
    marginTop: SH(10),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SW(12),
    paddingVertical: SH(8),
    borderRadius: SW(20),
    backgroundColor: '#2F6BFF1A',
    borderWidth: 1,
    borderColor: '#2F6BFF55',
  },

  uploadButtonText: {
    color: '#4DA3FF',
    marginLeft: SW(6),
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(12),
  },

  label: {
    color: appColors.bodyColor,
    fontSize: SF(11),
    fontFamily: appFonts.NunitoSemiBold,
    marginTop: SH(14),
    marginBottom: SH(6),
  },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: appColors.primary,
    borderRadius: SW(14),
    backgroundColor: appColors.primaryAA,
    paddingHorizontal: SW(12),
    minHeight: SH(48),
  },

  input: {
    flex: 1,
    color: appColors.white,
    fontSize: SF(14),
    marginLeft: SW(8),
    fontFamily: appFonts.NunitoRegular,
  },

  submitBtn: {
    backgroundColor: appColors.primary,
    borderRadius: SW(16),
    marginTop: SH(22),
    minHeight: SH(50),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  submitText: {
    color: appColors.white,
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(14),
  },

  infoText: {
    color: appColors.bodyColor,
    marginTop: SH(14),
    fontSize: SF(11),
    textAlign: 'center',
    fontFamily: appFonts.NunitoRegular,
  },
});
