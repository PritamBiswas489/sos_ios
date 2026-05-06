import { configureStore, combineReducers, createAction } from '@reduxjs/toolkit';
import userSlice from './redux/user.redux';
import trustedContactSlice from './redux/trustedContactList.redux';
import trustedContactIncommingRequestSlice from './redux/trustedContactIncommingRequest.redux';
import trustedContactOutgongRequestSlice from './redux/trustedContactOutgongRequest.redux';
import chatSelectedTrustedContactSlice from './redux/chatSelectedTrustedContact.redux';
import selectedReplyMessageSlice from './redux/selectedReplyMessage.redux';
import chatContactSlice from './redux/chatContactList.redux';
import currentScreenSlice from './redux/currentScreen.redux';
import contactScreentabSlice from './redux/contactScreenTab.redux';
import contactLocationsSlice from './redux/contactLocations.redux';
import mapSelectedContactSlice from './redux/mapSelectedContact.redux';
import audioSelectedContactSlice from './redux/audioSelectedContact.redux';
import incomingSosNotificationSlice from './redux/incomingSosNotification.redux';
import mySosSessionsSlice from './redux/mySosSessions.redux';
import healthSelectedContactSlice from './redux/healthSelectedContact.redux';
import deviceIdSlice from './redux/useDeviceId.redux';
import authSlice from './redux/useAuth.redux';

export const resetAllState = createAction('store/resetAll');

const appReducer = combineReducers({
  userProviderData: userSlice.reducer,
  trustedContactList: trustedContactSlice.reducer,
  trustedContactIncommingRequest: trustedContactIncommingRequestSlice.reducer,
  trustedContactOutgongRequest: trustedContactOutgongRequestSlice.reducer,
  chatSelectedTrustedContact: chatSelectedTrustedContactSlice.reducer,
  selectedReplyMessage: selectedReplyMessageSlice.reducer,
  chatContactList: chatContactSlice.reducer,
  currentScreen: currentScreenSlice.reducer,
  contactScreentab: contactScreentabSlice.reducer,
  contactLocations: contactLocationsSlice.reducer,
  mapSelectedContact: mapSelectedContactSlice.reducer,
  audioSelectedContact: audioSelectedContactSlice.reducer,
  incomingSosNotification: incomingSosNotificationSlice.reducer,
  mySosSessions: mySosSessionsSlice.reducer,
  healthSelectedContact: healthSelectedContactSlice.reducer,
  deviceId: deviceIdSlice.reducer,
  auth: authSlice.reducer,
});

const rootReducer = (state, action) => {
  if (action.type === resetAllState.type) {
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
};

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        warnAfter: 128,
      },
    }),
});

export default store;
