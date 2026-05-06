import { createSlice } from '@reduxjs/toolkit';
const initialState = {
    contact_list: [],
};
// This slice is specifically for managing the state of incoming trusted contact requests.
const trustedContactIncommingRequestSlice = createSlice({
  name: 'trustedContactIncommingRequest',
  initialState: initialState,
  reducers: {
    setTrustedContactList(state, action) {
      state.contact_list = action.payload;
    },
    resetState(state) {
      return initialState;
    },
  },
});
export const trustedContactIncommingRequestActions = trustedContactIncommingRequestSlice.actions;
export default trustedContactIncommingRequestSlice;