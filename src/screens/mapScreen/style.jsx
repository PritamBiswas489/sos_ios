import {StyleSheet} from 'react-native';
import appColors from '../../theme/appColors';
import appFonts from '../../theme/appFonts';
import {SH, SW, SF} from '../../theme/dimensions';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020B1B',
  },

  map: {
    ...StyleSheet.absoluteFillObject,
  },

  /* USER DOT */

  userPulseOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(77, 163, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(77, 163, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  userPulseMid: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(77, 163, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  userDotOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4DA3FF',
    borderWidth: 2.5,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#4DA3FF',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },

  userDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#cce8ff',
  },

  /* CONTACT MARKERS */

  markerWrapper: {
    alignItems: 'center',
  },

  markerPin: {
    width: SW(30),
    height: SW(30),
    borderRadius: SW(15),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },

  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },

  markerPinText: {
    color: '#ffffff',
    fontSize: SF(16),
    fontStyle: 'italic',
    fontFamily: appFonts.NunitoBold,
    lineHeight: SF(18),
    includeFontPadding: false,
  },

  /* ROUTE INFO BADGE */

  routeInfoBadge: {
    position: 'absolute',
    top: SW(72),
    alignSelf: 'center',
    left: SW(20),
    right: SW(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E1A33',
    paddingVertical: SW(7),
    paddingHorizontal: SW(16),
    borderRadius: 20,
    gap: SW(6),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
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

  /* RECENTER BUTTON */

  recenterBtn: {
    position: 'absolute',
    bottom: SW(130),
    right: SW(20),
    width: SW(44),
    height: SW(44),
    borderRadius: SW(22),
    backgroundColor: '#0E1A33',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.3)',
    elevation: 8,
    shadowColor: '#4DA3FF',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },

  /* ZOOM CONTROLS */

  zoomControls: {
    position: 'absolute',
    right: SW(20),
    bottom: SW(244),
    backgroundColor: '#0E1A33',
    borderRadius: SW(12),
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.2)',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  zoomBtn: {
    width: SW(44),
    height: SW(44),
    justifyContent: 'center',
    alignItems: 'center',
  },

  zoomDivider: {
    height: 1,
    marginHorizontal: SW(8),
    backgroundColor: 'rgba(77,163,255,0.18)',
  },

  /* FLOATING ACTION MENU */

  fabContainer: {
    position: 'absolute',
    left: SW(20),
    bottom: SW(140),
    alignItems: 'flex-start',
    gap: SW(10),
  },

  fabMain: {
    width: SW(48),
    height: SW(48),
    borderRadius: SW(24),
    backgroundColor: '#1A3A6A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.35)',
    elevation: 10,
    shadowColor: '#4DA3FF',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  fabMainOpen: {
    backgroundColor: '#FF3B5C',
    borderColor: 'rgba(255,59,92,0.4)',
    shadowColor: '#FF3B5C',
  },

  fabAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SW(10),
  },

  fabActionBtn: {
    width: SW(44),
    height: SW(44),
    borderRadius: SW(22),
    backgroundColor: '#0E1A33',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.25)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  fabActionBtnActive: {
    backgroundColor: '#FF3B5C',
    borderColor: 'rgba(255,59,92,0.4)',
  },

  fabActionLabel: {
    color: '#D0D9E8',
    fontSize: SF(12),
    fontFamily: appFonts.NunitoSemiBold,
    backgroundColor: '#0E1A33',
    paddingHorizontal: SW(10),
    paddingVertical: SW(5),
    borderRadius: SW(10),
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.18)',
    overflow: 'hidden',
    elevation: 4,
  },

  /* TRAVEL MODE BUTTON */

  travelModeBtn: {
    position: 'absolute',
    bottom: SW(186),
    right: SW(20),
    width: SW(44),
    height: SW(44),
    borderRadius: SW(22),
    backgroundColor: '#0E1A33',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.3)',
    elevation: 8,
    shadowColor: '#4DA3FF',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },

  travelModeBtnActive: {
    backgroundColor: '#4DA3FF',
    borderColor: '#4DA3FF',
  },

  /* SEARCH BAR — Google Places Autocomplete */

  searchBarWrapper: {
    position: 'absolute',
    top: SW(14),
    left: SW(20),
    right: SW(20),
    zIndex: 10,
  },

  placesContainer: {
    flex: 0,
  },

  placesInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E1A33',
    borderRadius: SW(28),
    paddingHorizontal: SW(10),
    paddingVertical: 0,
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.15)',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    height: SW(50),
  },

  placesInput: {
    flex: 1,
    color: '#D0D9E8',
    fontSize: SF(14),
    fontFamily: appFonts.NunitoSemiBold,
    backgroundColor: 'transparent',
    paddingHorizontal: SW(6),
    height: SW(50),
  },

  placesList: {
    backgroundColor: '#0E1A33',
    borderRadius: SW(16),
    marginTop: SW(6),
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.12)',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.45,
    shadowRadius: 10,
    overflow: 'hidden',
  },

  placesRow: {
    backgroundColor: 'transparent',
    paddingVertical: SW(12),
    paddingHorizontal: SW(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(77,163,255,0.07)',
  },

  placesDescription: {
    color: '#C0CCDC',
    fontSize: SF(13),
    fontFamily: appFonts.NunitoRegular,
  },

  searchIconBg: {
    width: SW(30),
    height: SW(30),
    borderRadius: SW(8),
    backgroundColor: 'rgba(77,163,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SW(2),
  },

  searchBtn: {
    backgroundColor: 'rgba(77,163,255,0.12)',
    width: SW(34),
    height: SW(34),
    borderRadius: SW(17),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.22)',
    marginLeft: SW(4),
  },

  /* LOCATION CARD */

  locationCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0B1629',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: SW(6),
    paddingBottom: SW(10),
    borderTopWidth: 1,
    borderTopColor: 'rgba(77,163,255,0.12)',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.45,
    shadowRadius: 12,
  },

  cardHandle: {
    width: SW(36),
    height: SW(3),
    borderRadius: SW(2),
    backgroundColor: 'rgba(164, 176, 190, 0.35)',
    alignSelf: 'center',
    marginBottom: SW(4),
  },

  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  redDotContainer: {
    alignItems: 'center',
    marginRight: 12,
  },

  redDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B5C',
  },

  redDotLine: {
    width: 2,
    height: 16,
    backgroundColor: '#FF3B5C',
    borderRadius: 1,
    marginTop: 2,
  },

  locationTitle: {
    color: '#fff',
    fontSize: SF(15),
    fontFamily: appFonts.NunitoBold,
  },

  locationSub: {
    color: '#6B7C99',
    fontSize: SF(11),
    fontFamily: appFonts.NunitoRegular,
    marginTop: 2,
    lineHeight: SF(15),
  },

  liveBadge: {
    backgroundColor: '#0C3F2C',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(46, 213, 115, 0.3)',
  },

  liveText: {
    color: '#2ED573',
    fontSize: SF(12),
    fontFamily: appFonts.NunitoBold,
    letterSpacing: 1,
  },
});
