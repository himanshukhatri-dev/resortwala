import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import adminAnalytics from '../utils/analytics';
import { FaFilter, FaSync, FaChartLine, FaEye, FaDesktop, FaMobileAlt, FaUserSecret, FaGlobe } from 'react-icons/fa';

const parseUA = (ua) => {
    if (!ua) return { browser: 'Unknown', os: 'Unknown', isMobile: false };
    const browser = /edg/i.test(ua) ? 'Edge' : /chrome/i.test(ua) ? 'Chrome' : /firefox/i.test(ua) ? 'Firefox' : /safari/i.test(ua) ? 'Safari' : 'Browser';
    const os = /windows/i.test(ua) ? 'Windows' : /macintosh/i.test(ua) ? 'macOS' : /android/i.test(ua) ? 'Android' : /iphone|ipad/i.test(ua) ? 'iOS' : 'Linux';
    const isMobile = /mobile|android|iphone|ipad/i.test(ua);
    return { browser, os, isMobile };
};

const getEventLabel = (name) => {
    const map = {
        'property_detail_view': 'Viewed Property',
        'search': 'Searched Resort',
        'gallery_open': 'Opened Gallery',
        'booking_started': 'Started Booking',
        'checkout_started': 'Entered Checkout',
        'filter_applied': 'Applied Filters',
        'contact_click': 'Contacted Vendor',
        'home_view': 'Visited Home'
    };

    if (map[name]) return map[name];

    // Fallback logic for API paths
    if (name?.includes('api/')) {
        return name.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    return name?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown Event';
};

export default function AdminEventLogs() {
    const [events, setEvents] = useState([]);
    const [stats, setStats] = useState(null);
    const [filters, setFilters] = useState({
        event_type: '',
        event_category: '',
        user_id: '',
        start_date: '',
        end_date: ''
    });
    const [availableFilters, setAvailableFilters] = useState({
        event_types: [],
        event_categories: []
    });
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 50,
        total: 0
    });
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        adminAnalytics.pageView('Analytics Dashboard', { section: 'event_logs' });
        fetchEvents();
        fetchStats();
        fetchAvailableFilters();
    }, [filters, pagination.current_page]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');

            // Build query params - filter out empty values
            const queryParams = {};
            Object.keys(filters).forEach(key => {
                if (filters[key]) queryParams[key] = filters[key];
            });
            queryParams.page = pagination.current_page;
            queryParams.per_page = pagination.per_page;

            const params = new URLSearchParams(queryParams);

            const response = await axios.get(`${API_BASE_URL}/admin/analytics/events?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setEvents(response.data.data || []);
            setPagination({
                current_page: response.data.current_page || 1,
                last_page: response.data.last_page || 1,
                per_page: response.data.per_page || 50,
                total: response.data.total || 0
            });
        } catch (error) {
            console.error('Failed to fetch events:', error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await axios.get(`${API_BASE_URL}/admin/analytics/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchAvailableFilters = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await axios.get(`${API_BASE_URL}/admin/analytics/filters`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setAvailableFilters(response.data);
        } catch (error) {
            console.error('Failed to fetch filters:', error);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const clearFilters = () => {
        setFilters({
            event_type: '',
            event_category: '',
            user_id: '',
            start_date: '',
            end_date: ''
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <FaChartLine className="text-indigo-600" />
                                Analytics Event Logs
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">Real-time user interaction tracking</p>
                        </div>
                        <button
                            onClick={() => { fetchEvents(); fetchStats(); }}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                            <FaSync /> Refresh
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow-sm p-4">
                            <div className="text-gray-500 text-sm font-medium">Total Events (24h)</div>
                            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total_events?.toLocaleString() || 0}</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-4">
                            <div className="text-gray-500 text-sm font-medium">Unique Sessions</div>
                            <div className="text-3xl font-bold text-indigo-600 mt-2">{stats.unique_sessions?.toLocaleString() || 0}</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-4">
                            <div className="text-gray-500 text-sm font-medium">Unique Users</div>
                            <div className="text-3xl font-bold text-green-600 mt-2">{stats.unique_users?.toLocaleString() || 0}</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-4">
                            <div className="text-gray-500 text-sm font-medium">Top Event</div>
                            <div className="text-lg font-bold text-gray-900 mt-2">
                                {stats.by_type?.[0]?.event_type || 'No events yet'}
                            </div>
                            <div className="text-sm text-gray-500">{stats.by_type?.[0]?.count || 0} times</div>
                        </div>
                    </div>
                )}

                {/* No Data Warning */}
                {stats && stats.total_events === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2">
                            <span className="text-yellow-600 text-lg">ℹ️</span>
                            <div>
                                <div className="font-semibold text-yellow-900">No events collected yet</div>
                                <div className="text-sm text-yellow-700 mt-1">
                                    Events will appear here once users start interacting with the customer app (viewing properties, clicking galleries, etc.)
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FaFilter className="text-gray-600" />
                        <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <select
                            value={filters.event_type}
                            onChange={(e) => handleFilterChange('event_type', e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="">All Event Types</option>
                            {availableFilters.event_types?.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>

                        <select
                            value={filters.event_category}
                            onChange={(e) => handleFilterChange('event_category', e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="">All Categories</option>
                            {availableFilters.event_categories?.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>

                        <input
                            type="date"
                            value={filters.start_date}
                            onChange={(e) => handleFilterChange('start_date', e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Start Date"
                        />

                        <input
                            type="date"
                            value={filters.end_date}
                            onChange={(e) => handleFilterChange('end_date', e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="End Date"
                        />

                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Event Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Detail</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User/Actor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform & IP</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                        </td>
                                    </tr>
                                ) : events.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                            No events found
                                        </td>
                                    </tr>
                                ) : (
                                    events.map((event) => (
                                        <tr key={event.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(event.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="px-2 py-0.5 text-[10px] font-black bg-indigo-50 text-indigo-600 rounded border border-indigo-100 uppercase tracking-tighter w-fit">
                                                        {getEventLabel(event.event_name)}
                                                    </span>
                                                    {event.metadata?.label && (
                                                        <span className="text-[10px] text-slate-500 mt-1 font-medium italic">
                                                            {event.metadata.label}
                                                        </span>
                                                    )}
                                                    {event.event_name === 'search' && event.metadata?.query && (
                                                        <span className="text-[10px] text-emerald-600 mt-1 font-bold">
                                                            🔍 "{event.metadata.query}"
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 text-[9px] font-black rounded border uppercase tracking-widest ${event.event_category === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                    event.event_category === 'vendor' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                        'bg-blue-50 text-blue-600 border-blue-100'
                                                    }`}>
                                                    {event.event_category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                        {event.user ? (
                                                            <span className="text-[10px] font-bold">{event.user.name.charAt(0).toUpperCase()}</span>
                                                        ) : (
                                                            <FaUserSecret className="text-xs" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-900">{event.user?.name || 'Guest'}</p>
                                                        <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">{event.role}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    {parseUA(event.user_agent).isMobile ? <FaMobileAlt size={11} /> : <FaDesktop size={11} />}
                                                    <span className="text-[10px] font-bold">{parseUA(event.user_agent).os} • {parseUA(event.user_agent).browser}</span>
                                                </div>
                                                <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400">
                                                    <FaGlobe size={8} />
                                                    {event.ip_address}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => setSelectedEvent(event)}
                                                    className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                                                >
                                                    <FaEye /> View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {events.length > 0 && (
                        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-medium">{((pagination.current_page - 1) * pagination.per_page) + 1}</span> to{' '}
                                <span className="font-medium">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> of{' '}
                                <span className="font-medium">{pagination.total}</span> events
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
                                    disabled={pagination.current_page === 1}
                                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
                                    disabled={pagination.current_page === pagination.last_page}
                                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Event Detail Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedEvent(null)}>
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Event Details</h3>
                            <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <div className="text-sm font-medium text-gray-500">Event Type</div>
                                <div className="text-base font-semibold text-gray-900">{selectedEvent.event_type}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Category</div>
                                <div className="text-base font-semibold text-gray-900">{selectedEvent.event_category}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Session ID</div>
                                <div className="text-xs font-mono text-gray-900 bg-slate-50 p-2 rounded">{selectedEvent.session_id}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Metadata (Params/URL)</div>
                                <pre className="mt-2 bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto max-h-[200px]">
                                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                                </pre>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Browser User Agent</div>
                                <div className="mt-2 bg-gray-50 p-3 rounded-lg text-[10px] text-gray-400 break-all leading-tight">
                                    {selectedEvent.user_agent}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
