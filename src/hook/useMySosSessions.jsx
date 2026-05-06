import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { mySosSessionsActions } from '../store/redux/mySosSessions.redux';
import { SOSService } from '../services/sos.service';
let inFlightUserDataRequest = null;

export const useMySosSessions = () => {
  const dispatch = useDispatch();
  const mySosSessionsData = useSelector(state => state.mySosSessions);
  const { sos_notification_list, limit, page, status, isLoading , hasMore} = mySosSessionsData;
  const fetchMySosSessions = useCallback((append = false) => {
    if (inFlightUserDataRequest) {
      return inFlightUserDataRequest;
    }
    inFlightUserDataRequest = new Promise(resolve => {
      dispatch(mySosSessionsActions.setLoading(true));
      try {
        SOSService.fetchMySosSessions({ limit, page, status }, result => {
          console.log('📦 fetchMySosSessions response:', JSON.stringify(result));
          if (result.success) {
            const payload = result.data?.data;
            const rows = payload?.sessions ??  [];
            const list = Array.isArray(rows) ? rows : [];
            console.log('📋 Fetched my SOS sessions:', list);
            dispatch(
              append
                ? mySosSessionsActions.appendSosNotificationList(list)
                : mySosSessionsActions.setSosNotificationList(list),
            );
            if (list.length < limit) {
              dispatch(mySosSessionsActions.setHasMore(false));
            }
          }
          resolve([]);
        });
      } catch (error) {
        console.log('❌ Error fetching my SOS sessions:', error?.message);
        resolve({ success: false, error: error?.message });
      }
    }).finally(() => {
      dispatch(mySosSessionsActions.setLoading(false));
      inFlightUserDataRequest = null;
    });
    return inFlightUserDataRequest;
  }, [dispatch, limit, page, status]);

  const setLimit = useCallback(
    newLimit => {
      dispatch(mySosSessionsActions.setLimit(newLimit));
    },
    [dispatch],
  );
  const setPage = useCallback(
    newPage => {
      dispatch(mySosSessionsActions.setPage(newPage));
    },
    [dispatch],
  );
  const setStatus = useCallback(
    newStatus => {
      dispatch(mySosSessionsActions.setStatus(newStatus));
    },
    [dispatch],
  );
  const resetSessions = useCallback(() => {
    dispatch(mySosSessionsActions.resetState());
  }, [dispatch]);
  return {
    sos_notification_list,
    limit,
    page,
    isLoading,
    fetchMySosSessions,
    setLimit,
    setPage,
    setStatus,
    status,
    hasMore,
    resetSessions,
  };
};
