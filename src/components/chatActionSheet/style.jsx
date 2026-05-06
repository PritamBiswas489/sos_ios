import { StyleSheet } from 'react-native';
import appColors from '../../theme/appColors';
import appFonts from '../../theme/appFonts';
import { SW, SF } from '../../theme/dimensions';

export default StyleSheet.create({
  actionSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  actionSheetContainer: {
    backgroundColor: '#111A2F',
    borderTopLeftRadius: SW(18),
    borderTopRightRadius: SW(18),
    paddingHorizontal: SW(14),
    paddingTop: SW(12),
    paddingBottom: SW(22),
    borderTopColor: appColors.secondary,
    borderTopWidth: 1,
  },

  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SW(12),
    paddingHorizontal: SW(10),
    borderRadius: SW(10),
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginTop: SW(8),
  },

  actionText: {
    color: appColors.white,
    marginLeft: SW(10),
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(13),
  },

  cancelActionItem: {
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
  },

  cancelActionText: {
    color: '#FF6B6B',
    marginLeft: SW(10),
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(13),
  },
});
