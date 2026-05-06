import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { contactLocationsActions } from '../store/redux/contactLocations.redux';
const { setContactLocations } = contactLocationsActions;

export const useContactLocations = () => {
    const dispatch = useDispatch();
    const contactLocations = useSelector(state => state.contactLocations?.contact_locations || {});
    const updateContactLocations = useCallback((locations) => {
        console.log('Updating contact locations:', locations);
        dispatch(setContactLocations(locations));
    }, [dispatch]);

    return {
        contactLocations,
        updateContactLocations,
    }
}