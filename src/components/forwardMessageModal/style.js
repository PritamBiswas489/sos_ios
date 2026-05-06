import { StyleSheet } from 'react-native';
import appColors from '../../theme/appColors';
import appFonts from '../../theme/appFonts';
import { SH, SW, SF } from '../../theme/dimensions';

export default StyleSheet.create({
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
    height: '78%',
    borderTopWidth: 1,
    borderTopColor: appColors.secondary,
  },

  /* Header */
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

  /* Message preview strip */
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SW(20),
    marginTop: SH(12),
    backgroundColor: appColors.whiteBdrTransparent,
    borderRadius: SW(10),
    paddingHorizontal: SW(12),
    paddingVertical: SH(8),
    borderLeftWidth: 3,
    borderLeftColor: appColors.primary,
  },

  previewIcon: {
    marginRight: SW(6),
  },

  previewText: {
    flex: 1,
    color: appColors.bodyColor,
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(12),
    fontStyle: 'italic',
  },

  /* Search */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SW(20),
    marginTop: SH(12),
    marginBottom: SH(4),
    backgroundColor: appColors.secondary,
    borderRadius: SW(12),
    paddingHorizontal: SW(12),
    paddingVertical: SH(6),
    borderWidth: 1,
    borderColor: 'rgba(143, 163, 200, 0.15)',
  },

  searchIcon: {
    marginRight: SW(8),
  },

  searchInput: {
    flex: 1,
    color: appColors.white,
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(13),
    paddingVertical: SH(2),
  },

  /* List */
  list: {
    flex: 1,
    marginTop: SH(4),
  },

  listContent: {
    paddingHorizontal: SW(20),
    paddingBottom: SH(8),
  },

  /* Contact row */
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SH(10),
    borderBottomWidth: 1,
    borderBottomColor: appColors.secondary,
  },

  contactAvatar: {
    width: SW(40),
    height: SW(40),
    borderRadius: SW(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SW(12),
  },

  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: SW(10),
    height: SW(10),
    borderRadius: SW(5),
    borderWidth: 1.5,
    borderColor: '#0A1628',
  },

  contactAvatarText: {
    color: appColors.white,
    fontFamily: appFonts.NunitoExtraBold,
    fontSize: SF(15),
  },

  contactInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  contactName: {
    color: appColors.white,
    fontFamily: appFonts.NunitoSemiBold,
    fontSize: SF(14),
  },

  contactPhone: {
    color: appColors.bodyColor,
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(11),
    marginTop: SH(2),
  },

  checkbox: {
    width: SW(22),
    height: SW(22),
    borderRadius: SW(11),
    borderWidth: 1.5,
    borderColor: appColors.bodyColor,
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkboxSelected: {
    backgroundColor: appColors.primary,
    borderColor: appColors.primary,
  },

  /* Empty state */
  emptyWrapper: {
    alignItems: 'center',
    paddingVertical: SH(32),
  },

  emptyText: {
    color: appColors.bodyColor,
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(13),
    marginTop: SH(8),
  },

  /* Footer */
  footer: {
    paddingHorizontal: SW(20),
    paddingVertical: SH(14),
    borderTopWidth: 1,
    borderTopColor: appColors.secondary,
  },

  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.primary,
    borderRadius: SW(12),
    paddingVertical: SH(12),
  },

  sendBtnDisabled: {
    opacity: 0.4,
  },

  sendIcon: {
    marginRight: SW(8),
  },

  sendBtnText: {
    color: appColors.white,
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(14),
  },
});
