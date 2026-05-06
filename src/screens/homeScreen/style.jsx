import { StyleSheet } from 'react-native';
import appColors from '../../theme/appColors';
import appFonts from '../../theme/appFonts';
import { SH, SW, SF } from '../../theme/dimensions';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.DarkPrimary,
  },

  greetingContainer: {
    paddingHorizontal: SW(18),
    marginTop: SW(55),
    marginBottom: SW(50),
  },

  goodMorning: {
    color: appColors.bodyColor,
    fontSize: SF(14),
    letterSpacing: 1,
  },

  userName: {
    fontSize: SF(30),
    color: appColors.white,
    fontFamily: appFonts.NunitoBold,
    marginTop: SW(3),
  },

  /* SOS */

  sosWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SH(50),
  },

  sosButton: {
    width: SW(160),
    height: SW(160),
    borderRadius: SW(80),
    backgroundColor: appColors.primary,
    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: appColors.primary,
    shadowOpacity: 0.8,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },

    elevation: 20,
  },

  sosText: {
    fontSize: SF(34),
    fontFamily: appFonts.NunitoBold,
    color: appColors.white,
  },

  sosSubText: {
    fontSize: SF(10),
    color: appColors.whiteAA,
    fontFamily: appFonts.NunitoSemiBold,
    letterSpacing: 1.5,
    marginTop: 5,
    textAlign: 'center',
  },

  glowRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: appColors.primary,
  },

  glowRing2: {
    position: 'absolute',
    width: SW(180),
    height: SW(180),
    borderRadius: SW(90),
    backgroundColor: appColors.primary,
    opacity: 0.4,
  },

  safeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColors.lightGreen,
    marginHorizontal: SW(20),
    padding: SW(12),
    borderRadius: SW(12),
    marginBottom: SW(20),
  },
  greenDot: {
    width: SW(10),
    height: SW(10),
    borderRadius: SW(5),
    backgroundColor: appColors.green,
    marginRight: SW(8),
  },
  safeText: {
    color: appColors.green,
    fontSize: SF(12),
    fontFamily: appFonts.NunitoSemiBold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SW(18),
  },

  card: {
    width: '48%',
    backgroundColor: appColors.secondary,
    paddingVertical: SW(20),
    paddingHorizontal: SW(18),
    borderRadius: SW(20),
    marginBottom: SW(12),
  },

  cardNumber: {
    color: appColors.white,
    fontSize: SF(20),
    fontFamily: appFonts.NunitoBold,
    marginTop: SW(4),
  },

  cardLabel: {
    color: appColors.bodyColor,
    fontFamily: appFonts.NunitoSemiBold,
    fontSize: SF(12),
    marginTop: SW(4),
  },
});

export default styles;
