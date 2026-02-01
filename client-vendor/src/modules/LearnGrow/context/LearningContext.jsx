import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { learningService } from '../services/learningService';

const LearningContext = createContext();

export const useLearning = () => useContext(LearningContext);

export const LearningProvider = ({ children }) => {
    const { user } = useAuth();
    const [progress, setProgress] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [milestones, setMilestones] = useState({});

    useEffect(() => {
        if (user) {
            fetchInitialData();
        }
    }, [user]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [videosData, progressData] = await Promise.all([
                learningService.getVideos(),
                // learningService.getProgress() // Assuming this method might not exist yet or we just use videosData if it includes progress
            ]);

            // If getVideos() returns { data: [...] } or just [...]
            setVideos(videosData || []);

            // setProgress(progressData); // specific progress endpoint if needed

            // Mock milestones for now until that endpoint is ready
            setMilestones({
                profile_completed: true, // This should come from an onboarding endpoint
                property_added: false
            });
        } catch (error) {
            console.error("Failed to fetch learning data", error);
        } finally {
            setLoading(false);
        }
    };

    const updateVideoProgress = async (videoId, progressData) => {
        // Optimistic update
        try {
            await learningService.updateProgress(videoId, progressData);
        } catch (error) {
            console.error("Failed to update progress", error);
        }
    };

    const value = {
        videos,
        progress,
        milestones,
        loading,
        updateVideoProgress,
        refresh: fetchInitialData
    };

    return (
        <LearningContext.Provider value={value}>
            {children}
        </LearningContext.Provider>
    );
};
