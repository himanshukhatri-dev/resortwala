import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import ConfirmModal from './ConfirmModal';

export default function Sidebar({ userType = 'vendor', isOpen, onClose, ...props }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const { user, token, logout } = useAuth();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await axios.post('/api/vendor/logout', {}, {
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

    // Propagate hover state to parent securely
    useEffect(() => {
        if (props.onHoverChange) {
            props.onHoverChange(isHovered);
        }
    }, [isHovered, props.onHoverChange]);

    const menuItems = [
        { path: '/dashboard', icon: '📊', label: 'Dashboard', roles: ['vendor', 'admin'] },
        { path: '/vendors', icon: '🏢', label: 'Vendor', roles: ['admin'] },
        { path: '/customers', icon: '👥', label: 'Customer', roles: ['admin'] },
        { path: '/calendar', icon: '🗓️', label: 'Booking Calendar', roles: ['vendor', 'admin'] },
        { path: '/properties', icon: '🏠', label: 'Property', roles: ['vendor', 'admin'] },
        { path: '/bookings', icon: '📅', label: 'Booking Reports', roles: ['vendor', 'admin'] },
        { path: '/holiday-management', icon: '🌴', label: 'Holiday', roles: ['vendor', 'admin'] },
        { path: '/reviews', icon: '⭐', label: 'Review', roles: ['vendor', 'admin'] },
    ];

    const filteredItems = menuItems.filter(item => item.roles.includes(userType));

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 999,
                        display: 'none', // Controlled by CSS media query
                        className: 'mobile-overlay'
                    }}
                />
            )}

            <div
                className={`sidebar ${isOpen ? 'mobile-open' : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    width: isHovered ? '240px' : '70px',
                    backgroundColor: 'var(--sidebar-bg)',
                    borderRight: '1px solid var(--border-color)',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 1000,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isHovered ? '4px 0 20px rgba(0,0,0,0.1)' : 'none',
                    overflow: 'hidden',
                    color: 'var(--text-color)'
                }}
            >
                {/* Logo Area */}
                <div style={{
                    height: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: isHovered ? '0 20px' : '0',
                    justifyContent: 'center',
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: 'var(--sidebar-bg)',
                    flexShrink: 0,
                    transition: 'all 0.3s ease',
                    position: 'relative'
                }}>
                    <img
                        src="/vendor/loader-logo.png"
                        alt="ResortWala"
                        style={{
                            height: isHovered ? '40px' : '28px',
                            width: 'auto',
                            transition: 'all 0.3s ease',
                            objectFit: 'contain'
                        }}
                    />

                    {/* Mobile Close Button */}
                    <button
                        className="mobile-close-btn"
                        onClick={onClose}
                        style={{
                            display: 'none',
                            position: 'absolute',
                            right: '10px',
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            color: 'var(--text-color)',
                            cursor: 'pointer'
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Menu Items */}
                <nav style={{ padding: '10px 0', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                    {filteredItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={onClose} // Close on mobile when clicked
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px',
                                    padding: '12px 20px',
                                    height: '50px',
                                    color: isActive ? 'var(--primary-color)' : 'var(--text-color)',
                                    backgroundColor: isActive ? 'var(--hover-bg)' : 'transparent',
                                    textDecoration: 'none',
                                    fontSize: '15px',
                                    fontWeight: isActive ? '600' : '500',
                                    borderLeft: isActive ? '3px solid var(--primary-color)' : '3px solid transparent',
                                    transition: 'all 0.2s ease',
                                    justifyContent: isHovered ? 'flex-start' : 'center',
                                    whiteSpace: 'nowrap'
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

                <div style={{
                    borderTop: '1px solid var(--border-color)',
                    padding: isHovered ? '20px' : '20px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                    backgroundColor: 'var(--sidebar-bg)',
                    alignItems: isHovered ? 'stretch' : 'center',
                    transition: 'all 0.3s ease'
                }}>
                    {/* User Profile */}
                    <Link to="/profile" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        textDecoration: 'none',
                        color: 'inherit',
                        justifyContent: isHovered ? 'flex-start' : 'center'
                    }}>
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
                            fontSize: '18px',
                            flexShrink: 0
                        }}>
                            {user?.name?.charAt(0).toUpperCase() || 'V'}
                        </div>
                        {isHovered && (
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.name || 'Vendor'}</div>
                                <div style={{ fontSize: '12px', opacity: 0.7, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.business_name || 'Business'}</div>
                            </div>
                        )}
                    </Link>

                    {/* Logout Button */}
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        style={{
                            padding: isHovered ? '10px' : '10px',
                            backgroundColor: 'var(--hover-bg-red)', // Define this or use faint red
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: isHovered ? 'flex-start' : 'center',
                            gap: '10px',
                            transition: 'all 0.2s'
                        }}
                        title="Logout"
                    >
                        <span style={{ fontSize: '18px' }}>🚪</span>
                        {isHovered && <span>Logout</span>}
                    </button>
                </div>

                {/* CSS for Mobile */}
                <style>{`
                    .sidebar-item:hover {
                        background-color: var(--hover-bg) !important;
                        color: var(--primary-color) !important;
                    }
                    
                    @media (max-width: 768px) {
                        .mobile-overlay {
                            display: block !important;
                        }

                        .sidebar {
                            transform: translateX(-100%);
                            width: 240px !important; /* Always full width on mobile if open */
                        }

                        .sidebar.mobile-open {
                            transform: translateX(0);
                        }

                        /* Force show labels on mobile when open */
                        .sidebar.mobile-open span {
                            opacity: 1 !important;
                            display: block !important;
                        }
                        
                        .sidebar.mobile-open .sidebar-item {
                            justify-content: flex-start !important;
                        }
                        
                        .mobile-close-btn {
                            display: block !important;
                        }
                    }
                `}</style>
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
