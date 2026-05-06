import { createSlice } from '@reduxjs/toolkit';
const initialState = {
  isMe: true,
  item: null, 
};
const healthSelectedContactSlice = createSlice({
  name: 'healthSelectedContact',
  initialState: initialState,
  reducers: {
    setHealthSelectedContact(state, action) {
      return action.payload;
    },
    resetState(state) {
      return initialState;
    },
  },
});
export const healthSelectedContactActions = healthSelectedContactSlice.actions;
export default healthSelectedContactSlice;