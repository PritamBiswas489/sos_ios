import { useSelector, useDispatch } from "react-redux";
import { authActions } from "../store/redux/useAuth.redux";
import { UserService } from "../services/user.service";

const useUserAuth = () => {
    const dispatch = useDispatch();
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

    const login = () => dispatch(authActions.login());
    const logout = () => dispatch(authActions.logout());

    const checkAuthentication = async () => {
        return new Promise((resolve) => {
            UserService.fetchUserProfile(({ success }) => {
                if (success) {
                    dispatch(authActions.login());
                } else {
                    dispatch(authActions.logout());
                }
                resolve(success);
            });
        });
    }

    return { isAuthenticated, login, logout, checkAuthentication };
};

export default useUserAuth;