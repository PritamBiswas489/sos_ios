import { StyleSheet } from 'react-native';
import appColors from '../../theme/appColors';
import appFonts from '../../theme/appFonts';
import { SH, SW, SF } from '../../theme/dimensions';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.DarkPrimary,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SW(15),
    paddingTop: SW(45),
  },

  title: {
    fontSize: SF(22),
    fontFamily: appFonts.NunitoBold,
    color: appColors.white,
  },

  subtitle: {
    fontSize: SF(12),
    fontFamily: appFonts.NunitoSemiBold,
    color: appColors.bodyColor,
    marginTop: SW(3),
  },

  waveContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginTop: SH(50),
    height: SH(50),
  },

  waveBar: {
    width: SW(4),
    backgroundColor: appColors.primary,
    marginHorizontal: SW(3),
    borderRadius: SW(2),
  },

  timer: {
    fontSize: SF(40),
    color: appColors.primary,
    textAlign: 'center',
    marginTop: SW(16),
    fontFamily: appFonts.NunitoBold,
  },

  recordingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SW(8),
  },

  recordDot: {
    color: appColors.primary,
    fontSize: SF(16),
    marginRight: SW(6),
  },

  recordingText: {
    color: appColors.bodyColor,
    fontSize: SF(12),
  },

  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SW(35),
  },

  controlBtn: {
    width: SW(50),
    height: SW(50),
    borderRadius: SW(28),
    backgroundColor: appColors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SW(12),
  },

  recordBtn: {
    width: SW(74),
    height: SW(74),
    borderRadius: SW(37),
    backgroundColor: appColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SW(16),
  },

  serverCard: {
    backgroundColor: appColors.secondary,
    marginHorizontal: SW(20),
    padding: SW(15),
    borderRadius: SW(14),
    marginTop: SW(40),
  },

  serverText: {
    color: appColors.bodyColor,
    fontSize: SF(12),
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SW(16),
    marginTop: SW(20),
  },

  statCard: {
    flex: 1,
    backgroundColor: appColors.secondary,
    padding: SW(15),
    borderRadius: SW(14),
    alignItems: 'center',
    marginHorizontal: SW(5),
  },

  statValue: {
    fontSize: SF(16),
    fontFamily: appFonts.NunitoBold,
    color: appColors.primary,
  },

  statLabel: {
    fontSize: SF(11),
    color: appColors.bodyColor,
    marginTop: SW(4),
  },
});
