import { StyleSheet } from 'react-native';
import appColors from '../../theme/appColors';
import appFonts from '../../theme/appFonts';
import { SH, SW, SF } from '../../theme/dimensions';

export default StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: appColors.DarkPrimary,
  },

  // ── Header ─────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SW(14),
    paddingTop: SW(45),
    paddingBottom: SW(12),
    gap: SW(10),
  },

  backBtn: {
    width: SW(34),
    height: SW(34),
    borderRadius: SW(17),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appColors.secondary,
  },

  headerAvatarWrap: {
    position: 'relative',
  },

  headerAvatar: {
    width: SW(44),
    height: SW(44),
    borderRadius: SW(22),
    borderWidth: 2,
    borderColor: appColors.secondary,
  },

  headerAvatarFallback: {
    width: SW(44),
    height: SW(44),
    borderRadius: SW(22),
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerAvatarInitial: {
    fontSize: SF(18),
    fontFamily: appFonts.NunitoBold,
    color: '#ffffff',
  },

  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: SW(12),
    height: SW(12),
    borderRadius: SW(6),
    borderWidth: 2,
    borderColor: appColors.DarkPrimary,
  },

  headerInfo: {
    flex: 1,
  },

  headerName: {
    fontSize: SF(16),
    fontFamily: appFonts.NunitoBold,
    color: appColors.white,
  },

  headerSub: {
    fontSize: SF(11),
    fontFamily: appFonts.NunitoSemiBold,
    color: appColors.bodyColor,
    marginTop: SH(2),
  },

  // ── Audio status bar (professional Connect / Disconnect control) ──────
  audioBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SW(14),
    marginBottom: SW(10),
    backgroundColor: '#111A2F',
    borderRadius: SW(14),
    borderWidth: 1,
    borderColor: '#1C2942',
    paddingVertical: SW(10),
    paddingHorizontal: SW(12),
    gap: SW(10),
  },

  audioIconWrap: {
    width: SW(36),
    height: SW(36),
    borderRadius: SW(18),
    justifyContent: 'center',
    alignItems: 'center',
  },

  audioInfo: {
    flex: 1,
  },

  audioLabel: {
    fontSize: SF(13),
    fontFamily: appFonts.NunitoBold,
    color: appColors.white,
  },

  audioSubLabel: {
    fontSize: SF(10.5),
    fontFamily: appFonts.NunitoRegular,
    color: appColors.bodyColor,
    marginTop: SH(1),
  },

  audioActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SW(6),
    borderRadius: SW(20),
    paddingHorizontal: SW(14),
    paddingVertical: SW(9),
  },

  audioActionBtnConnect: {
    backgroundColor: '#2ED573',
  },

  audioActionBtnDisconnect: {
    backgroundColor: 'rgba(255,59,92,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,92,0.4)',
  },

  audioActionBtnConnecting: {
    backgroundColor: 'rgba(124,111,247,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(124,111,247,0.4)',
  },

  audioActionText: {
    fontSize: SF(11.5),
    fontFamily: appFonts.NunitoBold,
    letterSpacing: 0.4,
  },

  hiddenRtc: {
    position: 'absolute',
    width: 1,
    height: 1,
    top: -100,
    left: -100,
    opacity: 0,
  },

  // ── MAIN SCREEN: live location map (now the primary content area) ──────
  mapContainer: {
    flex: 1,
    position: 'relative',
    marginHorizontal: SW(14),
    marginBottom: SW(14),
    borderRadius: SW(20),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.18)',
    backgroundColor: '#0E1A33',
  },

  mainMap: {
    ...StyleSheet.absoluteFillObject,
  },

  userPulseOuter: {
    width: SW(38),
    height: SW(38),
    borderRadius: SW(19),
    backgroundColor: 'rgba(77, 163, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(77, 163, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  userDotOuter: {
    width: SW(18),
    height: SW(18),
    borderRadius: SW(9),
    backgroundColor: '#4DA3FF',
    borderWidth: 2.5,
    borderColor: '#ffffff',
  },

  expandedMarkerWrapper: {
    alignItems: 'center',
  },

  expandedMarkerPin: {
    width: SW(34),
    height: SW(34),
    borderRadius: SW(17),
    backgroundColor: '#FF3B5C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },

  expandedMarkerText: {
    color: '#ffffff',
    fontSize: SF(14),
    fontFamily: appFonts.NunitoBold,
  },

  expandedMarkerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FF3B5C',
    marginTop: -2,
  },

  // Route info badge (top of the map)
  routeInfoBadge: {
    position: 'absolute',
    top: SW(14),
    left: SW(14),
    right: SW(68),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E1A33',
    paddingVertical: SW(9),
    paddingHorizontal: SW(14),
    borderRadius: 20,
    gap: SW(6),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.18)',
  },

  routeInfoText: {
    color: '#4DA3FF',
    fontSize: SF(13),
    fontFamily: appFonts.NunitoBold,
  },

  routeInfoSub: {
    color: '#7A8499',
    fontSize: SF(12),
    fontFamily: appFonts.NunitoRegular,
  },

  routeInfoDivider: {
    width: 1,
    height: SW(14),
    backgroundColor: 'rgba(164,176,190,0.25)',
    marginHorizontal: SW(2),
  },

  mapWaitingBadge: {
    position: 'absolute',
    top: SW(14),
    left: SW(14),
    right: SW(68),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SW(6),
    backgroundColor: '#0E1A33',
    paddingVertical: SW(9),
    paddingHorizontal: SW(14),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(122,132,153,0.2)',
  },

  mapWaitingText: {
    color: '#7A8499',
    fontSize: SF(12),
    fontFamily: appFonts.NunitoSemiBold,
  },

  // Travel mode + recenter (top-right stack, on top of the map)
  travelModeBtn: {
    position: 'absolute',
    top: SW(14),
    right: SW(14),
    width: SW(44),
    height: SW(44),
    borderRadius: SW(22),
    backgroundColor: '#0E1A33',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.3)',
    elevation: 8,
  },

  travelModeBtnActive: {
    backgroundColor: '#4DA3FF',
    borderColor: '#4DA3FF',
  },

  recenterBtn: {
    position: 'absolute',
    top: SW(66),
    right: SW(14),
    width: SW(44),
    height: SW(44),
    borderRadius: SW(22),
    backgroundColor: '#0E1A33',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.3)',
    elevation: 8,
  },

  mapStatusOverlay: {
    position: 'absolute',
    left: SW(14),
    bottom: SW(14),
    maxWidth: '62%',
    backgroundColor: 'rgba(11,22,41,0.9)',
    borderRadius: SW(14),
    paddingHorizontal: SW(12),
    paddingVertical: SW(8),
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.15)',
  },

  mapStatusName: {
    fontSize: SF(12.5),
    fontFamily: appFonts.NunitoBold,
    color: appColors.white,
  },

  mapStatusSub: {
    fontSize: SF(10.5),
    fontFamily: appFonts.NunitoRegular,
    color: appColors.bodyColor,
    marginTop: SH(1),
  },

  // ── Floating vitals card (heart rate + stress) ──────────────────────────
  vitalsCard: {
    position: 'absolute',
    right: SW(14),
    bottom: SW(246),
    width: SW(126),
    borderRadius: SW(16),
    borderWidth: 1,
    borderColor: 'rgba(255,59,92,0.22)',
    backgroundColor: '#111A2F',
    paddingVertical: SW(10),
    paddingHorizontal: SW(11),
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },

  vitalsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SW(5),
    marginBottom: SW(6),
  },

  vitalsLabel: {
    flex: 1,
    fontSize: SF(10),
    fontFamily: appFonts.NunitoSemiBold,
    color: '#8A93A6',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  vitalsExpandIcon: {
    opacity: 0.8,
  },

  vitalsBpmRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SW(4),
    marginBottom: SW(8),
  },

  vitalsBpmValue: {
    fontSize: SF(24),
    fontFamily: appFonts.NunitoBold,
    color: appColors.white,
    lineHeight: SF(26),
  },

  vitalsBpmUnit: {
    fontSize: SF(11),
    fontFamily: appFonts.NunitoRegular,
    color: '#5a6478',
    marginBottom: SH(2),
  },

  vitalsStressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SW(5),
    borderWidth: 1,
    borderRadius: SW(20),
    paddingHorizontal: SW(8),
    paddingVertical: SW(4),
    alignSelf: 'flex-start',
  },

  vitalsStressDot: {
    width: SW(20),
    height: SW(20),
    borderRadius: SW(3),
  },

  vitalsStressText: {
    fontSize: SF(9.5),
    fontFamily: appFonts.NunitoBold,
  },

  // ── Floating "chat" card (small floating screen → opens Chat modal) ────
  miniChatCard: {
    position: 'absolute',
    right: SW(14),
    bottom: SW(96),
    width: SW(126),
    height: SW(140),
    borderRadius: SW(18),
    borderWidth: 2,
    borderColor: 'rgba(46,213,115,0.3)',
    backgroundColor: '#111A2F',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SW(10),
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },

  miniChatAvatarWrap: {
    position: 'relative',
    marginBottom: SW(8),
  },

  miniChatAvatar: {
    width: SW(52),
    height: SW(52),
    borderRadius: SW(26),
    borderWidth: 2,
    borderColor: appColors.secondary,
  },

  miniChatAvatarFallback: {
    width: SW(52),
    height: SW(52),
    borderRadius: SW(26),
    justifyContent: 'center',
    alignItems: 'center',
  },

  miniChatAvatarInitial: {
    fontSize: SF(20),
    fontFamily: appFonts.NunitoBold,
    color: '#ffffff',
  },

  miniChatIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: SW(20),
    height: SW(20),
    borderRadius: SW(10),
    backgroundColor: '#2ED573',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#111A2F',
  },

  miniChatLiveDot: {
    position: 'absolute',
    top: -1,
    left: -1,
    width: SW(11),
    height: SW(11),
    borderRadius: SW(5.5),
    backgroundColor: '#2ED573',
    borderWidth: 1.5,
    borderColor: '#111A2F',
  },

  miniChatLabel: {
    fontSize: SF(12.5),
    fontFamily: appFonts.NunitoBold,
    color: appColors.white,
    maxWidth: '100%',
  },

  miniChatSubLabel: {
    fontSize: SF(10),
    fontFamily: appFonts.NunitoRegular,
    color: '#7A8499',
    marginTop: SH(2),
  },

  miniChatOverlay: {
    position: 'absolute',
    top: SW(8),
    right: SW(8),
    width: SW(20),
    height: SW(20),
    borderRadius: SW(10),
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Chat Modal (ConversationList + ChatComposer) ────────────────────────
  chatModalRoot: {
    flex: 1,
    backgroundColor: appColors.DarkPrimary,
  },

  chatModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SW(14),
    paddingTop: SW(45),
    paddingBottom: SW(12),
    gap: SW(10),
  },

  chatModalHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SW(10),
  },

  chatModalAvatar: {
    width: SW(38),
    height: SW(38),
    borderRadius: SW(19),
    borderWidth: 2,
    borderColor: appColors.secondary,
  },

  chatModalAvatarFallback: {
    width: SW(38),
    height: SW(38),
    borderRadius: SW(19),
    justifyContent: 'center',
    alignItems: 'center',
  },

  chatModalAvatarInitial: {
    fontSize: SF(15),
    fontFamily: appFonts.NunitoBold,
    color: '#ffffff',
  },

  chatModalTitle: {
    fontSize: SF(15),
    fontFamily: appFonts.NunitoBold,
    color: appColors.white,
  },

  chatModalSubtitle: {
    fontSize: SF(11),
    fontFamily: appFonts.NunitoSemiBold,
    color: appColors.bodyColor,
    marginTop: SH(1),
  },

  chatModalBody: {
    flex: 1,
  },

  // ── Expanded vitals modal (wraps existing ContactStressMonitor) ────────
  healthModalRoot: {
    flex: 1,
    backgroundColor: '#07090F',
  },

  healthModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SW(14),
    paddingTop: SW(45),
    paddingBottom: SW(12),
  },

  healthModalTitle: {
    fontSize: SF(15),
    fontFamily: appFonts.NunitoBold,
    color: appColors.white,
  },

  headerSpacer: {
    width: SW(34),
  },

  // ── Empty / not-found state ─────────────────────────────────────────────
  emptyWrap: {
    flex: 1,
    backgroundColor: appColors.DarkPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SH(10),
  },

  emptyText: {
    color: appColors.bodyColor,
    fontFamily: appFonts.NunitoSemiBold,
    fontSize: SF(13),
  },
});