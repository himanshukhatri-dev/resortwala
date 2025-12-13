import { Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { useAuth } from './context/AuthContext';

export default function Layout() {
    const { user } = useAuth();
    const role = user?.role || 'admin';

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            <Sidebar userType={role} />
            <div style={{ flex: 1, marginLeft: '200px', width: 'calc(100% - 200px)' }}>
                <Outlet />
            </div>
            <style>{`
                @media (max-width: 768px) {
                    div[style*="marginLeft: 200px"] {
                        margin-left: 60px !important;
                        width: calc(100% - 60px) !important;
                    }
                }
            `}</style>
        </div>
    );
}
