import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { trustedContactActions } from '../store/redux/trustedContactList.redux';
import { TrustedContactService } from '../services/trustedContact.service';

let inFlightTrustedContactsRequest = null;

export const useTrustedContacts = () => {
	const dispatch = useDispatch();
	const trustedContactList = useSelector(state => state.trustedContactList);
	const contactList = trustedContactList?.contact_list || [];

	const fetchTrustedContacts = useCallback(() => {
		if (inFlightTrustedContactsRequest) {
			return inFlightTrustedContactsRequest;
		}

		inFlightTrustedContactsRequest = new Promise(resolve => {
			try {
				TrustedContactService.getTrustedContacts(result => {
					if (result.success) {
						console.log('=====================================================');
						console.log('Trusted contacts fetched successfully:', result.data);
						console.log('=====================================================');

						dispatch(
							trustedContactActions.setTrustedContactList(result?.data?.data?.rows || []),
						);
					}

					resolve(result);
				});
			} catch (error) {
				console.log('❌ Error fetching trusted contacts:', error?.message);
				resolve({ success: false, error: error?.message });
			}
		}).finally(() => {
			inFlightTrustedContactsRequest = null;
		});

		return inFlightTrustedContactsRequest;
	}, [dispatch]);

	const setData = useCallback(data => {
		dispatch(trustedContactActions.setTrustedContactList(data));
	}, [dispatch]);

	return {
		contactList,
		fetchTrustedContacts,
		setData,
	};
};
