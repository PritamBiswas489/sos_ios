import { createSlice } from '@reduxjs/toolkit';

const initialState = {
	siteSettings: {
		PROFILE_IMAGE_SIZE: 20971520,
		CHAT_MEDIA_FILE_SIZES: {
			image: 20971520,
			video: 104857600,
			audio: 20971520,
			document: 20971520,
		},
		EVIDENCE_FILE_SIZES: {
			image: 20971520,
			video: 104857600,
			audio: 20971520,
			document: 20971520,
		},
	},
};

const settingsSlice = createSlice({
	name: 'settings',
	initialState: initialState,
	reducers: {
		setSiteSettings(state, action) {
			state.siteSettings = {
				...state.siteSettings,
				...(action.payload || {}),
			};
		},
		setSettingsFromResponse(state, action) {
			state.siteSettings = {
				...state.siteSettings,
				...(action.payload?.data?.siteSettings || {}),
			};
		},
		resetState(state) {
			return initialState;
		},
	},
});

export const settingsActions = settingsSlice.actions;
export default settingsSlice;
