import { StyleSheet } from 'react-native';
import appColors from '../../theme/appColors';
import appFonts from '../../theme/appFonts';
import { SH, SW, SF } from '../../theme/dimensions';

export default StyleSheet.create({
  typingIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SW(16),
    paddingVertical: SH(6),
  },

  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SW(6),
  },

  typingDot: {
    width: SW(6),
    height: SW(6),
    borderRadius: SW(3),
    backgroundColor: appColors.bodyColor,
    marginHorizontal: SW(2),
    opacity: 0.6,
  },

  typingDotOne: {},
  typingDotTwo: {},
  typingDotThree: {},

  typingIndicatorText: {
    color: appColors.bodyColor,
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(11),
    fontStyle: 'italic',
  },

  previewWrapper: {
    marginHorizontal: SW(12),
    marginBottom: SW(8),
    borderWidth: 1,
    borderColor: appColors.secondary,
    backgroundColor: appColors.primaryAA,
    borderRadius: SW(12),
    padding: SW(10),
    flexDirection: 'row',
    alignItems: 'center',
  },

  previewImageContainer: {
    position: 'relative',
  },

  previewImage: {
    width: SW(52),
    height: SW(52),
    borderRadius: SW(10),
    backgroundColor: appColors.secondary,
  },

  previewImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: SW(10),
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  previewMetaContainer: {
    flex: 1,
    marginHorizontal: SW(10),
  },

  previewTitle: {
    color: appColors.white,
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(12),
  },

  previewSubtitle: {
    color: appColors.bodyColor,
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(10),
    marginTop: SH(2),
  },

  previewRemoveBtn: {
    width: SW(28),
    height: SW(28),
    borderRadius: SW(14),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appColors.secondary,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SW(12),
    marginBottom: SW(10),
    paddingHorizontal: 0,
    borderTopColor: appColors.secondary,
    borderTopWidth: 1,
    borderBottomColor: appColors.secondary,
    borderBottomWidth: 1,
    paddingVertical: SW(10),
  },

  inputField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: appColors.primaryAA,
    borderRadius: SW(20),
    minHeight: SW(48),
    maxHeight: SW(130),
    paddingHorizontal: SW(6),
    paddingVertical: SW(6),
  },

  micBtn: {
    width: SW(34),
    height: SW(34),
    borderRadius: SW(17),
    backgroundColor: appColors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SW(6),
  },

  input: {
    flex: 1,
    color: '#fff',
    paddingHorizontal: SW(8),
    paddingTop: SW(8),
    paddingBottom: SW(8),
    minHeight: SW(34),
    maxHeight: SW(118),
  },

  sendBtn: {
    backgroundColor: appColors.primary,
    width: SW(34),
    height: SW(34),
    borderRadius: SW(17),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SW(6),
  },

  sendBtnDisabled: {
    opacity: 0.7,
  },

  recordingBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 92, 0.08)',
    borderRadius: SW(20),
    minHeight: SW(48),
    paddingHorizontal: SW(12),
    paddingVertical: SW(6),
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 92, 0.25)',
  },

  recordingPulse: {
    width: SW(36),
    height: SW(36),
    borderRadius: SW(18),
    backgroundColor: 'rgba(255, 59, 92, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  recordingInfo: {
    flex: 1,
    marginLeft: SW(10),
  },

  recordingLabel: {
    color: '#FF3B5C',
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(12),
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  recordingTimer: {
    color: appColors.white,
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(16),
    marginTop: SH(1),
  },

  recordingCancelBtn: {
    width: SW(36),
    height: SW(36),
    borderRadius: SW(18),
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SW(8),
  },

  recordingStopBtn: {
    width: SW(36),
    height: SW(36),
    borderRadius: SW(18),
    backgroundColor: '#FF3B5C',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
