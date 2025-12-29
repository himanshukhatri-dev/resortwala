import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { FaHistory, FaSearch, FaUserShield, FaEdit, FaTrash, FaPlus, FaExclamationCircle } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

export default function ImpactLogs() {
    const { token } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/intelligence/logs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (Array.isArray(res.data)) {
                setLogs(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch logs", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const getActionIcon = (action) => {
        switch (action?.toUpperCase()) {
            case 'UPDATE': return <FaEdit className="text-amber-500" />;
            case 'DELETE': return <FaTrash className="text-red-500" />;
            case 'CREATE': return <FaPlus className="text-green-500" />;
            default: return <FaExclamationCircle className="text-gray-400" />;
        }
    };

    const getActionColor = (action) => {
        switch (action?.toUpperCase()) {
            case 'UPDATE': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'DELETE': return 'bg-red-50 text-red-700 border-red-200';
            case 'CREATE': return 'bg-green-50 text-green-700 border-green-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const filteredLogs = logs.filter(log =>
        log.target_type?.toLowerCase().includes(filter.toLowerCase()) ||
        log.details?.toLowerCase().includes(filter.toLowerCase()) ||
        log.action?.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <FaHistory className="text-blue-500" /> System Audit Trail
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Track accurate changes made to critical data</p>
                </div>
                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Filter logs..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-64"
                    />
                </div>
            </div>

            {/* Logs List */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="text-center py-10 text-gray-400">Loading audit logs...</div>
                ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 flex flex-col items-center">
                        <FaUserShield className="text-4xl mb-3 opacity-20" />
                        <p>No audit logs found.</p>
                        <p className="text-xs mt-1">Actions performed in Live Editor will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredLogs.map(log => (
                            <div key={log.id} className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow bg-white items-start">
                                {/* Icon */}
                                <div className={`p-3 rounded-full flex-shrink-0 ${getActionColor(log.action).replace('text-', 'bg-opacity-20 ')}`}>
                                    {getActionIcon(log.action)}
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                            <span className="text-gray-900 font-bold ml-2">
                                                {log.target_type} <span className="text-gray-400">#{log.target_id}</span>
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-400 whitespace-nowrap" title={log.created_at}>
                                            {log.created_at ? formatDistanceToNow(new Date(log.created_at), { addSuffix: true }) : 'Unknown time'}
                                        </span>
                                    </div>

                                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg font-mono text-xs overflow-x-auto border border-gray-100">
                                        {log.details}
                                    </div>

                                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                                        <FaUserShield /> Admin ID: {log.admin_id}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
