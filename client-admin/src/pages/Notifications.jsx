import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { FiSend, FiBell, FiRefreshCw, FiTarget, FiUsers } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function Notifications() {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Compose State
    const [notification, setNotification] = useState({
        title: '',
        body: '',
        audience: 'all', // all, vendor, specific
        user_ids: '' // Comma separated IDs for 'specific'
    });

    // Logs State
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({});

    // Counters
    const [stats, setStats] = useState({
        sent_today: 0,
        failed_today: 0
    });

    useEffect(() => {
        fetchLogs();
    }, [token]);

    const fetchLogs = async () => {
        setRefreshing(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/notifications/logs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(res.data.data || []);
            setPagination(res.data);

            // Calculate pseudo-stats from recent logs
            // Ideally backend provides this
            const today = new Date().toISOString().split('T')[0];
            const todaysLogs = (res.data.data || []).filter(l => l.created_at.startsWith(today));
            setStats({
                sent_today: todaysLogs.reduce((acc, l) => acc + (parseInt(l.success_count) || 0), 0),
                failed_today: todaysLogs.reduce((acc, l) => acc + (parseInt(l.failure_count) || 0), 0)
            });

        } catch (error) {
            console.error('Failed to fetch logs:', error);
            toast.error('Failed to refresh logs');
        } finally {
            setRefreshing(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();

        // Validation
        if (!notification.title || !notification.body) {
            toast.error('Title and Body are required');
            return;
        }
        if (notification.audience === 'specific' && !notification.user_ids) {
            toast.error('Please specify User IDs');
            return;
        }

        if (!window.confirm('Are you sure you want to send this notification?')) return;

        setLoading(true);
        try {
            const payload = { ...notification };
            if (payload.audience === 'specific') {
                // Convert string "1, 2, 3" to array [1, 2, 3]
                payload.user_ids = payload.user_ids.split(',').map(id => id.trim()).filter(id => id);
            } else {
                delete payload.user_ids;
            }

            const res = await axios.post(`${API_BASE_URL}/notifications/send`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(res.data.message || 'Notification Sent');

            // Reset Form
            setNotification({
                title: '',
                body: '',
                audience: 'all',
                user_ids: ''
            });

            fetchLogs();

        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to send');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <FiBell className="text-indigo-600" />
                        Push Notifications
                    </h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">
                        Send mobile alerts to users, vendors, or specific devices.
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
                    <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl flex items-center gap-2">
                        <span className="text-slate-400">Sent Today:</span>
                        <span className="text-lg">{stats.sent_today}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Compose Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden sticky top-6">
                        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4">
                            <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                <FiSend /> Compose Alert
                            </h2>
                        </div>
                        <form onSubmit={handleSend} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Audience</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'all', label: 'All Users', icon: <FiUsers /> },
                                        { id: 'vendor', label: 'Vendors', icon: <FiUsers /> },
                                        { id: 'specific', label: 'Specific', icon: <FiTarget /> }
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setNotification({ ...notification, audience: type.id })}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-xs font-bold gap-2
                                                ${notification.audience === type.id
                                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                                    : 'border-slate-200 text-slate-400 hover:border-indigo-200 hover:text-slate-600'}`
                                            }
                                        >
                                            <span className="text-lg">{type.icon}</span>
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {notification.audience === 'specific' && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">User IDs</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 1, 45, 102"
                                        value={notification.user_ids}
                                        onChange={e => setNotification({ ...notification, user_ids: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-600 transition-all font-bold text-slate-700 placeholder:text-slate-300 outline-none"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1 font-bold">Comma separated User IDs</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                                <input
                                    type="text"
                                    value={notification.title}
                                    onChange={e => setNotification({ ...notification, title: e.target.value })}
                                    placeholder="Alert Title"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-600 transition-all font-bold text-slate-700 placeholder:text-slate-300 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Message Body</label>
                                <textarea
                                    value={notification.body}
                                    onChange={e => setNotification({ ...notification, body: e.target.value })}
                                    placeholder="Type your message here..."
                                    rows="4"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-600 transition-all font-bold text-slate-700 placeholder:text-slate-300 outline-none resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <FiRefreshCw className="animate-spin" /> : <FiSend />}
                                {loading ? 'Sending...' : 'Send Notification'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-700">Recent Dispatches</h2>
                        <button
                            onClick={fetchLogs}
                            disabled={refreshing}
                            className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
                        >
                            <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-wider">
                                        <th className="px-6 py-4">Message</th>
                                        <th className="px-6 py-4">Audience</th>
                                        <th className="px-6 py-4 text-center">Stats</th>
                                        <th className="px-6 py-4 text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-bold text-sm">
                                                No notifications sent yet.
                                            </td>
                                        </tr>
                                    ) : logs.map(log => (
                                        <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{log.title}</div>
                                                <div className="text-xs text-slate-500 font-medium truncate max-w-md">{log.body}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide
                                                    ${log.audience_type === 'all' ? 'bg-purple-100 text-purple-800' :
                                                        log.audience_type === 'vendor' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'}`}>
                                                    {log.audience_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xs font-black text-emerald-600">
                                                        {log.success_count} Sent
                                                    </span>
                                                    {log.failure_count > 0 && (
                                                        <span className="text-[10px] font-bold text-rose-500">
                                                            {log.failure_count} Failed
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="text-xs font-bold text-slate-500">
                                                    {new Date(log.created_at).toLocaleDateString()}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-mono">
                                                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
