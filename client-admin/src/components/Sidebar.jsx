import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useModal } from '../context/ModalContext';
import { API_BASE_URL } from '../config';
import {
    FiX, FiLogOut, FiChevronDown, FiChevronRight, FiMenu,
    FiHome, FiPieChart, FiLayout, FiUsers, FiBriefcase,
    FiDatabase, FiDollarSign, FiCalendar, FiSettings,
    FiMessageSquare, FiTruck, FiActivity, FiLayers,
    FiPlusCircle, FiUploadCloud, FiBarChart2, FiCpu,
    FiHash, FiArchive, FiBell, FiSearch, FiVideo, FiMic, FiLock
} from 'react-icons/fi';

export default function Sidebar({ userType = 'admin', isOpen, onClose, isMobile, onToggle }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { token, logout, hasPermission, hasRole } = useAuth();
    const { showConfirm } = useModal();
    const [expandedMenu, setExpandedMenu] = useState(null);
    const [isHovered, setIsHovered] = useState(false);
    const [systemInfo, setSystemInfo] = useState(null);
    const [stats, setStats] = useState({
        users: { pending_vendors: 0 },
        properties: { pending: 0 },
        bookings: { pending: 0 },
        holidays: { pending: 0 }
    });

    // Grouped Navigation Architecture
    const menuGroups = [
        {
            title: 'Reporting',
            activeColor: 'bg-blue-600',
            textColor: 'text-blue-600',
            bgLight: 'bg-blue-50',
            items: [
                { path: '/dashboard', icon: <FiPieChart />, label: 'Overview' },
                { path: '/analytics', icon: <FiActivity />, label: 'Analytics', permission: 'analytics.view' },
            ]
        },
        {
            title: 'Inventory',
            activeColor: 'bg-indigo-600',
            textColor: 'text-indigo-600',
            bgLight: 'bg-indigo-50',
            items: [
                {
                    id: 'properties',
                    icon: <FiLayout />,
                    label: 'Properties',
                    permission: 'properties.view',
                    subItems: [
                        { path: '/properties', icon: <FiLayers />, label: 'All Assets', permission: 'properties.view' },
                        { path: '/properties/pending', icon: <FiPlusCircle />, label: 'Pending Approvals', permission: 'properties.view' },
                        { path: '/bulk-upload', icon: <FiUploadCloud />, label: 'Bulk Upload', permission: 'properties.create' },
                        { path: '/revenue/full-rate-control', icon: <FiDollarSign />, label: 'Rate Control', permission: 'properties.view' },
                        { path: '/property-changes', icon: <FiActivity />, label: 'Update Requests', permission: 'properties.view' },
                    ]
                }
            ]
        },
        {
            title: 'Direct Sales',
            activeColor: 'bg-emerald-600',
            textColor: 'text-emerald-600',
            bgLight: 'bg-emerald-50',
            items: [
                { path: '/vendor-leads', icon: <FiBriefcase />, label: 'Vendor CRM', permission: 'crm.leads' },
                { path: '/intelligence/leads', icon: <FiSearch />, label: 'Lead Discovery', permission: 'crm.leads' },
                { path: '/connectors', icon: <FiUsers />, label: 'Connectors', permission: 'crm.connectors' },
                { path: '/connectors/reports', icon: <FiBarChart2 />, label: 'Commissions', permission: 'crm.connectors' },
                { path: '/vendor-presentation', icon: <FiTruck />, label: 'Vendor Onboarding', permission: 'crm.leads' },
                { path: '/tutorial-studio', icon: <FiVideo />, label: 'Tutorial Studio', permission: 'social.manage' },
                { path: '/ai-video-studio', icon: <FiVideo />, label: 'AI Social Studio', permission: 'social.manage' },
                { path: '/prompt-video-studio', icon: <FiVideo />, label: 'Prompt Video Studio', permission: 'social.manage' },
            ]
        },
        {
            title: 'Bookings & Ops',
            activeColor: 'bg-amber-600',
            textColor: 'text-amber-600',
            bgLight: 'bg-amber-50',
            items: [
                { path: '/bookings', icon: <FiCalendar />, label: 'Reservations', permission: 'bookings.view' },
                { path: '/calendar', icon: <FiHash />, label: 'Master View', permission: 'bookings.view' },
                { path: '/holidays', icon: <FiArchive />, label: 'Manage Holidays', permission: 'bookings.view' },
            ]
        },
        {
            title: 'Finance',
            activeColor: 'bg-rose-600',
            textColor: 'text-rose-600',
            bgLight: 'bg-rose-50',
            items: [
                { path: '/payments', icon: <FiDollarSign />, label: 'Payments Dashboard', permission: 'accounts.view' },
                { path: '/accounts-center', icon: <FiActivity />, label: 'Accounts Center', permission: 'accounts.view' },
                { path: '/coupons', icon: <FiHash />, label: 'Coupon Management', permission: 'accounts.manage' },
                { path: '/reconciliation', icon: <FiBarChart2 />, label: 'Reconciliation', permission: 'accounts.manage' }
            ]
        },
        {
            title: 'Directory',
            activeColor: 'bg-violet-600',
            textColor: 'text-violet-600',
            bgLight: 'bg-violet-50',
            items: [
                { path: '/users', icon: <FiUsers />, label: 'Administrators', permission: 'users.manage' },
                { path: '/vendors', icon: <FiUsers />, label: 'Vendor Partners', permission: 'users.manage' },
                { path: '/customers', icon: <FiUsers />, label: 'Customers', permission: 'users.manage' },
            ]
        },
        {
            title: 'Technical',
            activeColor: 'bg-slate-800',
            textColor: 'text-slate-800',
            bgLight: 'bg-slate-50',
            items: [
                { path: '/intelligence', icon: <FiCpu />, label: 'Control Plane', permission: 'system.manage_settings', developerOnly: true },
                { path: '/chatbot', icon: <FiMessageSquare />, label: 'Chatbot AI', permission: 'chatbot.manage' },
                { path: '/communications', icon: <FiMessageSquare />, label: 'Communications', permission: 'notifications.manage_templates' },
                { path: '/notifications', icon: <FiBell />, label: 'Push Notifications', permission: 'notifications.manage_templates' },
                { path: '/analytics', icon: <FiDatabase />, label: 'System Logs', permission: 'analytics.view' },
                { path: '/settings/mode', icon: <FiCpu />, label: 'Maintenance Mode', permission: 'system.manage_settings' },
                { path: '/settings', icon: <FiSettings />, label: 'App Settings', permission: 'system.manage_settings' },
            ]
        },
        {
            title: 'Security',
            activeColor: 'bg-red-700',
            textColor: 'text-red-700',
            bgLight: 'bg-red-50',
            items: [
                { path: '/security/acl', icon: <FiLock />, label: 'Access Control', permission: 'system.manage_acl', developerOnly: true },
                { path: '/security/audit', icon: <FiActivity />, label: 'Audit Logs', permission: 'system.manage_acl', developerOnly: true },
            ]
        }
    ];

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                const [sysRes, statsRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/admin/system-info`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_BASE_URL}/admin/stats/sidebar`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setSystemInfo(sysRes.data);
                setStats(statsRes.data);
            } catch (error) {
                console.error('Failed to fetch sidebar data:', error);
            }
        };
        fetchData();
        // Poll every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [token]);

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

    const desktopClasses = `fixed left-0 top-0 h-screen bg-white border-r border-gray-100 flex flex-col z-[40] transition-all duration-300 ease-in-out shadow-none ${isHovered ? 'w-60 shadow-xl' : 'w-[70px]'}`;
    const mobileClasses = `fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-[1001] transform transition-transform duration-300 ease-in-out flex flex-col h-[100dvh] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;
    const overlayClasses = `fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`;

    const getBadgeCount = (path) => {
        if (path === '/properties/pending') return stats.properties?.pending;
        if (path === '/bookings') return stats.bookings?.pending;
        if (path === '/vendors') return stats.users?.pending_vendors;
        if (path === '/holidays') return stats.holidays?.pending;
        return 0;
    };

    return (
        <>
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
                <div className="h-14 flex items-center justify-between px-6 border-b border-gray-100 bg-white flex-shrink-0">
                    <Link to="/dashboard" onClick={() => isMobile && onClose && onClose()} className="flex items-center gap-3">
                        <img
                            src="/admin/loader-logo.png"
                            alt="ResortWala"
                            className={`h-7 w-auto object-contain transition-all duration-300 ${!isMobile && !isHovered ? 'scale-90' : 'scale-100'}`}
                        />
                        {(isMobile || isHovered) && (
                            <span className="font-bold text-gray-800 text-sm tracking-tight text-nowrap">RESORTWALA ADMIN</span>
                        )}
                    </Link>
                    {isMobile && (
                        <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600">
                            <FiX size={20} />
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-4 px-3 space-y-6">
                    {menuGroups.map((group, gIdx) => {
                        // Filter items in the group
                        const visibleItems = group.items.filter(item => {
                            if (item.developerOnly && !hasRole('Developer')) return false;
                            return !item.permission || hasPermission(item.permission);
                        });

                        // If no items are visible in this group, hide the group header too
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={gIdx} className="space-y-1">
                                {(isMobile || isHovered) && (
                                    <div className={`px-3 mb-2 text-[10px] font-black uppercase tracking-widest truncate ${group.textColor} opacity-60`}>
                                        {group.title}
                                    </div>
                                )}

                                {visibleItems.map((item) => {
                                    const hasSubItems = !!item.subItems;
                                    const isExpanded = expandedMenu === item.id;
                                    const isActive = location.pathname === item.path || (hasSubItems && item.subItems.some(s => s.path === location.pathname));
                                    const parentBadge = hasSubItems ? item.subItems.reduce((acc, sub) => acc + (getBadgeCount(sub.path) || 0), 0) : getBadgeCount(item.path);

                                    if (hasSubItems) {
                                        return (
                                            <div key={item.id} className="relative">
                                                <button
                                                    onClick={() => toggleMenu(item.id)}
                                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 
                                                    ${isActive ? `${group.textColor} ${group.bgLight}` : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                                                    ${!isMobile && !isHovered ? 'justify-center' : 'justify-start'}
                                                    relative group
                                                `}
                                                >
                                                    <span className="text-lg transition-transform relative">
                                                        {item.icon}
                                                        {!isExpanded && !isMobile && !isHovered && parentBadge > 0 && (
                                                            <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-white">
                                                                {parentBadge}
                                                            </span>
                                                        )}
                                                    </span>
                                                    {(isMobile || isHovered) && (
                                                        <>
                                                            <span className="flex-1 text-left font-bold text-xs uppercase tracking-tight truncate flex items-center gap-2">
                                                                {item.label}
                                                                {parentBadge > 0 && !isExpanded && (
                                                                    <span className="bg-rose-100 text-rose-600 text-[9px] px-1.5 py-0.5 rounded-md font-black">
                                                                        {parentBadge}
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <span className={`text-xs transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                                                <FiChevronDown />
                                                            </span>
                                                        </>
                                                    )}
                                                </button>

                                                {(isExpanded && (isMobile || isHovered)) && (
                                                    <div className="mt-1 ml-4 pl-3 border-l border-gray-100 space-y-1">
                                                        {item.subItems
                                                            .filter(sub => !sub.permission || hasPermission(sub.permission))
                                                            .map(sub => {
                                                                const subBadge = getBadgeCount(sub.path);
                                                                return (
                                                                    <Link
                                                                        key={sub.path}
                                                                        to={sub.path}
                                                                        onClick={() => isMobile && onClose && onClose()}
                                                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors justify-between
                                                                        ${location.pathname === sub.path
                                                                                ? `${group.textColor} ${group.bgLight} font-bold`
                                                                                : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50 font-medium'}
                                                                    `}
                                                                    >
                                                                        <span className="truncate">{sub.label}</span>
                                                                        {subBadge > 0 && (
                                                                            <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded text-[9px] font-black">{subBadge}</span>
                                                                        )}
                                                                    </Link>
                                                                );
                                                            })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => isMobile && onClose && onClose()}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative
                                            ${isActive
                                                    ? `${group.activeColor} text-white font-bold shadow-md shadow-indigo-100/50`
                                                    : `text-gray-500 hover:${group.bgLight} hover:${group.textColor} font-medium`}
                                            ${!isMobile && !isHovered ? 'justify-center' : 'justify-start'}
                                        `}
                                            title={!isHovered && !isMobile ? item.label : ''}
                                        >
                                            <span className={`text-lg transition-transform group-hover:scale-110 relative`}>
                                                {item.icon}
                                                {!isMobile && !isHovered && parentBadge > 0 && (
                                                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-white">
                                                        {parentBadge}
                                                    </span>
                                                )}
                                            </span>
                                            {(isMobile || isHovered) && (
                                                <span className="text-xs font-bold uppercase tracking-tight truncate w-full flex justify-between items-center">
                                                    {item.label}
                                                    {parentBadge > 0 && (
                                                        <span className={`${isActive ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600'} px-1.5 py-0.5 rounded text-[9px]`}>
                                                            {parentBadge}
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                            {isActive && !isMobile && !isHovered && (
                                                <div className="absolute right-0 w-1 h-6 bg-white rounded-l-full" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        );
                    })}
                </nav>

                {/* System Info Widget */}
                <div className={`mx-3 mb-2 p-3 rounded-xl bg-gray-50 text-[10px] border border-gray-100 ${!isMobile && !isHovered ? 'hidden' : 'block'}`}>
                    {systemInfo ? (
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 font-bold uppercase tracking-tighter">Env:</span>
                                <span className={`font-black px-1.5 py-0.5 rounded uppercase ${systemInfo.system?.environment === 'production' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {systemInfo.system?.environment || 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 font-bold uppercase tracking-tighter">DB:</span>
                                <span className="font-mono font-bold text-gray-700 truncate max-w-[80px]" title={systemInfo.database?.database}>
                                    {systemInfo.database?.database || 'N/A'}
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
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors
                             ${!isMobile && !isHovered ? 'justify-center' : 'justify-start'}
                        `}
                        title={!isHovered && !isMobile ? "Logout" : ""}
                    >
                        <FiLogOut className="text-lg min-w-[20px]" />
                        {(isMobile || isHovered) && <span className="font-bold text-xs uppercase tracking-tight">Logout</span>}
                    </button>
                    {(isMobile || isHovered) && <div className="text-[9px] text-gray-400 font-bold text-center mt-2 uppercase tracking-widest">v1.5 INTEL</div>}
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            {isMobile && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[1000] pb-[env(safe-area-inset-bottom)]">
                    <div className="flex items-center justify-around px-2 py-2">
                        <Link
                            to="/dashboard"
                            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px] ${location.pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-500'}`}
                        >
                            <FiPieChart className="text-xl" />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
                        </Link>

                        <Link
                            to="/properties"
                            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px] ${location.pathname.startsWith('/properties') ? 'text-blue-600' : 'text-gray-500'}`}
                        >
                            <FiLayout className="text-xl" />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">Assets</span>
                        </Link>

                        <Link
                            to="/bookings"
                            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px] ${location.pathname.startsWith('/bookings') ? 'text-blue-600' : 'text-gray-500'}`}
                        >
                            <FiCalendar className="text-xl" />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">Book</span>
                        </Link>

                        <Link
                            to="/vendor-leads"
                            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px] ${location.pathname.startsWith('/vendor-leads') ? 'text-blue-600' : 'text-gray-500'}`}
                        >
                            <FiBriefcase className="text-xl" />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">CRM</span>
                        </Link>

                        <button
                            onClick={onToggle}
                            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px] ${isOpen ? 'text-blue-600' : 'text-gray-500'}`}
                        >
                            <FiMenu className="text-xl" />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">Menu</span>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
