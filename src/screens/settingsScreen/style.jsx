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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SW(18),
    paddingTop: SH(50),
    marginBottom: SW(25),
  },

  headerTitle: {
    fontSize: SF(22),
    fontFamily: appFonts.NunitoBold,
    color: appColors.white,
  },

  headerSub: {
    fontSize: SF(12),
    color: appColors.bodyColor,
    marginTop: 3,
  },

  section: {
    color: appColors.bodyColor,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    fontSize: SF(12),
    letterSpacing: 1,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SW(18),
    paddingVertical: SW(14),
    borderBottomWidth: 1,
    borderBottomColor: appColors.whiteTransparent,
  },

  iconBox: {
    width: SW(34),
    height: SW(34),
    borderRadius: SW(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SW(10),
  },

  rowText: {
    flex: 1,
  },

  title: {
    color: appColors.white,
    fontSize: SF(12),
    fontFamily: appFonts.NunitoBold,
  },

  subtitle: {
    color: appColors.bodyColor,
    fontSize: SF(12),
    marginTop: 3,
  },

  status: {
    color: appColors.green,
    fontSize: SF(13),
    fontFamily: appFonts.NunitoBold,
  },
});

export default styles;
