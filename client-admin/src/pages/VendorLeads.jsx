import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { PROPERTY_TYPES } from '../constants/propertyConstants';
import { useAuth } from '../context/AuthContext';
import {
    FiPlus, FiSearch, FiFilter, FiMoreVertical,
    FiPhone, FiMessageCircle, FiMail, FiGlobe,
    FiChevronRight, FiStar, FiCalendar, FiUser,
    FiDownload, FiAlertCircle, FiTrash2
} from 'react-icons/fi';
import Loader from '../components/Loader';
import { toast } from 'react-hot-toast';

const STATUS_COLORS = {
    new: 'bg-blue-50 text-blue-600 border-blue-100',
    contacted: 'bg-amber-50 text-amber-600 border-amber-100',
    interested: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    qualified: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    converted: 'bg-green-50 text-green-600 border-green-100',
    rejected: 'bg-red-50 text-red-600 border-red-100'
};

const PRIORITY_COLORS = {
    high: 'text-red-600',
    medium: 'text-amber-500',
    low: 'text-slate-400'
};

export default function VendorLeads() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [stats, setStats] = useState(null);
    const [funnelData, setFunnelData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        fetchLeads();
        fetchStats();
        fetchFunnel();
    }, [filterStatus]);

    const fetchLeads = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/crm/leads`, {
                params: {
                    search: searchTerm,
                    status: filterStatus
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            setLeads(res.data.data || []);
        } catch (error) {
            toast.error("Failed to fetch leads");
        } finally {
            setLoading(false);
        }
    };

    const fetchFunnel = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/crm/funnel`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFunnelData(res.data);
        } catch (error) { }
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/crm/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (error) { }
    };

    const deleteLead = async (id) => {
        if (!window.confirm("Are you sure you want to delete this lead? This action cannot be undone.")) return;
        try {
            await axios.delete(`${API_BASE_URL}/admin/crm/leads/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Lead deleted");
            fetchLeads();
            fetchStats();
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    const updateLeadStatus = async (id, status) => {
        try {
            await axios.put(`${API_BASE_URL}/admin/crm/leads/${id}`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Status updated");
            fetchLeads();
            fetchStats();
        } catch (error) {
            toast.error("Update failed");
        }
    };

    const handleExport = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/crm/export`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `vendor_leads_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            toast.success("Export started");
        } catch (error) {
            toast.error("Export failed");
        }
    };

    if (loading) return <Loader message="Accessing Sales Pipeline..." />;

    return (
        <div className="space-y-6 pb-20 text-left">
            {/* Aging Leads Alert */}
            {stats?.aging_leads > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top duration-500">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                            <FiAlertCircle size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-amber-900 uppercase tracking-tight">Critical Pipeline Alert</p>
                            <p className="text-[10px] font-bold text-amber-600 uppercase">You have {stats.aging_leads} leads that haven't been contacted in 3+ days</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setFilterStatus('new'); // Or some logic to show aging leads
                        }}
                        className="text-[10px] font-black text-amber-600 uppercase bg-amber-100/50 px-4 py-2 rounded-xl hover:bg-amber-100 transition-all"
                    >
                        Review Now
                    </button>
                </div>
            )}

            {/* Header & Stats Strip */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Vendor <span className="text-indigo-600">Onboarding CRM</span></h1>
                    <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-wider">Managing {stats?.active_pipeline || 0} active leads in pipeline</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                        <FiDownload /> Export CSV
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="saas-button-primary flex items-center gap-2"
                    >
                        <FiPlus /> New Lead Entry
                    </button>
                </div>
            </div>

            {/* Pipeline Mini Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {stats?.by_status.map(s => (
                    <div key={s.status} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.status}</p>
                        <p className="text-lg font-black text-slate-900">{s.count}</p>
                    </div>
                ))}
            </div>

            {/* Conversion Funnel */}
            <div className="saas-card p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Acquisition Funnel</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Leakage & Conversion across stages</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Success</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Dropoff</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-end gap-1 h-32 md:h-48">
                    {funnelData.map((stage, idx) => (
                        <div key={stage.stage} className="flex-1 flex flex-col items-center group relative">
                            <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded-lg z-10 whitespace-nowrap">
                                {stage.dropoff}% Drop-off from start
                            </div>
                            <div className="w-full flex flex-col justify-end h-full">
                                <div
                                    className="bg-indigo-600/10 border-x border-t border-indigo-100 rounded-t-xl w-full flex flex-col justify-end"
                                    style={{ height: `${(stage.count / (funnelData[0]?.count || 1)) * 100}%` }}
                                >
                                    <div className="bg-indigo-600 h-full rounded-t-xl flex flex-col justify-center items-center text-white">
                                        <span className="text-xs font-black">{stage.count}</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[9px] font-black text-slate-400 uppercase mt-3 tracking-tighter truncate w-full text-center">{stage.stage}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Advanced CRM Intelligence */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 saas-card p-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Agent Performance (Conversion)</h3>
                    <div className="space-y-4">
                        {stats?.by_agent.map(agent => (
                            <div key={agent.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-[10px] uppercase">
                                        {agent.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700">{agent.name}</p>
                                        <p className="text-[9px] font-medium text-slate-400">{agent.total_leads} leads assigned</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-indigo-600">{agent.converted_leads} Converted</p>
                                    <div className="w-32 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full"
                                            style={{ width: `${(agent.converted_leads / (agent.total_leads || 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="saas-card p-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Top Lead Sources (By City)</h3>
                    <div className="space-y-3">
                        {stats?.by_city.map(city => (
                            <div key={city.city} className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-600">{city.city}</span>
                                <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{city.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Search & Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[300px] relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by vendor, phone, or city..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchLeads()}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase py-2 pl-3 pr-8 focus:ring-2 focus:ring-indigo-500"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        {Object.keys(STATUS_COLORS).map(s => (
                            <option key={s} value={s}>{s.toUpperCase()}</option>
                        ))}
                    </select>
                    <button className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors">
                        <FiFilter />
                    </button>
                </div>
            </div>

            {/* High Density Table */}
            <div className="saas-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="saas-table border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="w-10">
                                    <input type="checkbox" className="rounded border-slate-200 text-indigo-600 focus:ring-indigo-500" />
                                </th>
                                <th>Vendor Entity</th>
                                <th>Contact Details</th>
                                <th>Location</th>
                                <th>Rating</th>
                                <th>Status</th>
                                <th>Priority</th>
                                <th>Next Action</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {leads.map(lead => (
                                <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                    <td className="py-4 px-4">
                                        <input type="checkbox" className="rounded border-slate-200 text-indigo-600 focus:ring-indigo-500" />
                                    </td>
                                    <td className="py-4 px-4 max-w-[200px]" onClick={() => navigate(`/vendor-leads/${lead.id}`)}>
                                        <div className="font-black text-slate-900 text-sm truncate">{lead.vendor_name}</div>
                                        {lead.property_name && <div className="text-xs font-bold text-indigo-600 truncate">{lead.property_name}</div>}
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight bg-slate-100 px-1.5 py-0.5 rounded italic">{lead.property_type || 'General'}</span>
                                            {lead.website && <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-600" onClick={(e) => e.stopPropagation()}><FiGlobe size={10} /></a>}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="text-xs font-bold text-slate-700">{lead.contact_person || 'N/A'}</div>
                                        <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                            {lead.phone}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="text-xs font-bold text-slate-700">{lead.city}</div>
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{lead.area}</div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-1">
                                            <FiStar className="text-amber-400 fill-amber-400" size={10} />
                                            <span className="text-xs font-black text-slate-700">{lead.rating || '0.0'}</span>
                                            <span className="text-[9px] font-bold text-slate-400">({lead.reviews_count})</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <select
                                            value={lead.status}
                                            onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border transform scale-90 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${STATUS_COLORS[lead.status] || 'bg-slate-50'}`}
                                        >
                                            {Object.keys(STATUS_COLORS).map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <div className={`flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-widest ${PRIORITY_COLORS[lead.priority]}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${lead.priority === 'high' ? 'bg-red-500' : lead.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-300'}`}></div>
                                            {lead.priority}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        {lead.next_follow_up_at ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center animate-pulse">
                                                    <FiCalendar size={14} />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black text-slate-900">{new Date(lead.next_follow_up_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</div>
                                                    <div className="text-[9px] font-bold text-slate-400 uppercase leading-none">Reminder</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <button className="text-[9px] font-black text-indigo-400 hover:text-indigo-600 uppercase tracking-widest">+ Set Action</button>
                                        )}
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors border border-transparent hover:border-emerald-100" title="WhatsApp">
                                                <FiMessageCircle size={14} />
                                            </button>
                                            <button className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-transparent hover:border-blue-100" title="Call">
                                                <FiPhone size={14} />
                                            </button>
                                            <button className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg transition-colors" title="Quick View">
                                                <FiChevronRight size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }}
                                                className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                                                title="Delete Lead"
                                            >
                                                <FiTrash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {leads.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200">
                            <FiUser size={32} />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 uppercase">No Pipeline Depth</h3>
                        <p className="text-[10px] font-bold text-slate-400 max-w-xs mx-auto mt-1">Start adding vendor leads to begin your onboarding automation lifecycle.</p>
                    </div>
                )}
            </div>

            {/* Add Lead Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase">New Lead Entry</h3>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Initialize onboarding lifecycle</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            const data = Object.fromEntries(formData.entries());
                            try {
                                await axios.post(`${API_BASE_URL}/admin/crm/leads`, data, {
                                    headers: { Authorization: `Bearer ${token}` }
                                });
                                toast.success("Lead created");
                                setShowAddModal(false);
                                fetchLeads();
                                fetchStats();
                            } catch (err) {
                                toast.error("Creation failed");
                            }
                        }} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Vendor/Entity Name</label>
                                    <input name="vendor_name" required className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Property Name (Proposal)</label>
                                    <input name="property_name" className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Phone</label>
                                    <input name="phone" required className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Email</label>
                                    <input name="email" type="email" className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">City</label>
                                    <input name="city" className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Property Type</label>
                                    <select name="property_type" className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500">
                                        {PROPERTY_TYPES.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-xs font-black text-slate-400 uppercase hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                                <button type="submit" className="flex-2 saas-button-primary w-full">Create Lead</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
