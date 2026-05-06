import { StyleSheet } from 'react-native';
import appColors from '../../theme/appColors';
import appFonts from '../../theme/appFonts';
import { SH, SW, SF } from '../../theme/dimensions';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020B1B',
  },

  chatScroll: {
    flex: 1,
  },

  chatContent: {
    paddingBottom: SW(10),
    paddingHorizontal: SW(6),
    paddingTop: SH(6),
  },

  chatContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SW(24),
  },

  emptyStateWrapper: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: appColors.secondary,
    borderRadius: SW(16),
    paddingVertical: SH(24),
    paddingHorizontal: SW(18),
  },

  emptyStateIconCircle: {
    width: SW(60),
    height: SW(60),
    borderRadius: SW(30),
    backgroundColor: 'rgba(143, 163, 200, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SH(12),
  },

  emptyStateTitle: {
    color: appColors.white,
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(16),
    marginBottom: SH(8),
  },

  emptyStateSubtitle: {
    color: appColors.bodyColor,
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(12),
    textAlign: 'center',
    lineHeight: SF(18),
  },

  historyLoaderScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SW(24),
  },

  historyLoaderCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: appColors.secondary,
    borderRadius: SW(16),
    paddingVertical: SH(24),
    paddingHorizontal: SW(20),
    minWidth: SW(220),
  },

  historyLoaderTitle: {
    color: appColors.white,
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(15),
    marginTop: SH(12),
  },

  historyLoaderSubtitle: {
    color: appColors.bodyColor,
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(11),
    marginTop: SH(4),
    textAlign: 'center',
  },

  historyLoaderInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SH(14),
    marginBottom: SH(2),
  },

  historyLoaderInlineText: {
    color: appColors.bodyColor,
    fontFamily: appFonts.NunitoSemiBold,
    fontSize: SF(11),
    marginLeft: SW(8),
  },

  /* HEADER */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  headerCenter: {
    flex: 1,
    marginLeft: 10,
  },

  title: {
    color: '#fff',
    fontSize: SF(18),
    fontFamily: appFonts.NunitoBold,
  },

  subtitle: {
    color: appColors.bodyColor,
    fontSize: SF(11),
  },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: appColors.green,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: appColors.green,
    marginRight: 6,
  },

  liveText: {
    color: appColors.green,
    fontSize: SF(11),
  },

  /* CONTACT AVATARS */

  avatarRowContainer: {
    paddingHorizontal: SW(18),
    marginTop: SW(18),
    borderTopColor: appColors.secondary,
    borderTopWidth: 1,
    borderBottomColor: appColors.secondary,
    borderBottomWidth: 1,
    paddingVertical: SW(10),
  },

  avatarRow: {
    flexGrow: 0,
  },

  avatarRowContent: {
    paddingRight: SW(12),
    alignItems: 'center',
  },

  avatarItem: {
    alignItems: 'center',
    marginRight: SW(12),
  },

  avatarCircle: {
    width: SW(40),
    height: SW(40),
    borderRadius: SW(20),
    borderWidth: SW(1.5),
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarAdd: {
    width: SW(40),
    height: SW(40),
    borderRadius: SW(20),
    borderWidth: SW(1.5),
    borderColor: '#4DA3FF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    color: appColors.white,
    fontFamily: appFonts.NunitoExtraBold,
  },

  avatarLabel: {
    color: appColors.bodyColor,
    fontFamily: appFonts.NunitoExtraBold,
    fontSize: SF(11),
    marginTop: 4,
  },

  selectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },

  /* DAY */

  dayLabel: {
    textAlign: 'center',
    color: '#8DA3B8',
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(9),
    marginTop: SH(12),
    marginBottom: SH(6),
    alignSelf: 'center',
    backgroundColor: 'rgba(138, 162, 190, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(138, 162, 190, 0.22)',
    borderRadius: SW(10),
    paddingHorizontal: SW(10),
    paddingVertical: SH(3),
    overflow: 'hidden',
  },

  /* SOS ALERT */

  sosContainer: {
    alignItems: 'flex-end',
    marginHorizontal: SW(20),
    marginTop: SW(12),
  },

  sosCard: {
    backgroundColor: appColors.primaryAA,
    borderRadius: 14,
    padding: 14,
    maxWidth: '85%',
  },

  sosBadge: {
    backgroundColor: appColors.primary,
    paddingHorizontal: SW(7),
    paddingVertical: SW(3),
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 5,
  },

  sosBadgeText: {
    color: appColors.white,
    fontSize: SF(10),
    fontFamily: appFonts.NunitoBold,
  },

  sosMessage: {
    color: appColors.white,
    fontSize: SF(13),
  },

  sosTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginRight: SW(20),
    marginTop: SW(6),
  },

  sosTimeText: {
    color: appColors.bodyColor,
    fontSize: SF(10),
    fontFamily: appFonts.NunitoRegular,
    marginRight: SW(8),
  },

  /* GPS CARD */

  locationContainer: {
    alignItems: 'flex-end',
    marginHorizontal: SW(20),
    marginTop: SW(6),
  },

  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColors.whiteBdrTransparent,
    padding: SW(8),
    borderRadius: SW(10),
  },

  locationText: {
    color: appColors.bodyColor,
    fontSize: SF(11),
    marginLeft: SF(5),
  },

  /* MESSAGE LEFT */

  bubbleLeftWrapper: {
    marginTop: SH(8),
    marginLeft: SW(8),
  },

  messageFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SH(4),
  },

  timeLeftInline: {
    color: '#8BA0B3',
    fontSize: SF(9),
    fontFamily: appFonts.NunitoRegular,
    marginLeft: SW(6),
  },

  messageRowLeft: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  bubbleLeft: {
    backgroundColor: '#1E2A33',
    paddingHorizontal: SW(11),
    paddingVertical: SH(8),
    borderRadius: SW(16),
    borderTopLeftRadius: SW(6),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    maxWidth: '82%',
  },

  bubbleMediaOnly: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },

  messageActionsRow: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  messageActionsRowLeft: {
    marginLeft: SW(8),
    marginBottom: SW(2),
  },

  messageActionsRowRight: {
    marginRight: SW(8),
    marginBottom: SW(2),
  },

  messageActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: SW(24),
    height: SW(24),
    borderRadius: SW(12),
    backgroundColor: 'rgba(143, 163, 200, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(143, 163, 200, 0.18)',
  },

  messageActionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },

  messageActionModalSheet: {
    backgroundColor: '#101C28',
    borderTopLeftRadius: SW(20),
    borderTopRightRadius: SW(20),
    paddingBottom: SH(28),
    paddingTop: SH(10),
    paddingHorizontal: SW(16),
    borderTopWidth: 1,
    borderColor: 'rgba(143, 163, 200, 0.18)',
  },

  messageActionModalHandle: {
    width: SW(36),
    height: SW(4),
    borderRadius: SW(2),
    backgroundColor: 'rgba(143, 163, 200, 0.35)',
    alignSelf: 'center',
    marginBottom: SH(16),
  },

  messageActionModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SH(14),
    paddingHorizontal: SW(8),
  },

  messageActionModalIconWrap: {
    width: SW(36),
    height: SW(36),
    borderRadius: SW(18),
    backgroundColor: 'rgba(96, 166, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SW(14),
  },

  messageActionModalText: {
    color: '#E5EDF4',
    fontSize: SF(15),
    fontFamily: appFonts.NunitoSemiBold,
  },

  messageActionModalDivider: {
    height: 1,
    backgroundColor: 'rgba(143, 163, 200, 0.12)',
    marginHorizontal: SW(4),
  },

  messageActionModalCancelItem: {
    justifyContent: 'center',
    marginTop: SH(6),
  },

  messageActionModalCancelText: {
    color: appColors.bodyColor,
    fontSize: SF(14),
    fontFamily: appFonts.NunitoRegular,
    textAlign: 'center',
    flex: 1,
  },

  messageText: {
    color: '#E9EDF1',
    fontSize: SF(12),
    lineHeight: SF(17),
    fontFamily: appFonts.NunitoRegular,
  },

  replyPreviewBox: {
    borderLeftWidth: 2.5,
    borderRadius: SW(8),
    paddingVertical: SH(6),
    paddingHorizontal: SW(8),
    marginBottom: SW(6),
  },

  replyPreviewBoxLeft: {
    borderLeftColor: '#7FB4E8',
    backgroundColor: 'rgba(127, 180, 232, 0.13)',
  },

  replyPreviewBoxRight: {
    borderLeftColor: '#89D7C7',
    backgroundColor: 'rgba(137, 215, 199, 0.12)',
  },

  replyPreviewTitle: {
    color: '#D7E3FF',
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(10),
    marginBottom: SH(2),
  },

  replyPreviewText: {
    color: appColors.white,
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(11),
    lineHeight: SF(15),
  },

  avatarSmallRed: {
    width: SW(25),
    height: SW(25),
    borderRadius: SW(25),
    backgroundColor: '#FF3B5C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SW(5),
  },

  avatarSmallBlue: {
    width: SW(25),
    height: SW(25),
    borderRadius: SW(25),
    backgroundColor: appColors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SW(5),
  },

  avatarSmallText: {
    color: appColors.white,
    fontSize: SF(10),
  },

  /* MESSAGE RIGHT */

  messageRowRight: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginTop: SH(8),
    marginRight: SW(8),
  },

  bubbleRight: {
    backgroundColor: '#045C4B',
    paddingHorizontal: SW(11),
    paddingVertical: SH(8),
    borderRadius: SW(16),
    borderTopRightRadius: SW(6),
    borderWidth: 1,
    borderColor: 'rgba(125, 221, 197, 0.22)',
    maxWidth: '82%',
  },

  avatarSmallPink: {
    width: SW(25),
    height: SW(25),
    borderRadius: SW(25),
    backgroundColor: appColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },

  /* TIMES */

  timeLeft: {
    color: appColors.bodyColor,
    fontSize: SF(10),
    marginLeft: SW(48),
    marginTop: 4,
  },

  timeRight: {
    color: '#A8C9C1',
    fontSize: SF(9),
    textAlign: 'right',
    marginRight: SW(48),
    marginTop: SH(3),
  },

  messageStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginRight: SW(48),
    marginTop: SH(1),
  },

  /* MEDIA BUBBLES */

  mediaBubbleImage: {
    width: SW(210),
    height: SW(165),
    borderRadius: SW(12),
    marginBottom: SW(6),
    backgroundColor: appColors.secondary,
  },

  mediaBubbleVideo: {
    width: SW(210),
    height: SW(128),
    borderRadius: SW(12),
    marginBottom: SW(6),
    backgroundColor: '#1D2E3D',
    borderWidth: 1,
    borderColor: 'rgba(155, 190, 219, 0.22)',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SH(10),
    paddingHorizontal: SW(10),
  },

  mediaBubbleMetaRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },

  mediaTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SW(12),
    backgroundColor: 'rgba(63, 111, 146, 0.50)',
    borderWidth: 1,
    borderColor: 'rgba(196, 223, 246, 0.34)',
    paddingHorizontal: SW(8),
    paddingVertical: SH(3),
  },

  mediaTypePillText: {
    color: '#E7F4FF',
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(9),
    marginLeft: SW(4),
    letterSpacing: 0.4,
  },

  mediaBubblePlayBtn: {
    width: SW(54),
    height: SW(54),
    borderRadius: SW(27),
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  mediaBubbleAudio: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D2E3D',
    borderRadius: SW(10),
    borderWidth: 1,
    borderColor: 'rgba(155, 190, 219, 0.22)',
    paddingVertical: SW(10),
    paddingHorizontal: SW(10),
    marginBottom: SW(6),
    minWidth: SW(190),
  },

  mediaAudioIconWrap: {
    width: SW(34),
    height: SW(34),
    borderRadius: SW(17),
    backgroundColor: 'rgba(110, 173, 223, 0.34)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  mediaAudioContent: {
    flex: 1,
    marginHorizontal: SW(10),
  },

  mediaAudioWaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SH(4),
  },

  mediaAudioWaveBarShort: {
    width: SW(3),
    height: SH(5),
    borderRadius: SW(2),
    backgroundColor: 'rgba(215, 236, 252, 0.72)',
    marginRight: SW(2),
  },

  mediaAudioWaveBarMedium: {
    width: SW(3),
    height: SH(8),
    borderRadius: SW(2),
    backgroundColor: 'rgba(215, 236, 252, 0.82)',
    marginRight: SW(2),
  },

  mediaAudioWaveBarTall: {
    width: SW(3),
    height: SH(11),
    borderRadius: SW(2),
    backgroundColor: '#E6F5FF',
    marginRight: SW(2),
  },

  mediaBubbleDocument: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B2B39',
    borderRadius: SW(10),
    paddingVertical: SW(10),
    paddingHorizontal: SW(12),
    marginBottom: SW(6),
    minWidth: SW(140),
  },

  mediaBubbleLabel: {
    color: '#EAF4FD',
    fontFamily: appFonts.NunitoSemiBold,
    fontSize: SF(12),
  },

  mediaBubbleSubLabel: {
    color: '#9BB4C8',
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(9),
    marginTop: SH(1),
  },

  mediaBubbleCompact: {
    marginBottom: 0,
  },

  locationMessageCard: {
    borderRadius: SW(10),
    padding: SW(10),
    marginBottom: SW(6),
    borderWidth: 1,
  },

  locationMessageCardLeft: {
    backgroundColor: 'rgba(127, 180, 232, 0.10)',
    borderColor: 'rgba(127, 180, 232, 0.28)',
  },

  locationMessageCardRight: {
    backgroundColor: 'rgba(95, 206, 176, 0.12)',
    borderColor: 'rgba(95, 206, 176, 0.30)',
  },

  locationMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  locationPinBadge: {
    width: SW(26),
    height: SW(26),
    borderRadius: SW(13),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appColors.primary,
    marginRight: SW(8),
  },

  locationMessageHeaderTextBlock: {
    flex: 1,
  },

  locationMessageTitle: {
    color: appColors.white,
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(12),
  },

  locationMessageSubtitle: {
    color: appColors.bodyColor,
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(10),
    marginTop: SH(1),
  },

  locationCoordsRow: {
    marginTop: SH(8),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: SW(8),
    paddingVertical: SH(5),
    paddingHorizontal: SW(8),
  },

  locationCoordsLabel: {
    color: appColors.bodyColor,
    fontFamily: appFonts.NunitoExtraBold,
    fontSize: SF(9),
  },

  locationCoordsLabelSpacing: {
    marginLeft: SW(10),
  },

  locationCoordsValue: {
    color: appColors.white,
    fontFamily: appFonts.NunitoSemiBold,
    fontSize: SF(10),
    marginLeft: SW(4),
  },

  scrollToBottomBtn: {
    position: 'absolute',
    right: SW(16),
    bottom: SW(88),
    width: SW(38),
    height: SW(38),
    borderRadius: SW(19),
    backgroundColor: '#22A884',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 20,
  },

});
