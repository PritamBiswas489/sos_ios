import api from '../config/authApi.config';
export class SOSService {
  static async createNewSOS(callback) {
    try {
      const response = await api.post('/sos/register-sos', {});
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
  static async triggerStressSos(request, callback) {
     try{
      const { payload, headers, user } = request;
      const {hr, stress_score, latitude, longitude } = payload;
      const userId = user?.id;

      return await this.registerSosSession({ userid: userId, payload: { hr, stress_score, latitude, longitude, type: "stress" }, headers }, (err, response) => {
        if (err) {
          return callback(err, null);
        }
        return callback(null, { data: response.data });
      });
      
     }catch(e){
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      logger.error("ERROR In triggerStressSos", { error: e });
      console.error("Error triggering stress SOS:", e.message);
      return callback(new Error("TRIGGER_STRESS_SOS_FAILED"), null);
     }

  }
  
   
}
