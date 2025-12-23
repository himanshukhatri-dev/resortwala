import { Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { useAuth } from './context/AuthContext';
import NotificationBell from './components/NotificationBell';

export default function Layout() {
    const { user } = useAuth();
    const role = user?.role || 'admin';

    return (
        <div className="flex min-h-screen bg-[#f8f9fa] overflow-x-hidden">
            <Sidebar userType={role} />

            {/* Notification Bell - Fixed Top Right */}
            <div className="fixed top-4 right-6 z-50">
                <NotificationBell />
            </div>

            <main style={{
                flex: 1,
                marginLeft: 'var(--sidebar-width, 70px)',
                width: '100%',
                transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                minWidth: 0
            }}>
                <Outlet />
            </main>
            <style>{`
                :root {
                    --sidebar-width: 70px;
                }
                @media (max-width: 768px) {
                    :root {
                        --sidebar-width: 60px;
                    }
                }
            `}</style>
        </div>
    );
}
