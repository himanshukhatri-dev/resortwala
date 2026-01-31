import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { learningService } from '../services/learningService';

const ContextualHelp = ({ topic, placement = 'right', children, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);

    const fetchContent = async () => {
        if (content) return; // Already loaded
        setLoading(true);
        try {
            // Fetch help content for the current page
            const currentRoute = window.location.pathname;
            const helpData = await learningService.getContextualHelp(currentRoute);

            // Find specific help for this element (topic)
            const specificHelp = Array.isArray(helpData)
                ? helpData.find(item => item.element_id === topic)
                : null;

            if (specificHelp) {
                setContent(specificHelp);
            } else {
                // If not found, we can silently fail or show generic
                // For now, silently failing by not setting content (or setting null and handling in render)
                setContent(null);
            }
        } catch (error) {
            setContent({ title: 'Error', content: 'Could not load help.' });
        } finally {
            setLoading(false);
        }
    };

    const toggleHelp = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isOpen) {
            updatePosition();
            fetchContent();
            // Track interaction
            learningService.trackHelpInteraction({
                interaction_type: 'tooltip_view',
                resource_type: 'tooltip',
                page_route: window.location.pathname,
                trigger_source: 'manual'
            });
        }
        setIsOpen(!isOpen);
    };

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const scrollY = window.scrollY;
            const scrollX = window.scrollX;

            let top = rect.top + scrollY;
            let left = rect.left + scrollX;

            // Simple placement logic (can be enhanced with libraries like Popper.js)
            switch (placement) {
                case 'right':
                    top += rect.height / 2;
                    left += rect.width + 10;
                    break;
                case 'left':
                    top += rect.height / 2;
                    left -= 260; // Approximate width of popover
                    break;
                case 'top':
                    top -= 10;
                    left += rect.width / 2;
                    break;
                case 'bottom':
                    top += rect.height + 10;
                    left += rect.width / 2;
                    break;
                default:
                    top += rect.height / 2;
                    left += rect.width + 10;
            }

            setCoords({ top, left });
        }
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isOpen && triggerRef.current && !triggerRef.current.contains(e.target) && !e.target.closest('.contextual-help-popover')) {
                setIsOpen(false);
            }
        };

        window.addEventListener('click', handleClickOutside);
        window.addEventListener('resize', updatePosition);

        return () => {
            window.removeEventListener('click', handleClickOutside);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    return (
        <>
            <span
                ref={triggerRef}
                onClick={toggleHelp}
                className={`inline-flex items-center justify-center cursor-pointer text-gray-400 hover:text-blue-600 transition-colors ${className}`}
                title="Click for help"
            >
                {children || (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )}
            </span>

            {isOpen && createPortal(
                <div
                    className="contextual-help-popover fixed z-[9999] bg-white rounded-lg shadow-xl border border-gray-200 w-64 text-sm animate-fade-in"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        transform: placement === 'top' || placement === 'bottom' ? 'translateX(-50%)' : 'translateY(-50%)'
                    }}
                >
                    <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-t-lg border-b border-gray-100">
                        <h4 className="font-semibold text-gray-800">
                            {loading ? 'Loading...' : (content?.title || 'Help')}
                        </h4>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                            ×
                        </button>
                    </div>
                    <div className="p-3 text-gray-600">
                        {loading ? (
                            <div className="flex justify-center py-2">
                                <span className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></span>
                            </div>
                        ) : (
                            <>
                                <p className="mb-2">{content?.content}</p>
                                {content?.video_url && (
                                    <a href={content.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 mt-2 text-xs font-medium">
                                        ▶ Watch Video Tutorial
                                    </a>
                                )}
                            </>
                        )}
                    </div>
                    {/* Arrow (Visual only, simplified) */}
                    <div
                        className="absolute w-2 h-2 bg-white border-l border-b border-gray-200 transform rotate-45"
                        style={{
                            ...getArrowStyle(placement)
                        }}
                    ></div>
                </div>,
                document.body
            )}
        </>
    );
};

const getArrowStyle = (placement) => {
    switch (placement) {
        case 'right': return { top: '50%', left: '-5px', marginTop: '-4px' };
        case 'left': return { top: '50%', right: '-5px', marginTop: '-4px', borderLeft: 'none', borderBottom: 'none', borderRight: '1px solid #e5e7eb', borderTop: '1px solid #e5e7eb' };
        case 'top': return { bottom: '-5px', left: '50%', marginLeft: '-4px' };
        case 'bottom': return { top: '-5px', left: '50%', marginLeft: '-4px', borderBottom: 'none', borderLeft: 'none', borderTop: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' };
        default: return {};
    }
};

export default ContextualHelp;
