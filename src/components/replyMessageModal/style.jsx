import { StyleSheet } from 'react-native';
import appColors from '../../theme/appColors';
import appFonts from '../../theme/appFonts';
import { SH, SW, SF } from '../../theme/dimensions';

export default StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
  },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 11, 27, 0.82)',
    justifyContent: 'flex-end',
  },

  sheet: {
    backgroundColor: '#0A1628',
    borderTopLeftRadius: SW(20),
    borderTopRightRadius: SW(20),
    paddingTop: SH(6),
    minHeight: '38%',
    borderTopWidth: 1,
    borderTopColor: appColors.secondary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SW(20),
    paddingVertical: SH(14),
    borderBottomWidth: 1,
    borderBottomColor: appColors.secondary,
  },

  headerTitle: {
    color: appColors.white,
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(16),
  },

  closeBtn: {
    width: SW(32),
    height: SW(32),
    borderRadius: SW(16),
    backgroundColor: 'rgba(143, 163, 200, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  previewBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: SW(20),
    marginTop: SH(16),
    backgroundColor: appColors.whiteBdrTransparent,
    borderRadius: SW(12),
    paddingHorizontal: SW(14),
    paddingVertical: SH(12),
    borderLeftWidth: 3,
    borderLeftColor: appColors.primary,
  },

  previewBadge: {
    width: SW(34),
    height: SW(34),
    borderRadius: SW(17),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(143, 163, 200, 0.14)',
    marginRight: SW(10),
  },

  previewTextBlock: {
    flex: 1,
  },

  previewTitle: {
    color: appColors.white,
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(13),
  },

  previewText: {
    color: appColors.bodyColor,
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(12),
    marginTop: SH(4),
    lineHeight: SF(17),
  },

  composerWrap: {
    marginTop: SH(10),
    paddingBottom: SH(12),
  },
});