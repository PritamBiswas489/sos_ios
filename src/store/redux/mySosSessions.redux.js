import { createSlice } from '@reduxjs/toolkit';
const initialState = {
  sos_notification_list: [],
  limit: 10,
  page: 1,
  status:'active', //active, expired, cancelled, resolved
  isLoading: false,
  hasMore: true,
};
// This slice is specifically for managing the state of SOS sessions.
const mySosSessionsSlice = createSlice({
  name: 'mySosSessions',
    initialState: initialState,
    reducers: {
    setSosNotificationList(state, action) {
      state.sos_notification_list = action.payload;
    },
    appendSosNotificationList(state, action) {
      state.sos_notification_list = [...state.sos_notification_list, ...action.payload];
    },
    setLimit(state, action) {
      state.limit = action.payload;
    },
    setPage(state, action) {
      state.page = action.payload;
    },
    setStatus(state, action) {
      state.status = action.payload;
    },
    setLoading(state, action) {
      state.isLoading = action.payload;
    },
    setHasMore(state, action) {
      state.hasMore = action.payload;
    },
    resetState(state) {
      return initialState;
    },
  },
});
export const mySosSessionsActions = mySosSessionsSlice.actions;
export default mySosSessionsSlice;