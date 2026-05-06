import api from '../config/authApi.config';
export class TrustedContactService {
  static async saveTrustedContact(contactData, callback) {
    console.log('Saving trusted contact with data:', contactData);
    try {
      const response = await api.post(
        '/trusted-contact/send-contact-invitation',
        contactData,
      );

      callback({ success: true, data: response.data });
    } catch (error) {
      console.log('❌ Error saving trusted contact:', error?.message);
      callback({ success: false, error: error.message });
    }
  }
  //get trusted contacts
  static async getTrustedContacts(callback) {
    const url = '/trusted-contact/contacts?page=1&limit=100';
    try {
      const response = await api.get(url);

      callback({ success: true, data: response.data });
    } catch (error) {
      console.log('❌ Error fetching trusted contacts:', error?.message);
      callback({ success: false, error: error.message });
    }
  }
  static async getChatContactList(callback) {
    const url = '/trusted-contact/chat-contact-friend-list?page=1&limit=100';
    try {
      const response = await api.get(url);
      callback({ success: true, data: response.data });
    } catch (error) {
      console.log('❌ Error fetching chat contact list:', error?.message);
      callback({ success: false, error: error.message });
    }
  }
  //get incomming invitations
  static async incommingInvitations(callback) {
    const url = '/trusted-contact/pendings-incoming?page=1&limit=100';
    try {
      const response = await api.get(url);
      console.log(
        'Server response for fetching incoming invitations:',
        response.data,
      );
      callback({ success: true, data: response.data });
    } catch (error) {
      console.log('❌ Error fetching incoming invitations:', error?.message);
      callback({ success: false, error: error.message });
    }
  }
  //get outgoing invitations
  static async outgoingInvitations(callback) {
    const url = '/trusted-contact/pendings-outgoing?page=1&limit=100';
    try {
      const response = await api.get(url);
      // console.log('Server response for fetching outgoing invitations:', response.data);
      callback({ success: true, data: response.data });
    } catch (error) {
      console.log('❌ Error fetching outgoing invitations:', error?.message);
      callback({ success: false, error: error.message });
    }
  }
  static async acceptInvitation(invitationId, callback) {
    const url = `/trusted-contact/accept-contact-invitation`;
    try {
      const response = await api.post(url, { id: invitationId });
      callback({ success: true, data: response.data });
    } catch (error) {
      console.log('❌ Error accepting invitation:', error?.message);
      callback({ success: false, error: error.message });
    }
  }
  static async deleteInvitation(invitationId, callback) {
    const url = `/trusted-contact/delete-contact-invitation`;
    try {
      const response = await api.post(url, { id: invitationId });
      callback({ success: true, data: response.data });
    } catch (error) {
      console.log('❌ Error deleting invitation:', error?.message);
      callback({ success: false, error: error.message });
    }
  }
}