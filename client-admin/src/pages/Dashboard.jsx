import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
    FaUsers, FaHome, FaCalendarCheck, FaCheckCircle,
    FaTimesCircle, FaRupeeSign, FaSearch, FaArrowRight, FaEdit, FaExclamationCircle
} from 'react-icons/fa';
import Loader from '../components/Loader';

// --- COMPONENTS ---

const StatCard = ({ label, value, icon, color }) => (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex justify-between items-center">
            <div className={`w-12 h-12 rounded-2xl ${color} text-white flex items-center justify-center shadow-lg`}>
                {icon}
            </div>
            <div className="text-right">
                <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">{label}</p>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{value}</h3>
            </div>
        </div>
    </div>
);

const ActionBox = ({ title, count, data, renderItem, icon: Icon, colorClass, onViewAll }) => (
    <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${colorClass} bg-opacity-10 text-xl`}>
                    <Icon className={colorClass.replace('bg-', 'text-')} />
                </div>
                <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">{title}</h3>
                    <p className="text-[10px] font-bold text-gray-400">{count} Items Pending</p>
                </div>
            </div>
            {onViewAll && count > 0 && (
                <button onClick={onViewAll} className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1">
                    View All <FaArrowRight />
                </button>
            )}
        </div>

        <div className="space-y-3 flex-1">
            {data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-300 opacity-60">
                    <FaCheckCircle className="text-3xl mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest">All Caught Up</p>
                </div>
            ) : (
                data.slice(0, 4).map(renderItem)
            )}
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    let styles = "bg-gray-100 text-gray-600";
    const s = status?.toLowerCase();
    if (s === 'confirmed' || s === 'approved' || s === 'completed') styles = "bg-emerald-50 text-emerald-600 border border-emerald-100";
    if (s === 'pending') styles = "bg-amber-50 text-amber-600 border border-amber-100";
    if (s === 'cancelled' || s === 'rejected' || s === 'failed') styles = "bg-red-50 text-red-600 border border-red-100";
    return <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${styles}`}>{status || 'Pending'}</span>;
};

// --- MAIN COMPONENT ---

export default function Dashboard() {
    const { token } = useAuth();
    const navigate = useNavigate();

    // State
    const [stats, setStats] = useState(null);
    const [pendingVendors, setPendingVendors] = useState([]);
    const [pendingProperties, setPendingProperties] = useState([]);
    const [changeRequests, setChangeRequests] = useState([]);
    const [recentBookings, setRecentBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const [statsRes, vendorsRes, propsRes, changesRes, bookingsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/admin/stats`, { headers }),
                axios.get(`${API_BASE_URL}/admin/vendors/pending`, { headers }),
                axios.get(`${API_BASE_URL}/admin/properties/pending`, { headers }),
                axios.get(`${API_BASE_URL}/admin/property-changes`, { headers }),
                axios.get(`${API_BASE_URL}/admin/bookings`, { headers })
            ]);

            setStats(statsRes.data);
            setPendingVendors(vendorsRes.data);
            setPendingProperties(propsRes.data);
            setChangeRequests(changesRes.data || []);
            setRecentBookings(bookingsRes.data.slice(0, 5));
        } catch (error) {
            console.error("Dashboard Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.length > 2) {
                handleGlobalSearch();
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleGlobalSearch = async () => {
        setIsSearching(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/search?query=${searchTerm}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSearchResults(res.data);
        } catch (error) {
            console.error("Search Error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const navigateToResult = (result) => {
        setSearchTerm('');
        setSearchResults([]);
        if (result.type === 'user') navigate('/users');
        if (result.type === 'customer') navigate('/customers');
        if (result.type === 'property') navigate(`/properties/${result.id}/approve`);
        if (result.type === 'booking') navigate('/bookings');
    };

    if (loading) return <Loader message="Accessing Console..." />;

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 space-y-8 pb-24 font-inter text-left">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin Console</h1>
                    <p className="text-gray-500 font-medium font-outfit mt-1">Operational status of ResortWala ecosystem</p>
                </div>
                <div className="relative group w-full md:w-80">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                        type="text"
                        placeholder="Search IDs, Phones, Names..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-50 outline-none font-bold text-gray-700 transition-all shadow-sm"
                    />

                    {/* Search Results Dropdown */}
                    {(searchResults.length > 0 || isSearching) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 text-left">
                            {isSearching ? (
                                <div className="p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Searching Platform...</div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {searchResults.map((res, idx) => (
                                        <div
                                            key={`${res.type}-${res.id}-${idx}`}
                                            onClick={() => navigateToResult(res)}
                                            className="p-4 hover:bg-blue-50 cursor-pointer transition-colors flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black uppercase ${res.type === 'user' ? 'bg-indigo-100 text-indigo-600' :
                                                    res.type === 'customer' ? 'bg-emerald-100 text-emerald-600' :
                                                        res.type === 'property' ? 'bg-blue-100 text-blue-600' : 'bg-violet-100 text-violet-600'
                                                    }`}>{res.type.charAt(0)}</div>
                                                <div>
                                                    <div className="text-xs font-black text-gray-900">{res.name}</div>
                                                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                                                        {res.type === 'user' ? `${res.role} • ${res.email}` :
                                                            res.type === 'customer' ? `Guest • ${res.phone || res.email}` :
                                                                res.type === 'property' ? `Property • ${res.Location}` : `Booking • ${res.Status}`}
                                                    </div>
                                                </div>
                                            </div>
                                            <FaArrowRight className="text-gray-200 text-[10px]" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* KPI GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard label="Platform Revenue" value={formatCurrency(stats?.total_revenue)} icon={<FaRupeeSign />} color="bg-blue-600" />
                <StatCard label="Total Volume" value={stats?.total_bookings || '0'} icon={<FaCalendarCheck />} color="bg-indigo-600" />
                <StatCard label="Retail Partners" value={stats?.approved_vendors || '0'} icon={<FaUsers />} color="bg-emerald-600" />
                <StatCard label="Active Inventory" value={stats?.total_properties || '0'} icon={<FaHome />} color="bg-violet-600" />
            </div>

            {/* ACTION CENTER */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

                {/* Pending Vendors */}
                <ActionBox
                    title="Vendor Access"
                    count={pendingVendors.length}
                    data={pendingVendors}
                    icon={FaUsers}
                    colorClass="bg-amber-600"
                    onViewAll={() => navigate('/vendors')}
                    renderItem={(vendor) => (
                        <div key={vendor.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-amber-50/50 border border-transparent transition group cursor-pointer" onClick={() => navigate(`/vendors/${vendor.id}`)}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-amber-600 shadow-sm border border-amber-50">
                                    {vendor.name?.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-gray-900">{vendor.name}</h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{vendor.business_name || 'Individual'}</p>
                                </div>
                            </div>
                            <FaArrowRight className="text-amber-200 group-hover:text-amber-600 transition-colors" />
                        </div>
                    )}
                />

                {/* Pending Properties */}
                <ActionBox
                    title="Property Approval"
                    count={pendingProperties.length}
                    data={pendingProperties}
                    icon={FaHome}
                    colorClass="bg-blue-600"
                    onViewAll={() => navigate('/properties')}
                    renderItem={(prop) => (
                        <div key={prop.PropertyId} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-blue-50/50 border border-transparent transition group cursor-pointer" onClick={() => navigate(`/properties/${prop.PropertyId}/approve`)}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-blue-600 shadow-sm border border-blue-50">
                                    P
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-gray-900">{prop.Name}</h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{prop.Location} • ₹{prop.Price}</p>
                                </div>
                            </div>
                            <FaArrowRight className="text-blue-200 group-hover:text-blue-600 transition-colors" />
                        </div>
                    )}
                />

                {/* Change Requests */}
                <ActionBox
                    title="Change Requests"
                    count={changeRequests.length}
                    data={changeRequests}
                    icon={FaEdit}
                    colorClass="bg-violet-600"
                    onViewAll={() => navigate('/property-changes')}
                    renderItem={(req) => (
                        <div key={req.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-violet-50/50 border border-transparent transition group cursor-pointer" onClick={() => navigate(`/properties/${req.property_id}/changes/${req.id}`)}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-violet-600 shadow-sm border border-violet-50">
                                    <FaExclamationCircle className="text-xs" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-gray-900">{req.property_name}</h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Vendor: {req.vendor_name || 'N/A'}</p>
                                </div>
                            </div>
                            <FaArrowRight className="text-violet-200 group-hover:text-violet-600 transition-colors" />
                        </div>
                    )}
                />
            </div>

            {/* RECENT BOOKINGS */}
            <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            Internal Transaction Flow
                        </h3>
                        <p className="text-gray-400 text-xs font-bold font-outfit mt-1">Real-time booking data across all categories</p>
                    </div>
                    <button onClick={() => navigate('/bookings')} className="px-6 py-2.5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-gray-200">
                        Full Ledger
                    </button>
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50">
                                <th className="pb-5 text-[10px] font-black text-gray-300 uppercase tracking-widest">Transaction ID</th>
                                <th className="pb-5 text-[10px] font-black text-gray-300 uppercase tracking-widest">Primary Client</th>
                                <th className="pb-5 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Engagement Date</th>
                                <th className="pb-5 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Financials</th>
                                <th className="pb-5 text-[10px] font-black text-gray-300 uppercase tracking-widest text-right">Verification</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recentBookings.map(b => (
                                <tr key={b.BookingId} className="hover:bg-blue-50/20 transition-colors">
                                    <td className="py-6 font-mono text-[10px] text-gray-400">#RES-{b.BookingId}</td>
                                    <td className="py-6 font-black text-gray-900 text-sm">{b.CustomerName}</td>
                                    <td className="py-6 text-xs font-bold text-gray-400 text-center">{new Date(b.CheckInDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                    <td className="py-6 font-black text-gray-900 text-sm text-center">₹{(b.TotalAmount || 0).toLocaleString('en-IN')}</td>
                                    <td className="py-6 text-right"><StatusBadge status={b.Status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {recentBookings.map(b => (
                        <div key={b.BookingId} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center">
                            <div>
                                <div className="text-[10px] font-black text-gray-300 uppercase mb-1">ID: #RES-{b.BookingId}</div>
                                <div className="font-black text-gray-900 text-sm">{b.CustomerName}</div>
                                <div className="text-xs font-bold text-gray-400 mt-1">{new Date(b.CheckInDate).toLocaleDateString()}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-black text-blue-600 text-lg">₹{(b.TotalAmount || 0).toLocaleString('en-IN')}</div>
                                <div className="mt-2"><StatusBadge status={b.Status} /></div>
                            </div>
                        </div>
                    ))}
                </div>

                {recentBookings.length === 0 && (
                    <div className="py-20 text-center text-gray-300 font-black uppercase tracking-[0.2em] text-xs">No Recent Transactions</div>
                )}
            </div>
        </div>
    );
}
