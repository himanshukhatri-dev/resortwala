import React, { useState, useEffect } from 'react';
import { FaShieldAlt, FaTools, FaClock, FaSave, FaEye, FaLock, FaGlobe, FaFileUpload, FaEnvelope } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import toast from 'react-hot-toast';

export default function SystemControl() {
    const { token } = useAuth();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/settings/mode`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSettings({
                ...res.data,
                maintenance_mode: res.data.maintenance,
                coming_soon_mode: res.data.coming_soon
            });
        } catch (err) {
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.post(`${API_BASE_URL}/admin/settings/mode`, settings, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("System Settings Updated!");
        } catch (err) {
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const handleUpload = async (file, type) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const toastId = toast.loading(`Uploading ${type}...`);
        try {
            const res = await axios.post(`${API_BASE_URL}/admin/settings/upload-asset`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Update settings based on type
            if (type === 'logo') {
                setSettings({ ...settings, logo_url: res.data.url });
            } else if (type === 'background_maintenance') {
                setSettings({
                    ...settings,
                    maintenance_content: { ...settings.maintenance_content, background_url: res.data.url }
                });
            } else if (type === 'background_coming_soon') {
                setSettings({
                    ...settings,
                    coming_soon_content: { ...settings.coming_soon_content, background_url: res.data.url }
                });
            }

            toast.success("Uploaded successfully!", { id: toastId });
        } catch (err) {
            toast.error("Upload failed", { id: toastId });
        }
    };

    if (loading || !settings) return <div className="p-8 text-center text-gray-500">Loading Configuration...</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <FaShieldAlt className="text-blue-600" /> Platform Security & Modes
                    </h1>
                    <div className="flex items-center gap-4 mt-2">
                        {settings.logo_url && (
                            <img src={settings.logo_url} alt="Logo" className="h-6 w-auto" />
                        )}
                        <label className="text-[10px] bg-slate-100 px-2 py-1 rounded cursor-pointer hover:bg-slate-200 font-bold text-slate-500 uppercase">
                            Change Logo
                            <input type="file" className="hidden" onChange={(e) => handleUpload(e.target.files[0], 'logo')} />
                        </label>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all disabled:opacity-50"
                >
                    <FaSave /> {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Maintenance Mode Card */}
                <div className={`bg-white p-8 rounded-3xl border-2 transition-all duration-500 ${settings.maintenance ? 'border-orange-500 shadow-lg shadow-orange-500/10' : 'border-slate-100'}`}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${settings.maintenance ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                <FaTools className="text-xl" />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800">Maintenance Mode</h3>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Lock entire site for upgrades</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.maintenance_mode}
                                onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                            />
                            <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Display Title</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white transition-all text-sm font-medium"
                                value={settings.maintenance_content?.title || ''}
                                onChange={(e) => setSettings({ ...settings, maintenance_content: { ...settings.maintenance_content, title: e.target.value } })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description</label>
                            <textarea
                                className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white transition-all text-sm font-medium h-24"
                                value={settings.maintenance_content?.description || ''}
                                onChange={(e) => setSettings({ ...settings, maintenance_content: { ...settings.maintenance_content, description: e.target.value } })}
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Estimated Time</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium"
                                    value={settings.maintenance_content?.estimated_return || ''}
                                    placeholder="e.g. 2 hours"
                                    onChange={(e) => setSettings({ ...settings, maintenance_content: { ...settings.maintenance_content, estimated_return: e.target.value } })}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Support Email</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium"
                                    value={settings.maintenance_content?.contact_email || ''}
                                    onChange={(e) => setSettings({ ...settings, maintenance_content: { ...settings.maintenance_content, contact_email: e.target.value } })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Background Image</label>
                            <div className="flex items-center gap-4">
                                {settings.maintenance_content?.background_url && (
                                    <img src={settings.maintenance_content.background_url} alt="BG" className="w-12 h-12 rounded-lg object-cover border" />
                                )}
                                <input
                                    type="file"
                                    onChange={(e) => handleUpload(e.target.files[0], 'background_maintenance')}
                                    className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coming Soon Card */}
                <div className={`bg-white p-8 rounded-3xl border-2 transition-all duration-500 ${settings.coming_soon_mode ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-slate-100'}`}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${settings.coming_soon_mode ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                <FaClock className="text-xl" />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800">Coming Soon Mode</h3>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Tease new features safely</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.coming_soon_mode}
                                onChange={(e) => setSettings({ ...settings, coming_soon_mode: e.target.checked })}
                            />
                            <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Teaser Title</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium"
                                value={settings.coming_soon_content?.title || ''}
                                onChange={(e) => setSettings({ ...settings, coming_soon_content: { ...settings.coming_soon_content, title: e.target.value } })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Teaser Subtext</label>
                            <textarea
                                className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium h-24"
                                value={settings.coming_soon_content?.description || ''}
                                onChange={(e) => setSettings({ ...settings, coming_soon_content: { ...settings.coming_soon_content, description: e.target.value } })}
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <FaEnvelope className="text-slate-400" />
                                <span className="text-sm font-bold text-slate-700">Email Capture</span>
                            </div>
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={settings.coming_soon_content?.allow_email_capture}
                                onChange={(e) => setSettings({ ...settings, coming_soon_content: { ...settings.coming_soon_content, allow_email_capture: e.target.checked } })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Teaser Background</label>
                            <div className="flex items-center gap-4">
                                {settings.coming_soon_content?.background_url && (
                                    <img src={settings.coming_soon_content.background_url} alt="BG" className="w-12 h-12 rounded-lg object-cover border" />
                                )}
                                <input
                                    type="file"
                                    onChange={(e) => handleUpload(e.target.files[0], 'background_coming_soon')}
                                    className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Developer Bypass Key */}
            <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl shadow-slate-950/20">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl">
                            <FaLock className="text-xl text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-black">Developer Bypass Control</h3>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Required for dev access during lock</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <code className="bg-white/5 px-4 py-2 rounded-xl border border-white/10 text-xs font-mono text-blue-300">
                            {settings.developer_bypass_key}
                        </code>
                    </div>
                </div>

                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium opacity-80">Testing Shortcut Link</p>
                        <p className="text-[10px] text-slate-500 mt-1">Append this to the URL to bypass all maintenance screens.</p>
                    </div>
                    <code className="text-xs bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 text-blue-400">
                        resortwala.com/?testali=1
                    </code>
                </div>
            </div>
        </div>
    );
}
