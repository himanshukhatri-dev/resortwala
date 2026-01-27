import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { API_BASE_URL } from '../config';

export default function CalendarRedirect() {
    const { token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAndRedirect = async () => {
            try {
                const baseURL = API_BASE_URL;
                const response = await axios.get(`${baseURL}/vendor/properties`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const properties = response.data;

                if (properties.length > 0) {
                    navigate(`/properties/${properties[0].PropertyId}/calendar`, { replace: true });
                } else {
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
