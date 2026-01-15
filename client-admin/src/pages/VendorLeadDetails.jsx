import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import {
    FiArrowLeft, FiPhone, FiMessageCircle, FiMail,
    FiCheck, FiX, FiCalendar, FiClock, FiPlus,
    FiUser, FiMapPin, FiStar, FiGlobe, FiBriefcase, FiHome
} from 'react-icons/fi';
import Loader from '../components/Loader';
import { toast } from 'react-hot-toast';

const STATUS_OPTIONS = ['new', 'contacted', 'interested', 'qualified', 'converted', 'rejected'];

const STATUS_COLORS = {
    new: 'text-blue-600 bg-blue-50',
    contacted: 'text-amber-600 bg-amber-50',
    interested: 'text-emerald-600 bg-emerald-50',
    qualified: 'text-indigo-600 bg-indigo-50',
    converted: 'text-green-600 bg-green-50',
    rejected: 'text-red-600 bg-red-50'
};

export default function VendorLeadDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [lead, setLead] = useState(null);
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInteractionModal, setShowInteractionModal] = useState(false);

    useEffect(() => {
        fetchLeadDetails();
        fetchAgents();
    }, [id]);

    const fetchLeadDetails = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/crm/leads/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLead(res.data);
        } catch (error) {
            toast.error("Failed to load lead details");
            navigate('/admin/vendor-leads');
        } finally {
            setLoading(false);
        }
    };

    const fetchAgents = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/crm/agents`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAgents(res.data);
        } catch (error) { }
    };

    const updateAssignment = async (agentId) => {
        try {
            await axios.put(`${API_BASE_URL}/admin/crm/leads/${id}`, { assigned_to: agentId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Agent assigned");
            fetchLeadDetails();
        } catch (err) {
            toast.error("Assignment failed");
        }
    };

    const handleLogInteraction = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        try {
            await axios.post(`${API_BASE_URL}/admin/crm/leads/${id}/interactions`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Interaction logged");
            setShowInteractionModal(false);
            fetchLeadDetails();
        } catch (err) {
            toast.error("Failed to log interaction");
        }
    };

    const updateStatus = async (status) => {
        try {
            await axios.put(`${API_BASE_URL}/admin/crm/leads/${id}`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Status updated");
            fetchLeadDetails();
        } catch (err) {
            toast.error("Update failed");
        }
    };

    if (loading) return <Loader message="Accessing Intelligence Dossier..." />;
    if (!lead) return null;

    return (
        <div className="space-y-6 pb-20 text-left">
            {/* Header / Nav */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/vendor-leads')}
                    className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all"
                >
                    <FiArrowLeft className="text-slate-400" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        {lead.vendor_name}
                        {lead.property_name && <span className="text-lg text-slate-400 font-medium">/ {lead.property_name}</span>}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${STATUS_COLORS[lead.status]}`}>
                            {lead.status}
                        </span>
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Assigned to: {lead.assigned_agent?.name || 'Unassigned'}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Lead Profiling */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="saas-card p-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Contact Dossier</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <FiUser size={18} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Decision Maker</p>
                                    <p className="text-sm font-bold text-slate-700">{lead.contact_person || 'N/A'}</p>
                                </div>
                            </div>
                            {lead.property_name && (
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                        <FiHome size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Property</p>
                                        <p className="text-sm font-bold text-slate-700">{lead.property_name}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <FiPhone size={18} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mobile Contact</p>
                                    <p className="text-sm font-bold text-slate-700">{lead.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <FiMapPin size={18} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                                    <p className="text-sm font-bold text-slate-700">{lead.area}, {lead.city}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <FiBriefcase size={18} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Entity Type</p>
                                    <p className="text-sm font-bold text-slate-700 capitalize">{lead.property_type || 'General'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
                            <button className="flex flex-col items-center gap-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 group hover:bg-emerald-600 transition-all duration-300">
                                <FiMessageCircle className="text-emerald-600 group-hover:text-white" size={20} />
                                <span className="text-[10px] font-black text-emerald-600 group-hover:text-white uppercase">WhatsApp</span>
                            </button>
                            <button className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-2xl border border-blue-100 group hover:bg-blue-600 transition-all duration-300">
                                <FiPhone className="text-blue-600 group-hover:text-white" size={20} />
                                <span className="text-[10px] font-black text-blue-600 group-hover:text-white uppercase">Call</span>
                            </button>
                        </div>
                    </div>

                    {/* Status Management */}
                    <div className="saas-card p-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Pipeline Control</h3>

                        <div className="mb-6">
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Assigned Agent</label>
                            <select
                                value={lead.assigned_to || ''}
                                onChange={(e) => updateAssignment(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Unassigned</option>
                                {agents.map(agent => (
                                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            {STATUS_OPTIONS.map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => updateStatus(opt)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${lead.status === opt ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200'}`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest">{opt}</span>
                                    {lead.status === opt && <FiCheck />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Timeline & Interactions */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="saas-card p-8 min-h-[500px] flex flex-col">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Activity Timeline</h3>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Chronological verification history</p>
                            </div>
                            <button
                                onClick={() => setShowInteractionModal(true)}
                                className="saas-button-primary flex items-center gap-2"
                            >
                                <FiPlus /> Log Interaction
                            </button>
                        </div>

                        <div className="relative flex-1">
                            <div className="absolute left-4 top-0 bottom-0 w-[1px] bg-slate-100"></div>
                            <div className="space-y-8 relative">
                                {lead.interactions?.map((it, idx) => (
                                    <div key={it.id} className="flex gap-6">
                                        <div className={`w-8 h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center relative z-10 shrink-0 ${it.interaction_type === 'Call' ? 'bg-blue-500 text-white' : it.interaction_type === 'Meeting' ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                            {it.interaction_type === 'Call' ? <FiPhone size={12} /> : <FiUser size={12} />}
                                        </div>
                                        <div className="flex-1 pb-8 border-b border-slate-50 last:border-0">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-xs font-black text-slate-900">{it.interaction_type} <span className="text-slate-400 font-bold tracking-tight mx-2">•</span> {it.outcome}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold mt-1">via {it.agent?.name}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <FiClock size={10} />
                                                    <span className="text-[10px] font-medium">{new Date(it.created_at).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="mt-3 p-4 bg-slate-50 rounded-2xl text-xs text-slate-600 font-medium leading-relaxed italic border border-slate-100">
                                                "{it.notes}"
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!lead.interactions || lead.interactions.length === 0) && (
                                    <div className="p-20 text-center">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">No interactions logged yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Interaction Modal */}
            {showInteractionModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase">Log Interaction</h3>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Updates audit trail</p>
                            </div>
                            <button onClick={() => setShowInteractionModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
                        </div>
                        <form onSubmit={handleLogInteraction} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Medium</label>
                                    <select name="interaction_type" className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500">
                                        <option value="Call">Phone Call</option>
                                        <option value="WhatsApp">WhatsApp</option>
                                        <option value="Meeting">Meeting</option>
                                        <option value="Email">Email</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Outcome</label>
                                    <select name="outcome" className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500">
                                        <option value="Interested">Interested</option>
                                        <option value="Callback">Needs Callback</option>
                                        <option value="Rejected">Rejected</option>
                                        <option value="Not Reachable">Not Reachable</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Activity Notes</label>
                                    <textarea name="notes" rows="3" required className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500" placeholder="Summarize the discussion..."></textarea>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Schedule Follow-up</label>
                                    <input type="datetime-local" name="follow_up_at" className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowInteractionModal(false)} className="flex-1 py-3 text-xs font-black text-slate-400 uppercase hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                                <button type="submit" className="flex-2 saas-button-primary w-full">Save Entry</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
