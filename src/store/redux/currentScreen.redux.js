import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  name: null,
};

const currentScreenSlice = createSlice({
  name: 'currentScreen',
  initialState,
  reducers: {
    setCurrentScreen(state, action) {
      state.name = action.payload;
    },
    resetCurrentScreen() {
      return initialState;
    },
  },
});

export const currentScreenActions = currentScreenSlice.actions;
export default currentScreenSlice;
