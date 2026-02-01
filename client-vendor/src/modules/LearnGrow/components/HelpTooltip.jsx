import React, { useState } from 'react';
import { FaQuestionCircle } from 'react-icons/fa';

const HelpTooltip = ({ content, placement = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="relative inline-block ml-1"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            <FaQuestionCircle className="text-gray-400 hover:text-blue-500 cursor-help transition-colors text-sm" />

            {isVisible && (
                <div
                    className={`absolute z-50 w-48 bg-gray-900 text-white text-xs p-2 rounded-lg shadow-xl animate-in fade-in duration-200 pointer-events-none`}
                    style={{
                        bottom: placement === 'top' ? '100%' : 'auto',
                        top: placement === 'bottom' ? '100%' : 'auto',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginBottom: placement === 'top' ? '8px' : '0',
                        marginTop: placement === 'bottom' ? '8px' : '0',
                    }}
                >
                    {content}
                    {/* Arrow */}
                    <div
                        className="absolute w-2 h-2 bg-gray-900 rotate-45"
                        style={{
                            bottom: placement === 'top' ? '-4px' : 'auto',
                            top: placement === 'bottom' ? '-4px' : 'auto',
                            left: '50%',
                            marginLeft: '-4px'
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default HelpTooltip;
