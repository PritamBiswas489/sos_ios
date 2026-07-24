import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { settingsActions } from '../store/redux/settings.redux';
import { SettingsService } from '../services/settings.service';

let inFlightSettingsRequest = null;

export const useSettings = () => {
	const dispatch = useDispatch();
	const settings = useSelector(state => state.settings);
	const siteSettings = settings?.siteSettings || {};

	const fetchSettings = useCallback(() => {
		if (inFlightSettingsRequest) {
			return inFlightSettingsRequest;
		}

		inFlightSettingsRequest = new Promise(resolve => {
			try {
				SettingsService.getSettings(result => {
					if (result.success) {
						dispatch(settingsActions.setSettingsFromResponse(result.data));
					}
					resolve(result.data?.data?.siteSettings || {});
				});
			} catch (error) {
				console.log('❌ Error fetching app settings:', error?.message);
				resolve({ success: false, error: error?.message });
			}
		}).finally(() => {
			inFlightSettingsRequest = null;
		});

		return inFlightSettingsRequest;
	}, [dispatch]);

	const setSettings = useCallback(
		data => {
			dispatch(settingsActions.setSiteSettings(data || {}));
		},
		[dispatch],
	);

	return {
		settings,
		siteSettings,
		fetchSettings,
		setSettings,
	};
};
