import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { FiSave, FiLock, FiServer, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function GatewaySettings() {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState({
        sms_provider: 'msg91',
        sms_api_key: '',
        sms_sender_id: '', // Default Sender ID (e.g. RSRTWL)
        dlt_n_key: '', // Some providers require DLT Entity ID in header

        whatsapp_provider: 'meta',
        whatsapp_access_token: '',
        whatsapp_phone_id: '',

        email_driver: 'smtp',
        email_host: '',
        email_port: '587',
        email_username: '',
        email_password: ''
    });

    // In a real app, we would fetch existing secure config (redacted)
    // For now, we will just allow setting them.

    const handleSave = async (section) => {
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/admin/notifications/setup/gateway`, {
                section,
                config
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`${section} Settings Saved`);
        } catch (error) {
            toast.error("Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* SMS & DLT Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <FiServer className="text-indigo-600" /> SMS & DLT Gateway
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Provider</label>
                        <select
                            className="saas-input w-full"
                            value={config.sms_provider}
                            onChange={e => setConfig({ ...config, sms_provider: e.target.value })}
                        >
                            <option value="msg91">MSG91</option>
                            <option value="twilio">Twilio</option>
                            <option value="kaleyra">Kaleyra</option>
                            <option value="textlocal">TextLocal</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">API Key / Auth Token</label>
                        <input
                            type="password"
                            className="saas-input w-full font-mono"
                            value={config.sms_api_key}
                            onChange={e => setConfig({ ...config, sms_api_key: e.target.value })}
                            placeholder="****************"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Default Sender ID</label>
                            <input
                                className="saas-input w-full uppercase"
                                maxLength={6}
                                value={config.sms_sender_id}
                                onChange={e => setConfig({ ...config, sms_sender_id: e.target.value })}
                                placeholder="RSRTWL"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">DLT Entity ID (PE ID)</label>
                            <input
                                className="saas-input w-full"
                                value={config.dlt_n_key}
                                onChange={e => setConfig({ ...config, dlt_n_key: e.target.value })}
                                placeholder="1701...."
                            />
                        </div>
                    </div>
                    <button
                        onClick={() => handleSave('sms')}
                        disabled={loading}
                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition"
                    >
                        Save SMS Config
                    </button>

                    <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg mt-4">
                        <strong>Note:</strong> Template specific DLT IDs are managed in the <strong>DLT Registry</strong> tab. This section is for the main sending gateway credentials.
                    </div>
                </div>
            </div>

            {/* WhatsApp Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <FiCheckCircle className="text-emerald-500" /> WhatsApp API (Meta)
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number ID</label>
                        <input
                            className="saas-input w-full"
                            value={config.whatsapp_phone_id}
                            onChange={e => setConfig({ ...config, whatsapp_phone_id: e.target.value })}
                            placeholder="10923..."
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Permanent Access Token</label>
                        <input
                            type="password"
                            className="saas-input w-full font-mono"
                            value={config.whatsapp_access_token}
                            onChange={e => setConfig({ ...config, whatsapp_access_token: e.target.value })}
                            placeholder="EAAG..."
                        />
                    </div>
                    <button
                        onClick={() => handleSave('whatsapp')}
                        disabled={loading}
                        className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition"
                    >
                        Save WhatsApp Config
                    </button>
                </div>
            </div>

        </div>
    );
}
