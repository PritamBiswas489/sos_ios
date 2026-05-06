import { StyleSheet } from 'react-native';
import appColors from '../../theme/appColors';
import appFonts from '../../theme/appFonts';
import { SH, SW, SF } from '../../theme/dimensions';

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
    fontSize: SF(14),
    fontFamily: appFonts.NunitoBold,
  },

  closeBtn: {
    width: SW(30),
    height: SW(30),
    borderRadius: SW(15),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  content: {
    paddingHorizontal: SW(16),
    paddingVertical: SH(16),
  },

  iconBubble: {
    width: SW(54),
    height: SW(54),
    borderRadius: SW(27),
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(92, 20, 28, 0.9)',
    marginBottom: SH(14),
  },

  progressTrack: {
    width: '100%',
    height: SH(6),
    borderRadius: SH(3),
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#2ED573',
  },

  timeRow: {
    marginTop: SH(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  timeLabel: {
    color: appColors.bodyColor,
    fontFamily: appFonts.NunitoSemiBold,
    fontSize: SF(11),
  },

  controlsRow: {
    marginTop: SH(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  controlBtn: {
    width: SW(42),
    height: SW(42),
    borderRadius: SW(21),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  playPauseBtn: {
    width: SW(54),
    height: SW(54),
    borderRadius: SW(27),
    marginHorizontal: SW(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5C141C',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },

  errorBox: {
    height: SH(180),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SW(20),
    backgroundColor: '#101f34',
  },

  errorText: {
    marginTop: SH(8),
    textAlign: 'center',
    color: appColors.white,
    fontFamily: appFonts.NunitoSemiBold,
    fontSize: SF(12),
  },

  hiddenPlayer: {
    width: 0,
    height: 0,
    opacity: 0,
  },
});
