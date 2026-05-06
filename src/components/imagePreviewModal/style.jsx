import { StyleSheet } from 'react-native';
import appColors from '../../theme/appColors';
import { SH, SW } from '../../theme/dimensions';

export default StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SW(12),
  },

  card: {
    width: '100%',
    maxWidth: SW(360),
    borderRadius: SW(14),
    overflow: 'hidden',
    backgroundColor: '#081528',
    borderWidth: 1,
    borderColor: 'rgba(143,163,200,0.35)',
  },

  header: {
    height: SH(44),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SW(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(143,163,200,0.2)',
  },

  title: {
    color: appColors.white,
    fontSize: 14,
    fontWeight: '700',
  },

  closeBtn: {
    width: SW(30),
    height: SW(30),
    borderRadius: SW(15),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  image: {
    width: '100%',
    height: SH(360),
    backgroundColor: '#000000',
  },

  errorBox: {
    height: SH(240),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SW(20),
    backgroundColor: '#101f34',
  },

  errorText: {
    marginTop: SH(8),
    textAlign: 'center',
    color: appColors.white,
  },
});
