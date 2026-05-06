import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { contactScreentabActions } from '../store/redux/contactScreenTab.redux';

export const useContactTab = () => {
    const dispatch = useDispatch();
    const contactScreenTab = useSelector(state => state.contactScreentab);
    const currentTab = contactScreenTab?.tab || 'contact';
    const setCurrentTab = useCallback(
        (tab) => {
            dispatch(contactScreentabActions.setCurrentTab(tab));
        },
        [dispatch]
    );
    return {
        currentTab,
        setCurrentTab,
    };
}