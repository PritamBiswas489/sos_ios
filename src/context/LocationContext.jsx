
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { requestLocationPermissions } from '../services/permissions.service';
import BackgroundActions from 'react-native-background-actions';
import { useSocket } from './SocketContext';
import { useUserData } from '../hook/useUserData';
import { useContactLocations } from '../hook/useContactLocations';
import { LocationsService } from '../services/locations.service';
import useUserAuth from '../hook/useUserAuth';
 
 

const LocationContext = createContext(null);

// ─── Background Task Definition ───────────────────────────────────────────────
// react-native-background-actions runs a JS task; we use the global callback
// pattern identical to the Expo version so SocketContext wiring is unchanged.
const backgroundLocationTask = async taskData => {
  await new Promise(resolve => {
    const watchId = Geolocation.watchPosition(
      position => {
        if (global.__locationUpdateCallback) {
          global.__locationUpdateCallback(position, true);
        }
      },
      error => {
        console.error('Background location error:', error.message);
      },
      {
        accuracy: {
          android: 'balanced', // PRIORITY_BALANCED_POWER_ACCURACY
          ios: 'hundredMeters',
        },
        interval: 10000, // every 10 seconds in background
        fastestInterval: 5000,
        distanceFilter: 10,
        showsBackgroundLocationIndicator: true,
        forceRequestLocation: true,
      },
    );

    // Keep the task alive; it resolves only when BackgroundActions.stop() is called.
    BackgroundActions.on('expiration', () => {
      Geolocation.clearWatch(watchId);
      resolve();
    });
  });
};

// ─── Background service options ───────────────────────────────────────────────
const backgroundOptions = {
  taskName: 'LocationSharing',
  taskTitle: 'Location Sharing Active',
  taskDesc: 'Your location is being shared with your room.',
  taskIcon: {
    name: 'ic_launcher', // must exist in android/app/src/main/res/mipmap-*
    type: 'mipmap',
  },
  color: '#6C63FF',
  linkingURI: undefined, // set to your deep-link scheme if needed
  parameters: {},
};

export const LocationProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [isBackground, setIsBackground] = useState(false);
  const { on, emitNoAck, emit, isConnected } = useSocket();

  const watchIdRef = useRef(null);
  const onLocationUpdateRef = useRef(null); // callback from SocketContext
  const isTrackingRef = useRef(false); // synchronous guard — state is async and races
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
  const {   updateContactLocations } = useContactLocations();
 
  const { userData } = useUserData();
  const { isAuthenticated } = useUserAuth();

  // Register the global callback for the background task
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

  const startTracking = useCallback(
    async onUpdate => {
      if (isTrackingRef.current) return; // synchronous guard against multiple watchers
      isTrackingRef.current = true;
      onLocationUpdateRef.current = onUpdate;

      const granted = await requestPermissions();
      if (!granted) return;

      try {
        // Foreground watch
        watchIdRef.current = Geolocation.watchPosition(
          location => {
            global.__locationUpdateCallback?.(location, false);
          },
          error => {
            console.error('Foreground location error:', error.message);
            setLocationError(error.message);
          },
          {
            accuracy: {
              android: 'high',
              ios: 'best',
            },
            interval: 3000, // every 3 seconds
            fastestInterval: 2000,
            distanceFilter: 5, // or every 5 metres
            forceRequestLocation: true,
            showsBackgroundLocationIndicator: true,
          },
        );

        // Background service (only when full background permission is available)
        if (permissionStatus === 'full' && !BackgroundActions.isRunning()) {
          await BackgroundActions.start(
            backgroundLocationTask,
            backgroundOptions,
          );
        }

        setIsTracking(true);
        setLocationError(null);
      } catch (err) {
        console.error('startTracking error:', err);
        isTrackingRef.current = false; // reset guard on failure
        setLocationError(err.message);
      }
    },
    [permissionStatus, requestPermissions],
  );
  startTrackingRef.current = startTracking;

  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (BackgroundActions.isRunning()) {
      await BackgroundActions.stop().catch(() => {});
    }

    onLocationUpdateRef.current = null;
    isTrackingRef.current = false;
    setIsTracking(false);
    setCurrentLocation(null);
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
          setLocationError(error.message);
          resolve(null);
        },
        {
          accuracy: { android: 'high', ios: 'best' },
          timeout: 15000,
          maximumAge: 10000,
          forceRequestLocation: true,
        },
      );
    });
  }, []);

  const updateCurrentLocation = useCallback(async (location) => {
     console.log('Updating current location in context:', location);
     if(location?.latitude && location?.longitude) {
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
  },[emit]);


  const updateMyGprsLocation = useCallback(async () => {
    console.log('Updating current location from GPRS...');
    const location = await getCurrentPosition();
    if(location?.latitude && location?.longitude) {
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

  },[emit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  useEffect(() => {
    if (!isConnected) {
      // Socket dropped — reset tracking guard so it restarts after reconnect
      isTrackingRef.current = false;
      return;
    }

    // Start tracking once the server confirms the personal room was joined.
    // SocketContext already emits join:personal on connect, so this fires
    // automatically after every (re)connect.
    const onPersonalRoomJoined = () => {
      console.log('Joined personal room, starting location tracking...');
      startTrackingRef.current(location => {
        console.log('Emitting location update to server:', location);
        emitNoAck('location:update', JSON.stringify({ loc: location }));
      });

      // Fallback interval for Android background — watchPosition is unreliable
      // when the app is backgrounded, so re-emit the last known location every 10s.
      
      // locationIntervalRef.current = setInterval(() => {
      //   console.log('Emitting periodic location update to server:');
      //  emitNoAck('location:update');
      // }, 90000); // every 90 seconds
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

    // Emit AFTER registering the listener — guarantees the server's
    // personal:room:joined response is never missed due to a race condition.
    emitNoAck('join:personal');

    return () => {
      unsubs.forEach(unsub => unsub());
      stopTrackingRef.current();
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    };
  }, [isConnected, on, emitNoAck]);

  const getContactsLastLocations = useCallback(async () => {
    console.log('Fetching contacts last locations from server...');
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
      if(response?.data){
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

   

  // Fetch contacts' last locations on mount
  useEffect(() => {
    if(isAuthenticated){
        getContactsLastLocations();
    }
  }, [getContactsLastLocations, isAuthenticated]);
  

   

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
        updateMyGprsLocation
        
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
