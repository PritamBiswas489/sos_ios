import api from '../config/authApi.config';
import { uploadMedia } from '../config/apiClient';
import { deleteAuthTokens } from '../config/auth';
export class UserService {
  static async fetchUserProfile(callback) {
    try {
      const response = await api.get('/user/profile/details');
      callback({ success: true, data: response.data });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  }

  static async logout() {
    await deleteAuthTokens();
  }

  static async saveFcmToken({ token, platform }, callback) {
    try {
      const response = await api.post('/user/profile/save-device-token', {
        device_token: token,
        device_type: platform,
      });
      callback({ success: true, data: response.data });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  }
  static async deleteFcmToken(callback) {
    try {
      const response = await api.post('/user/profile/delete-device-token');
      callback({ success: true, data: response.data });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  }

  static async updateProfile(formData, callback) {
    try {
      const response = await uploadMedia('/user/profile/update', formData);
      callback({ success: true, data: response.data });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  }
  static async checkDeviceidLastLogin(callback) {
    try {
      const response = await api.get('/user/profile/device-is-equal-to-last-login');
      callback({ success: true, data: response.data });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  }
}
