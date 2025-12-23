import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    FaUsers, FaHome, FaCalendarCheck, FaTags, FaCheckCircle,
    FaTimesCircle, FaClock, FaRupeeSign, FaBell, FaSearch
} from 'react-icons/fa';
import Modal from '../components/Modal';
import Loader from '../components/Loader';

// --- COMPONENTS ---

const StatCard = ({ label, value, icon, color, trend }) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg shadow-gray-100/50 hover:-translate-y-1 transition-transform duration-300">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-gray-500 font-medium text-sm mb-1">{label}</p>
                <h3 className="text-3xl font-extrabold text-gray-900">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${color} text-white shadow-md`}>
                {icon}
            </div>
        </div>
        {trend && (
            <div className={`mt-4 text-xs font-bold ${trend > 0 ? 'text-green-600' : 'text-red-600'} flex items-center gap-1`}>
                <span>{trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%</span>
                <span className="text-gray-400 font-normal">vs last month</span>
            </div>
        )}
    </div>
);

const SectionHeader = ({ title, subtitle }) => (
    <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
    </div>
);

const StatusBadge = ({ status }) => {
    let styles = "bg-gray-100 text-gray-600";
    if (status === 'confirmed' || status === 'approved') styles = "bg-green-100 text-green-700 border border-green-200";
    if (status === 'pending') styles = "bg-amber-100 text-amber-700 border border-amber-200";
    if (status === 'cancelled' || status === 'rejected') styles = "bg-red-50 text-red-600 border border-red-100";
    return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles}`}>{status || 'Pending'}</span>;
};

// --- MAIN COMPONENT ---

export default function Dashboard() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();

    // State
    const [stats, setStats] = useState(null);
    const [pendingVendors, setPendingVendors] = useState([]);
    const [pendingProperties, setPendingProperties] = useState([]);
    const [recentBookings, setRecentBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Derived Charts Data (Mocked for now until API supports granularity)
    const revenueData = [
        { name: 'Week 1', value: 45000 },
        { name: 'Week 2', value: 72000 },
        { name: 'Week 3', value: 58000 },
        { name: 'Week 4', value: 95000 },
    ];

    const statusData = [
        { name: 'Confirmed', value: stats?.total_bookings || 12, color: '#10B981' },
        { name: 'Pending', value: 5, color: '#F59E0B' }, // specific count if avail
        { name: 'Cancelled', value: 2, color: '#EF4444' },
    ];

    // Helpers
    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const headers = { Authorization: `Bearer ${token}` };

            const [statsRes, vendorsRes, propsRes, bookingsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/admin/stats`, { headers }),
                axios.get(`${API_BASE_URL}/admin/vendors/pending`, { headers }),
                axios.get(`${API_BASE_URL}/admin/properties/pending`, { headers }),
                axios.get(`${API_BASE_URL}/admin/bookings`, { headers }) // Assuming this returns all, we slice top 5
            ]);

            setStats(statsRes.data);
            setPendingVendors(vendorsRes.data);
            setPendingProperties(propsRes.data);
            setRecentBookings(bookingsRes.data.slice(0, 5));
        } catch (error) {
            console.error("Dashboard Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = (type, id) => {
        if (type === 'vendor') {
            navigate(`/vendors/${id}`);
        } else {
            navigate(`/properties/${id}/approve`);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">Initializing Command Center...</div>;

    return (
        <div className="max-w-[1600px] mx-auto p-6 space-y-8 pb-24 font-inter text-gray-900">

            {/* 1. TOP HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 mt-1">Welcome back, Super Admin. Here's what's happening today.</p>
                </div>
                <div className="flex gap-3">
                    {/* Search Bar Placeholer */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-gray-400 group-focus-within:text-blue-500 transition" />
                        </div>
                        <input
                            type="text"
                            placeholder="Global Search..."
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none w-64 bg-white shadow-sm transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* 2. KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Revenue"
                    value={formatCurrency(stats?.total_revenue || 452000)} // Mock data fallback if API missing
                    icon={<FaRupeeSign />}
                    color="bg-indigo-600"
                    trend={12.5}
                />
                <StatCard
                    label="Total Bookings"
                    value={stats?.total_bookings || 0}
                    icon={<FaCalendarCheck />}
                    color="bg-blue-500"
                    trend={8.2}
                />
                <StatCard
                    label="Active Vendors"
                    value={stats?.approved_vendors || 0}
                    icon={<FaUsers />}
                    color="bg-emerald-500"
                    trend={2.1}
                />
                <StatCard
                    label="Total Properties"
                    value={stats?.total_properties || 0}
                    icon={<FaHome />}
                    color="bg-violet-500"
                />
            </div>

            {/* 3. ANALYTICS & PENDING SPLIT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT: Revenue Chart (2 cols) */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-100/50">
                    <SectionHeader title="Revenue Overview" subtitle="Gross earnings over the last 30 days" />
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(value) => formatCurrency(value)}
                                />
                                <Area type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* RIGHT: Booking Status (1 col) */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-100/50 flex flex-col items-center justify-center relative">
                    <div className="w-full mb-4">
                        <SectionHeader title="Booking Segments" subtitle="Distribution by status" />
                    </div>
                    <div className="h-[250px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-10">
                            <span className="text-3xl font-bold text-gray-800">{stats?.total_bookings}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. ACTION CENTER: PENDING ITEMS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* PENDING VENDORS */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-8 bg-amber-400 rounded-full"></div>
                            <h3 className="text-lg font-bold">Pending Vendors</h3>
                            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">{pendingVendors.length}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {pendingVendors.length === 0 ? <div className="text-gray-400 italic text-sm">No pending approvals.</div> :
                            pendingVendors.slice(0, 3).map(vendor => (
                                <div key={vendor.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition border border-transparent hover:border-gray-100 group">
                                    <div>
                                        <h4 className="font-bold text-gray-900">{vendor.name}</h4>
                                        <p className="text-xs text-gray-500">{vendor.business_name || 'Individual'}</p>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition">
                                        <button onClick={() => handleApprove('vendor', vendor.id)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><FaCheckCircle /></button>
                                        <button className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><FaTimesCircle /></button>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                    {pendingVendors.length > 3 && <button className="w-full mt-4 text-center text-sm text-indigo-600 font-bold hover:underline">View All</button>}
                </div>

                {/* PENDING PROPERTIES */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                            <h3 className="text-lg font-bold">Pending Properties</h3>
                            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">{pendingProperties.length}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {pendingProperties.length === 0 ? <div className="text-gray-400 italic text-sm">All properties active.</div> :
                            pendingProperties.slice(0, 3).map(prop => (
                                <div key={prop.PropertyId} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition border border-transparent hover:border-gray-100 group">
                                    <div>
                                        <h4 className="font-bold text-gray-900">{prop.Name}</h4>
                                        <p className="text-xs text-gray-500">{prop.Location} • ₹{prop.Price}</p>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition">
                                        <button onClick={() => handleApprove('property', prop.PropertyId)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><FaCheckCircle /></button>
                                        <button className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><FaTimesCircle /></button>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>

            {/* 5. RECENT ACTIVITY TABLE */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-100/50">
                <SectionHeader title="Recent Bookings" subtitle="Latest transactions across the platform" />
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                                <th className="pb-4 font-semibold pl-4">Booking ID</th>
                                <th className="pb-4 font-semibold">Customer</th>
                                <th className="pb-4 font-semibold">Date</th>
                                <th className="pb-4 font-semibold">Amount</th>
                                <th className="pb-4 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentBookings.map(b => (
                                <tr key={b.BookingId} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                                    <td className="py-4 pl-4 font-mono text-xs text-gray-500">#{b.BookingId}</td>
                                    <td className="py-4 font-bold text-gray-700">{b.CustomerName}</td>
                                    <td className="py-4 text-sm text-gray-500">{new Date(b.CheckInDate).toLocaleDateString()}</td>
                                    <td className="py-4 font-bold">₹{b.TotalAmount}</td>
                                    <td className="py-4"><StatusBadge status={b.Status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DEBUGGER */}
            {actionLoading && <Loader message="Processing..." />}
        </div>
    );
}
