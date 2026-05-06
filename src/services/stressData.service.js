import api from '../config/authApi.config';
import {buildStressRecord} from '../models/stressRecord.model';

const STRESS_DB_ENDPOINT = '/health/save-stress-reading';
const STRESS_LIST_ENDPOINT = '/health/stress-readings';
const STRESS_LATEST_ENDPOINT = '/health/stress-readings/latest';
const STRESS_CONTACTS_LAST_HEALTH_DATA_ENDPOINT = '/trusted-contact/contacts-get-heart-rate-readings';

export class StressDataService {
  static async insertFromContext(payload, callback = () => {}) {
    try {
     
      if (!payload) {
        callback({success: false, error: 'No device/Health Connect data to save'});
        return;
      }

      const response = await api.post(STRESS_DB_ENDPOINT, payload);
      callback({success: true, data: {record: payload, remote: response.data}});
    } catch (error) {
      callback({
        success: false,
        error: error?.message ?? 'Database insert failed',
      });
    }
  }

  static async getAll(callback = () => {}) {
    try {
      const response = await api.get(STRESS_LIST_ENDPOINT);
      const rows = response?.data?.data ?? response?.data ?? [];
      callback({success: true, data: rows});
    } catch (error) {
      callback({success: false, error: error?.message ?? 'Read failed', data: []});
    }
  }

  static async getLatest(callback = () => {}) {
    try {
      const response = await api.get(STRESS_LATEST_ENDPOINT);
      const row = response?.data?.data ?? response?.data ?? null;
      callback({success: true, data: row});
    } catch (error) {
      callback({success: false, error: error?.message ?? 'Latest read failed', data: null});
    }
  }

  static async clearAll(callback = () => {}) {
    callback({
      success: false,
      error: 'Clear is not supported in API-only mode. Use backend endpoint if needed.',
    });
  }

  static async getContactsLastHealthData(callback = () => {}) {
    try {
      const response = await api.get(STRESS_CONTACTS_LAST_HEALTH_DATA_ENDPOINT);
      const data = response?.data?.data ?? response?.data ?? null;
      callback({success: true, data});
    } catch (error) {
      callback({success: false, error: error?.message ?? 'Failed to fetch contacts last health data', data: null});
    }
  }
}
