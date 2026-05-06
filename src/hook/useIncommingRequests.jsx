import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { trustedContactIncommingRequestActions } from '../store/redux/trustedContactIncommingRequest.redux';
import { TrustedContactService } from '../services/trustedContact.service';

let inFlightIncommingRequests = null;

export const useIncommingRequests = () => {
	const dispatch = useDispatch();
	const incommingRequestState = useSelector(
		state => state.trustedContactIncommingRequest,
	);
	const contactList = incommingRequestState?.contact_list || [];
	 
	const fetchIncommingRequests = useCallback(() => {
		if (inFlightIncommingRequests) {
			return inFlightIncommingRequests;
		}

		inFlightIncommingRequests = new Promise(resolve => {
			try {
				TrustedContactService.incommingInvitations(result => {
					if (result.success) {
						console.log('=====================================================');
						console.log('Incoming trusted requests fetched successfully:', result.data);
						console.log('=====================================================');

						dispatch(
							trustedContactIncommingRequestActions.setTrustedContactList(
								result?.data?.data?.rows || [],
							),
						);
						 
					}

					resolve(result);
				});
			} catch (error) {
				console.log('❌ Error fetching incoming trusted requests:', error?.message);
				resolve({ success: false, error: error?.message });
			}
		}).finally(() => {
			inFlightIncommingRequests = null;
		});

		return inFlightIncommingRequests;
	}, [dispatch]);

	const setData = useCallback(data => {
		dispatch(trustedContactIncommingRequestActions.setTrustedContactList(data));
	}, [dispatch]);

	return {
		contactList,
		setData,
		fetchIncommingRequests,
	};
};


