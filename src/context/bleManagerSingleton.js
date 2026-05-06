/**
 * bleManagerSingleton.js
 *
 * Holds a single BleManager instance OUTSIDE React's component lifecycle.
 * Because this file does NOT export a React component, React Fast Refresh
 * never re-evaluates it during hot reload — so the manager survives
 * code changes without being destroyed and recreated.
 */
import {BleManager} from 'react-native-ble-plx';

let _manager = null;

/**
 * Returns the existing BleManager or creates a new one if needed.
 * Safe to call multiple times — always returns the same live instance.
 */
export function getBleManager() {
  if (!_manager) {
    _manager = new BleManager();
  }
  return _manager;
}

/**
 * Call this only on true app close (via AppState 'background'/'inactive').
 * Do NOT call this on hot reload / component unmount.
 */
export function destroyBleManager() {
  if (_manager) {
    _manager.destroy().catch(() => {});
    _manager = null;
  }
}
