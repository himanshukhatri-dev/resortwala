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

    useEffect(() => {
        if (props.onHoverChange) {
            props.onHoverChange(isHovered);
        }
    }, [isHovered, props.onHoverChange]);

    const menuItems = [
        { path: '/dashboard', icon: '📊', label: 'Dashboard', roles: ['vendor', 'admin'] },
        { path: '/properties', icon: '🏠', label: 'Property', roles: ['vendor', 'admin'] },
        { path: '/bookings', icon: '📅', label: 'Bookings', roles: ['vendor', 'admin'] },
        { path: '/calendar', icon: '🗓️', label: 'Calendar', roles: ['vendor', 'admin'] },
        { path: '/holiday-management', icon: '🌴', label: 'Holiday', roles: ['vendor', 'admin'] },
        { path: '/reviews', icon: '⭐', label: 'Reviews', roles: ['vendor', 'admin'] },
        { path: '/learning', icon: '🎓', label: 'Learn & Grow', roles: ['vendor'] },
    ];

    const filteredItems = menuItems.filter(item => item.roles.includes(userType));

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] md:hidden"
                />
            )}

            {/* Desktop Sidebar */}
            <div
                className={`
                    fixed left-0 top-0 h-screen bg-white border-r border-gray-200 
                    transition-all duration-300 ease-in-out z-[1000]
                    hidden md:flex flex-col
                    ${isHovered ? 'w-60' : 'w-[70px]'}
                    shadow-lg
                `}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Logo */}
                <div className="h-20 flex items-center justify-center border-b border-gray-200 px-4">
                    <img
                        src="/vendor/loader-logo.png"
                        alt="ResortWala"
                        className={`transition-all duration-300 object-contain ${isHovered ? 'h-10' : 'h-7'}`}
                    />
                </div>

                {/* Menu Items */}
                <nav className="sidebar-nav flex-1 py-4 overflow-y-auto overflow-x-hidden">
                    {filteredItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`
                                    flex items-center gap-4 px-5 py-3 mx-2 rounded-xl
                                    transition-all duration-200
                                    ${isActive
                                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-semibold shadow-sm'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                                    }
                                    ${isHovered ? 'justify-start' : 'justify-center'}
                                `}
                                title={!isHovered ? item.label : ''}
                            >
                                <span className="text-xl min-w-[24px] text-center">{item.icon}</span>
                                <span className={`text-sm font-medium whitespace-nowrap transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 w-0'}`}>
                                    {item.label}
                                </span>
                                {isActive && isHovered && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Profile & Logout - Desktop */}
                <div className="border-t border-gray-200 p-4 space-y-3">
                    {/* Profile */}
                    <Link
                        to="/profile"
                        className={`
                            flex items-center gap-3 p-3 rounded-xl
                            bg-gradient-to-r from-gray-50 to-gray-100
                            hover:from-blue-50 hover:to-indigo-50
                            transition-all duration-200 group
                            ${isHovered ? 'justify-start' : 'justify-center'}
                        `}
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white group-hover:ring-blue-200 transition-all">
                            {user?.name?.charAt(0).toUpperCase() || 'V'}
                        </div>
                        {isHovered && (
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm text-gray-900 truncate">{user?.name || 'Vendor'}</div>
                                <div className="text-xs text-gray-500 truncate">{user?.business_name || 'Business'}</div>
                            </div>
                        )}
                    </Link>

                    {/* Logout */}
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className={`
                            w-full flex items-center gap-3 p-3 rounded-xl
                            bg-red-50 text-red-600 hover:bg-red-100
                            transition-all duration-200 font-semibold text-sm
                            ${isHovered ? 'justify-start' : 'justify-center'}
                            group
                        `}
                        title="Logout"
                    >
                        <span className="text-lg group-hover:scale-110 transition-transform">🚪</span>
                        {isHovered && <span>Logout</span>}
                    </button>
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[1000] safe-area-inset-bottom">
                <div className="flex items-center justify-around px-2 py-2">
                    {filteredItems.slice(0, 5).map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`
                                    flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl
                                    transition-all duration-200 min-w-[60px]
                                    ${isActive
                                        ? 'bg-gradient-to-b from-blue-50 to-indigo-50 text-blue-600 shadow-sm'
                                        : 'text-gray-600 active:bg-gray-50'
                                    }
                                `}
                            >
                                <span className={`text-xl ${isActive ? 'scale-110' : ''} transition-transform`}>{item.icon}</span>
                                <span className={`text-[10px] font-semibold ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                                    {item.label}
                                </span>
                                {isActive && <div className="w-1 h-1 rounded-full bg-blue-600 absolute bottom-1" />}
                            </Link>
                        );
                    })}

                    {/* Profile Button on Mobile */}
                    <Link
                        to="/profile"
                        className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl text-gray-600 active:bg-gray-50 transition-all min-w-[60px]"
                    >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                            {user?.name?.charAt(0).toUpperCase() || 'V'}
                        </div>
                        <span className="text-[10px] font-semibold text-gray-500">Profile</span>
                    </Link>
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
