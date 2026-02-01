import React, { createContext, useContext, useState, useEffect } from 'react';
import { learningService } from '../services/learningService';
import { useLocation } from 'react-router-dom';

const WalkthroughContext = createContext();

export const useWalkthrough = () => {
    const context = useContext(WalkthroughContext);
    if (!context) {
        throw new Error('useWalkthrough must be used within a WalkthroughProvider');
    }
    return context;
};

export const WalkthroughProvider = ({ children }) => {
    const [activeWalkthrough, setActiveWalkthrough] = useState(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [completedWalkthroughs, setCompletedWalkthroughs] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    // Check for walkthroughs on route change
    useEffect(() => {
        const checkWalkthroughForPage = async (route) => {
            try {
                // Fetch main walkthrough for this page
                // Note: In real app, we might want to cache this or check local storage first
                const data = await learningService.getMainWalkthrough(route);

                // If data exists and NOT completed
                // We need a list of completed IDs. For now, we assume backend filters or we fetch status separate
                if (data && !completedWalkthroughs.includes(data.id)) {
                    // Logic to auto-start or show "New Tour available" badge?
                    // For now, we just expose the data. 
                    // To auto-start: setActiveWalkthrough(data);
                }
            } catch (error) {
                console.error('Failed to check walkthrough:', error);
            }
        };

        if (location.pathname) {
            checkWalkthroughForPage(location.pathname);
        }
    }, [location.pathname, completedWalkthroughs]);

    const startWalkthrough = async (walkthroughIdOrRoute) => {
        try {
            // Support passing ID or letting service find by current route if no ID
            let walkthrough = null;
            if (walkthroughIdOrRoute) {
                // Try to fetch by ID or Route? Service only has getMainWalkthrough(route) currently
                // Use current route as fallback
                walkthrough = await learningService.getMainWalkthrough(location.pathname);
            } else {
                walkthrough = await learningService.getMainWalkthrough(location.pathname);
            }

            if (walkthrough && walkthrough.steps?.length > 0) {
                setActiveWalkthrough(walkthrough);
                setCurrentStepIndex(0);
            }
        } catch (error) {
            console.error('Failed to start walkthrough:', error);
        }
    };

    const nextStep = () => {
        if (activeWalkthrough && currentStepIndex < activeWalkthrough.steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            completeWalkthrough();
        }
    };

    const prevStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    const skipWalkthrough = () => {
        setActiveWalkthrough(null);
        setCurrentStepIndex(0);
    };

    const completeWalkthrough = async () => {
        if (!activeWalkthrough) return;

        const id = activeWalkthrough.id;
        setActiveWalkthrough(null);
        setCurrentStepIndex(0);

        setCompletedWalkthroughs(prev => [...prev, id]);

        try {
            await learningService.updateWalkthroughProgress(id, { status: 'completed' });
        } catch (error) {
            console.error('Failed to save walkthrough completion:', error);
        }
    };

    const value = {
        activeWalkthrough,
        currentStepIndex,
        completedWalkthroughs,
        loading,
        startWalkthrough,
        nextStep,
        prevStep,
        skipWalkthrough,
        currentStep: activeWalkthrough?.steps?.[currentStepIndex] || null,
        totalSteps: activeWalkthrough?.steps?.length || 0,
        isLastStep: activeWalkthrough?.steps?.length ? currentStepIndex === activeWalkthrough.steps.length - 1 : false
    };

    return (
        <WalkthroughContext.Provider value={value}>
            {children}
        </WalkthroughContext.Provider>
    );
};
