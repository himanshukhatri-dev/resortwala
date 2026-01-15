import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
    FiUsers, FiHome, FiTrendingUp, FiActivity,
    FiArrowUpRight, FiArrowDownRight, FiCalendar,
    FiSearch, FiArrowRight, FiInfo, FiZap
} from 'react-icons/fi';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar,
    Cell, PieChart, Pie
} from 'recharts';
import Loader from '../components/Loader';

// --- COMPONENTS ---

const DashboardKPITile = ({ label, value, subValue, icon: Icon, color, trend, trendValue }) => (
    <div className="saas-card p-6 relative overflow-hidden group">
        <div className="flex justify-between items-start relative z-10">
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
                {subValue && <p className="text-[10px] font-bold text-gray-400 mt-1">{subValue}</p>}
            </div>
            <div className={`w-10 h-10 rounded-xl ${color} bg-opacity-10 flex items-center justify-center text-xl`}>
                <Icon className={color.replace('bg-', 'text-')} />
            </div>
        </div>
        {trend && (
            <div className="mt-4 flex items-center gap-2">
                <span className={`flex items-center text-[10px] font-black px-1.5 py-0.5 rounded ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {trend === 'up' ? <FiArrowUpRight size={12} /> : <FiArrowDownRight size={12} />}
                    {trendValue}%
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">vs last month</span>
            </div>
        )}
        <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${color} opacity-[0.03] group-hover:scale-125 transition-transform duration-500`}></div>
    </div>
);

const ChartCard = ({ title, children, icon: Icon, badge }) => (
    <div className="saas-card p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Icon size={16} />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">{title}</h3>
            </div>
            {badge && <span className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-100">{badge}</span>}
        </div>
        <div className="flex-1 min-h-[250px] w-full min-w-0">
            {children}
        </div>
    </div>
);

// --- MAIN COMPONENT ---

export default function Dashboard() {
    const { token, user } = useAuth();
    const navigate = useNavigate();

    // State
    const [analytics, setAnalytics] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recentBookings, setRecentBookings] = useState([]);

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const [analyticsRes, statsRes, bookingsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/admin/analytics/dashboard`, { headers }),
                axios.get(`${API_BASE_URL}/admin/stats`, { headers }),
                axios.get(`${API_BASE_URL}/admin/bookings`, { headers })
            ]);

            setAnalytics(analyticsRes.data);
            setStats(statsRes.data);
            setRecentBookings(bookingsRes.data.slice(0, 5));
        } catch (error) {
            console.error("Dashboard Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <Loader message="Compiling Platform Intelligence..." />;

    const kpis = analytics?.kpis || {};
    const revenueTrends = analytics?.revenue_trends || [];
    const trafficTrends = analytics?.traffic_trends || [];
    const funnel = analytics?.funnel || {};

    return (
        <div className="space-y-8 pb-12 text-left">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Terminal <span className="text-indigo-600">Console</span>
                    </h1>
                    <p className="text-slate-500 font-medium font-outfit mt-1">Real-time ecosystem performance & revenue control</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100 group cursor-pointer hover:border-indigo-200 transition-all touch-manipulation">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Operational</span>
                    </div>
                </div>
            </div>

            {/* KPI GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardKPITile
                    label="Lifetime Revenue"
                    value={formatCurrency(kpis.total_revenue)}
                    subValue={`₹${(kpis.monthly_revenue || 0).toLocaleString()} this month`}
                    icon={FiTrendingUp}
                    color="bg-emerald-600"
                    trend={kpis.revenue_growth >= 0 ? "up" : "down"}
                    trendValue={Math.abs(kpis.revenue_growth || 0)}
                />
                <DashboardKPITile
                    label="Platform Growth"
                    value={kpis.active_inventory || '0'}
                    subValue={`${kpis.pending_approvals || 0} pending review`}
                    icon={FiHome}
                    color="bg-indigo-600"
                    trend={kpis.inventory_growth >= 0 ? "up" : "down"}
                    trendValue={Math.abs(kpis.inventory_growth || 0)}
                />
                <DashboardKPITile
                    label="Daily Active Users"
                    value={kpis.active_users_today || '0'}
                    subValue="Across 3 platforms"
                    icon={FiUsers}
                    color="bg-blue-600"
                />
                <DashboardKPITile
                    label="System Traffic"
                    value={kpis.interactions || '0'}
                    subValue="API requests last 30d"
                    icon={FiActivity}
                    color="bg-violet-600"
                />
            </div>

            {/* MAIN DATA SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Revenue & Growth Chart */}
                <div className="lg:col-span-2 space-y-8">
                    <ChartCard title="Revenue Distribution" icon={FiTrendingUp} badge="Live Flow">
                        <div className="h-[300px] w-full min-w-0">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <AreaChart data={revenueTrends}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                                        dy={10}
                                        tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                                        tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: '900' }}
                                        formatter={(val) => [formatCurrency(val), 'Revenue']}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>

                    {/* Funnel Dropoff */}
                    <div className="saas-card p-6">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <FiZap className="text-amber-500" /> Conversion Funnel
                                </h3>
                                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">End-to-End lifecycle tracking</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            {[
                                { label: 'Top of Funnel (Unique Sessions)', value: funnel.total_users, color: 'bg-indigo-600', total: funnel.total_users },
                                { label: 'Property Discovery (Views)', value: funnel.property_views, color: 'bg-indigo-500', total: funnel.total_users },
                                { label: 'Intent to Book (Checkout)', value: funnel.checkouts, color: 'bg-indigo-400', total: funnel.total_users },
                                { label: 'Conversion (Completed)', value: funnel.bookings, color: 'bg-emerald-500', total: funnel.total_users },
                            ].map((step, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{step.label}</span>
                                        <span className="text-xs font-black text-slate-900">{step.value} <span className="text-slate-300 font-bold ml-1">({((step.value / step.total) * 100).toFixed(1)}%)</span></span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${step.color} transition-all duration-1000`}
                                            style={{ width: `${step.total > 0 ? (step.value / step.total) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Data: Traffic & Recent Actions */}
                <div className="space-y-8">
                    <ChartCard title="Platform Traffic" icon={FiActivity}>
                        <div className="h-[200px] w-full min-w-0">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <BarChart data={trafficTrends}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        hide
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: '900' }}
                                    />
                                    <Bar dataKey="users" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 flex items-center justify-center bg-slate-50 p-3 rounded-xl border border-slate-100 italic text-[10px] text-slate-400">
                            Real-time traffic analysis based on platform event logs
                        </div>
                    </ChartCard>

                    {/* Quick Access Actions */}
                    <div className="saas-card p-6 bg-slate-900 text-white border-none shadow-xl shadow-indigo-100">
                        <h3 className="text-sm font-black uppercase tracking-wider mb-6 flex items-center gap-2">
                            System Quick Actions
                        </h3>
                        <div className="space-y-3">
                            <button onClick={() => navigate('/properties/add')} className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group">
                                <div className="flex items-center gap-3">
                                    <FiHome className="text-indigo-400" />
                                    <span className="text-xs font-bold">Onboard New Property</span>
                                </div>
                                <FiArrowRight className="text-white/20 group-hover:text-white transition-colors" />
                            </button>
                            <button onClick={() => navigate('/revenue/full-rate-control')} className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group">
                                <div className="flex items-center gap-3">
                                    <FiTrendingUp className="text-emerald-400" />
                                    <span className="text-xs font-bold">Manage Rate Control</span>
                                </div>
                                <FiArrowRight className="text-white/20 group-hover:text-white transition-colors" />
                            </button>
                            <button onClick={() => navigate('/admin/vendor-leads')} className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group">
                                <div className="flex items-center gap-3">
                                    <FiUsers className="text-blue-400" />
                                    <span className="text-xs font-bold">Access Sales CRM</span>
                                </div>
                                <FiArrowRight className="text-white/20 group-hover:text-white transition-colors" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* RECENT FLOW TABLE */}
            <div className="saas-card pt-8 p-6 md:p-10">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Financial Ledger
                        </h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Real-time transaction stream</p>
                    </div>
                    <button onClick={() => navigate('/bookings')} className="saas-button-primary">
                        View Full Ledger
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="saas-table">
                        <thead>
                            <tr>
                                <th>Transaction ID</th>
                                <th>Client</th>
                                <th>Engagement Date</th>
                                <th className="text-center">Financials</th>
                                <th className="text-right">Verification</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {recentBookings.map(b => (
                                <tr key={b.BookingId} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="py-5 font-mono text-[10px] text-slate-400 font-bold">#RES-{b.BookingId}</td>
                                    <td className="py-5">
                                        <div className="font-black text-slate-900 text-sm">{b.CustomerName}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">{b.CustomerEmail || 'direct customer'}</div>
                                    </td>
                                    <td className="py-5 text-xs font-bold text-slate-500">
                                        {new Date(b.CheckInDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="py-5 font-black text-slate-900 text-sm text-center">
                                        {formatCurrency(b.TotalAmount)}
                                    </td>
                                    <td className="py-5 text-right">
                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${b.Status?.toLowerCase() === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                                            b.Status?.toLowerCase() === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                                            }`}>
                                            {b.Status || 'Active'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
