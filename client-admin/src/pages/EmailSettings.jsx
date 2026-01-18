import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { toast } from 'react-hot-toast';
import { FiSave } from 'react-icons/fi';

const EmailSettings = () => {
    const token = localStorage.getItem('admin_token');
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        email: 'support@resortwala.com',
        imap_host: 'imap.secureserver.net',
        imap_port: 993,
        smtp_host: 'smtpout.secureserver.net',
        smtp_port: 465,
        password: ''
    });

    useEffect(() => {
        // Fetch existing settings (we might get list, but for now we assume simple 1 account setup)
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/shared-inbox/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.length > 0) {
                // Pre-fill first account
                const acc = res.data[0];
                setSettings({ ...acc, password: '' });
            }
        } catch (err) {
            console.error("No settings found or error");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            toast.loading("Saving...");
            await axios.post(`${API_BASE_URL}/admin/shared-inbox/settings`, settings, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.dismiss();
            toast.success("Settings Saved");
        } catch (err) {
            toast.dismiss();
            toast.error("Failed to save settings");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Shared Inbox Settings</h1>

            <div className="bg-white p-6 rounded-lg shadow">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input
                            type="email"
                            required
                            value={settings.email}
                            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            placeholder={settings.id ? "(Unchanged)" : "Enter Password"}
                            value={settings.password}
                            onChange={(e) => setSettings({ ...settings, password: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Stored securely using OpenSSL encryption.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">IMAP Host</label>
                            <input
                                type="text"
                                value={settings.imap_host}
                                onChange={(e) => setSettings({ ...settings, imap_host: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">IMAP Port</label>
                            <input
                                type="number"
                                value={settings.imap_port}
                                onChange={(e) => setSettings({ ...settings, imap_port: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">SMTP Host</label>
                            <input
                                type="text"
                                value={settings.smtp_host}
                                onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">SMTP Port</label>
                            <input
                                type="number"
                                value={settings.smtp_port}
                                onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button type="submit" className="flex items-center justify-center w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                            <FiSave className="mr-2" /> Save Configuration
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmailSettings;
