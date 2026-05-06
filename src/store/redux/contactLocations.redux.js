import { createSlice } from '@reduxjs/toolkit';
const initialState = {
  contact_locations: {}, // store as object for Redux serialization
};
const contactLocationsSlice = createSlice({
  name: 'contactLocations',
  initialState: initialState,
  reducers: {
    setContactLocations(state, action) {
      // Accepts an object with userId as key and location as value
      // Merges with existing contact_locations
      const incoming = action.payload;
      state.contact_locations = {
        ...(state.contact_locations || {}),
        ...incoming,
      };
    },
    resetState(state) {
      return initialState;
    },
  },
});
export const contactLocationsActions = contactLocationsSlice.actions;
export default contactLocationsSlice;
