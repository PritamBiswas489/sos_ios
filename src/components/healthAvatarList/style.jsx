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
    paddingTop: SW(12),
    paddingBottom: SW(12),
    marginTop: SW(8),
    borderTopColor: appColors.secondary,
    borderTopWidth: 0.8,
    borderBottomColor: appColors.secondary,
    borderBottomWidth: 0.8,
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
    minWidth: SW(138),
    maxWidth: SW(165),
    paddingVertical: SW(7),
    paddingHorizontal: SW(10),
    borderRadius: SW(18),
    borderWidth: 1.5,
    borderColor: 'rgba(143,163,200,0.25)',
    backgroundColor: 'rgba(15, 29, 52, 0.75)',
  },

  avatarItemSelected: {
    borderColor: 'rgba(77,163,255,0.85)',
    backgroundColor: 'rgba(77,163,255,0.14)',
  },

  avatarCircleWrap: {
    position: 'relative',
    marginRight: SW(9),
  },

  avatarCircle: {
    width: SW(36),
    height: SW(36),
    borderRadius: SW(18),
    borderWidth: SW(1.5),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
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
  streamingBadge: {
    position: 'absolute',
    left: SW(-3),
    top: SW(-3),
    width: SW(14),
    height: SW(14),
    borderRadius: SW(7),
    backgroundColor: '#6A4CFF',
    borderWidth: 1.5,
    borderColor: '#0A1628',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6A4CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 4,
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
    borderRadius: SW(18),
  },

  avatarLabel: {
    color: appColors.white,
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(12.5),
    lineHeight: SF(15),
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

  /* ME BUTTON */
  meBtnTouchable: {
    marginRight: SW(8),
  },
meBtnGradient: {
  flexDirection: 'row',         // ← was 'column'
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: SW(7),       // ← match avatarItem
  paddingHorizontal: SW(10),
  gap: SW(8),                   // ← space between avatar and "Me" text
  borderRadius: SW(18),         // ← match avatarItem (was SW(20))
  minWidth: SW(80),             // ← wider to match pill shape
  minHeight: 0,                 // ← remove tall fixed height
  shadowColor: '#1A6EFF',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.35,
  shadowRadius: 6,
  elevation: 4,
},
  meBtnCriticalGradient: {
  shadowColor: '#FF3366',
  shadowOpacity: 0.6,
  shadowRadius: 12,
  elevation: 8,
},
meBtnIdle: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: SW(7),
  paddingHorizontal: SW(10),
  borderRadius: SW(18),
  minWidth: SW(100),
  maxWidth: SW(120),
  borderWidth: 1.5,
  borderColor: 'rgba(143,163,200,0.25)',
  backgroundColor: 'rgba(15, 29, 52, 0.75)',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.15,
  shadowRadius: 2,
  elevation: 2,
},

 meBtnCriticalIdle: {
  borderColor: 'rgba(255,51,102,0.65)',
  backgroundColor: 'rgba(255,51,102,0.07)',
  shadowColor: '#FF3366',
  shadowOpacity: 0.4,
  shadowRadius: 6,
  elevation: 4,
},
meBtnAvatar: {
  width: SW(36),
  height: SW(36),
  borderRadius: SW(18),
  backgroundColor: 'rgba(255,255,255,0.25)',
  borderWidth: 1.5,
  borderColor: 'rgba(255,255,255,0.7)',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
},

meBtnAvatarIdle: {
  width: SW(36),
  height: SW(36),
  borderRadius: SW(18),
  backgroundColor: 'rgba(26,110,255,0.2)',
  borderWidth: 1.5,
  borderColor: 'rgba(26,110,255,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
},
 meBtnAvatarImg: {
  width: '100%',
  height: '100%',
  borderRadius: SW(18),
},
 meBtnAvatarInitial: {
  color: '#fff',
  fontSize: SF(15),
  fontFamily: appFonts.NunitoExtraBold,
},
meBtnAvatarInitialIdle: {
  color: '#4DA3FF',
  fontSize: SF(15),
  fontFamily: appFonts.NunitoExtraBold,
},
 meBtnTextActive: {
  color: appColors.white,
  fontFamily: appFonts.NunitoBold,
  fontSize: SF(12.5),
  lineHeight: SF(15),
},

meBtnTextIdle: {
  color: appColors.white,
  fontFamily: appFonts.NunitoBold,
  fontSize: SF(12.5),
  lineHeight: SF(15),
},
  meBtnActiveDot: {
    width: SW(5),
    height: SW(5),
    borderRadius: SW(2.5),
    backgroundColor: 'rgba(255,255,255,0.9)',
  },

  /* ME BUTTON — avatar wrapper (for badge positioning) */
meBtnAvatarWrap: {
  position: 'relative',
  marginRight: SW(9),
   
},
  /* STRESS EMOJI BADGE */
  emojiBadge: {
    position: 'absolute',
    top: SW(-2),
    right: SW(-2),
    width: SW(16),
    height: SW(16),
    borderRadius: SW(8),
    backgroundColor: '#0D1F3C',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
  emojiBadgeCritical: {
    borderWidth: 1.5,
    borderColor: '#FF3366',
    backgroundColor: 'rgba(255,51,102,0.3)',
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 6,
  },

  /* CRITICAL ITEM BORDER */
  avatarItemCritical: {
    borderColor: 'rgba(255,51,102,0.65)',
    backgroundColor: 'rgba(255,51,102,0.07)',
  },
});
