import { createSlice } from '@reduxjs/toolkit';
const initialState = {
  contact_list: []
};
const trustedContactOutgongRequestSlice = createSlice({
  name: 'trustedContactOutgongRequest',
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
export const trustedContactOutgongRequestActions = trustedContactOutgongRequestSlice.actions;
export default trustedContactOutgongRequestSlice;