import { GOOGLE_MAPS_API_KEY as _GOOGLE_MAPS_API_KEY } from '@env';
import {TURN_DOMAIN, TURN_SERVER_USERNAME, TURN_SERVER_PASSWORD} from '@env';
import { MAPTILE_API_KEY, ORS_API_KEY  } from '@env';

export const TURN_SERVER_DOMAIN = TURN_DOMAIN;
export const TURN_SERVER_USER = TURN_SERVER_USERNAME;
export const TURN_SERVER_PASS = TURN_SERVER_PASSWORD;
export const MAP_TILE_API_KEY = MAPTILE_API_KEY;
export const ORS_KEY = ORS_API_KEY;
export const USE_GOOGLE_MAPS = true;

export const GOOGLE_MAPS_API_KEY = _GOOGLE_MAPS_API_KEY;

export const env = {
  type: 'prod', //prod staging dev
  appUrls: {
    dev: {
      apiUrl: 'https://99bpkvn6-4000.inc1.devtunnels.ms',
    },
    staging: {
      apiUrl: 'https://back-sos.pritamaqua.aqualeafitsol.com',
    },
    prod: {
      apiUrl: 'https://back-sos.pritamaqua.aqualeafitsol.com',
    },
  },
  mediaUrls: {
    dev: {
      apiUrl: 'https://back-sos.pritamaqua.aqualeafitsol.com',
    },
    staging: {
      apiUrl: 'https://back-sos.pritamaqua.aqualeafitsol.com',
    },
    prod: {
      apiUrl: 'https://back-sos.pritamaqua.aqualeafitsol.com',
    },
  },
};
 