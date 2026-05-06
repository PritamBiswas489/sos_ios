import api from '../config/authApi.config';

export class LocationsService {
  static async getContactsLastLocations(callback) {
    try {
       const response = await api.get('/trusted-contact/contacts-get-locations');
       callback({ success: true, data: response.data });
    } catch (error) {
      console.log('❌ Error fetching contacts last locations:', error?.message);
      callback({ success: false, error: error.message });
    }
  }
}
