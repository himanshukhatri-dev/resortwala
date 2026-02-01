import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWalkthrough } from '../context/WalkthroughContext';

const WalkthroughOverlay = () => {
    const {
        activeWalkthrough,
        currentStepIndex,
        nextStep,
        prevStep,
        skipWalkthrough,
        currentStep: contextStep,
        totalSteps
    } = useWalkthrough();

    const [targetRect, setTargetRect] = useState(null);

    // Use Context's current step
    const currentStep = contextStep;
    const isActive = !!activeWalkthrough;

    useEffect(() => {
        if (!isActive || !currentStep) return;

        const updatePosition = () => {
            // Support both 'element_selector' and 'target' properties
            const selector = currentStep.element_selector || currentStep.target;
            const element = document.querySelector(selector);

            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const rect = element.getBoundingClientRect();
                setTargetRect({
                    top: rect.top + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                    height: rect.height,
                    viewportTop: rect.top,
                    viewportLeft: rect.left
                });
            } else {
                console.warn(`Walkthrough element not found: ${selector}`);
            }
        };

        const timeout = setTimeout(updatePosition, 500);
        window.addEventListener('resize', updatePosition);
        return () => {
            clearTimeout(timeout);
            window.removeEventListener('resize', updatePosition);
        };
    }, [currentStep, isActive]);

    if (!isActive || !currentStep || !targetRect) return null;

    const handleNext = () => {
        nextStep();
    };

    const handleBack = () => {
        prevStep();
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] overflow-hidden">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <mask id="spotlight-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        <rect
                            x={targetRect.viewportLeft - 4}
                            y={targetRect.viewportTop - 4}
                            width={targetRect.width + 8}
                            height={targetRect.height + 8}
                            rx="8"
                            fill="black"
                        />
                    </mask>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="rgba(0, 0, 0, 0.6)" mask="url(#spotlight-mask)" />
            </svg>

            <div
                className="absolute transition-all duration-300 ease-out"
                style={{
                    top: targetRect.viewportTop + targetRect.height + 20,
                    left: Math.max(20, Math.min(targetRect.viewportLeft, window.innerWidth - 320)),
                    width: '300px'
                }}
            >
                <div className="bg-white rounded-xl shadow-2xl p-5 border border-gray-100 animate-fade-in-up">
                    <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold text-blue-600 tracking-wider">
                            STEP {currentStepIndex + 1} OF {totalSteps}
                        </span>
                        <button onClick={skipWalkthrough} className="text-gray-400 hover:text-gray-600">
                            <span className="sr-only">Close</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2">{currentStep.title}</h3>
                    <p className="text-gray-600 text-sm mb-6 leading-relaxed">{currentStep.content}</p>

                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            {Array.from({ length: totalSteps }).map((_, idx) => (
                                <div key={idx} className={`w-2 h-2 rounded-full transition-colors ${idx === currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'}`} />
                            ))}
                        </div>
                        <div className="flex gap-3">
                            {currentStepIndex > 0 && (
                                <button onClick={handleBack} className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">Back</button>
                            )}
                            <button
                                onClick={handleNext}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                            >
                                {currentStepIndex === totalSteps - 1 ? 'Finish' : 'Next'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default WalkthroughOverlay;
