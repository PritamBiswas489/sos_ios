import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { incomingSosNotificationActions } from '../store/redux/incomingSosNotification.redux';
import { SOSService } from '../services/sos.service';
let inFlightUserDataRequest = null;

export const useIncomingSosNotifications = () => {
  const dispatch = useDispatch();
  const sosNotificationData = useSelector(
    state => state.incomingSosNotification,
  );
  const { sos_notification_list, limit, page, status, isLoading, hasMore } =
    sosNotificationData;

  const fetchSosNotifications = useCallback(
    (append = false) => {
      if (inFlightUserDataRequest) {
        return inFlightUserDataRequest;
      }
      inFlightUserDataRequest = new Promise(resolve => {
        dispatch(incomingSosNotificationActions.setLoading(true));
        try {
          SOSService.fetchIncomingSosNotifications(
            { limit, page, status },
            result => {
              console.log(
                '📦 fetchIncomingSosNotifications response:',
                JSON.stringify(result),
              );
              if (result.success) {
                const payload = result.data?.data;
                const rows = payload?.notifications ?? [];
                const list = Array.isArray(rows) ? rows : [];
                console.log('📋 Fetched incoming SOS notifications:', list);
                dispatch(
                  append
                    ? incomingSosNotificationActions.appendSosNotificationList(list)
                    : incomingSosNotificationActions.setSosNotificationList(list),
                );
                if (list.length < limit) {
                  dispatch(incomingSosNotificationActions.setHasMore(false));
                }
              }
              resolve([]);
            },
          );
        } catch (error) {
          console.log('❌ Error fetching incoming SOS notifications:', error?.message);
          resolve({ success: false, error: error?.message });
        }
      }).finally(() => {
        dispatch(incomingSosNotificationActions.setLoading(false));
        inFlightUserDataRequest = null;
      });
      return inFlightUserDataRequest;
    },
    [dispatch, limit, page, status],
  );

  const setLimit = useCallback(
    newLimit => {
      dispatch(incomingSosNotificationActions.setLimit(newLimit));
    },
    [dispatch],
  );
  const setPage = useCallback(
    newPage => {
      dispatch(incomingSosNotificationActions.setPage(newPage));
    },
    [dispatch],
  );
  const setStatus = useCallback(
    newStatus => {
      dispatch(incomingSosNotificationActions.setStatus(newStatus));
    },
    [dispatch],
  );
  const resetNotifications = useCallback(() => {
    dispatch(incomingSosNotificationActions.resetState());
  }, [dispatch]);

  return {
    sos_notification_list,
    limit,
    page,
    isLoading,
    fetchSosNotifications,
    setLimit,
    setPage,
    setStatus,
    status,
    hasMore,
    resetNotifications,
  };
};