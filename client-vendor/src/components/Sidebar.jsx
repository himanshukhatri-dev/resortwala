import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import ConfirmModal from './ConfirmModal';

export default function Sidebar({ userType = 'vendor', ...props }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);

    // Propagate hover state to parent
    if (props.onHoverChange) {
        props.onHoverChange(isHovered);
    }

    const menuItems = [
        { path: '/dashboard', icon: '📊', label: 'Dashboard', roles: ['vendor', 'admin'] },
        { path: '/vendors', icon: '🏢', label: 'Vendor', roles: ['admin'] },
        { path: '/customers', icon: '👥', label: 'Customer', roles: ['admin'] },
        { path: '/properties', icon: '🏠', label: 'Property', roles: ['vendor', 'admin'] },
        { path: '/bookings', icon: '📅', label: 'Booking', roles: ['vendor', 'admin'] },
        { path: '/day-wise-booking', icon: '📊', label: 'Day Wise Booking', roles: ['vendor', 'admin'] },
        { path: '/holidays', icon: '🌴', label: 'Holiday', roles: ['vendor', 'admin'] },
        { path: '/reviews', icon: '⭐', label: 'Review', roles: ['vendor', 'admin'] },
    ];

    const filteredItems = menuItems.filter(item => item.roles.includes(userType));



    return (
        <>
            <div
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
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isHovered ? '4px 0 20px rgba(0,0,0,0.1)' : 'none',
                    overflow: 'hidden',
                    color: 'var(--text-color)'
                }}
            >
                {/* Logo Area */}
                <div style={{
                    height: '70px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: isHovered ? '0 20px' : '0',
                    justifyContent: isHovered ? 'flex-start' : 'center',
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: 'var(--sidebar-bg)',
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
                <nav style={{ padding: '10px 0', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                    {filteredItems.map((item) => {
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
                                    color: isActive ? 'var(--primary-color)' : 'var(--text-color)',
                                    backgroundColor: isActive ? 'var(--hover-bg)' : 'transparent',
                                    textDecoration: 'none',
                                    fontSize: '15px',
                                    fontWeight: isActive ? '600' : '500',
                                    borderLeft: isActive ? '3px solid var(--primary-color)' : '3px solid transparent',
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

                {/* Theme Toggle & Logout */}
                <div style={{ padding: isHovered ? '15px' : '10px', borderTop: '1px solid var(--border-color)' }}>
                    <style>{`
                    .sidebar-item:hover {
                        background-color: var(--hover-bg) !important;
                        color: var(--primary-color) !important;
                    }
                    @media (max-width: 768px) {
                        div[style*="width"] {
                            width: 60px !important;
                        }
                    }
                `}</style>
                </div>
            </div>
        </>
    );
}
