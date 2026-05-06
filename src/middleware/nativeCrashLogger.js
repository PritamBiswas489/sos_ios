// middleware/nativeCrashLogger.js
// Field names match DB columns exactly

import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import DeviceInfo from 'react-native-device-info';
import api from '../config/frontApi.config';

 
const LOG_FILE_PATH = `${RNFS.DocumentDirectoryPath}/crash_logs.json`;
const APP_VERSION   = '1.0.0';

const buildDeviceInfo = () => ({
  app_name: DeviceInfo.getApplicationName(),
  app_version: DeviceInfo.getVersion(),
  app_build_number: DeviceInfo.getBuildNumber(),
  bundle_id: DeviceInfo.getBundleId(),
  brand: DeviceInfo.getBrand(),
  model: DeviceInfo.getModel(),
  manufacturer: DeviceInfo.getManufacturerSync(),
  device_id: DeviceInfo.getDeviceId(),
  system_name: DeviceInfo.getSystemName(),
  system_version: DeviceInfo.getSystemVersion(),
  device_type: DeviceInfo.getDeviceType(),
  is_emulator: DeviceInfo.isEmulatorSync(),
  unique_id: DeviceInfo.getUniqueIdSync(),
  supported_abis: DeviceInfo.supportedAbisSync(),
  total_memory: DeviceInfo.getTotalMemorySync(),
  used_memory: DeviceInfo.getUsedMemorySync(),
  has_notch: DeviceInfo.hasNotch(),
  has_dynamic_island: DeviceInfo.hasDynamicIsland(),
  tablet: DeviceInfo.isTablet(),
});

// ─── BUILD PAYLOAD (field names = DB column names) ────────────────────────────
const buildPayload = ({ type, error, is_fatal = false, extra = {} }) => ({
  type,
  is_fatal,
  message:       error?.message || String(error),
  stack_trace:   error?.stack   || null,
  error_name:    error?.name    || 'UnknownError',
  platform:      Platform.OS,
  os_version:    String(Platform.Version),
  app_version:   APP_VERSION,
  crashed_at:    new Date().toISOString(),
  device_info:   buildDeviceInfo(),
  ...extra,
});
 

// ─── SEND TO API ──────────────────────────────────────────────────────────────
const sendToAPI = async (payload) => {
  console.log('[CrashLogger] Sending crash log to API...');
  try{
    await api.post('/crash-report/submit', payload)
    return true;
  }catch(e){
    console.warn('[CrashLogger] Failed to send crash log to API:', e.message);
    return false;
  }
  
  
};

// ─── LOCAL FILE ───────────────────────────────────────────────────────────────
const readCrashFile = async () => {
  try {
    const exists = await RNFS.exists(LOG_FILE_PATH);
    if (!exists) return [];
    return JSON.parse(await RNFS.readFile(LOG_FILE_PATH, 'utf8'));
  } catch { return []; }
};

const writeCrashFile = async (logs) => {
  try { await RNFS.writeFile(LOG_FILE_PATH, JSON.stringify(logs), 'utf8'); }
  catch (e) { console.warn('[CrashLogger] File write failed:', e.message); }
};

const appendCrashToFile = async (payload) => {
  const logs = await readCrashFile();
  logs.push(payload);
  await writeCrashFile(logs.slice(-100));
};

// ─── FLUSH QUEUE ON NEXT LAUNCH ───────────────────────────────────────────────
export const flushSavedCrashes = async () => {
  const logs = await readCrashFile();
  if (!logs.length) return;
  const failed = [];
  for (const log of logs) {
    const sent = await sendToAPI(log);
    if (!sent) failed.push(log);
  }
  await writeCrashFile(failed);
  console.log(`[CrashLogger] Flushed ${logs.length - failed.length} crash(es).`);
};

// ─── GLOBAL JS CRASH HANDLER ──────────────────────────────────────────────────
const setupGlobalHandler = () => {
  const prev = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler(async (error, isFatal) => {
    const payload = buildPayload({ type: 'JS_FATAL_CRASH', error, is_fatal: isFatal });
    await appendCrashToFile(payload);
    sendToAPI(payload).catch(() => {});
    if (prev) prev(error, isFatal);
  });
};

// ─── UNHANDLED PROMISE REJECTION ─────────────────────────────────────────────
const setupPromiseHandler = () => {
  try {
    const tracking = require('promise/setimmediate/rejection-tracking');
    tracking.enable({
      allRejections: true,
      onUnhandled: async (id, error) => {
        const payload = buildPayload({
          type: 'UNHANDLED_PROMISE',
          error,
          extra: { promise_id: id },
        });
        await appendCrashToFile(payload);
        sendToAPI(payload).catch(() => {});
      },
      onHandled: () => {},
    });
  } catch { }
};

// ─── MANUAL ERROR LOGGING ─────────────────────────────────────────────────────
export const logError = async (error, context = {}) => {
  const payload = buildPayload({ type: 'MANUAL_ERROR', error, extra: context });
  await appendCrashToFile(payload);
  const sent = await sendToAPI(payload);
  if (!sent) console.warn('[CrashLogger] Queued manually reported error.');
};

// ─── COMPONENT CRASH ─────────────────────────────────────────────────────────
export const logComponentCrash = async (error, component_stack) => {
  const payload = buildPayload({
    type: 'COMPONENT_CRASH',
    error,
    extra: { component_stack },
  });
  await appendCrashToFile(payload);
  sendToAPI(payload).catch(() => {});
};

// ─── UTILS ───────────────────────────────────────────────────────────────────
export const getLocalCrashLogs   = async () => await readCrashFile();
export const clearLocalCrashLogs = async () => await writeCrashFile([]);

// ─── INIT ─────────────────────────────────────────────────────────────────────
export const initCrashLogger = () => {
  setupGlobalHandler();
  setupPromiseHandler();
  flushSavedCrashes();
  console.log('[CrashLogger] Ready');
};
