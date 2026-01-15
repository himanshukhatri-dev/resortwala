import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import {
    FiSettings, FiMail, FiPhone, FiGlobe,
    FiCheck, FiSave, FiInfo, FiHash, FiInstagram, FiFacebook, FiTwitter
} from 'react-icons/fi';
import Loader from '../components/Loader';
import { toast } from 'react-hot-toast';

export default function Settings() {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({});
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSettings(res.data.settings || {});
        } catch (error) {
            console.error("Failed to fetch settings", error);
            toast.error("Failed to load system settings");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        setSaving(true);
        try {
            // Flatten settings back for update
            const flatSettings = {};
            Object.values(settings).forEach(group => {
                group.forEach(s => {
                    flatSettings[s.key] = s.value;
                });
            });

            await axios.post(`${API_BASE_URL}/admin/settings/update`, { settings: flatSettings }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("System configurations updated live!");
        } catch (error) {
            console.error("Failed to save settings", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (group, key, value) => {
        setSettings(prev => ({
            ...prev,
            [group]: prev[group].map(s => s.key === key ? { ...s, value } : s)
        }));
    };

    if (loading) return <Loader message="Accessing System Core..." />;

    const tabs = [
        { id: 'general', label: 'General', icon: FiSettings },
        { id: 'contact', label: 'Contact & Support', icon: FiPhone },
        { id: 'social', label: 'Social Media', icon: FiInstagram },
        { id: 'seo', label: 'SEO & Meta', icon: FiGlobe },
    ];

    return (
        <div className="p-4 lg:p-8 max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        System <span className="text-indigo-600">Configurations</span>
                    </h1>
                    <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Global platform parameters & site info</p>
                </div>
                <button
                    onClick={handleUpdate}
                    disabled={saving}
                    className="saas-button-primary flex items-center gap-2 bg-slate-900 px-8 disabled:opacity-50"
                >
                    {saving ? <Loader className="w-4 h-4" /> : <FiSave />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Tabs */}
                <div className="space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            <tab.icon className={activeTab === tab.id ? 'text-white' : 'text-slate-400'} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="saas-card p-6 md:p-8">
                        <div className="space-y-6">
                            {(settings[activeTab] || []).map(field => (
                                <div key={field.key} className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <FiHash className="text-indigo-400" />
                                        {field.key.replace(/_/g, ' ')}
                                    </label>
                                    <div className="relative">
                                        {field.key.includes('description') || field.key.includes('message') ? (
                                            <textarea
                                                value={field.value || ''}
                                                onChange={(e) => handleChange(activeTab, field.key, e.target.value)}
                                                className="saas-input py-3 min-h-[100px]"
                                                placeholder={`Enter ${field.key}...`}
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                value={field.value || ''}
                                                onChange={(e) => handleChange(activeTab, field.key, e.target.value)}
                                                className="saas-input h-12"
                                                placeholder={`Enter ${field.key}...`}
                                            />
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 italic font-medium px-1">
                                        {activeTab === 'seo' ? 'Visible to search engines for indexing optimization.' : 'Used across transactional emails and support UI.'}
                                    </p>
                                </div>
                            ))}

                            {(settings[activeTab] || []).length === 0 && (
                                <div className="text-center py-12 text-slate-400">
                                    <FiSettings className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="font-bold">No settings found in this category.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Security Info Card */}
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4 items-start">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                            <FiInfo className="text-xl" />
                        </div>
                        <div>
                            <h4 className="font-black text-amber-900 uppercase tracking-tight text-xs mb-1">Impact Analysis</h4>
                            <p className="text-xs text-amber-700 font-medium leading-relaxed">
                                Changes to these values will update the platform globally across the User App, Vendor App, and Customer Website. Transactional emails (Invoices, OTPs) will use these new identities immediately.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
