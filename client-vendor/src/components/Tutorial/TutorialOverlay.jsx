import React, { useEffect, useState } from 'react';
import { useTutorial } from './TutorialContext';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoArrowForward, IoCheckmarkDone } from 'react-icons/io5';

const TutorialOverlay = () => {
    const { isActive, currentStepIndex, activeModule, targetElement, nextStep, stopTutorial } = useTutorial();
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

    const currentStep = activeModule?.steps?.[currentStepIndex];

    // Update position when target updates or window resizes
    useEffect(() => {
        const updatePos = () => {
            if (targetElement) {
                const rect = targetElement.getBoundingClientRect();
                setPosition({
                    top: rect.top + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                    height: rect.height
                });
            } else {
                // If no target (e.g., pure navigation step or wait), center it
                setPosition({
                    top: window.innerHeight / 2,
                    left: window.innerWidth / 2,
                    width: 0,
                    height: 0
                });
            }
        };

        updatePos();
        window.addEventListener('resize', updatePos);
        return () => window.removeEventListener('resize', updatePos);
    }, [targetElement, currentStep]);

    if (!isActive || !currentStep) return null;

    // Calculate Tooltip Position (Top/Bottom/Left/Right preference)
    const isTargeted = !!targetElement;

    // Simple logic: Place tooltip below by default, or verify space
    const tooltipStyle = isTargeted ? {
        top: position.top + position.height + 20,
        left: position.left,
    } : {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
    };

    // Ensure tooltip doesn't bleed off screen
    // BUT only if we are using numeric coordinates (isTargeted)
    if (isTargeted && typeof tooltipStyle.left === 'number') {
        if (tooltipStyle.left + 300 > window.innerWidth) {
            tooltipStyle.left = window.innerWidth - 320;
        }
    }

    return (
        <div className="fixed inset-0" style={{ zIndex: 99999, pointerEvents: 'none' }}>

            {/* The Backdrop / Spotlight Effect */}
            {isTargeted && (
                <div className="fixed inset-0 transition-all duration-300"
                    style={{
                        // Hole punching using CSS path clip or complex box-shadows
                        // Simplified: Using a huge box shadow on a positioned div
                    }}>
                    {/* Spotlight Div */}
                    <div
                        className="absolute border-2 border-blue-500 rounded-md shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] transition-all duration-300 ease-in-out box-content"
                        style={{
                            top: position.top - 5,
                            left: position.left - 5,
                            width: position.width + 10,
                            height: position.height + 10,
                            pointerEvents: 'none' // Let clicks pass through to the element
                        }}
                    />

                    {/* Animated Pulse Ring */}
                    <div
                        className="absolute rounded-md animate-ping border border-blue-400 opacity-75"
                        style={{
                            top: position.top - 5,
                            left: position.left - 5,
                            width: position.width + 10,
                            height: position.height + 10,
                        }}
                    />
                </div>
            )}

            {!isTargeted && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" style={{ pointerEvents: 'auto' }}></div>
            )}

            {/* Instruction Card */}
            <div
                className="fixed bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 transform hover:scale-[1.02]"
                style={{
                    ...tooltipStyle,
                    width: '320px',
                    zIndex: 100000,
                    border: '1px solid rgba(0,0,0,0.05)'
                }}
            >
                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-gray-100">
                    <div
                        className="h-full bg-blue-600 transition-all duration-1000 ease-out"
                        style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                    />
                </div>

                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-xs">
                                    {currentStepIndex + 1}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Step {currentStepIndex + 1} of {steps.length}
                            </span>
                        </div>
                        <button
                            onClick={stopTutorial}
                            className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 transition-colors"
                        >
                            <IoClose size={18} />
                        </button>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-3 leading-tight font-outfit">
                        {currentStep.title || (currentStep.action_type === 'navigate' ? 'Going to...' : 'Tip')}
                    </h3>

                    <p className="text-sm text-gray-600 leading-relaxed mb-6">
                        {currentStep.narration || currentStep.narration_text || "Follow the highlighted area."}
                    </p>

                    <div className="flex items-center justify-between gap-3">
                        <button
                            onClick={stopTutorial}
                            className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            Skip Tutorial
                        </button>

                        {currentStep.requires_action ? (
                            <div className="flex items-center gap-2 text-blue-600 text-xs font-bold bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 animate-pulse">
                                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                Waiting for Action...
                            </div>
                        ) : (
                            <button
                                onClick={nextStep}
                                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 flex items-center gap-2 group"
                            >
                                Next Step
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Pulsing Target Overlay (adds emphasis) */}
            {targetElement && (
                <div
                    className="fixed pointer-events-none rounded-2xl animate-[pulse_2s_infinite]"
                    style={{
                        left: position.left - 4,
                        top: position.top - 4,
                        width: position.width + 8,
                        height: position.height + 8,
                        border: '2px solid rgba(255,255,255,0.4)',
                        boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
                        zIndex: 9998
                    }}
                />
            )}
        </div>
    );
};

export default TutorialOverlay;
