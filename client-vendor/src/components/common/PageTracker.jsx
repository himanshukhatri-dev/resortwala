import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import vendorAnalytics from '../../utils/analytics';

export default function PageTracker() {
    const location = useLocation();

    useEffect(() => {
        vendorAnalytics.pageView(document.title);
    }, [location]);

    return null;
}
