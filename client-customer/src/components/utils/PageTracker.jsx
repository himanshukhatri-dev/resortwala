import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import analytics from '../../utils/analytics';

export default function PageTracker() {
    const location = useLocation();

    useEffect(() => {
        analytics.pageView(document.title);
    }, [location]);

    return null;
}
