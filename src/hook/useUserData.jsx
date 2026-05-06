import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { userActions } from '../store/redux/user.redux';
import { UserService } from '../services/user.service';
let inFlightUserDataRequest = null;

export const useUserData = () => {
    const dispatch = useDispatch();
    const userData = useSelector(state => state.userProviderData);
    const fetchUserData = useCallback(() => {
        if (inFlightUserDataRequest) {
            return inFlightUserDataRequest;
        }
        inFlightUserDataRequest = new Promise(resolve => {
            try {
                UserService.fetchUserProfile(result => {
                    if (result.success) {
                        dispatch(
                            userActions.setFullData(result.data?.data || {}),
                        );
                    }
                    resolve(result.data?.data || {});
                }
                );
            } catch (error) {
                console.log('❌ Error fetching user data:', error?.message);
                resolve({ success: false, error: error?.message });
            }
        }).finally(() => {
            inFlightUserDataRequest = null;
        });
        return inFlightUserDataRequest;
    }
        , [dispatch]);

    const setUserData = useCallback(data => {
        const updatedData = { ...userData, ...data };
        dispatch(userActions.setFullData(updatedData));
    }, [dispatch, userData]);

     

    return {
        userData,
        fetchUserData,
        setUserData,
    }
}

