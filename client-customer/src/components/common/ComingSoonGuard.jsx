import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import axios from 'axios';
import Maintenance from '../../pages/Maintenance';
import ComingSoon from '../../pages/ComingSoon';

const ComingSoonGuard = ({ children }) => {
    const [mode, setMode] = useState({ maintenance: false, coming_soon: false, maintenance_content: null, coming_soon_content: null });
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const location = useLocation();

    useEffect(() => {
        const fetchMode = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/system-mode`);
                setMode(res.data);
            } catch (err) {
                console.error("Failed to fetch system mode", err);
                if (err.response?.status === 503 || err.response?.status === 403) {
                    setMode(prev => ({ ...prev, maintenance: true }));
                }
            } finally {
                setLoading(false);
            }
        };

        // 1. Check Bypass via URL or LocalStorage
        const bypassParam = searchParams.get('testali');
        if (bypassParam === '1') localStorage.setItem('coming_soon_bypass', '1');
        else if (bypassParam === '0') localStorage.removeItem('coming_soon_bypass');

        const isBypassed = localStorage.getItem('coming_soon_bypass') === '1';

        // 2. Check Admin Bypass (Front-end level)
        let isAdmin = false;
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                isAdmin = user.role === 'admin' || user.role === 'vendor' || user.isAdmin || user.isVendor;
            }
        } catch (e) { }

        if (isBypassed || isAdmin) {
            setLoading(false);
        } else {
            fetchMode();
        }
    }, [searchParams]);

    if (loading) return (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 text-center">
            <img src="/resortwala-logo.png" alt="ResortWala" className="h-12 w-auto mb-4 animate-pulse" />
            <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '30%' }}></div>
            </div>
            <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-tighter">Preparing your experience...</p>
        </div>
    );

    // Maintenance has priority
    if (mode.maintenance) {
        return <Maintenance content={mode.maintenance_content} logo={mode.logo_url} />;
    }

    if (mode.coming_soon) {
        return <ComingSoon content={mode.coming_soon_content} logo={mode.logo_url} />;
    }

    return children;
};

export default ComingSoonGuard;
