import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useModal } from '../context/ModalContext'; // Use confirm modal if needed, or simple window.confirm

export default function Sidebar({ userType = 'admin' }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { token, logout } = useAuth();
    const { showConfirm } = useModal();
    const [isHovered, setIsHovered] = useState(false);

    // Filter menu items for Admin
    const menuItems = [
        { path: '/dashboard', icon: '👤', label: 'Dashboard' },
        { path: '/users', icon: '👥', label: 'Users' },
        { path: '/vendors', icon: '🏢', label: 'Vendors' },
        { path: '/customers', icon: '🙂', label: 'Customers' },
        { path: '/properties', icon: '🏠', label: 'Properties' },
        { path: '/bookings', icon: '📅', label: 'Bookings' },
        { path: '/day-wise-booking', icon: '📊', label: 'Availability' },
        { path: '/holidays', icon: '🌴', label: 'Holidays' },
        { path: '/reviews', icon: '⭐', label: 'Reviews' },
    ];

    const handleLogout = async () => {
        const confirmed = await showConfirm('Logout', 'Are you sure you want to logout?', 'Logout', 'Cancel', 'danger');
        if (!confirmed) return;

        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/logout`, {}, {
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
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                width: isHovered ? '240px' : '70px',
                backgroundColor: '#ffffff',
                borderRight: '1px solid #e0e0e0',
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                display: 'flex',
                flexDirection: 'column',
                zIndex: 1000,
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isHovered ? '4px 0 20px rgba(0,0,0,0.1)' : 'none',
                overflow: 'hidden',
                color: '#333'
            }}
        >
            {/* Logo Area */}
            <div style={{
                height: '70px',
                display: 'flex',
                alignItems: 'center',
                padding: isHovered ? '0 20px' : '0',
                justifyContent: isHovered ? 'flex-start' : 'center',
                borderBottom: '1px solid #e0e0e0',
                backgroundColor: '#ffffff',
                flexShrink: 0,
                transition: 'all 0.3s ease'
            }}>
                <Link to="/dashboard" style={{
                    fontSize: '22px',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <span style={{ fontSize: '24px' }}>🏖️</span>
                    <span style={{
                        opacity: isHovered ? 1 : 0,
                        display: isHovered ? 'block' : 'none',
                        transition: 'opacity 0.2s ease',
                        whiteSpace: 'nowrap'
                    }}>
                        ResortWala
                    </span>
                </Link>
            </div>

            {/* Menu Items */}
            <nav style={{ padding: '10px 0', flex: 1, overflowY: 'auto' }}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                padding: '12px 20px',
                                height: '50px',
                                color: isActive ? '#667eea' : '#666',
                                backgroundColor: isActive ? '#f0f4ff' : 'transparent',
                                textDecoration: 'none',
                                fontSize: '15px',
                                fontWeight: isActive ? '600' : '500',
                                borderLeft: isActive ? '3px solid #667eea' : '3px solid transparent',
                                transition: 'all 0.2s ease',
                                justifyContent: isHovered ? 'flex-start' : 'center'
                            }}
                            title={!isHovered ? item.label : ''}
                            className="sidebar-item"
                        >
                            <span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>{item.icon}</span>
                            <span style={{
                                opacity: isHovered ? 1 : 0,
                                display: isHovered ? 'block' : 'none',
                                whiteSpace: 'nowrap',
                                transition: 'opacity 0.2s'
                            }}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div style={{ padding: isHovered ? '15px' : '10px', borderTop: '1px solid #e0e0e0' }}>
                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '10px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#d32f2f',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        justifyContent: isHovered ? 'flex-start' : 'center',
                        height: '45px'
                    }}
                    title={!isHovered ? "Logout" : ""}
                    className="logout-btn"
                >
                    <span style={{ fontSize: '20px' }}>🚪</span>
                    <span style={{
                        opacity: isHovered ? 1 : 0,
                        display: isHovered ? 'block' : 'none',
                        whiteSpace: 'nowrap'
                    }}>
                        Logout
                    </span>
                </button>
            </div>

            <style>{`
                .sidebar-item:hover {
                    background-color: #f8f9fa !important;
                    color: #667eea !important;
                }
                .logout-btn:hover {
                    background-color: #ffebee !important;
                }
                @media (max-width: 768px) {
                    div[style*="width"] {
                        width: 60px !important;
                    }
                }
            `}</style>
        </div>
    );
}
