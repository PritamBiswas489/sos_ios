import axios from 'axios';
import { getAppUrl } from './utility';
const app_url =  getAppUrl();
 
const API_PROCESS = axios.create({
	baseURL: app_url + '/api/v1',
	timeout: 15000,
});

API_PROCESS.interceptors.request.use(async (config) => {
	const fullRequestUrl = `${config.baseURL}${config.url}`;
	config.headers = {
		'Content-Type': 'multipart/form-data',
	};
	console.log('Request URL:', fullRequestUrl);
	return config; 
});
API_PROCESS.interceptors.response.use(async (res) => {
    
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
    return Promise.reject(error);
});
export default API_PROCESS;
