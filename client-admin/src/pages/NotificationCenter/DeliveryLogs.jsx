import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { FiRefreshCw, FiActivity, FiMail, FiMessageSquare } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function DeliveryLogs() {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        fetchLogs();
    }, [token]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/notifications/setup/logs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(res.data);
        } catch (error) {
            console.error('Logs fetch failed', error);
            toast.error("Failed to load delivery logs");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <FiActivity className="text-emerald-500" /> Delivery Logs
                </h2>
                <button onClick={fetchLogs} className="p-2 hover:bg-slate-100 rounded-lg">
                    <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b text-xs font-black text-slate-400 uppercase tracking-widest">
                        <tr>
                            <th className="px-6 py-4">Channel</th>
                            <th className="px-6 py-4">Recipient</th>
                            <th className="px-6 py-4">Event / Template</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Latency</th>
                            <th className="px-6 py-4 text-right">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50 transition-all">
                                <td className="px-6 py-4 font-bold flex items-center gap-2">
                                    {log.channel === 'email' && <FiMail className="text-blue-500" />}
                                    {log.channel === 'sms' && <FiMessageSquare className="text-amber-500" />}
                                    {log.channel === 'whatsapp' && <FiMessageSquare className="text-emerald-500" />}
                                    <span className="capitalize">{log.channel}</span>
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-600">{log.recipient}</td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-800">{log.event_name || 'Manual'}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">{log.template_name}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${log.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                        }`}>
                                        {log.status}
                                    </span>
                                    {log.status === 'failed' && log.error_message && (
                                        <div className="mt-1 text-[10px] text-rose-600 font-medium max-w-[200px] truncate" title={log.error_message}>
                                            {log.error_message}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 font-mono text-xs text-slate-400">
                                    {log.latency_ms ? `${log.latency_ms}ms` : '-'}
                                </td>
                                <td className="px-6 py-4 text-right text-slate-400 font-medium whitespace-nowrap">
                                    {new Date(log.created_at).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
