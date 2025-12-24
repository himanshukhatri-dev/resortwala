import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useModal } from '../context/ModalContext';
import { API_BASE_URL } from '../config';

export default function Sidebar({ userType = 'admin' }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { token, logout } = useAuth();
    const { showConfirm } = useModal();
    const [expandedMenu, setExpandedMenu] = useState(null);
    const [isHovered, setIsHovered] = useState(false);

    // Update Layout margin via CSS Variable
    useEffect(() => {
        const root = document.documentElement;
        if (isHovered) {
            root.style.setProperty('--sidebar-width', '240px');
        } else {
            root.style.setProperty('--sidebar-width', window.innerWidth <= 768 ? '60px' : '70px');
            setExpandedMenu(null); // Collapse when sidebar shrinks
        }
    }, [isHovered]);

    const menuItems = [
        { path: '/dashboard', icon: '📊', label: 'Overview' },
        {
            id: 'authority',
            label: 'Authorities',
            icon: '🛡️',
            subItems: [
                { path: '/users', icon: '👥', label: 'Administrators' },
                { path: '/vendors', icon: '🏢', label: 'Partner Vendors' },
                { path: '/customers', icon: '🙂', label: 'Customer Base' },
            ]
        },
        { path: '/properties', icon: '🏠', label: 'Properties' },
        { path: '/property-changes', icon: '📝', label: 'Prop. Updates' },
        { path: '/bookings', icon: '📅', label: 'Bookings' },
        { path: '/calendar', icon: '📆', label: 'Master Calendar' },
        { path: '/day-wise-booking', icon: '📊', label: 'Availability' },
        { path: '/holidays', icon: '🌴', label: 'Holidays' },
        { path: '/reviews', icon: '⭐', label: 'Reviews' },
    ];

    const handleLogout = async () => {
        const confirmed = await showConfirm('Logout', 'Are you sure you want to logout?', 'Logout', 'Cancel', 'danger');
        if (!confirmed) return;

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

    const toggleMenu = (id) => {
        if (!isHovered) {
            setIsHovered(true);
            setExpandedMenu(id);
            return;
        }
        setExpandedMenu(expandedMenu === id ? null : id);
    };

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setExpandedMenu(null);
            }}
            style={{
                width: isHovered ? '240px' : '70px',
                backgroundColor: '#ffffff',
                borderRight: '1px solid #f1f5f9',
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                display: 'flex',
                flexDirection: 'column',
                zIndex: 1000,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isHovered ? '20px 0 50px rgba(0,0,0,0.03)' : 'none',
                overflow: 'hidden',
                color: '#334155'
            }}
        >
            {/* Logo Area */}
            <div style={{
                height: '70px',
                display: 'flex',
                alignItems: 'center',
                padding: isHovered ? '0 24px' : '0',
                justifyContent: 'center',
                borderBottom: '1px solid #f1f5f9',
                backgroundColor: '#ffffff',
                flexShrink: 0,
                transition: 'all 0.3s ease'
            }}>
                <Link to="/dashboard" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    textDecoration: 'none'
                }}>
                    <img
                        src="/admin/loader-logo.png"
                        alt="ResortWala"
                        style={{
                            height: isHovered ? '32px' : '24px',
                            width: 'auto',
                            transition: 'all 0.3s ease',
                            objectFit: 'contain'
                        }}
                    />
                </Link>
            </div>

            {/* Menu Items */}
            <nav style={{ padding: '16px 0', flex: 1, overflowY: 'auto', overflowX: 'hidden' }} className="custom-scrollbar">
                {menuItems.map((item) => {
                    const hasSubItems = !!item.subItems;
                    const isExpanded = expandedMenu === item.id;
                    const isActive = location.pathname === item.path || (hasSubItems && item.subItems.some(s => s.path === location.pathname));

                    if (hasSubItems) {
                        return (
                            <div key={item.id} className="mb-1">
                                <button
                                    onClick={() => toggleMenu(item.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px 24px',
                                        width: '100%',
                                        border: 'none',
                                        background: 'transparent',
                                        color: isActive ? '#0f172a' : '#64748b',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '700',
                                        transition: 'all 0.2s ease',
                                        justifyContent: isHovered ? 'flex-start' : 'center',
                                        position: 'relative'
                                    }}
                                >
                                    <span style={{ fontSize: '18px', minWidth: '24px' }}>{item.icon}</span>
                                    {isHovered && (
                                        <>
                                            <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                                            <span style={{
                                                fontSize: '10px',
                                                transition: 'transform 0.3s',
                                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                                            }}>▼</span>
                                        </>
                                    )}
                                    {isActive && !isExpanded && (
                                        <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '4px', backgroundColor: '#3b82f6', borderRadius: '0 4px 4px 0' }} />
                                    )}
                                </button>

                                {isHovered && isExpanded && (
                                    <div style={{
                                        backgroundColor: '#f8fafc',
                                        margin: '4px 12px',
                                        borderRadius: '16px',
                                        padding: '4px 0'
                                    }}>
                                        {item.subItems.map(sub => (
                                            <Link
                                                key={sub.path}
                                                to={sub.path}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    padding: '10px 16px',
                                                    color: location.pathname === sub.path ? '#3b82f6' : '#64748b',
                                                    textDecoration: 'none',
                                                    fontSize: '13px',
                                                    fontWeight: location.pathname === sub.path ? '800' : '600',
                                                    transition: 'all 0.2s ease',
                                                    borderRadius: '12px',
                                                    margin: '2px 8px',
                                                    backgroundColor: location.pathname === sub.path ? '#eff6ff' : 'transparent'
                                                }}
                                            >
                                                <span style={{ fontSize: '16px' }}>{sub.icon}</span>
                                                <span>{sub.label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 24px',
                                color: isActive ? '#0f172a' : '#64748b',
                                backgroundColor: isActive ? '#f8fafc' : 'transparent',
                                textDecoration: 'none',
                                fontSize: '14px',
                                fontWeight: isActive ? '700' : '600',
                                transition: 'all 0.2s ease',
                                justifyContent: isHovered ? 'flex-start' : 'center',
                                position: 'relative',
                                marginBottom: '4px'
                            }}
                            title={!isHovered ? item.label : ''}
                        >
                            <span style={{ fontSize: '18px', minWidth: '24px' }}>{item.icon}</span>
                            {isHovered && <span>{item.label}</span>}
                            {isActive && (
                                <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '4px', backgroundColor: '#3b82f6', borderRadius: '0 4px 4px 0' }} />
                            )}
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
