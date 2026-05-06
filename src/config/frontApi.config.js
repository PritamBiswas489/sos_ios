import axios from 'axios';
import { getAppUrl } from './utility';
import { getDeviceIdAsync } from '../utils/deviceId';
const app_url =  getAppUrl();
const api = axios.create({
	baseURL: app_url + '/api-mobile/front',
	timeout: 15000,
});

api.interceptors.request.use(async (config) => {
	const fullRequestUrl = `${config.baseURL}${config.url}`;
    // console.log(config.method)
	// if(config.method!=='get'){
    //     console.log('sdsd')
	// 	config.headers = {
	// 		'Content-Type': 'multipart/form-data',
	// 	};
	// }

	const deviceId = await getDeviceIdAsync();
    console.log('Adding device ID to headers:', deviceId);
	if (deviceId) {
		config.headers = {
			...config.headers,
			'x-device-id': deviceId,
		};
	}
	 
	console.log('Request URL:', fullRequestUrl);
	return config;
});

api.interceptors.response.use(async (res) => {
    
    return res;
}, error => {
    console.error('Response Error:', error);
    if (error.response) {
        // The request was made and the server responded with a status code outside the range of 2xx
        console.error('Response Data:', error.response.data);
        console.error('Response Status:', error.response.status);
        console.error('Response Headers:', error.response.headers);
    } else if (error.request) {
        // The request was made but no response was received
        console.error('Request Data:', error.request);
    } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error Message:', error.message);
    }
    console.log("================================")
    console.error(error?.response?.data?.error?.message);
    return Promise.reject(error?.response?.data?.error?.message ?  new Error(error.response.data.error.message) : error);
});

export default api;
