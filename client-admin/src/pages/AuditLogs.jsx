import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { FiActivity, FiSearch, FiClock, FiUser, FiInfo } from 'react-icons/fi';
import { format } from 'date-fns';

export default function AuditLogs() {
    const { token } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({});
    const [filters, setFilters] = useState({
        module: '',
        user_id: ''
    });

    useEffect(() => {
        fetchLogs();
    }, [page, filters]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/acl/audit-logs`, {
                params: { ...filters, page },
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(res.data.data);
            setMeta(res.data);
        } catch (err) {
            console.error('Failed to fetch audit logs:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FiActivity className="text-rose-600" />
                    Security Audit Logs
                </h1>
                <p className="text-gray-500 mt-1">Trace all administrative actions and security events.</p>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-3">
                    <FiSearch className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search Module..."
                        className="text-sm bg-transparent border-none focus:ring-0 w-full"
                        value={filters.module}
                        onChange={(e) => setFilters({ ...filters, module: e.target.value })}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                            <th className="p-4 border-b">Timestamp</th>
                            <th className="p-4 border-b">User</th>
                            <th className="p-4 border-b">Module</th>
                            <th className="p-4 border-b">Action</th>
                            <th className="p-4 border-b">Target</th>
                            <th className="p-4 border-b text-right">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="p-10 text-center text-gray-400">Loading Logs...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan="6" className="p-10 text-center text-gray-400">No logs found.</td></tr>
                        ) : logs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50 transition-colors border-b last:border-0">
                                <td className="p-4 text-xs font-medium text-gray-500">
                                    <div className="flex items-center gap-1.5"><FiClock className="opacity-50" /> {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}</div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black">{log.user?.name?.[0].toUpperCase() || 'S'}</div>
                                        <div className="text-xs">
                                            <div className="font-bold text-gray-800">{log.user?.name || 'System'}</div>
                                            <div className="text-[10px] text-gray-400 leading-none">{log.ip_address}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 font-mono text-[10px] font-black text-indigo-600 uppercase">{log.module || 'system'}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight
                                        ${log.action === 'deleted' ? 'bg-red-100 text-red-700' : log.action === 'created' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}
                                    `}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="p-4 text-xs font-bold text-gray-600">#{log.target_id || 'N/A'}</td>
                                <td className="p-4 text-right capitalize">
                                    <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors" title="View Payload">
                                        <FiInfo className="text-gray-400" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="p-4 bg-gray-50 border-t flex justify-between items-center text-xs font-bold text-gray-500">
                    <span>Showing {meta.from} to {meta.to} of {meta.total} logs</span>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-3 py-1.5 bg-white border rounded-lg disabled:opacity-50"
                        >Prev</button>
                        <button
                            disabled={page >= meta.last_page}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1.5 bg-white border rounded-lg disabled:opacity-50"
                        >Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
