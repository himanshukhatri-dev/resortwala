import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { FiPlus, FiSave, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function DltRegistry() {
    const { token } = useAuth();
    const [registries, setRegistries] = useState([]);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        entity_id: '',
        sender_id: '',
        template_id: '',
        approved_content: ''
    });

    useEffect(() => {
        fetchRegistries();
    }, []);

    const fetchRegistries = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/notifications/setup/dlt`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRegistries(res.data);
        } catch (error) {
            toast.error("Failed to load DLT data");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE_URL}/admin/notifications/setup/dlt`, form, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("DLT Record Saved");
            fetchRegistries();
            setForm({ entity_id: '', sender_id: '', template_id: '', approved_content: '' });
        } catch (error) {
            toast.error("Failed to save DLT record");
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Form */}
            <div className="w-full lg:w-1/3">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FiPlus className="text-indigo-600" /> Add DLT Template
                    </h3>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Entity ID (PE ID)</label>
                            <input
                                className="saas-input w-full"
                                value={form.entity_id}
                                onChange={e => setForm({ ...form, entity_id: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Sender ID (6 chars)</label>
                            <input
                                className="saas-input w-full"
                                maxLength={6}
                                value={form.sender_id}
                                onChange={e => setForm({ ...form, sender_id: e.target.value.toUpperCase() })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Template ID</label>
                            <input
                                className="saas-input w-full"
                                value={form.template_id}
                                onChange={e => setForm({ ...form, template_id: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Approved Content</label>
                            <textarea
                                className="saas-input w-full min-h-[100px]"
                                value={form.approved_content}
                                onChange={e => setForm({ ...form, approved_content: e.target.value })}
                                placeholder="Hi {#var#}, your OTP is {#var#}."
                                required
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Use <strong>{'{#var#}'}</strong> for variables as per DLT.</p>
                        </div>
                        <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
                            Register Template
                        </button>
                    </form>
                </div>
            </div>

            {/* List */}
            <div className="flex-1">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase">Template ID</th>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase">Sender</th>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase">Content</th>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {registries.map(reg => (
                                <tr key={reg.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-mono text-xs font-bold text-slate-600">{reg.template_id}</td>
                                    <td className="p-4 font-bold text-xs">{reg.sender_id}</td>
                                    <td className="p-4 text-xs text-slate-500 max-w-md truncate">{reg.approved_content}</td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase">
                                            <FiCheckCircle /> Active
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {registries.length === 0 && !loading && (
                                <tr><td colSpan="4" className="p-8 text-center text-slate-400 font-bold text-sm">No DLT templates registered</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
