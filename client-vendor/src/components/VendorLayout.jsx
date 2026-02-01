import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import AccountPending from './AccountPending';
import NotificationBell from './NotificationBell';
import ConfirmModal from './ConfirmModal';
import axios from 'axios';
import WalkthroughOverlay from '../modules/LearnGrow/components/WalkthroughOverlay';
import AIChatWidget from '../modules/LearnGrow/components/AIChatWidget';
import SmartTriggerManager from '../modules/LearnGrow/components/SmartTriggerManager';
import { useLocation } from 'react-router-dom';

export default function VendorLayout({ children, title }) {
    const navigate = useNavigate();
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const { user, token, logout } = useAuth();
    const isApproved = user?.is_approved === 1 || user?.is_approved === true;

    const handleLogout = async () => {
        try {
            await axios.post('/api/vendor/logout', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            logout();
            navigate('/login');
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-color)' }}>
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-[998] px-4 pb-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))]">
                <div className="flex items-center justify-between gap-3">
                    <img src="/vendor/resortwala-logo.png" alt="ResortWala" className="h-7 object-contain" />

                    <div className="flex items-center gap-2">
                        {isApproved && <NotificationBell />}

                        <div className="relative">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all shadow-sm active:scale-95"
                            >
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md ring-2 ring-white">
                                    {user?.name?.charAt(0).toUpperCase() || 'V'}
                                </div>
                                <svg className={`w-3.5 h-3.5 text-gray-600 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showProfileMenu && (
                                <>
                                    <div className="fixed inset-0 z-[997]" onClick={() => setShowProfileMenu(false)} />
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[999] animate-slide-down">
                                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md ring-2 ring-white">
                                                    {user?.name?.charAt(0).toUpperCase() || 'V'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-sm text-gray-900 truncate">{user?.name || 'Vendor'}</div>
                                                    <div className="text-xs text-gray-600 truncate">{user?.business_name || 'Business'}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-2">
                                            <button
                                                onClick={() => {
                                                    setShowProfileMenu(false);
                                                    navigate('/profile');
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                                            >
                                                <span className="text-xl">👤</span>
                                                <span className="font-semibold text-sm text-gray-700">My Profile</span>
                                            </button>

                                            <div className="h-px bg-gray-100 my-2" />

                                            <button
                                                onClick={() => {
                                                    setShowProfileMenu(false);
                                                    setShowLogoutModal(true);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors text-left text-red-600"
                                            >
                                                <span className="text-xl">🚪</span>
                                                <span className="font-semibold text-sm">Logout</span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Sidebar
                onHoverChange={setIsSidebarHovered}
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            {/* Notification Bell - Desktop Only */}
            {isApproved && (
                <div className="hidden md:block" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 999 }}>
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
            }} className="content-area md:mt-0 mt-[calc(56px+env(safe-area-inset-top))]">
                <div style={{ padding: '30px' }} className="page-content">
                    {isApproved ? children : <AccountPending />}
                </div>

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
                        padding-bottom: 80px !important;
                    }
                    .page-content {
                        padding: 15px !important;
                    }
                }
                
                @keyframes slide-down {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-slide-down {
                    animation: slide-down 0.2s ease-out;
                }
            `}</style>

            <ConfirmModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleLogout}
                title="Confirm Logout"
                message="Are you sure you want to log out?"
                type="danger"
                confirmText="Logout"
                cancelText="Cancel"
            />
            <ConfirmModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleLogout}
                title="Confirm Logout"
                message="Are you sure you want to log out?"
                type="danger"
                confirmText="Logout"
                cancelText="Cancel"
            />

            {/* Auto-Triggered Walkthrough based on current route */}
            <WalkthroughOverlay pageRoute={useLocation().pathname} />

            {/* Smart Triggers (Behavioral Rules) */}
            <SmartTriggerManager />

            {/* Global AI Chat Assistant */}
            <AIChatWidget />
        </div>
    );
}
