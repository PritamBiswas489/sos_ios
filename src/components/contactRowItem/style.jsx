import { StyleSheet } from 'react-native';
import appColors from '../../theme/appColors';
import appFonts from '../../theme/appFonts';
import { SW, SF } from '../../theme/dimensions';

export default StyleSheet.create({
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SW(18),
    paddingVertical: SW(12),
    borderBottomWidth: 1,
    borderBottomColor: appColors.whiteTransparent,
  },

  avatar: {
    width: SW(42),
    height: SW(42),
    borderRadius: SW(21),
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    color: appColors.white,
    fontFamily: appFonts.NunitoExtraBold,
    fontSize: SF(16),
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: SW(21),
  },

  contactInfo: {
    flex: 1,
    marginLeft: SW(12),
  },

  contactName: {
    color: appColors.white,
    fontSize: SF(15),
    fontFamily: appFonts.NunitoBold,
  },

  contactRelation: {
    color: appColors.blue,
    fontSize: SF(11),
    marginTop: SW(2),
    fontFamily: appFonts.NunitoSemiBold,
  },

  contactDetails: {
    color: appColors.bodyColor,
    fontSize: SF(12),
    marginTop: SW(3),
    fontFamily: appFonts.NunitoSemiBold,
  },

  actionContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    position: 'relative',
  },

  kebabButton: {
    width: SW(32),
    height: SW(32),
    borderRadius: SW(16),
    alignItems: 'center',
    justifyContent: 'center',
  },

  dropdownMenu: {
    position: 'absolute',
    right: SW(0),
    top: SW(34),
    backgroundColor: '#1E2A3A',
    borderRadius: SW(10),
    borderWidth: 1,
    borderColor: '#2A3A50',
    paddingVertical: SW(4),
    minWidth: SW(130),
    zIndex: 999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },

  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SW(10),
    paddingHorizontal: SW(14),
    gap: SW(10),
  },

  dropdownItemText: {
    fontSize: SW(13),
    fontWeight: '500',
  },
});
