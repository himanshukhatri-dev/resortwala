import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useModal } from '../context/ModalContext';
import { API_BASE_URL } from '../config';
import { FiX, FiLogOut, FiChevronDown, FiChevronRight, FiMenu } from 'react-icons/fi';

export default function Sidebar({ userType = 'admin', isOpen, onClose, isMobile, onToggle }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { token, logout } = useAuth();
    const { showConfirm } = useModal();
    const [expandedMenu, setExpandedMenu] = useState(null);
    const [isHovered, setIsHovered] = useState(false);
    const [systemInfo, setSystemInfo] = useState(null);

    useEffect(() => {
        // Fetch System Info
        const fetchSystemInfo = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/admin/system-info`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSystemInfo(response.data);
            } catch (error) {
                console.error('Failed to fetch system info:', error);
            }
        };
        if (token) fetchSystemInfo();
    }, [token]);

    // Desktop: Update margin via CSS variable
    useEffect(() => {
        if (isMobile) return;

        const root = document.documentElement;
        if (isHovered) {
            root.style.setProperty('--sidebar-width', '240px');
        } else {
            root.style.setProperty('--sidebar-width', '70px');
            setExpandedMenu(null);
        }
    }, [isHovered, isMobile]);

    const menuItems = [
        { path: '/dashboard', icon: '📊', label: 'Overview' },
        { path: '/users', icon: '👥', label: 'Administrators' },
        { path: '/vendors', icon: '🏢', label: 'Vendors' },
        { path: '/customers', icon: '🙂', label: 'Customers' },
        { path: '/properties', icon: '🏠', label: 'Properties' },
        { path: '/property-changes', icon: '📝', label: 'Prop. Updates' },
        { path: '/bookings', icon: '📅', label: 'Bookings' },
        { path: '/calendar', icon: '📆', label: 'Master Calendar' },
        { path: '/analytics', icon: '📊', label: 'Analytics' },
        { path: '/holidays', icon: '🌴', label: 'Holidays' },
        { path: '/intelligence', icon: '🧠', label: 'Intelligence' },
        { path: '/vendor-presentation', icon: '🎯', label: 'Vendor Pitch' },
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
            if (isMobile && onClose) onClose();
            logout();
            navigate('/login');
        }
    };

    const toggleMenu = (id) => {
        if (!isMobile && !isHovered) {
            setIsHovered(true);
            setExpandedMenu(id);
            return;
        }
        setExpandedMenu(expandedMenu === id ? null : id);
    };

    // Desktop Styles
    const desktopClasses = `fixed left-0 top-0 h-screen bg-white border-r border-gray-100 flex flex-col z-[40] transition-all duration-300 ease-in-out shadow-none ${isHovered ? 'w-60 shadow-xl' : 'w-[70px]'}`;

    // Mobile Styles (Drawer)
    const mobileClasses = `fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-[1001] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;
    const overlayClasses = `fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`;

});
console.log('Sidebar System Info:', systemInfo);

return (
    <>
        {/* Mobile Overlay */}
        {isMobile && <div className={overlayClasses} onClick={onClose} />}

        <div
            className={isMobile ? mobileClasses : desktopClasses}
            onMouseEnter={() => !isMobile && setIsHovered(true)}
            onMouseLeave={() => {
                if (!isMobile) {
                    setIsHovered(false);
                    setExpandedMenu(null);
                }
            }}
        >
            {/* Logo Area */}
            <div className="h-[70px] flex items-center justify-between px-6 border-b border-gray-100 bg-white flex-shrink-0">
                <Link to="/dashboard" onClick={() => isMobile && onClose && onClose()} className="flex items-center gap-3">
                    <img
                        src="/admin/loader-logo.png"
                        alt="ResortWala"
                        className={`h-8 w-auto object-contain transition-all duration-300 ${!isMobile && !isHovered ? 'scale-75' : 'scale-100'}`}
                    />
                    {(isMobile || isHovered) && (
                        <span className="font-bold text-gray-800 text-lg hidden">ResortWala</span>
                    )}
                </Link>
                {isMobile && (
                    <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600">
                        <FiX size={24} />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-4">
                {menuItems.map((item) => {
                    const hasSubItems = !!item.subItems;
                    const isExpanded = expandedMenu === item.id;
                    const isActive = location.pathname === item.path || (hasSubItems && item.subItems.some(s => s.path === location.pathname));

                    if (hasSubItems) {
                        return (
                            <div key={item.id} className="mb-1 px-3">
                                <button
                                    onClick={() => toggleMenu(item.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 
                                            ${isActive ? 'text-gray-900 bg-gray-50' : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'}
                                            ${!isMobile && !isHovered ? 'justify-center' : 'justify-start'}
                                        `}
                                >
                                    <span className="text-xl min-w-[24px] flex justify-center">{item.icon}</span>
                                    {(isMobile || isHovered) && (
                                        <>
                                            <span className="flex-1 text-left font-semibold text-sm">{item.label}</span>
                                            <span className={`text-xs transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                                <FiChevronDown />
                                            </span>
                                        </>
                                    )}
                                    {isActive && !isExpanded && !isMobile && !isHovered && (
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-l-full" />
                                    )}
                                </button>

                                {/* Submenu */}
                                {(isExpanded && (isMobile || isHovered)) && (
                                    <div className="mt-1 ml-4 pl-4 border-l-2 border-gray-100 space-y-1">
                                        {item.subItems.map(sub => (
                                            <Link
                                                key={sub.path}
                                                to={sub.path}
                                                onClick={() => isMobile && onClose && onClose()}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                                                        ${location.pathname === sub.path
                                                        ? 'text-blue-600 bg-blue-50 font-bold'
                                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-medium'}
                                                    `}
                                            >
                                                <span className="text-base">{sub.icon}</span>
                                                <span>{sub.label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    // Regular Item
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => isMobile && onClose && onClose()}
                            className={`flex items-center gap-3 mx-3 mb-1 px-3 py-3 rounded-xl transition-all duration-200 group
                                    ${isActive
                                    ? 'bg-blue-50 text-blue-600 font-bold shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600 font-medium'}
                                    ${!isMobile && !isHovered ? 'justify-center' : 'justify-start'}
                                `}
                            title={!isHovered && !isMobile ? item.label : ''}
                        >
                            <span className={`text-xl min-w-[24px] flex justify-center transition-transform group-hover:scale-110`}>{item.icon}</span>
                            {(isMobile || isHovered) && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* System Info Widget */}
            <div className={`mx-3 mb-2 p-3 rounded-xl bg-gray-50 text-xs border border-gray-100 ${!isMobile && !isHovered ? 'hidden' : 'block'}`}>
                {systemInfo ? (
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-medium">Env:</span>
                            <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${systemInfo.environment === 'production' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                {systemInfo.environment?.toUpperCase()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-medium">DB:</span>
                            <span className="font-mono font-bold text-gray-700 truncate max-w-[100px]" title={systemInfo.database}>
                                {systemInfo.database}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="animate-pulse flex space-x-2">
                        <div className="h-2 bg-gray-200 rounded w-full"></div>
                    </div>
                )}
            </div>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-gray-100 bg-white">
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors
                             ${!isMobile && !isHovered ? 'justify-center' : 'justify-start'}
                        `}
                    title={!isHovered && !isMobile ? "Logout" : ""}
                >
                    <FiLogOut className="text-xl min-w-[24px]" />
                    {(isMobile || isHovered) && <span className="font-bold text-sm">Logout</span>}
                </button>
            </div>
        </div>

        {/* Mobile Bottom Navigation */}
        {
            isMobile && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[1000] pb-[env(safe-area-inset-bottom)]">
                    <div className="flex items-center justify-around px-2 py-2">
                        {/* 1. Overview */}
                        <Link
                            to="/dashboard"
                            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px] ${location.pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-500'
                                }`}
                        >
                            <span className={`text-xl ${location.pathname === '/dashboard' ? 'scale-110' : ''} transition-transform`}>📊</span>
                            <span className="text-[10px] font-semibold">Home</span>
                            {location.pathname === '/dashboard' && <div className="w-1 h-1 rounded-full bg-blue-600 absolute bottom-1" />}
                        </Link>

                        {/* 2. Properties */}
                        <Link
                            to="/properties"
                            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px] ${location.pathname.startsWith('/properties') ? 'text-blue-600' : 'text-gray-500'
                                }`}
                        >
                            <span className={`text-xl ${location.pathname.startsWith('/properties') ? 'scale-110' : ''} transition-transform`}>🏠</span>
                            <span className="text-[10px] font-semibold">Props</span>
                            {location.pathname.startsWith('/properties') && <div className="w-1 h-1 rounded-full bg-blue-600 absolute bottom-1" />}
                        </Link>

                        {/* 3. Bookings */}
                        <Link
                            to="/bookings"
                            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px] ${location.pathname.startsWith('/bookings') ? 'text-blue-600' : 'text-gray-500'
                                }`}
                        >
                            <span className={`text-xl ${location.pathname.startsWith('/bookings') ? 'scale-110' : ''} transition-transform`}>📅</span>
                            <span className="text-[10px] font-semibold">Bookings</span>
                            {location.pathname.startsWith('/bookings') && <div className="w-1 h-1 rounded-full bg-blue-600 absolute bottom-1" />}
                        </Link>

                        {/* 4. Updates */}
                        <Link
                            to="/property-changes"
                            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px] ${location.pathname.startsWith('/property-changes') ? 'text-blue-600' : 'text-gray-500'
                                }`}
                        >
                            <span className={`text-xl ${location.pathname.startsWith('/property-changes') ? 'scale-110' : ''} transition-transform`}>📝</span>
                            <span className="text-[10px] font-semibold">Updates</span>
                            {location.pathname.startsWith('/property-changes') && <div className="w-1 h-1 rounded-full bg-blue-600 absolute bottom-1" />}
                        </Link>

                        {/* 5. Menu / More */}
                        <button
                            onClick={onToggle}
                            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px] ${isOpen ? 'text-blue-600' : 'text-gray-500'
                                }`}
                        >
                            <FiMenu className={`text-xl ${isOpen ? 'scale-110' : ''} transition-transform`} />
                            <span className="text-[10px] font-semibold">Menu</span>
                            {isOpen && <div className="w-1 h-1 rounded-full bg-blue-600 absolute bottom-1" />}
                        </button>
                    </div>
                </div>
            )
        }
    </>
);
}
