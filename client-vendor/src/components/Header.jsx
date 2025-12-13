import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ConfirmModal from './ConfirmModal';

export default function Header({ title }) {
    const { user, token, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await axios.post('http://192.168.1.105:8000/api/vendor/logout', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsLoggingOut(false);
            logout();
            navigate('/login');
        }
    };

    return (
        <>
            <div style={{
                height: '70px',
                backgroundColor: 'var(--sidebar-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 30px',
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-color)'
            }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>{title}</h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '20px',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-color)'
                        }}
                        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                    >
                        {theme === 'dark' ? '🌙' : '☀️'}
                    </button>

                    {/* User Profile Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/profile')}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '600', fontSize: '14px' }}>{user?.name || 'Vendor'}</div>
                            <div style={{ fontSize: '12px', opacity: 0.7 }}>{user?.business_name || 'Business'}</div>
                        </div>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary-color)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '18px'
                        }} title="Go to Profile">
                            {user?.name?.charAt(0).toUpperCase() || 'V'}
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: 'var(--hover-bg-red)',
                            color: 'var(--danger-color)',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <span>🚪</span> Logout
                    </button>
                </div>
            </div>

            <ConfirmModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleLogout}
                title="Confirm Logout"
                message="Are you sure you want to log out?"
                type="danger"
                confirmText={isLoggingOut ? "Logging out..." : "Logout"}
                cancelText="Cancel"
                isLoading={isLoggingOut}
            />
        </>
    );
}
