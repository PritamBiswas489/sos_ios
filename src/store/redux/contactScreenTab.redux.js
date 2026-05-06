import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tab: 'contact',
};

const contactScreentabSlice = createSlice({
  name: 'contactScreentab',
  initialState,
  reducers: {
    setCurrentTab(state, action) {
      state.tab = action.payload;
    },
    resetCurrentTab() {
      return initialState;
    },
  },
});

export const contactScreentabActions = contactScreentabSlice.actions;
export default contactScreentabSlice;
