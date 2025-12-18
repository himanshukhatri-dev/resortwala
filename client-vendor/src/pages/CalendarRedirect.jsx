import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

export default function CalendarRedirect() {
    const { token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAndRedirect = async () => {
            try {
                // Use absolute URL just to be safe, though relative works with proxy
                // Reuse logic from MyProperties
                const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
                const response = await axios.get(`${baseURL}/api/vendor/properties`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const properties = response.data;

                if (properties.length > 0) {
                    // Always redirect to the first property's calendar for now
                    navigate(`/properties/${properties[0].PropertyId}/calendar`, { replace: true });
                } else {
                    // No properties -> Go to properties list to create one
                    navigate('/properties', { replace: true });
                }
            } catch (err) {
                console.error("Failed to fetch properties for calendar redirect", err);
                navigate('/properties', { replace: true });
            }
        };

        if (token) {
            fetchAndRedirect();
        }
    }, [token, navigate]);

    return <Loader />;
}
