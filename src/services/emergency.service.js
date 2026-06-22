import api from '../config/authApi.config';
export class EmergencyService {
    static async submitEmergencyCall(form, callback) {
        try {
            const response = await api.post('/emergency-services/request-register-new-location', form);
            callback({ success: true, data: response.data });
        } catch (error) {
            console.log('❌ Error submitting emergency call:', error?.message);
            callback({ success: false, error: error.message });
        }
    }

    static async fetchMyRequestedServices(page = 1, limit = 10, callback) {
        try {
            const url = `/emergency-services/get-my-requested-emergency-services?page=${page}&limit=${limit}`;
            const response = await api.get(url);
            callback({ success: true, data: response.data });
        } catch (error) {
            console.log('❌ Error fetching requested services:', error?.message);
            callback({ success: false, error: error.message });
        }
    }

    static async fetchNearbyServices(latitude, longitude, radius, serviceType,  callback) {
        try {
            let url = `/emergency-services/get-nearby-emergency-services?latitude=${latitude}&longitude=${longitude}&radius=${radius}`;
            if(serviceType && serviceType !== 'all') {
                url += `&serviceType=${serviceType}`;
            }
            const response = await api.get(url);
            callback({ success: true, data: response.data });
        } catch (error) {
            console.log('❌ Error fetching nearby services:', error?.message);
            callback({ success: false, error: error.message });
        }
    }

}