import { StyleSheet } from 'react-native';
import appColors from '../../theme/appColors';
import appFonts from '../../theme/appFonts';
import { SW, SH, SF } from '../../theme/dimensions';

const styles = StyleSheet.create({
  // ── Layout ───────────────────────────────────────────────────────────────────
  root: {
    flex: 1,
    backgroundColor: appColors.DarkPrimary,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SW(16),
    paddingTop: SH(8),
  },
  bottomSpacer: { height: SH(32) },

  // ── Loading ───────────────────────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    backgroundColor: appColors.DarkPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(14),
    color: appColors.whiteAA,
    marginTop: SH(10),
  },

  // ── Header ────────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SW(16),
    paddingTop: SH(50),
    paddingBottom: SH(14),
  },
  backBtn: { padding: SW(4), marginRight: SW(6) },
  headerTitle: {
    flex: 1,
    fontFamily: appFonts.NunitoExtraBold,
    fontSize: SF(22),
    color: appColors.white,
  },
  headerDate: {
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(12),
    color: appColors.bodyColor,
  },

  // ── Card ──────────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: appColors.whiteTransparent,
    borderRadius: SW(16),
    borderWidth: 1,
    borderColor: appColors.whiteBdrTransparent,
    padding: SW(16),
    marginBottom: SH(14),
  },

  // ── Section Header ────────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SH(14),
  },
  sectionTitle: {
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(14),
    color: appColors.white,
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(11),
    color: appColors.bodyColor,
  },
  subLabel: {
    fontFamily: appFonts.NunitoSemiBold,
    fontSize: SF(11),
    color: appColors.bodyColor,
    marginBottom: SH(8),
    marginTop: SH(4),
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // ── Badge ─────────────────────────────────────────────────────────────────────
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SW(8),
    paddingVertical: SH(3),
    borderRadius: SW(20),
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: appFonts.NunitoSemiBold,
    fontSize: SF(10),
    letterSpacing: 0.2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: SW(6),
    flexWrap: 'wrap',
    marginTop: SH(4),
  },

  // ── Profile Card ──────────────────────────────────────────────────────────────
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SW(16),
    padding: SW(14),
    marginBottom: SH(14),
    borderWidth: 1,
    borderColor: appColors.whiteBdrTransparent,
    gap: SW(12),
  },
  profileAvatar: {
    width: SW(50),
    height: SW(50),
    borderRadius: SW(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontFamily: appFonts.NunitoBlack,
    fontSize: SF(20),
    color: appColors.white,
  },
  profileMid: { flex: 1 },
  profileName: {
    fontFamily: appFonts.NunitoExtraBold,
    fontSize: SF(15),
    color: appColors.white,
  },
  profileSub: {
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(11),
    color: appColors.bodyColor,
    marginTop: SH(2),
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SW(10),
  },
  profileStatItem: { alignItems: 'center' },
  profileStatNum: {
    fontFamily: appFonts.NunitoBlack,
    fontSize: SF(18),
    color: appColors.white,
  },
  profileStatLbl: {
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(10),
    color: appColors.bodyColor,
  },
  profileStatDivider: {
    width: 1,
    height: SH(28),
    backgroundColor: appColors.whiteBdrTransparent,
  },

  // ── License Panel ────────────────────────────────────────────────────────────
  licenseCard: {
    borderRadius: SW(14),
    borderWidth: 1,
    borderColor: appColors.whiteBdrTransparent,
    padding: SW(12),
    marginBottom: SH(14),
    gap: SH(10),
  },
  licenseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SW(10),
  },
  licenseIconWrap: {
    width: SW(36),
    height: SW(36),
    borderRadius: SW(18),
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  licenseTitleLabel: {
    fontFamily: appFonts.NunitoExtraBold,
    fontSize: SF(12),
    color: appColors.white,
    letterSpacing: 1.2,
  },
  licenseTitleSub: {
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(10),
    color: appColors.bodyColor,
    marginTop: SH(1),
  },
  licenseStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SW(8),
    paddingVertical: SH(3),
    borderRadius: SW(20),
    borderWidth: 1,
    gap: SW(4),
  },
  licenseStatusDot: {
    width: SW(6),
    height: SW(6),
    borderRadius: SW(3),
  },
  licenseStatusText: {
    fontFamily: appFonts.NunitoExtraBold,
    fontSize: SF(9),
    letterSpacing: 0.8,
  },
  licenseKeyBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: SW(10),
    borderWidth: 1,
    borderColor: appColors.whiteBdrTransparent,
    paddingHorizontal: SW(12),
    paddingVertical: SH(10),
    alignItems: 'center',
  },
  licenseKeyLabel: {
    fontFamily: appFonts.NunitoSemiBold,
    fontSize: SF(9),
    color: appColors.bodyColor,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: SH(5),
  },
  licenseKeyValue: {
    fontFamily: appFonts.NunitoBlack,
    fontSize: SF(17),
    color: appColors.white,
    letterSpacing: 2,
    textAlign: 'center',
  },
  licenseFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SW(10),
  },
  licenseFooterItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SW(4),
  },
  licenseFooterText: {
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(10),
    color: appColors.bodyColor,
    flex: 1,
  },
  licenseFooterDivider: {
    width: 1,
    height: SH(18),
    backgroundColor: appColors.whiteBdrTransparent,
  },

  // ── Stat Chip Grid (SOS counts) ───────────────────────────────────────────────
  statChipGrid: {
    flexDirection: 'row',
    gap: SW(7),
    marginBottom: SH(16),
  },
  statChip: {
    flex: 1,
    backgroundColor: appColors.whiteTransparent,
    borderRadius: SW(12),
    borderWidth: 1,
    paddingVertical: SH(10),
    paddingHorizontal: SW(4),
    alignItems: 'center',
    gap: SH(3),
  },
  statChipIcon: {
    width: SW(30),
    height: SW(30),
    borderRadius: SW(15),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SH(1),
  },
  statChipCount: {
    fontFamily: appFonts.NunitoBlack,
    fontSize: SF(18),
  },
  statChipLabel: {
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(9),
    color: appColors.bodyColor,
    textAlign: 'center',
  },

  // ── Session Row ───────────────────────────────────────────────────────────────
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SH(10),
    gap: SW(10),
  },
  sessionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: appColors.whiteBdrTransparent,
  },
  sessionDot: {
    width: SW(8),
    height: SW(8),
    borderRadius: SW(4),
  },
  sessionInfo: { flex: 1 },
  sessionId: {
    fontFamily: appFonts.NunitoSemiBold,
    fontSize: SF(13),
    color: appColors.white,
  },
  sessionTime: {
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(11),
    color: appColors.bodyColor,
    marginTop: SH(2),
  },
  sessionLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SW(3),
    marginTop: SH(2),
  },
  sessionLoc: {
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(10),
    color: appColors.bodyColor,
    flex: 1,
  },
  sessionBadge: {
    paddingHorizontal: SW(10),
    paddingVertical: SH(4),
    borderRadius: SW(20),
    borderWidth: 1,
  },
  sessionBadgeText: {
    fontFamily: appFonts.NunitoSemiBold,
    fontSize: SF(11),
  },

  // ── Contact Stats Panel ──────────────────────────────────────────────────────
  contactStatGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: SH(8),
  },
  contactStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: SH(8),
  },
  contactStatIconWrap: {
    width: SW(52),
    height: SW(52),
    borderRadius: SW(26),
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactStatNum: {
    fontFamily: appFonts.NunitoBlack,
    fontSize: SF(26),
  },
  contactStatLbl: {
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(11),
    color: appColors.bodyColor,
    textAlign: 'center',
    lineHeight: SF(16),
  },
  contactStatDivider: {
    width: 1,
    height: SH(70),
    backgroundColor: appColors.whiteBdrTransparent,
  },

  // ── Stress Snapshot ───────────────────────────────────────────────────────────
  stressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SW(8),
  },
  stressStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SW(10),
    paddingVertical: SH(10),
    borderRadius: SW(12),
    borderWidth: 1,
    minWidth: SW(70),
  },
  stressStateLbl: {
    fontFamily: appFonts.NunitoExtraBold,
    fontSize: SF(13),
  },
  stressStateSub: {
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(10),
    color: appColors.bodyColor,
    marginTop: SH(2),
  },
  stressDividerV: {
    width: 1,
    height: SH(40),
    backgroundColor: appColors.whiteBdrTransparent,
  },
  stressStat: {
    flex: 1,
    alignItems: 'center',
    gap: SH(3),
  },
  stressStatVal: {
    fontFamily: appFonts.NunitoBold,
    fontSize: SF(14),
    color: appColors.white,
  },
  stressStatUnit: {
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(10),
    color: appColors.bodyColor,
  },
  stressStatLbl: {
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(10),
    color: appColors.bodyColor,
    textAlign: 'center',
  },
  stressFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SW(5),
    marginTop: SH(14),
    paddingTop: SH(10),
    borderTopWidth: 1,
    borderTopColor: appColors.whiteBdrTransparent,
  },
  stressFooterText: {
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(11),
    color: appColors.bodyColor,
  },

  // ── Empty State ───────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: SH(20),
    gap: SH(8),
  },
  emptyText: {
    fontFamily: appFonts.NunitoRegular,
    fontSize: SF(13),
    color: appColors.bodyColor,
  },
});

export default styles;


