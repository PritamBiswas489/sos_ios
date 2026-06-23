import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { chatContactActions } from '../store/redux/chatContactList.redux';
import { TrustedContactService } from '../services/trustedContact.service';
import { useUserData } from './useUserData';
import useUserAuth from './useUserAuth';
let inFlightChatContactsRequest = null;

export const useChatContacts = () => {
    const dispatch = useDispatch();
    const { userData } = useUserData();
    const chatContactList = useSelector(state => state.chatContactList);
    const { isAuthenticated } = useUserAuth();
    const contactList = chatContactList?.contact_list || [];
    
    const fetchChatContacts = useCallback(() => {
      if (!isAuthenticated) {
        return;
      }
      if (inFlightChatContactsRequest) {
        return inFlightChatContactsRequest;
      }

      inFlightChatContactsRequest = new Promise(resolve => {
            try {
                TrustedContactService.getChatContactList(result => {
                  if (result.success) {
                    console.log('=====================================================');
                    console.log('Chat contact list fetched successfully:', result.data);
                    console.log('=====================================================');
                    dispatch(
                      chatContactActions.setChatContactList(
                        result.data.data,
                      ),
                    );
                  }
                  resolve(result);
                });
            } catch (error) {
                console.log('❌ Error fetching chat contacts:', error?.message);
                resolve({ success: false, error: error?.message });
            }
          }).finally(() => {
            inFlightChatContactsRequest = null;
          });

          return inFlightChatContactsRequest;
    }, [dispatch, isAuthenticated]);

    const lengthCalculation = useCallback(() => {
      if (!contactList || contactList.length === 0) {
        return 0;
      }
      const uniqueContacts = new Set();
      contactList.forEach(contact => {
        uniqueContacts.add(contact.user_id);
        uniqueContacts.add(contact.trusted_user_id);
      });
      uniqueContacts.delete(userData?.id);
      return uniqueContacts.size;
      
    }, [contactList]);


    

    return {
        contactList,
        fetchChatContacts,
        lengthCalculation
    }
     


}