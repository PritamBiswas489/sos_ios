import { createSlice } from '@reduxjs/toolkit';
const initialState = {
  deleted_at: null,
  devices: [],
  email: null,
  hex_salt: null,
  id: null,
  is_active: true,
  is_online: false,
  is_verified: false,
  last_seen: null,
  licenses: {
    expiry_date: null,
    id: null,
    license_key: null,
    status: null,
  },
  name: null,
  ngo_certificate: null,
  ngo_id: null,
  ngo_number_of_user_assigned: null,
  ngo_number_of_user_registered: null,
  phone_number: null,
  profile_photo: null,
  role: 'USER',
  latitude: null,
  longitude: null,
};
const userSlice = createSlice({
  name: 'userProfileField',
  initialState: initialState,
  reducers: {
    setData(state, action) {
      state[action.payload.field] = action.payload.data;
    },
    setFullData(state, action) {
      return {
        ...state,
        ...action.payload,
      };
    },
    resetState(state) {
      return initialState;
    },
  },
});
export const userActions = userSlice.actions;
export default userSlice;
