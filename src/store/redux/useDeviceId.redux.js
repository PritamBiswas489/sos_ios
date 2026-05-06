import { createSlice } from "@reduxjs/toolkit";
const initialState = {
  device_id: null,
};
const deviceIdSlice = createSlice({
  name: "deviceId",
  initialState: initialState,
    reducers: {
    setDeviceId(state, action) {
      state.device_id = action.payload;
    }
    },
});
export const deviceIdActions = deviceIdSlice.actions;
export default deviceIdSlice;