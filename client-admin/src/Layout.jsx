import { Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { useAuth } from './context/AuthContext';
import NotificationBell from './components/NotificationBell';
import { useState, useEffect } from 'react';
import { FiMenu } from 'react-icons/fi';

export default function Layout() {
    const { user } = useAuth();
    const role = user?.role || 'admin';
    const [isMobile, setIsMobile] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
            />

            {/* Mobile Header */}
            {isMobile && (
                <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-[999] flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            <FiMenu size={24} />
                        </button>
                        <img
                            src="/admin/loader-logo.png"
                            alt="ResortWala"
                            className="h-8 w-auto object-contain"
                        />
                    </div>
                    {/* Notification Bell on Mobile Header */}
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <NotificationBell mobile={true} />
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
                style={{
                    flex: 1,
                    marginLeft: isMobile ? '0' : 'var(--sidebar-width, 70px)',
                    marginTop: isMobile ? '64px' : '0', // Push content down for mobile header
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
