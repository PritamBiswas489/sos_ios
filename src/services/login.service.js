import api from '../config/frontApi.config';
export class LoginService {
  static async requestOtp(payload, callback) {
    try {
      const response = await api.post('/login/send-otp', payload);
      callback({ success: true, data: response.data });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  }
  static async verifyOtp(payload, callback) {
    try {
      const response = await api.post('/login/verify-otp', payload);
      callback({ success: true, data: response.data });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  }
  static async processLogin(payload, callback) {
    try {
      const response = await api.post('/login/create-user-after-otp-verification', payload);
      callback({ success: true, data: response.data });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  }
  static async checkMobileHasLicense(payload, callback) {
    try {
      const response = await api.get('/login/check-mobile-number-has-license', { params: payload });
      callback({ success: true, data: response.data });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  }
}
