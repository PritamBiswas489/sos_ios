import DeviceInfo from 'react-native-device-info';

// Fetched once at module load time and cached forever.
// Awaiting this promise in interceptors costs nothing after the first resolution.
const deviceIdPromise = DeviceInfo.getUniqueId();

let cachedDeviceId = null;
deviceIdPromise.then(id => { cachedDeviceId = id; });

/** Synchronous — returns null only before the first resolution (extremely rare). */
export const getDeviceId = () => cachedDeviceId;

/** Async — always resolves with the real ID. Use this in interceptors. */
export const getDeviceIdAsync = () => deviceIdPromise;
