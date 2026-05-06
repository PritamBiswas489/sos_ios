import { createSlice } from '@reduxjs/toolkit';
const initialState = {};
const chatSelectedTrustedContactSlice = createSlice({
  name: 'chatSelectedTrustedContact',
  initialState: initialState,
  reducers: {
    setSelectedTrustedContact(state, action) {
      return action.payload;
    },
     resetState(state) {
      return initialState;
    },
  },
});
export const chatSelectedTrustedContactActions =
  chatSelectedTrustedContactSlice.actions;
export default chatSelectedTrustedContactSlice;
