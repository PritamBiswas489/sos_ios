import { StyleSheet } from 'react-native';
import appColors from '../../theme/appColors';
import appFonts from '../../theme/appFonts';
import { SH, SW, SF } from '../../theme/dimensions';
import { TrustedContactService } from '../../services/trustedContact.service';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.DarkPrimary,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SW(18),
    paddingTop: SW(45),
    marginBottom: SW(20),
  },

  title: {
    color: appColors.white,
    fontSize: SF(22),
    fontFamily: appFonts.NunitoBold,
  },

  subtitle: {
    color: appColors.bodyColor,
    fontFamily: appFonts.NunitoSemiBold,
    fontSize: SF(12),
    marginTop: SW(4),
  },

  contactList: {
    flex: 1,
  },

  listLoaderWrap: {
    flex: 1,
    minHeight: SW(260),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SW(24),
  },

  listLoaderText: {
    color: appColors.bodyColor,
    fontSize: SF(13),
    fontFamily: appFonts.NunitoSemiBold,
    marginTop: SW(10),
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SW(32),
    paddingTop: SW(60),
    paddingBottom: SW(40),
  },

  emptyIconWrap: {
    width: SW(90),
    height: SW(90),
    borderRadius: SW(45),
    backgroundColor: appColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SW(20),
    borderWidth: 1,
    borderColor: appColors.whiteTransparent,
  },

  emptyTitle: {
    color: appColors.white,
    fontSize: SF(17),
    fontFamily: appFonts.NunitoBold,
    textAlign: 'center',
    marginBottom: SW(10),
  },

  emptySubtitle: {
    color: appColors.bodyColor,
    fontSize: SF(13),
    fontFamily: appFonts.NunitoSemiBold,
    textAlign: 'center',
    lineHeight: SF(20),
  },

  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SW(18),
    marginBottom: SW(12),
    backgroundColor: appColors.secondary,
    borderRadius: SW(12),
    padding: SW(4),
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SW(10),
    paddingVertical: SW(10),
    paddingHorizontal: SW(6),
  },

  activeTabButton: {
    backgroundColor: appColors.blue,
  },

  tabText: {
    color: appColors.bodyColor,
    fontFamily: appFonts.NunitoSemiBold,
    fontSize: SF(10),
    textAlign: 'center',
  },

  activeTabText: {
    color: appColors.white,
    fontFamily: appFonts.NunitoBold,
  },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SW(18),
    paddingVertical: SW(10),
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

  contactDetails: {
    color: appColors.bodyColor,
    fontSize: SF(12),
    marginTop: SW(3),
    fontFamily: appFonts.NunitoSemiBold,
  },
    contactRelation:{
    color: appColors.blue,
    fontSize: SF(11),
    marginTop: SW(2),
    fontFamily: appFonts.NunitoSemiBold,
  },

  statusDot: {
    width: SW(10),
    height: SW(10),
    borderRadius: SW(5),
    marginRight: SW(10),
  },

  actionContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    position: 'relative',
  },

  actionIconButton: {
    width: SW(30),
    height: SW(30),
    borderRadius: SW(15),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.secondary,
    marginLeft: SW(6),
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

  addBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: appColors.blue,
    marginHorizontal: SW(20),
    marginTop: SW(16),
    paddingVertical: SW(15),
    borderRadius: SW(12),
    alignItems: 'center',
  },

  addText: {
    color: appColors.blue,
    fontSize: SF(13),
    fontFamily: appFonts.NunitoSemiBold,
  },

  infoCard: {
    flexDirection: 'row',
    backgroundColor: appColors.secondary,
    marginHorizontal: SW(20),
    marginTop: SW(14),
    marginBottom: SW(20),
    padding: SW(15),
    borderRadius: SW(12),
  },

  infoText: {
    color: appColors.bodyColor,
    fontSize: SF(12),
    marginLeft: SW(8),
    flex: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    width: '85%',
    backgroundColor: appColors.DarkPrimary,
    borderRadius: SW(16),
    padding: SW(20),
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SW(15),
  },

  modalTitle: {
    color: appColors.white,
    fontSize: SF(18),
    fontFamily: appFonts.NunitoBold,
  },
 

  input: {
    backgroundColor: appColors.secondary,
    borderRadius: SW(10),
    paddingHorizontal: SW(15),
    paddingVertical: SW(12),
    color: appColors.white,
    marginBottom: SW(12),
  },

  saveBtn: {
    backgroundColor: appColors.blue,
    paddingVertical: SW(14),
    borderRadius: SW(10),
    alignItems: 'center',
  },

  saveText: {
    color: appColors.white,
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(14),
  },
});

export default styles;
