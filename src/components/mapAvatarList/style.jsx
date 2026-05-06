import { StyleSheet } from 'react-native';
import appColors from '../../theme/appColors';
import appFonts from '../../theme/appFonts';
import { SH, SW, SF } from '../../theme/dimensions';

export default StyleSheet.create({
  /* CONTACT AVATARS */

  avatarRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SW(12),
    marginTop: SW(8),
    borderTopColor: appColors.secondary,
    borderTopWidth: 0.8,
    borderBottomColor: appColors.secondary,
    borderBottomWidth: 0.8,
    paddingVertical: SW(8),
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },

  refreshIconBtn: {
    width: SW(34),
    height: SW(34),
    borderRadius: SW(17),
    borderWidth: 1,
    borderColor: 'rgba(46, 213, 115, 0.35)',
    backgroundColor: 'rgba(46, 213, 115, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SW(8),
    marginRight: SW(2),
    shadowColor: '#2ED573',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },

  avatarRow: {
    flex: 1,
  },

  avatarRowContent: {
    paddingRight: SW(8),
    alignItems: 'stretch',
    gap: SW(6),
  },

  avatarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SW(6),
    minWidth: SW(142),
    maxWidth: SW(170),
    paddingVertical: SW(6),
    paddingHorizontal: SW(8),
    borderRadius: SW(16),
    borderWidth: 1,
    borderColor: 'rgba(143,163,200,0.24)',
    backgroundColor: 'rgba(15, 29, 52, 0.7)',
  },

  avatarItemSelected: {
    borderColor: 'rgba(77,163,255,0.85)',
    backgroundColor: 'rgba(77,163,255,0.14)',
  },

  avatarCircleWrap: {
    position: 'relative',
    marginRight: SW(8),
  },

  avatarCircle: {
    width: SW(38),
    height: SW(38),
    borderRadius: SW(19),
    borderWidth: SW(1.5),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    color: appColors.white,
  },
  onlineDot: {
    position: 'absolute',
    right: SW(0),
    bottom: SW(0),
    width: SW(9),
    height: SW(9),
    borderRadius: SW(4.5),
    backgroundColor: '#2ED573',
    borderWidth: 1.5,
    borderColor: '#0A1628',
  },
  avatarAdd: {
    width: SW(38),
    height: SW(38),
    borderRadius: SW(19),
    borderWidth: SW(1.5),
    borderColor: '#4DA3FF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4DA3FF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  avatarText: {
    color: appColors.white,
    fontFamily: appFonts.NunitoExtraBold,
    fontSize: SF(15),
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: SW(19),
  },

  avatarLabel: {
    color: appColors.white,
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(12),
    lineHeight: SF(14),
  },

  avatarMeta: {
    flex: 1,
    minWidth: 0,
  },

  avatarLabelSelected: {
    color: '#7EC0FF',
  },

  avatarPhoneNumber: {
    color: appColors.bodyColor,
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(10),
    marginTop: 2,
  },

  avatarPhoneSelected: {
    color: '#AFCBEF',
  },

  selectedDot: {
    width: SW(12),
    height: SW(12),
    borderRadius: SW(6),
    marginTop: SH(6),
    borderWidth: 2,
    borderColor: '#EAF2FF',
    backgroundColor: '#4DA3FF',
    shadowColor: '#4DA3FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
});
