import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import {
    FiMail, FiMessageSquare, FiSend, FiCheckCircle,
    FiClock, FiAlertCircle, FiSearch, FiFilter, FiX, FiUsers, FiTag
} from 'react-icons/fi';
import Loader from '../components/Loader';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Communications() {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ sent: 0, failed: 0, pending: 0 });
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    // Modal States
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [showLogModal, setShowLogModal] = useState(null);

    // Broadcast Form State
    const [broadcastForm, setBroadcastForm] = useState({
        recipients: [],
        type: 'email',
        subject: '',
        content: '',
        audience: 'vendors' // vendors, customers, manual
    });
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, [filter]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/communications/logs?status=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(res.data.logs || []);
            setStats(res.data.stats || { sent: 0, failed: 0, pending: 0 });
        } catch (error) {
            console.error("Failed to fetch logs", error);
            toast.error("Failed to load transmission logs");
        } finally {
            setLoading(false);
        }
    };

    const handleBroadcastSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            // In a real app, 'audience' would resolve to a list of emails on the backend
            // For now, we'll send the audience type and the backend will handle it
            // Or we simulate by passing a placeholder list if audience is manual

            const payload = {
                ...broadcastForm,
                recipients: broadcastForm.audience === 'manual' ? broadcastForm.recipients.split(',').map(s => s.trim()) : [],
                audience_type: broadcastForm.audience // New field for backend to resolve emails
            };

            await axios.post(`${API_BASE_URL}/admin/communications/broadcast`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Broadcast initiated successfully!");
            setShowBroadcastModal(false);
            fetchLogs();
        } catch (error) {
            console.error("Broadcast failed", error);
            toast.error("Failed to initiate broadcast");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">System <span className="text-indigo-600">Communications</span></h1>
                    <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">SMS, Email & Alert Audit Trail</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowBroadcastModal(true)}
                        className="saas-button-primary bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-100 hover:scale-105 transition-transform"
                    >
                        <FiSend /> New Broadcast
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="saas-card p-6 border-l-4 border-emerald-500 bg-white">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Delivered</div>
                    <div className="text-3xl font-black text-slate-900">{stats.sent}</div>
                </div>
                <div className="saas-card p-6 border-l-4 border-amber-500 bg-white">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending/Retry</div>
                    <div className="text-3xl font-black text-slate-900">{stats.pending}</div>
                </div>
                <div className="saas-card p-6 border-l-4 border-red-500 bg-white">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Failed</div>
                    <div className="text-3xl font-black text-slate-900">{stats.failed}</div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="saas-card overflow-hidden bg-white">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-2">
                        {['all', 'email', 'sms', 'whatsapp'].map(t => (
                            <button
                                key={t}
                                onClick={() => setFilter(t)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === t ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 hover:bg-slate-100'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search recipient..."
                            className="saas-input pl-10 h-10 w-64 text-xs"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="saas-table w-full">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Recipient</th>
                                <th>Subject/Content Preview</th>
                                <th>Timestamp</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center"><Loader message="Loading transmission logs..." /></td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center text-slate-400 font-bold italic text-sm">No communication records found</td>
                                </tr>
                            ) : logs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-4">
                                        {log.channel === 'email' ? <FiMail className="text-indigo-500" /> : <FiMessageSquare className="text-emerald-500" />}
                                    </td>
                                    <td className="py-4 px-4 font-bold text-slate-700 text-xs">{log.recipient}</td>
                                    <td className="py-4 px-4 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-500">{log.subject || log.payload?.content}</td>
                                    <td className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest 
                                            ${log.status === 'sent' ? 'bg-emerald-50 text-emerald-600' :
                                                log.status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {log.status === 'sent' ? <FiCheckCircle /> : log.status === 'failed' ? <FiAlertCircle /> : <FiClock />}
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <button
                                            onClick={() => setShowLogModal(log)}
                                            className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter hover:underline"
                                        >
                                            Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Broadcast Modal */}
            <AnimatePresence>
                {showBroadcastModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setShowBroadcastModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10"
                        >
                            <form onSubmit={handleBroadcastSubmit}>
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg">
                                            <FiSend />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 uppercase tracking-tight">New Broadcast</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Outreach Engine</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setShowBroadcastModal(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                                        <FiX size={20} />
                                    </button>
                                </div>

                                <div className="p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FiUsers /> Target Audience</label>
                                            <select
                                                value={broadcastForm.audience}
                                                onChange={(e) => setBroadcastForm({ ...broadcastForm, audience: e.target.value })}
                                                className="saas-input h-12 text-sm font-bold"
                                            >
                                                <option value="vendors">All Active Vendors</option>
                                                <option value="customers">All Registered Customers</option>
                                                <option value="manual">Manual Recipients (CSV)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FiTag /> Channel</label>
                                            <select
                                                value={broadcastForm.type}
                                                onChange={(e) => setBroadcastForm({ ...broadcastForm, type: e.target.value })}
                                                className="saas-input h-12 text-sm font-bold"
                                            >
                                                <option value="email">Direct Email</option>
                                                <option value="sms">SMS Pulse (Coming Soon)</option>
                                                <option value="whatsapp">WhatsApp Business (Coming Soon)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {broadcastForm.audience === 'manual' && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipients (Comma separated emails)</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. john@example.com, sara@example.com"
                                                className="saas-input h-12 text-sm"
                                                value={broadcastForm.recipients}
                                                onChange={(e) => setBroadcastForm({ ...broadcastForm, recipients: e.target.value })}
                                                required={broadcastForm.audience === 'manual'}
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Line</label>
                                        <input
                                            type="text"
                                            placeholder="Enter transmission subject..."
                                            className="saas-input h-12 text-sm font-medium"
                                            value={broadcastForm.subject}
                                            onChange={(e) => setBroadcastForm({ ...broadcastForm, subject: e.target.value })}
                                            required={broadcastForm.type === 'email'}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Content Body</label>
                                        <textarea
                                            placeholder="Write your message here..."
                                            className="saas-input min-h-[150px] py-4 text-sm"
                                            value={broadcastForm.content}
                                            onChange={(e) => setBroadcastForm({ ...broadcastForm, content: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowBroadcastModal(false)} className="px-6 py-2.5 rounded-xl text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className="px-10 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50"
                                    >
                                        {sending ? <Loader className="w-4 h-4" /> : <FiSend />}
                                        {sending ? 'Transmitting...' : 'Send Broadcast'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Log Details Modal */}
            <AnimatePresence>
                {showLogModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowLogModal(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10">
                            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-black text-slate-900 uppercase tracking-tight">Transmission Detail</h3>
                                <button onClick={() => setShowLogModal(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><FiX /></button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</div>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${showLogModal.status === 'sent' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                            {showLogModal.status}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Recipient</div>
                                        <p className="text-xs font-bold text-slate-700">{showLogModal.recipient}</p>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subject</div>
                                    <p className="text-xs font-bold text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100">{showLogModal.subject || 'N/A'}</p>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Content</div>
                                    <div className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                                        {showLogModal.payload?.content || 'No content recorded.'}
                                    </div>
                                </div>
                                {showLogModal.error_message && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                                        <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Failure Reason</div>
                                        <p className="text-xs text-red-600 font-bold">{showLogModal.error_message}</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-6 text-center border-t border-slate-100">
                                <button onClick={() => setShowLogModal(null)} className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900">Close Audit</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
