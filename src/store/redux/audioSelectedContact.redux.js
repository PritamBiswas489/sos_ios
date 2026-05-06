import { createSlice } from '@reduxjs/toolkit';
const initialState = {};
const audioSelectedContactSlice = createSlice({
  name: 'audioSelectedContact',
  initialState: initialState,
  reducers: {
    setAudioSelectedContact(state, action) {
      return action.payload;
    },
    resetState(state) {
      return initialState;
    },
  },
});
export const audioSelectedContactActions = audioSelectedContactSlice.actions;
export default audioSelectedContactSlice;
