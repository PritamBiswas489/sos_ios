import { StyleSheet } from 'react-native';
import appColors from '../../theme/appColors';
import appFonts from '../../theme/appFonts';
import { SH, SW, SF } from '../../theme/dimensions';

export default StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SW(12),
  },

  card: {
    width: '100%',
    maxWidth: SW(360),
    borderRadius: SW(14),
    overflow: 'hidden',
    backgroundColor: '#081528',
    borderWidth: 1,
    borderColor: 'rgba(143,163,200,0.35)',
  },

  header: {
    height: SH(44),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SW(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(143,163,200,0.2)',
  },

  title: {
    color: appColors.white,
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(14),
  },

  closeBtn: {
    width: SW(30),
    height: SW(30),
    borderRadius: SW(15),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  previewArea: {
    width: '100%',
    minHeight: SH(260),
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  imagePreview: {
    width: '100%',
    height: SH(320),
  },

  videoPreview: {
    width: '100%',
    height: SH(320),
    backgroundColor: '#000000',
  },

  audioPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SH(40),
    paddingHorizontal: SW(20),
  },

  audioIconBubble: {
    width: SW(80),
    height: SW(80),
    borderRadius: SW(40),
    backgroundColor: 'rgba(255, 59, 92, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SH(16),
  },

  audioFileName: {
    color: appColors.bodyColor,
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(12),
    textAlign: 'center',
    maxWidth: SW(240),
  },

  noPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SH(50),
  },

  noPreviewText: {
    color: appColors.bodyColor,
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(12),
    marginTop: SH(8),
  },

  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  uploadingText: {
    color: appColors.white,
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(12),
    marginTop: SH(10),
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SW(12),
    paddingVertical: SH(10),
    borderTopWidth: 1,
    borderTopColor: 'rgba(143,163,200,0.2)',
  },

  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SH(8),
    paddingHorizontal: SW(14),
    borderRadius: SW(10),
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },

  cancelBtnText: {
    color: '#FF6B6B',
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(13),
    marginLeft: SW(6),
  },

  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SH(8),
    paddingHorizontal: SW(20),
    borderRadius: SW(10),
    backgroundColor: '#FF3B5C',
  },

  sendBtnDisabled: {
    opacity: 0.5,
  },

  sendBtnText: {
    color: appColors.white,
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(13),
    marginLeft: SW(6),
  },
});
