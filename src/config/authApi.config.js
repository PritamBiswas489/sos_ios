import axios from 'axios';
import { getAuthTokens, setAuthTokens, deleteAuthTokens } from './auth';
import { Alert } from 'react-native';
import { getAppUrl } from './utility';
import store from '../store/index';
import { resetAllState } from '../store/index';
import { navigate } from '../utils/navigationService';
import { getDeviceIdAsync } from '../utils/deviceId';
import * as storeage from "../utils/localstorage/index.jsx";
 

const app_url =  getAppUrl();
console.log(app_url + '/api-mobile/auth');
const api = axios.create({
	baseURL: app_url + '/api-mobile/auth',
	timeout: 15000,
});

const resetStateData = async () => {
    
	await deleteAuthTokens();
	store.dispatch(resetAllState());
	navigate('Login');
};

api.interceptors.request.use(async (config) => {
	const {accessToken, refreshToken} = await getAuthTokens();
    const languageCode = await storeage.getValue('languageCode');
	const deviceId = await getDeviceIdAsync();
    
	config.headers = {
    ...config.headers,
    Authorization: 'Bearer ' + accessToken,
    refreshToken: refreshToken,
    'X-localization': languageCode || 'en',
    'x-device-id': deviceId,
  };
    // console.log(config.headers)
	const fullRequestUrl = `${config.baseURL}${config.url}`;
	console.log('Request URL:', fullRequestUrl);
	
	return config;
});

api.interceptors.response.use(async (res) => {
    const accesstoken = res?.data?.meta?.accesstoken || '';
    const refreshtoken = res?.data?.meta?.refreshtoken || '';

    if (accesstoken && refreshtoken) {
        await setAuthTokens(accesstoken, refreshtoken);
    }
    if (res?.data?.status === 401) {        
        await resetStateData();
        return Promise.reject(new Error('UNAUTHORIZED'));
    }
    if (res?.data?.status === 403) {
        Alert.alert(
            'Access Denied',
            'You do not have permission to perform this action.');
        await resetStateData();      
        return Promise.reject(new Error('FORBIDDEN'));
    }
    return res;
}, error => {
    console.log('Response Error:', error);
    if (error.response) {
        // The request was made and the server responded with a status code outside the range of 2xx
        console.log('Response Data:', error.response.data);
        console.log('Response Status:', error.response.status);
        console.log('Response Headers:', error.response.headers);
    } else if (error.request) {
        // The request was made but no response was received
        console.log('Request Data:', error.request);
    } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error Message:', error.message);
    }
     console.log("================================")
    //console.error(error?.response?.data?.error?.message);
    return Promise.reject(error?.response?.data?.error?.message ?  new Error(error.response.data.error.message) : error);
});
export default api;
