import appColors from '../../theme/appColors';
import appFonts from '../../theme/appFonts';
import { SH, SW, SF } from '../../theme/dimensions';
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020B1B',
  },

  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  profile: {
    alignItems: 'center',
    marginTop: 20,
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#272928',
  },
  greenTag: {
    borderColor: '#00FF9C',
  },

  purpleTag: {
    borderColor: '#A855F7',
  },

  greenText: {
    color: '#00FF9C',
    fontFamily: appFonts.NunitoBold,
  },

  purpleText: {
    color: '#A855F7',
    fontFamily: appFonts.NunitoBold,
  },

  grayText: {
    color: '#94A3B8',
    fontFamily: appFonts.NunitoBold,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    backgroundColor: '#00FF9C',
    borderRadius: 6,
  },

  name: {
    color: '#E2E8F0',
    fontSize: 18,
    fontFamily: appFonts.NunitoExtraBold,
    marginTop: 10,
  },

  username: {
    color: '#94A3B8',
    fontFamily: appFonts.NunitoSemiBold,
  },

  address: {
    color: '#64748B',
    marginTop: 4,
    fontFamily: appFonts.NunitoSemiBold,
  },

  tags: {
    flexDirection: 'row',
    marginTop: 15,
  },

  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 5,
  },

  card: {
    margin: 16,
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#081E3C',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  progressText: {
    color: '#00FFC6',
    fontSize: 22,
    fontFamily: appFonts.NunitoBlack,
  },

  scoreBox: {
    marginLeft: 15,
    flex: 1,
  },

  scoreTitle: {
    color: '#94A3B8',
    fontFamily: appFonts.NunitoBlack,
    fontSize: 12,
  },

  scoreMain: {
    color: '#00FFC6',
    fontSize: 28,
    fontFamily: appFonts.NunitoBlack,
  },

  scoreTotal: {
    color: '#94A3B8',
    fontFamily: appFonts.NunitoBold,
  },

  excellent: {
    color: '#22C55E',
    fontSize: 12,
    fontFamily: appFonts.NunitoBold,
  },

  rank: {
    color: '#94A3B8',
    fontFamily: appFonts.NunitoBlack,
    fontSize: 11,
  },

  rightBars: {
    marginLeft: 10,
    marginBottom: 10,
  },

  barRow: {
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },

  barLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: appFonts.NunitoBlack,
    width: 60,
  },

  barBg: {
    width: 70,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
  },

  barFill: {
    height: 6,
    borderRadius: 10,
  },
  avatarWrapper: {
    position: 'relative',
    // padding: 4,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#FF00FF',
    // overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 10,
  },

  statCard: {
    width: '23%',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    backgroundColor: '#081E3C',
    borderWidth: 1,
    borderColor: '#6B7C99',
  },

  statValue: {
    fontSize: 20,
    FontFamily: appFonts.NunitoBlack,
    marginTop: 5,
  },

  statLabel: {
    fontSize: 10,
    FontFamily: appFonts.NunitoBold,
    color: '#94A3B8',
  },

  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },

  actionBtn: {
    width: '23%',
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 18,
    alignItems: 'center',
    backgroundColor: '#081E3C',
    borderWidth: 1,
    borderColor: '#6B7C99',
  },

  activeBtn: {
    borderWidth: 1,
    borderColor: '#FF4D6D',
    backgroundColor: 'rgba(255,77,109,0.08)',
  },

  actionText: {
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 5,
  },

  emergencyCard: {
    margin: 16,
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#700b1e',
  },

  emergencyTitle: {
    color: '#94A3B8',
    fontFamily: appFonts.NunitoSemiBold,
  },
  emergencyCode: {
    color: '#fff',
    fontSize: 16,
    fontFamily: appFonts.NunitoBold,
  },
  emergencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sosBox: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  sosText: {
    color: '#fff',
    fontFamily: appFonts.NunitoBlack,
  },

  copyBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },

  copyText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: appFonts.NunitoBlack,
  },

  activity: {
    padding: 16,
  },

  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  sectionTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: appFonts.NunitoBlack,
  },

  viewAll: {
    color: '#3B82F6',
    fontSize: 12,
    fontFamily: appFonts.NunitoBlack,
  },

  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  activityTitle: {
    color: '#fff',
    fontSize: 13,
    fontFamily: appFonts.NunitoBlack,
  },

  activitySub: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: appFonts.NunitoSemiBold,
  },

  time: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: appFonts.NunitoBlack,
  },
});
