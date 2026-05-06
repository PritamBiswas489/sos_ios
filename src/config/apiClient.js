import { getAuthTokens, setAuthTokens, deleteAuthTokens } from './auth';
import { getAppUrl } from './utility';
import * as storage from '../utils/localstorage/index.jsx';
import store, { resetAllState } from '../store/index';
import { Alert } from 'react-native';
import { navigate } from '../utils/navigationService';
import { getDeviceIdAsync } from '../utils/deviceId';
const BASE_URL = `${getAppUrl()}/api-mobile/auth`;

// ---------------------------------------------------------------------------
// Shared logout helper
// ---------------------------------------------------------------------------

const resetStateData = async () => {
  await deleteAuthTokens();
  store.dispatch(resetAllState());
  navigate('Login');
};

// ---------------------------------------------------------------------------
// Shared auth header builder
// ---------------------------------------------------------------------------

const buildAuthHeaders = async (extraHeaders = {}) => {
  const { accessToken, refreshToken } = await getAuthTokens();
  const languageCode = (await storage.getValue('languageCode')) || 'en';
  const deviceId = await getDeviceIdAsync();
  return {
    Authorization: `Bearer ${accessToken}`,
    refreshToken: refreshToken,
    'X-localization': languageCode,
    ...extraHeaders,
    'x-device-id': deviceId,
  };
};

// ---------------------------------------------------------------------------
// Shared token refresh handler
// ---------------------------------------------------------------------------

const handleTokenRefresh = async (data) => {
  const newAccessToken = data?.meta?.accesstoken;
  const newRefreshToken = data?.meta?.refreshtoken;
  if (newAccessToken && newRefreshToken) {
    await setAuthTokens(newAccessToken, newRefreshToken);
  }
};

// ---------------------------------------------------------------------------
// Shared response parser + error handler
// ---------------------------------------------------------------------------

const parseResponse = async (response, url) => {
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Invalid server response');
  }

  // Handle token refresh from response meta
  await handleTokenRefresh(data);

  if (response.status === 401 || data?.status === 401) {
    await resetStateData();
    throw new Error('UNAUTHORIZED');
  }

  if (response.status === 403 || data?.status === 403) {
    Alert.alert('Access Denied', 'You do not have permission to perform this action.');
    await resetStateData();
    throw new Error('FORBIDDEN');
  }

  if (!response.ok) {
    const serverMessage = data?.error?.message;
    console.error('[API] Response error:', response.status, data);
    throw new Error(serverMessage || `Request failed with status ${response.status}`);
  }

  return data;
};

const handleNetworkError = (error, url) => {
  console.error('[API] No response received — URL:', url, 'message:', error.message);
  throw new Error('Network Error');
};

// ---------------------------------------------------------------------------
// jsonClient — fetch wrapper for regular JSON requests
// ---------------------------------------------------------------------------

/**
 * Make a JSON API request.
 *
 * @param {string} method           - HTTP method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
 * @param {string} endpoint         - e.g. '/login'
 * @param {object} [body]           - request body (will be JSON.stringify'd)
 * @param {object} [extraHeaders]   - any additional headers
 * @returns {Promise<{ data: any }>} - wraps response in { data } to match axios shape
 *
 * @example
 * const res = await jsonClient('POST', '/login', { email, password });
 * console.log(res.data);
 */
export const jsonClient = async (method, endpoint, body = null, extraHeaders = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const headers = await buildAuthHeaders({
    'Content-Type': 'application/json',
    ...extraHeaders,
  });

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });
  } catch (error) {
    handleNetworkError(error, url);
  }

  const data = await parseResponse(response, url);

  // Wrap in { data } to keep the same shape as axios responses
  return { data };
};

// Convenience methods to match axios usage
jsonClient.get    = (endpoint, extraHeaders)       => jsonClient('GET',    endpoint, null, extraHeaders);
jsonClient.post   = (endpoint, body, extraHeaders) => jsonClient('POST',   endpoint, body, extraHeaders);
jsonClient.put    = (endpoint, body, extraHeaders) => jsonClient('PUT',    endpoint, body, extraHeaders);
jsonClient.patch  = (endpoint, body, extraHeaders) => jsonClient('PATCH',  endpoint, body, extraHeaders);
jsonClient.delete = (endpoint, extraHeaders)       => jsonClient('DELETE', endpoint, null, extraHeaders);

// ---------------------------------------------------------------------------
// uploadMedia — fetch-based uploader for multipart/FormData requests
//
// Why no Content-Type header?
// React Native's XHR layer automatically sets:
// 'multipart/form-data; boundary=xxxxxxxx'
// If Content-Type is pre-set (even to multipart/form-data without a boundary),
// the server cannot parse the body and the request fails.
// ---------------------------------------------------------------------------

/**
 * Upload a FormData payload to the given endpoint.
 *
 * @param {string}   endpoint  - e.g. '/chat/upload-media'
 * @param {FormData} formData  - FormData with { uri, type, name } file entries
 * @returns {Promise<any>}     - parsed JSON response body
 *
 * @example
 * const formData = new FormData();
 * formData.append('file', { uri, type: mimeType, name: fileName });
 * const data = await uploadMedia('/chat/upload-media', formData);
 */
export const uploadMedia = async (endpoint, formData) => {
  const url = `${BASE_URL}${endpoint}`;

  // ✅ DO NOT set Content-Type — RN XHR sets multipart/form-data + boundary automatically
  const headers = await buildAuthHeaders();

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,  // ← no Content-Type
      body: formData,
    });
  } catch (error) {
    handleNetworkError(error, url);
  }

  return await parseResponse(response, url);
};

export default jsonClient;