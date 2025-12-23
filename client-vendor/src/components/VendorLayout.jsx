import { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import AccountPending from './AccountPending';
import NotificationBell from './NotificationBell';


export default function VendorLayout({ children, title }) {
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user } = useAuth();
    const isApproved = user?.is_approved === 1 || user?.is_approved === true;

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-color)' }}>
            {/* Mobile Hamburger Button */}
            <button
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
                style={{
                    position: 'fixed',
                    top: '20px',
                    left: '20px',
                    zIndex: 998,
                    background: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    display: 'none', // Shown via CSS media query
                    cursor: 'pointer'
                }}
                id="mobile-menu-toggle"
            >
                ☰
            </button>
            <style>{`
                @media (max-width: 768px) {
                    #mobile-menu-toggle { display: block !important; }
                }
            `}</style>

            <Sidebar
                onHoverChange={setIsSidebarHovered}
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            {/* Notification Bell - Fixed Top Right */}
            {isApproved && (
                <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 999 }}>
                    <NotificationBell />
                </div>
            )}

            <div style={{
                flex: 1,
                marginLeft: isSidebarHovered ? '240px' : '70px',
                transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                overflowY: 'auto'
            }} className="content-area">
                <div style={{ padding: '30px' }} className="page-content">
                    {/* Approval Guard */}
                    {isApproved ? children : <AccountPending />}
                </div>
                {/* Footer */}
                <div className="mt-auto border-t border-gray-100 bg-white/50 backdrop-blur-sm p-6 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-400 uppercase tracking-widest">
                            <span>Resortwala Registered Vendor</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 font-semibold">
                            <span>{user?.business_name || 'Business Partner'}</span>
                            <span className="text-gray-300">•</span>
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">ID: {user?.id}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                            Authorized Partner • Terms of Service Apply
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .content-area {
                        margin-left: 0 !important;
                    }
                    .page-content {
                        padding: 15px !important;
                    }
                }
            `}</style>
        </div>
    );
}
