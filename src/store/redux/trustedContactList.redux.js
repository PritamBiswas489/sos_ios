import { createSlice } from '@reduxjs/toolkit';
const initialState = {
  contact_list: [],
};
const trustedContactSlice = createSlice({
  name: 'trustedContactList',
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
export const trustedContactActions = trustedContactSlice.actions;
export default trustedContactSlice;