import api from '../config/authApi.config';
export class SOSService {
  static async createNewSOS({ latitude, longitude }, callback) {
    try {
      const response = await api.post('/sos/register-sos', { latitude, longitude });
      callback({ success: true, data: response.data });
    } catch (error) {
      console.log('❌ Error creating SOS:', error?.message);
      callback({ success: false, error: error.message });
    }
  }
  static async fetchIncomingSosNotifications(
    { limit, page, status },
    callback,
  ) {
    try {
      const response = await api.post('/sos/incomming-sos-notification', {
        limit,
        page,
        status,
      });
      callback({ success: true, data: response.data });
    } catch (error) {
      console.log(
        '❌ Error fetching incoming SOS notifications:',
        error?.message,
      );
      callback({ success: false, error: error.message });
    }
  }
  static async fetchMySosSessions({ limit, page, status }, callback) {
    try {
      const response = await api.post('/sos/my-sos-sessions', {
        limit,
        page,
        status,
      });
      callback({ success: true, data: response.data });
    } catch (error) {
      console.log('❌ Error fetching my SOS sessions:', error?.message);
      callback({ success: false, error: error.message });
    }
  }

  static async reponseSosNotification({ notification_id, status }, callback) {
    try {
      const response = await api.post('/sos/response-sos-notification', {
        notification_id,
        status,
      });
      callback({ success: true, data: response.data });
    } catch (error) {
      console.log('❌ Error responding to SOS notification:', error?.message);
      callback({ success: false, error: error.message });
    }
  }
  static async changeMySosSessionStatus({ session_id, status }, callback) {
    try {
      const response = await api.post('/sos/change-my-sos-session-status', {
        session_id,
        status,
      });
      callback({ success: true, data: response.data });
    } catch (error) {
      console.log('❌ Error changing my SOS session status:', error?.message);
      callback({ success: false, error: error.message });
    }
  }
  static async triggerStressSos({hr, stress_score, latitude, longitude}, callback) {
    console.log(`Triggering stress SOS with HR: ${hr} and Stress Score: ${stress_score}`);
    try {
      const response = await api.post('/sos/trigger-stress-sos', {
        hr,
        stress_score,
        latitude,
        longitude,
      });
      callback({ success: true, data: response.data });
    } catch (error) {
      console.log('❌ Error triggering stress SOS:', error?.message);
      callback({ success: false, error: error.message });
    }
  }
  
   
}
