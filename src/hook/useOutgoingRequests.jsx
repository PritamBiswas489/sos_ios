import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { trustedContactOutgongRequestActions } from '../store/redux/trustedContactOutgongRequest.redux';
import { TrustedContactService } from '../services/trustedContact.service';

let inFlightOutgoingRequests = null;

export const useOutgoingRequests = () => {
	const dispatch = useDispatch();
	const outgoingRequestState = useSelector(
		state => state.trustedContactOutgongRequest,
	);
	const contactList = outgoingRequestState?.contact_list || [];

	const fetchOutgoingRequests = useCallback(() => {
		if (inFlightOutgoingRequests) {
			return inFlightOutgoingRequests;
		}

		inFlightOutgoingRequests = new Promise(resolve => {
			try {
				TrustedContactService.outgoingInvitations(result => {
					if (result.success) {
						console.log('=====================================================');
						console.log('Outgoing trusted requests fetched successfully:', result.data);
						console.log('=====================================================');

						dispatch(
							trustedContactOutgongRequestActions.setTrustedContactList(
								result?.data?.data?.rows || [],
							),
						);
					}

					resolve(result);
				});
			} catch (error) {
				console.log('❌ Error fetching outgoing trusted requests:', error?.message);
				resolve({ success: false, error: error?.message });
			}
		}).finally(() => {
			inFlightOutgoingRequests = null;
		});

		return inFlightOutgoingRequests;
	}, [dispatch]);

	const setData = useCallback(data => {
		dispatch(trustedContactOutgongRequestActions.setTrustedContactList(data));
	}, [dispatch]);

	return {
		contactList,
		fetchOutgoingRequests,
		setData,
	};
};