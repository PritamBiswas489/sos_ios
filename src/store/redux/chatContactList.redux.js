import { createSlice } from '@reduxjs/toolkit';
const initialState = {
  contact_list: [],
};
const chatContactSlice = createSlice({
  name: 'chatContactList',
  initialState: initialState,
  reducers: {
    setChatContactList(state, action) {
      state.contact_list = action.payload;
    },
    
    resetState(state) {
      return initialState;
    },
  },
});
export const chatContactActions = chatContactSlice.actions;
export default chatContactSlice;