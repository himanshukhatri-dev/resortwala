import React, { useState, useEffect } from 'react';
import ComingSoon from '../../pages/ComingSoon';
import { useSearchParams } from 'react-router-dom';

const ComingSoonGuard = ({ children }) => {
    const [showComingSoon, setShowComingSoon] = useState(false);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const checkStatus = () => {
            // 1. Check Date
            const launchDate = new Date('2026-01-25T00:00:00');
            const now = new Date();
            const isPreLaunch = now < launchDate;

            // 2. Check Environment
            // Only enforce on exact production domain
            const isProduction = window.location.hostname === 'resortwala.com' || window.location.hostname === 'www.resortwala.com';

            // 3. Check Bypass
            // Allow query param ?testali=1 (Enable) or ?testali=0 (Disable)
            const bypassParam = searchParams.get('testali');

            if (bypassParam === '1') {
                sessionStorage.setItem('coming_soon_bypass', '1');
            } else if (bypassParam === '0') {
                sessionStorage.removeItem('coming_soon_bypass');
            }

            const hasSessionBypass = sessionStorage.getItem('coming_soon_bypass') === '1';
            const isBypassed = (bypassParam === '1') || (hasSessionBypass && bypassParam !== '0');

            // Logic: Show Coming Soon IF (Pre-Launch AND Production AND NOT Bypassed)
            if (isPreLaunch && isProduction && !isBypassed) {
                setShowComingSoon(true);
            } else {
                setShowComingSoon(false);
            }
        };

        checkStatus();
    }, [searchParams]);

    if (showComingSoon) {
        return <ComingSoon />;
    }

    return children;
};

export default ComingSoonGuard;
