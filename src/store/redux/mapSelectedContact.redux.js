import { createSlice } from '@reduxjs/toolkit';
const initialState = {};
const mapSelectedContactSlice = createSlice({
  name: 'mapSelectedContact',
  initialState: initialState,
  reducers: {
    setMapSelectedContact(state, action) {
      return action.payload;
    },
    resetState(state) {
      return initialState;
    },
  },
});
export const mapSelectedContactActions = mapSelectedContactSlice.actions;
export default mapSelectedContactSlice;
