import { Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { useAuth } from './context/AuthContext';
import NotificationBell from './components/NotificationBell';
import { useState, useEffect } from 'react';
import { FiMenu, FiChevronDown } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from './config';

export default function Layout() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const role = user?.role || 'admin';
    const [isMobile, setIsMobile] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const handleLogout = async () => {
        try {
            await axios.post(`${API_BASE_URL}/admin/logout`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            logout();
            navigate('/login');
        }
    };

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024); // Mobile < 1024px (Tablet/Mobile)
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div className="flex min-h-screen bg-[#f8f9fa] overflow-x-hidden">
            {/* Sidebar (Desktop & Mobile Drawer) */}
            <Sidebar
                userType={role}
                isMobile={isMobile}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
            />

            {/* Mobile Header */}
            {isMobile && (
                <div className="fixed top-0 left-0 right-0 h-[calc(64px+env(safe-area-inset-top))] bg-white border-b border-gray-200 z-[999] flex items-center justify-between px-4 pt-[env(safe-area-inset-top)] shadow-sm">
                    {/* Left: Logo */}
                    <div className="flex items-center gap-3">
                        <img
                            src="/admin/resortwala-logo.png"
                            alt="ResortWala"
                            className="h-8 w-auto object-contain"
                        />
                    </div>

                    {/* Right: Notification & Profile */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <NotificationBell mobile={true} />
                        </div>

                        {/* Profile Popup */}
                        <div className="relative">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all active:scale-95 border border-gray-200"
                            >
                                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                                </div>
                                <FiChevronDown size={14} className={`text-gray-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {showProfileMenu && (
                                <>
                                    <div className="fixed inset-0 z-[998]" onClick={() => setShowProfileMenu(false)} />
                                    <div className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[999] animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="p-4 bg-gray-50 border-b border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
                                                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-sm text-gray-900 truncate">{user?.name || 'Administrator'}</div>
                                                    <div className="text-xs text-gray-500 truncate">{user?.email || 'admin@resortwala.com'}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-2">
                                            {/* Profile Link could go here if Admin has a profile page */}
                                            {/* For now just Logout */}
                                            <button
                                                onClick={() => {
                                                    setShowProfileMenu(false);
                                                    handleLogout();
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors text-left text-red-600"
                                            >
                                                <span className="text-lg">🚪</span>
                                                <span className="font-semibold text-sm">Logout</span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Notification Bell - Fixed Top Right */}
            {!isMobile && (
                <div className="fixed top-4 right-6 z-50">
                    <NotificationBell />
                </div>
            )}

            <main
                className={isMobile ? 'pb-20' : ''}
                style={{
                    flex: 1,
                    marginLeft: isMobile ? '0' : 'var(--sidebar-width, 70px)',
                    marginTop: isMobile ? 'calc(64px + env(safe-area-inset-top))' : '0', // Push content down for mobile header with safe area
                    width: '100%',
                    transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    minWidth: 0
                }}
            >
                <Outlet />
            </main>

            <style>{`
                :root {
                    --sidebar-width: 70px;
                }
            `}</style>
        </div>
    );
}
