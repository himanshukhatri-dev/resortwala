import { Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { useAuth } from './context/AuthContext';
import NotificationBell from './components/NotificationBell';
import { useState, useEffect } from 'react';
import { FiMenu, FiChevronDown, FiArrowRight } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from './config';

export default function Layout() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const role = user?.role || 'admin';
    const [isMobile, setIsMobile] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // Search States
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleLogout = async () => {
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

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024); // Mobile < 1024px (Tablet/Mobile)
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Global Search Logic
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.length > 2) {
                performGlobalSearch();
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // Navigation Index
    const NAV_ITEMS = [
        { name: 'Lead Intelligence', type: 'navigation', path: '/intelligence/leads', keywords: ['lead', 'leads', 'crawl', 'market', 'intelligence'] },
        { name: 'Properties', type: 'navigation', path: '/properties', keywords: ['property', 'hotel', 'resort'] },
        { name: 'Bookings', type: 'navigation', path: '/bookings', keywords: ['booking', 'reservation'] },
        { name: 'Users', type: 'navigation', path: '/users', keywords: ['user', 'admin', 'staff'] },
        { name: 'Customers', type: 'navigation', path: '/customers', keywords: ['customer', 'guest'] },
    ];

    const performGlobalSearch = async () => {
        setIsSearching(true);
        let results = [];

        // 1. Local Navigation Search
        const query = searchTerm.toLowerCase();
        const navMatches = NAV_ITEMS.filter(item =>
            item.name.toLowerCase().includes(query) ||
            item.keywords.some(k => k.includes(query))
        );
        results = [...navMatches];

        // 2. API Search
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/search?query=${searchTerm}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            results = [...results, ...res.data];
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setSearchResults(results);
            setIsSearching(false);
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('global-search-input')?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="flex h-screen bg-[#f3f4f6] overflow-hidden">
            {/* Sidebar (Desktop & Mobile Drawer) */}
            <Sidebar
                userType={role}
                isMobile={isMobile}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
            />

            {/* Main Content Area */}
            <div
                className="flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all duration-300"
                style={{
                    marginLeft: isMobile ? 0 : 'var(--sidebar-width, 70px)'
                }}
            >
                {/* Fixed Header */}
                <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-30 shadow-sm">
                    {/* Left: Mobile Toggle & Breadcrumbs (Simplified) */}
                    <div className="flex items-center gap-3">
                        {isMobile && (
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                            >
                                <FiMenu size={20} />
                            </button>
                        )}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-800">Admin Control Center</span>
                            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-bold uppercase tracking-wider">v1.5</span>
                        </div>
                    </div>

                    {/* Right: Search, Notification, Profile */}
                    <div className="flex items-center gap-2">
                        {/* Global Search */}
                        <div className="relative group">
                            <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-1.5 w-64 border border-transparent focus-within:border-indigo-500 focus-within:bg-white transition-all shadow-inner">
                                <span className="text-indigo-400 font-bold text-[10px] bg-white px-1.5 py-0.5 rounded shadow-sm">⌘K</span>
                                <input
                                    id="global-search-input"
                                    type="text"
                                    placeholder="Terminal Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 text-xs w-full ml-2 font-black text-slate-700"
                                />
                            </div>

                            {/* Search Results Dropdown */}
                            {(searchResults.length > 0 || isSearching) && (
                                <div className="absolute top-full right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2">
                                    <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform Index</span>
                                        {isSearching && <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar divide-y divide-gray-50">
                                        {searchResults.map((res, idx) => (
                                            <div
                                                key={`${res.type}-${res.id}-${idx}`}
                                                onClick={() => {
                                                    setSearchTerm('');
                                                    setSearchResults([]);
                                                    if (res.type === 'navigation') navigate(res.path);
                                                    if (res.type === 'user') navigate('/users');
                                                    if (res.type === 'customer') navigate('/customers');
                                                    if (res.type === 'property') navigate(`/properties/${res.id}/approve`);
                                                    if (res.type === 'booking') navigate('/bookings');
                                                }}
                                                className="p-4 hover:bg-indigo-50 cursor-pointer transition-colors flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black uppercase ${res.type === 'navigation' ? 'bg-orange-100 text-orange-600' :
                                                            res.type === 'user' ? 'bg-indigo-100 text-indigo-600' :
                                                                res.type === 'customer' ? 'bg-emerald-100 text-emerald-600' :
                                                                    res.type === 'property' ? 'bg-blue-100 text-blue-600' : 'bg-violet-100 text-violet-600'
                                                        }`}>{res.type.charAt(0)}</div>
                                                    <div>
                                                        <div className="text-xs font-black text-gray-900">{res.name}</div>
                                                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                                                            {res.type === 'navigation' ? `Go to Page • ${res.path}` :
                                                                res.type === 'user' ? `${res.role} • ${res.email}` :
                                                                    res.type === 'customer' ? `Guest • ${res.phone || res.email}` :
                                                                        res.type === 'property' ? `Property • ${res.Location}` : `Booking • ${res.Status}`}
                                                        </div>
                                                    </div>
                                                </div>
                                                <FiArrowRight className="text-gray-200 group-hover:text-indigo-500 transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-3 text-center border-t border-gray-50 bg-gray-50/50">
                                        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em]">End of Index</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <NotificationBell />

                        <div className="h-6 w-[1px] bg-gray-200 mx-1"></div>

                        {/* Profile Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200"
                            >
                                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                                </div>
                                <div className="hidden sm:block text-left">
                                    <div className="text-[11px] font-bold text-gray-900 leading-none truncate max-w-[80px]">{user?.name || 'Admin'}</div>
                                    <div className="text-[10px] text-gray-400 leading-none mt-1 capitalize">{role}</div>
                                </div>
                                <FiChevronDown size={12} className={`text-gray-400 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {showProfileMenu && (
                                <>
                                    <div className="fixed inset-0 z-[998]" onClick={() => setShowProfileMenu(false)} />
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[999] p-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="px-3 py-2.5 mb-1 bg-gray-50 rounded-lg">
                                            <div className="text-xs font-bold text-gray-900 truncate">{user?.email || 'admin@resortwala.com'}</div>
                                            <div className="text-[10px] text-gray-500 mt-0.5">Administrator Access</div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setShowProfileMenu(false);
                                                handleLogout();
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-left text-red-600 group"
                                        >
                                            <span className="text-sm scale-110 group-hover:rotate-12 transition-transform">🚪</span>
                                            <span className="font-bold text-xs uppercase tracking-tight">Logout System</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Scrollable Area */}
                <main
                    className="flex-1 overflow-y-auto custom-scrollbar bg-[#f3f4f6]"
                    style={{
                        paddingBottom: isMobile ? '70px' : '0'
                    }}
                >
                    <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
                        <Outlet />
                    </div>
                </main>
            </div>

            <style>{`
                :root {
                    --sidebar-width: 70px;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
}
