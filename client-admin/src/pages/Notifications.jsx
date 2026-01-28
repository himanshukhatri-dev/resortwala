import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import {
    FiSend, FiBell, FiRefreshCw, FiTarget, FiMail,
    FiMessageSquare, FiSettings, FiActivity, FiEye
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function Notifications() {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState('logs');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [templates, setTemplates] = useState([]);

    // Testing Form State
    const [testForm, setTestForm] = useState({
        type: 'email',
        recipient: '',
        template_id: '',
        data: {
            customer_name: 'John Doe',
            otp: '123456',
            propertyName: 'The Grand Resort',
            bookingId: 'RW-TEST-001'
        }
    });

    useEffect(() => {
        fetchLogs();
        fetchTemplates(testForm.type);
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

    const fetchTemplates = async (channel) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/notifications/setup/templates?channel=${channel}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTemplates(res.data);
            if (res.data.length > 0) {
                setTestForm(prev => ({ ...prev, template_id: res.data[0].id }));
            }
        } catch (error) {
            console.error('Templates fetch failed', error);
        }
    };

    const handleSendTest = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/admin/notifications/setup/test`, testForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(res.data.message);
            fetchLogs();
        } catch (error) {
            toast.error(error.response?.data?.message || "Test dispatch failed");
        } finally {
            setLoading(false);
        }
    };

    const handleSimulate = async (eventName) => {
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/admin/notifications/setup/simulate-event`, {
                event_name: eventName,
                email: 'himanshukhatri.1988@gmail.com',
                phone: '919870646548'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(res.data.message);
            fetchLogs();
        } catch (error) {
            toast.error("Simulation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <FiBell className="text-indigo-600" />
                        Notification Center
                    </h1>
                    <p className="text-slate-500 font-medium">Control and monitor system-wide communications.</p>
                </div>
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                    {['logs', 'test', 'settings'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'logs' && (
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
            )}

            {activeTab === 'test' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
                    {/* Manual Send */}
                    <div className="bg-white border rounded-2xl shadow-sm p-8 space-y-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <FiTarget className="text-indigo-600" /> Dispatch Tool
                        </h2>

                        <form onSubmit={handleSendTest} className="space-y-4">
                            <div className="grid grid-cols-3 gap-2">
                                {['email', 'sms', 'whatsapp'].map(ch => (
                                    <button
                                        key={ch}
                                        type="button"
                                        onClick={() => {
                                            setTestForm({ ...testForm, type: ch });
                                            fetchTemplates(ch);
                                        }}
                                        className={`px-4 py-3 rounded-xl border-2 font-black text-xs uppercase tracking-tighter transition-all ${testForm.type === ch ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400'
                                            }`}
                                    >
                                        {ch}
                                    </button>
                                ))}
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Recipient</label>
                                <input
                                    type="text"
                                    value={testForm.recipient}
                                    onChange={e => setTestForm({ ...testForm, recipient: e.target.value })}
                                    placeholder={testForm.type === 'email' ? 'email@example.com' : '91XXXXXXXXXX'}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-600 outline-none transition-all font-bold"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Template</label>
                                <select
                                    value={testForm.template_id}
                                    onChange={e => setTestForm({ ...testForm, template_id: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-600 outline-none transition-all font-bold"
                                >
                                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all"
                            >
                                Dispatch Test
                            </button>
                        </form>
                    </div>

                    {/* Quick Simulation */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <FiSettings className="text-slate-400" /> Event Simulator
                        </h2>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { event: 'otp.sms', label: 'OTP via SMS', color: 'border-blue-100 bg-blue-50 text-blue-700' },
                                { event: 'booking.confirmed', label: 'Booking Confirmation', color: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
                                { event: 'vendor.approved', label: 'Vendor Approval', color: 'border-indigo-100 bg-indigo-50 text-indigo-700' },
                                { event: 'property.created_admin', label: 'New Property Alert', color: 'border-amber-100 bg-amber-50 text-amber-700' },
                            ].map(s => (
                                <button
                                    key={s.event}
                                    onClick={() => handleSimulate(s.event)}
                                    className={`px-6 py-4 rounded-2xl border text-sm font-bold flex items-center justify-between transition-all hover:scale-[1.01] ${s.color}`}
                                >
                                    {s.label}
                                    <FiActivity className="opacity-50" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="bg-white border rounded-2xl p-12 text-center space-y-4">
                    <FiSettings className="text-5xl text-slate-200 mx-auto" />
                    <h3 className="text-lg font-bold text-slate-800">Advanced Configuration</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        Template and Trigger editing is restricted to Developer accounts to prevent production delivery errors.
                    </p>
                </div>
            )}
        </div>
    );
}
