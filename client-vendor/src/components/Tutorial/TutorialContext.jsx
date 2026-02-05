import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const TutorialContext = createContext();

export const useTutorial = () => useContext(TutorialContext);

export const TutorialProvider = ({ children }) => {
    const [isActive, setIsActive] = useState(false);
    const [activeModule, setActiveModule] = useState(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false); // For auto-play narration/flow
    const [targetElement, setTargetElement] = useState(null);
    const [isWaitingByUser, setIsWaitingByUser] = useState(false); // User needs to interact

    const navigate = useNavigate();
    const location = useLocation();

    // Start a specific tutorial
    const startTutorial = useCallback((moduleData) => {
        console.log("--- TUTORIAL ENGINE: STARTING ---");
        console.log("Module Title:", moduleData.title);
        console.log("Steps Count:", moduleData.steps?.length);

        if (!moduleData.steps || moduleData.steps.length === 0) {
            console.error("CRITICAL: Tutorial started but NO STEPS FOUND in module data!");
            toast.error("Tutorial data is corrupted (no steps).");
            return;
        }

        try {
            setActiveModule(moduleData);
            setCurrentStepIndex(0);
            setIsActive(true);
            setIsPlaying(true);
            console.log("State set: isActive=true, stepIndex=0");
            toast.loading(`Starting: ${moduleData.title}`, { duration: 3000, position: 'top-center' });
        } catch (err) {
            console.error("Failed to set tutorial state:", err);
        }
    }, []);

    const stopTutorial = useCallback(() => {
        setIsActive(false);
        setActiveModule(null);
        setCurrentStepIndex(0);
        setIsPlaying(false);
        setTargetElement(null);
        toast.success("Tutorial finished!");
    }, []);

    const currentStep = activeModule?.steps?.[currentStepIndex];

    // THE DIRECTOR: Engine Logic
    useEffect(() => {
        if (!isActive || !currentStep) return;

        console.log(`Executing Step ${currentStepIndex + 1}:`, currentStep.action_type);

        const executeStep = async () => {
            const { action_type, selector, path, payload, narration_text } = currentStep;

            // 1. Navigation Check
            if (path) {
                // With React Router basename="/vendor", location.pathname is already relative
                // But let's be extremely safe and log everything.
                const currentPath = location.pathname;

                console.log("--- NAV EVALUATION ---");
                console.log("Current (Router):", currentPath);
                console.log("Target (Seeder):", path);

                if (currentPath !== path && currentPath !== `/vendor${path}`) {
                    console.log("MISMATCH: Navigating...");
                    navigate(path);
                    return;
                }

                console.log("MATCH: Already on correct page.");

                // If this was ONLY a navigation step (no selector/logic), 
                // we might want to auto-advance to help the user, or let them click "Next".
                // For now, let's just log.
            }

            // 2. Element Verification (for highlight/click/input)
            if (selector) {
                // Find element with retry logic
                let attempts = 0;
                const maxAttempts = 20; // 10 seconds total roughly

                const findInterval = setInterval(() => {
                    const el = document.querySelector(selector);
                    if (el) {
                        clearInterval(findInterval);

                        // Scroll into view
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTargetElement(el);

                        // If it's pure logic (like click), we might do it automatically
                        // BUT for this "Walkthrough", we usually highlight and wait for user,
                        // unless it's a "Ghost Mode" demo.
                        // Designed for: Assisted Walkthrough (User does the action)

                        // If action is Navigation via Click, we might wait.
                    } else {
                        attempts++;
                        if (attempts >= maxAttempts) {
                            clearInterval(findInterval);
                            console.warn("Tutorial Element Not Found:", selector);
                            toast.error("Couldn't find the element. Please try manually.");
                            // Maybe pause or skip
                        }
                    }
                }, 500);
            } else {
                setTargetElement(null);
            }

            // 3. AI Narration (Simulated)
            if (narration_text) {
                // In future: playAudio(currentStep.audio_url);
                // For now, relies on the Overlay to show the text
            }
        };

        executeStep();

    }, [isActive, currentStepIndex, activeModule, location.pathname, navigate]);

    // Called when user performs the right action/clicks "Next"
    const nextStep = useCallback(() => {
        if (!activeModule) return;

        if (currentStepIndex < activeModule.steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            stopTutorial();
        }
    }, [activeModule, currentStepIndex, stopTutorial]);

    // Helper: Is the user currently targeting the correct element?
    const checkInteraction = useCallback((e) => {
        if (!isActive || !currentStep?.selector) return;

        // For clicks
        if (e.type === 'click' && e.target.closest(currentStep.selector)) {
            console.log("INTERACTION DETECTED: Click");
            // If it's a field, we wait for input/change usually, 
            // but if it's a button, we proceed immediately
            const isButton = e.target.closest('button, a, [role="button"]');
            if (isButton) {
                setTimeout(nextStep, 300);
            }
        }

        // For input changes (like typing a name)
        if (e.type === 'change' || e.type === 'blur') {
            if (e.target.matches(currentStep.selector) && e.target.value.length > 2) {
                console.log("INTERACTION DETECTED: Input/Change");
                setTimeout(nextStep, 800);
            }
        }
    }, [isActive, currentStep, nextStep]);

    // Global listeners for interaction verification
    useEffect(() => {
        if (isActive) {
            document.addEventListener('click', checkInteraction, true);
            document.addEventListener('change', checkInteraction, true);
            document.addEventListener('blur', checkInteraction, true);
            return () => {
                document.removeEventListener('click', checkInteraction, true);
                document.removeEventListener('change', checkInteraction, true);
                document.removeEventListener('blur', checkInteraction, true);
            };
        }
    }, [isActive, checkInteraction]);

    return (
        <TutorialContext.Provider value={{
            isActive,
            currentStepIndex,
            activeModule,
            targetElement,
            startTutorial,
            stopTutorial,
            nextStep
        }}>
            {children}
        </TutorialContext.Provider>
    );
};
