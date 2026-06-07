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

  // ── Global callback for location updates ──────────────────────────────────
  useEffect(() => {
    global.__locationUpdateCallback = (location, bg) => {
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        accuracy: location.coords.accuracy,
        heading: location.coords.heading,
        speed: location.coords.speed,
        isBackground: bg,
        timestamp: location.timestamp,
      };
      setCurrentLocation(coords);
      currentLocationRef.current = coords;
      setIsBackground(bg);
      isBackgroundRef.current = bg;
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
      if (isTrackingRef.current) return;
      isTrackingRef.current = true;
      onLocationUpdateRef.current = onUpdate;

      const granted = await requestPermissions();
      if (!granted || granted === 'denied') {
        isTrackingRef.current = false;
        return;
      }

      try {
        // iOS foreground + background watch
        watchIdRef.current = Geolocation.watchPosition(
          location => {
            global.__locationUpdateCallback?.(location, false);
          },
          error => {
            console.error('Location error:', error.message);
            setLocationError(error.message);
          },
          {
            accuracy: {
              ios: 'best',
            },
            distanceFilter: 5,           // update every 5 metres
            timeout: 15000,
            maximumAge: 1000,
            forceRequestLocation: true,
            showsBackgroundLocationIndicator: true,  // iOS blue bar
            pausesLocationUpdatesAutomatically: false, // prevent iOS pausing
            activityType: 'other',                    // iOS activity type
          },
        );

        setIsTracking(true);
        setLocationError(null);
        console.log('✅ iOS location tracking started');
      } catch (err) {
        console.error('startTracking error:', err);
        isTrackingRef.current = false;
        setLocationError(err.message);
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
          accuracy: { ios: 'best' },
          timeout: 15000,
          maximumAge: 10000,
          forceRequestLocation: true,
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
      console.log('✅ Joined personal room, starting location tracking...');
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
      const response = await new Promise((resolve, reject) => {
        LocationsService.getContactsLastLocations(result => {
          if (result.success) {
            resolve(result.data);
          } else {
            reject(new Error(result.error || 'Unknown error fetching locations'));
          }
        });
      });

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
    if (isAuthenticated) {
      getContactsLastLocations();
    }
  }, [getContactsLastLocations, isAuthenticated]);

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