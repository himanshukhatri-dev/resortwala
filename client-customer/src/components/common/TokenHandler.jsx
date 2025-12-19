import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function TokenHandler() {
    const location = useLocation();
    const navigate = useNavigate();
    const { loginWithToken } = useAuth(); // We need to expose this in AuthContext

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('impersonate_token');

        if (token) {
            console.log("Impersonation Token Found:", token);
            if (loginWithToken) {
                loginWithToken(token);
                // Remove token from URL for cleaner history
                navigate(location.pathname, { replace: true });
            }
        }
    }, [location, loginWithToken, navigate]);

    return null; // Invisible component
}
