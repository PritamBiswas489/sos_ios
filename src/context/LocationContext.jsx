import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import Geolocation from '@react-native-community/geolocation';
import { requestLocationPermissions } from '../services/permissions.service';
import { useSocket } from './SocketContext';
import { useUserData } from '../hook/useUserData';
import { useContactLocations } from '../hook/useContactLocations';
import { LocationsService } from '../services/locations.service';
import useUserAuth from '../hook/useUserAuth';
import { AppState } from 'react-native';
 




const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [isBackground, setIsBackground] = useState(false);
  const { on, emitNoAck, emit, isConnected } = useSocket();

  const watchIdRef = useRef(null);
  const onLocationUpdateRef = useRef(null);
  const isTrackingRef = useRef(false);
  const locationIntervalRef = useRef(null);
  const currentLocationRef = useRef(null);
  const isBackgroundRef = useRef(false);
  const startTrackingRef = useRef(null);
  const stopTrackingRef = useRef(null);

  const { setUserData: updateUserCurrentLocation } = useUserData();
  const updateUserCurrentLocationRef = useRef(updateUserCurrentLocation);
  useEffect(() => {
    updateUserCurrentLocationRef.current = updateUserCurrentLocation;
  });

  const { updateContactLocations } = useContactLocations();
  const { userData } = useUserData();
  const { isAuthenticated } = useUserAuth();


  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      console.log('📱 [AppState] changed to:', nextState); // ✅ tells you foreground/background
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);

 

  // ── Global callback for location updates ──────────────────────────────────
  useEffect(() => {
    global.__locationUpdateCallback = (location, bg) => {
      console.log('📍 [LocationCallback] fired | bg:', bg, '| coords:', {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy,
      });
      const coords = { ...location.coords, isBackground: bg, timestamp: location.timestamp };
      // Use unstable_batchedUpdates or combine into single state object
      setCurrentLocation(coords);
      currentLocationRef.current = coords;
      if (bg !== isBackgroundRef.current) {  // ✅ only update if changed
        setIsBackground(bg);
        isBackgroundRef.current = bg;
      }
      onLocationUpdateRef.current?.(coords);
    };

    return () => {
      global.__locationUpdateCallback = null;
    };
  }, []);

  // ── Permission helpers ─────────────────────────────────────────────────────
  const requestPermissions = useCallback(async () => {
    try {
      const status = await requestLocationPermissions();
      setPermissionStatus(status);
      return status;
    } catch (err) {
      setLocationError(err.message);
      return 'denied';
    }
  }, []);

  // ── Start tracking (iOS only) ──────────────────────────────────────────────
  const startTracking = useCallback(
  async onUpdate => {
    console.log('🔵 [startTracking] called | isTracking:', isTrackingRef.current);
    if (isTrackingRef.current) {
      console.log('⛔ [startTracking] already tracking — skipped');
      return;
    }
    isTrackingRef.current = true;
    onLocationUpdateRef.current = onUpdate;

    console.log('🔑 [startTracking] requesting permissions...');
    const granted = await requestPermissions();
    console.log('🔑 [startTracking] permission result:', granted);
    
    if (granted === 'denied') {
      console.log('❌ [startTracking] permission denied — stopped');
      isTrackingRef.current = false;
      return;
    }

    try {
      console.log('📡 [startTracking] calling watchPosition...');
      watchIdRef.current = Geolocation.watchPosition(
        location => {
          const isBackground = appStateRef.current !== 'active';
          console.log('🛰️ [watchPosition] fired | bg:', isBackground, '| accuracy:', location.coords.accuracy);
          global.__locationUpdateCallback?.(location, isBackground);
        },
        error => {
          console.error('❌ [watchPosition] error:', error.code, error.message);
          setLocationError(error.message);
        },
        {
          accuracy: { ios: 'nearestTenMeters' },
          distanceFilter: 10,
          timeout: 10000,
          maximumAge: 5000,
          forceRequestLocation: false,
          pausesLocationUpdatesAutomatically: false,
          allowsBackgroundLocationUpdates: true,
          showsBackgroundLocationIndicator: true,
          activityType: 'other',
        },
      );
      console.log('✅ [startTracking] watchPosition started | watchId:', watchIdRef.current);
      setIsTracking(true);
    } catch (err) {
      console.error('❌ [startTracking] exception:', err.message);
      isTrackingRef.current = false;
    }
  },
  [requestPermissions],
);
  startTrackingRef.current = startTracking;

  // ── Stop tracking ──────────────────────────────────────────────────────────
  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    onLocationUpdateRef.current = null;
    isTrackingRef.current = false;
    setIsTracking(false);
    // ✅ Keep last known location — don't null out (prevents map crash)
    console.log('🛑 iOS location tracking stopped');
  }, []);
  stopTrackingRef.current = stopTracking;

  // ── One-shot current position ──────────────────────────────────────────────
  const getCurrentPosition = useCallback(async () => {
    return new Promise(resolve => {
      Geolocation.getCurrentPosition(
        loc => {
          resolve({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            altitude: loc.coords.altitude,
            accuracy: loc.coords.accuracy,
            heading: loc.coords.heading,
            speed: loc.coords.speed,
          });
        },
        error => {
          console.error('getCurrentPosition error:', error.message);
          setLocationError(error.message);
          resolve(null);
        },
        {
          accuracy: { ios: 'hundredMeters' }, // ✅ uses cell/wifi, instant
          timeout: 5000,                       // ✅ fail fast
          maximumAge: 30000,                   // ✅ accept 30s old cache
          forceRequestLocation: false,         // ✅ use cached if available
        },
      );
    });
  }, []);

  // ── Manual location override (for search/places) ──────────────────────────
  const updateCurrentLocation = useCallback(async location => {
    console.log('Updating current location in context:', location);
    if (location?.latitude && location?.longitude) {
      const updatedLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        altitude: location.altitude || 0,
        accuracy: location.accuracy || 0,
        heading: location.heading || 0,
        speed: location.speed || 0.5,
        isBackground: isBackgroundRef.current,
      };
      emitNoAck('location:update', JSON.stringify({ loc: updatedLocation }));
    }
  }, [emitNoAck]);

  // ── Update from GPS ────────────────────────────────────────────────────────
  const updateMyGprsLocation = useCallback(async () => {
    console.log('Updating location from GPS...');
    const location = await getCurrentPosition();
    if (location?.latitude && location?.longitude) {
      const updatedLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        altitude: location.altitude || 0,
        accuracy: location.accuracy || 0,
        heading: location.heading || 0,
        speed: location.speed || 0.5,
        isBackground: isBackgroundRef.current,
      };
      emitNoAck('location:update', JSON.stringify({ loc: updatedLocation }));
    }
  }, [getCurrentPosition, emitNoAck]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopTrackingRef.current?.();
    };
  }, []);

  // ── Socket connection handler ──────────────────────────────────────────────
  useEffect(() => {
    if (!isConnected) {
      isTrackingRef.current = false;
      return;
    }

    const onPersonalRoomJoined = () => {
      console.log('🏠 [Socket] personal:room:joined fired — starting tracking');
      startTrackingRef.current(location => {
        console.log('📍 Emitting location update:', location);
        emitNoAck('location:update', JSON.stringify({ loc: location }));
      });
    };

    const onLocationUpdated = payload => {
      updateContactLocations({ [payload.userId]: payload.location });
    };

    const onMyLocationUpdated = ({ location }) => {
      updateUserCurrentLocationRef.current({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    };

    const unsubs = [
      on('personal:room:joined', onPersonalRoomJoined),
      on('location:updated', onLocationUpdated),
      on('location:my-updated', onMyLocationUpdated),
    ];

    emitNoAck('join:personal');

    return () => {
      unsubs.forEach(unsub => unsub());
      stopTrackingRef.current?.();
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    };
  }, [isConnected, on, emitNoAck]);

  // ── Fetch contacts last locations on mount ─────────────────────────────────
  const getContactsLastLocations = useCallback(async () => {
    console.log('📍 Fetching contacts last locations...');
    try {
      const response = await Promise.race([
        new Promise((resolve, reject) => {
          LocationsService.getContactsLastLocations(result => {
            if (result.success) resolve(result.data);
            else reject(new Error(result.error || 'Unknown error'));
          });
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('getContactsLastLocations timeout')), 10000)
        ), // ✅ 10s max wait
      ]);

      if (response?.data) {
        const initialLocations = {};
        response.data.forEach(locData => {
          initialLocations[locData.user_id] = {
            latitude: locData.latitude,
            longitude: locData.longitude,
            altitude: locData.altitude || 0,
            accuracy: locData.accuracy || 0,
            heading: locData.heading || 0,
            speed: locData.speed || 0.5,
            isBackground: true,
          };
        });
        updateContactLocations(initialLocations);
      }
    } catch (err) {
      console.error('Failed to get contacts locations:', err.message);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    console.log('⏳ [LocationContext] scheduling getContactsLastLocations in 2s'); // ✅ ADD
    const timer = setTimeout(() => {
      console.log('🚀 [LocationContext] calling getContactsLastLocations now'); // ✅ ADD
      getContactsLastLocations();
    }, 2000);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  // ── Context value ──────────────────────────────────────────────────────────
  const value = {
    currentLocation,
    locationError,
    isTracking,
    isBackground,
    permissionStatus,
    startTracking,
    stopTracking,
    getCurrentPosition,
    requestPermissions,
    getContactsLastLocations,
    updateCurrentLocation,
    updateMyGprsLocation,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export default LocationContext;