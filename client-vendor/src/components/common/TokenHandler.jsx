import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function TokenHandler() {
    const location = useLocation();
    const navigate = useNavigate();
    const { loginWithToken } = useAuth();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('impersonate_token');

        if (token) {
            console.log("Impersonation Token Found:", token);
            if (loginWithToken) {
                loginWithToken(token);
                // Remove token from URL
                navigate(location.pathname, { replace: true });
            }
        }
    }, [location, loginWithToken, navigate]);

    return null;
}
