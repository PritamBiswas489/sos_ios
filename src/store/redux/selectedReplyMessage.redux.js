import { createSlice } from '@reduxjs/toolkit';
const initialState = {};
const selectedReplyMessageSlice = createSlice({
  name: 'chatSelectedReplyMessage',
  initialState: initialState,
  reducers: {
    setSelectedReplyMessage(state, action) {
      return action.payload;
    },
     resetState(state) {
      return initialState;
    },
  },
});

export const selectedReplyMessageActions = selectedReplyMessageSlice.actions;
export default selectedReplyMessageSlice;
