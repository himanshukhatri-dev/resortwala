import React from 'react';

/**
 * Utility component that only renders its children if the developer bypass is active.
 * Used for debugging info, admin controls, and developer-only properties.
 */
const DeveloperOnly = ({ children }) => {
    const isBypassed = localStorage.getItem('coming_soon_bypass') === '1';

    // Also include Admin/Vendor users as developers for convenience
    let isAdmin = false;
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            isAdmin = user.role === 'admin' || user.role === 'vendor' || user.isAdmin || user.isVendor;
        }
    } catch (e) { }

    if (!isBypassed && !isAdmin) {
        return null;
    }

    return (
        <div className="developer-only-gate relative">
            <div className="absolute top-0 right-0 px-2 py-0.5 bg-yellow-400 text-[8px] font-black uppercase text-black rounded-bl-lg z-[9999] pointer-events-none select-none">
                Dev Mode
            </div>
            {children}
        </div>
    );
};

export default DeveloperOnly;
