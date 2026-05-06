import { StyleSheet } from 'react-native';
import appColors from '../../theme/appColors';
import appFonts from '../../theme/appFonts';
import { SH, SW, SF } from '../../theme/dimensions';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.DarkPrimary,
  },

  header: {
    paddingTop: SW(50),
    paddingHorizontal: SW(20),
  },

  title: {
    fontSize: SF(28),
    fontFamily: appFonts.NunitoBold,
    color: appColors.white,
  },

  subtitle: {
    color: appColors.bodyColor,
    fontSize: SF(12),
    marginTop: SW(3),
    fontFamily: appFonts.NunitoSemiBold,
  },

  heartContainer: {
    alignItems: 'center',
    marginTop: SW(25),
  },

  heartRate: {
    fontSize: SF(48),
    fontFamily: appFonts.NunitoExtraBold,
    color: appColors.primary,
  },

  bpm: {
    color: appColors.bodyColor,
    fontSize: SF(14),
  },

  ecgContainer: {
    width: '100%',
    marginTop: SW(20),
    paddingHorizontal: SW(20),
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: SW(20),
    marginTop: SW(25),
  },

  statCard: {
    width: '31%',
    backgroundColor: appColors.secondary,
    borderRadius: SW(16),
    padding: SW(15),
    alignItems: 'center',
  },

  statValue: {
    fontSize: SF(18),
    fontFamily: appFonts.NunitoBold,
    color: appColors.white,
    marginTop: SW(6),
  },

  statLabel: {
    fontSize: SF(12),
    fontFamily: appFonts.NunitoRegular,
    color: appColors.bodyColor,
  },

  stressContainer: {
    marginHorizontal: SW(20),
    marginTop: SW(25),
  },

  stressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SW(8),
  },

  stressTitle: {
    color: appColors.white,
    fontSize: SF(14),
    fontFamily: appFonts.NunitoRegular,
  },

  stressPercent: {
    color: appColors.yellow,
    fontSize: SF(14),
  },

  progressBar: {
    height: SW(5),
    backgroundColor: appColors.whiteBdrTransparent,
    borderRadius: SW(5),
    overflow: 'hidden',
  },

  progressFill: {
    height: SW(5),
  },

  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A1E2E',
    marginHorizontal: SW(20),
    marginTop: SW(30),
    padding: SW(12),
    borderRadius: SW(10),
  },

  warningText: {
    color: appColors.yellow,
    marginLeft: SW(8),
    fontSize: SF(13),
    fontFamily: appFonts.NunitoRegular,
  },
});

export default styles;
