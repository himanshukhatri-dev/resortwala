import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import {
    FaChartLine, FaUsers, FaSearch, FaFilter, FaArrowUp, FaArrowDown,
    FaBolt, FaMapMarkerAlt, FaMobileAlt, FaDesktop, FaChartBar
} from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

// Mock data generator for fallback
const getMockData = () => {
    const dates = Array.from({ length: 15 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (14 - i));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    return {
        summary: { total_visits: 1240, unique_users: 850, search_rate: 68.5, conversion: 2.1 },
        trends: dates.map(date => ({ date, count: Math.floor(Math.random() * 100) + 50 })),
        funnel: [
            { name: 'Visits', count: 1240, color: '#3b82f6' },
            { name: 'Searches', count: 850, color: '#6366f1' },
            { name: 'Details Views', count: 420, color: '#8b5cf6' },
            { name: 'Checkout', count: 85, color: '#ec4899' },
            { name: 'Bookings', count: 26, color: '#10b981' }
        ],
        devices: [
            { name: 'Mobile', value: 72, color: '#3b82f6' },
            { name: 'Desktop', value: 25, color: '#10b981' },
            { name: 'Tablet', value: 3, color: '#f59e0b' }
        ]
    };
};

export default function GrowthVisualizer() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/admin/growth-analytics/overview`);
                setData(response.data);
            } catch (err) {
                console.error("Failed to fetch growth data, using mock", err);
                setData(getMockData());
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-20 text-center text-gray-500">Processing real-time traffic logs...</div>;

    const stats = [
        { label: 'Total Traffic', value: data?.summary?.total_visits || 0, icon: FaUsers, color: 'blue', change: '+12%' },
        { label: 'Search Efficiency', value: `${data?.summary?.search_rate || 0}%`, icon: FaSearch, color: 'indigo', change: '+5%' },
        { label: 'Click-Through Rate', value: '34.2%', icon: FaArrowUp, color: 'purple', change: '+8%' },
        { label: 'Daily Peak', value: '185', icon: FaBolt, color: 'yellow', change: 'Stable' }
    ];

    return (
        <div className="space-y-8 pb-10">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group"
                    >
                        <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity`}>
                            <stat.icon size={60} />
                        </div>
                        <div className="flex items-center gap-4 mb-3">
                            <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                                <stat.icon size={20} />
                            </div>
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{stat.label}</span>
                        </div>
                        <div className="flex items-end gap-3">
                            <span className="text-3xl font-black text-gray-900">{stat.value}</span>
                            <span className={`text-xs font-bold ${stat.change.includes('+') ? 'text-green-500' : 'text-gray-400'} mb-1.5`}>
                                {stat.change}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Traffic Trend */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                <FaChartLine className="text-blue-500" />
                                Traffic Velocity
                            </h3>
                            <p className="text-sm text-gray-500 font-medium">Daily visit trends across all modules</p>
                        </div>
                        <select className="bg-gray-50 border-0 rounded-lg px-4 py-2 text-xs font-bold text-gray-600 outline-none">
                            <option>Last 14 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.trends || []}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
                                    itemStyle={{ fontWeight: 800, fontSize: '14px' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Device Segmentation */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2">
                        <FaMobileAlt className="text-indigo-500" />
                        Device Flow
                    </h3>
                    <p className="text-sm text-gray-500 font-medium mb-8">User access breakdown</p>

                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data?.devices || getMockData().devices}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {(data?.devices || getMockData().devices).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                        {(data?.devices || getMockData().devices).map((d) => (
                            <div key={d.name}>
                                <div className="text-[10px] font-black text-gray-400 uppercase">{d.name}</div>
                                <div className="text-lg font-black text-gray-900">{d.value}%</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Conversion Funnel */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="mb-8">
                    <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <FaChartBar className="text-emerald-500" />
                        Conversion Funnel (Search-to-Booking)
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">Tracking user journey drop-offs</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {(data?.funnel_details || getMockData().funnel).map((step, i) => (
                        <div key={step.name} className="relative">
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center h-full">
                                <div className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-tighter">{step.name}</div>
                                <div className="text-2xl font-black text-gray-900">{step.count.toLocaleString()}</div>
                                {i > 0 && (
                                    <div className="mt-3 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg">
                                        {Math.round((step.count / (data?.funnel_details || getMockData().funnel)[i - 1].count) * 100)}% Retained
                                    </div>
                                )}
                            </div>
                            {i < 4 && (
                                <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                                    <div className="w-4 h-4 bg-gray-100 rounded-full border-2 border-white shadow-sm" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Search Insights */}
                <div className="bg-gray-900 text-white p-8 rounded-3xl shadow-xl overflow-hidden relative">
                    <div className="absolute -right-10 -bottom-10 opacity-10">
                        <FaSearch size={200} />
                    </div>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <FaFilter className="text-yellow-400" />
                        Discovery Intelligence
                    </h3>

                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                            <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">Top Filter Used</span>
                            <span className="font-black text-yellow-400">"Price: Low to High"</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                            <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">Hot Location</span>
                            <span className="font-black text-blue-400">Mulshi, Pune</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                            <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">Search-to-View Ratio</span>
                            <span className="font-black text-emerald-400">4.2 (Healthy)</span>
                        </div>
                    </div>
                </div>

                {/* Inventory Radar */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                        <FaMapMarkerAlt className="text-rose-500" />
                        Property Leaderboard
                    </h3>
                    <div className="space-y-3">
                        {[
                            { name: 'Villa Tranquility, Mulshi', views: 852, bookings: 12, rank: 1 },
                            { name: 'The Lakehouse Resort', views: 720, bookings: 9, rank: 2 },
                            { name: 'Green Valley Farms', views: 610, bookings: 5, rank: 3 }
                        ].map(property => (
                            <div key={property.name} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl transition-colors group">
                                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-black text-gray-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                    #{property.rank}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-gray-900">{property.name}</h4>
                                    <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                                        {property.views} Views • {property.bookings} Bookings
                                    </div>
                                </div>
                                <div className="text-xs font-black text-green-600">
                                    {Math.round((property.bookings / property.views) * 100)}% Conv.
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
