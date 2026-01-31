import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const WalkthroughContext = createContext(null);

export const useWalkthrough = () => {
    const context = useContext(WalkthroughContext);
    if (!context) {
        throw new Error('useWalkthrough must be used within a WalkthroughProvider');
    }
    return context;
};

export const WalkthroughProvider = ({ children }) => {
    const [currentWalkthrough, setCurrentWalkthrough] = useState(null);
    const [isActive, setIsActive] = useState(false);
    const [completedWalkthroughs, setCompletedWalkthroughs] = useState([]);
    const location = useLocation();

    // Fetch walkthroughs/check status on route change
    useEffect(() => {
        const checkWalkthrough = async () => {
            try {
                // In a real implementation, we would fetch from API based on location.pathname
                // For now, we'll simulating fetching or matching a static list
                // const response = await axios.get(`/api/vendor/walkthroughs/active?route=${location.pathname}`);
                // if (response.data) setCurrentWalkthrough(response.data);

                // Temporary Mock Logic
                if (location.pathname === '/vendor/dashboard' && !completedWalkthroughs.includes('dashboard')) {
                    // Only trigger if not completed
                    // For dev/demo, we might want to manually trigger or check query params
                }
            } catch (error) {
                console.error('Failed to check walkthroughs', error);
            }
        };

        checkWalkthrough();
    }, [location.pathname, completedWalkthroughs]);

    const startWalkthrough = (walkthroughId) => {
        // Logic to fetch specific walkthrough by ID
        // setCurrentWalkthrough(walkthrough);
        setIsActive(true);
    };

    const endWalkthrough = () => {
        setIsActive(false);
        if (currentWalkthrough) {
            markAsComplete(currentWalkthrough.id);
        }
        setCurrentWalkthrough(null);
    };

    const markAsComplete = async (id) => {
        setCompletedWalkthroughs(prev => [...prev, id]);
        // await axios.post(`/api/vendor/walkthroughs/${id}/complete`);
    };

    const value = {
        currentWalkthrough,
        isActive,
        startWalkthrough,
        endWalkthrough,
        completedWalkthroughs
    };

    return (
        <WalkthroughContext.Provider value={value}>
            {children}
        </WalkthroughContext.Provider>
    );
};
