import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { toast } from 'react-hot-toast';
import { FiRefreshCw, FiStar, FiTrash2, FiMail, FiSettings, FiPaperclip, FiCornerUpLeft, FiEdit3, FiX, FiSend } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const SharedInbox = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('admin_token');

    const [emails, setEmails] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [filter, setFilter] = useState('INBOX');

    // Compose State
    const [showCompose, setShowCompose] = useState(false);
    const [sending, setSending] = useState(false);
    const [composeData, setComposeData] = useState({
        to: '',
        subject: '',
        body: '',
        from_email: '' // Should be selectable if multiple credentials exist
    });
    const [credentials, setCredentials] = useState([]);

    useEffect(() => {
        fetchEmails();
        fetchCredentials();
    }, [filter]);

    const fetchCredentials = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/shared-inbox/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCredentials(res.data);
            if (res.data.length > 0) {
                setComposeData(prev => ({ ...prev, from_email: res.data[0].email }));
            }
        } catch (err) {
            console.error("Failed to load credentials");
        }
    };

    const fetchEmails = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/shared-inbox/emails?folder=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEmails(res.data.data);
        } catch (err) {
            toast.error("Failed to load emails");
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            toast.loading("Syncing emails...");
            const res = await axios.post(`${API_BASE_URL}/admin/shared-inbox/sync`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.dismiss();
            toast.success(`Sync complete. ${res.data.details[Object.keys(res.data.details)[0]].count} new emails.`);
            fetchEmails();
        } catch (err) {
            toast.dismiss();
            toast.error("Sync failed");
        } finally {
            setSyncing(false);
        }
    };

    const handleSelectEmail = async (email) => {
        setSelectedEmail(email);
        if (!email.is_read) {
            const updated = emails.map(e => e.id === email.id ? { ...e, is_read: true } : e);
            setEmails(updated);
            try {
                await axios.get(`${API_BASE_URL}/admin/shared-inbox/emails/${email.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (err) {
                console.error("Failed to mark read");
            }
        }
    };

    const handleSend = async () => {
        if (!composeData.to || !composeData.subject || !composeData.body) {
            toast.error("Please fill all fields");
            return;
        }
        setSending(true);
        const toastId = toast.loading("Sending email...");
        try {
            await axios.post(`${API_BASE_URL}/admin/shared-inbox/send`, composeData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Email Sent!", { id: toastId });
            setShowCompose(false);
            setComposeData({ to: '', subject: '', body: '', from_email: credentials[0]?.email || '' });
            if (filter === 'SENT') fetchEmails();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to send", { id: toastId });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden relative">
            {/* Sidebar Folder Nav */}
            <div className="w-64 bg-white border-r flex flex-col">
                <div className="p-4 border-b flex items-center justify-between">
                    <h1 className="font-bold text-lg text-gray-800">Shared Inbox</h1>
                    <button onClick={() => navigate('/admin/settings/email')} className="text-gray-500 hover:text-gray-800">
                        <FiSettings /> {/* Settings Icon Placeholder */}
                    </button>
                </div>
                <div className="p-4">
                    <button
                        onClick={() => setShowCompose(true)}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition"
                    >
                        <FiEdit3 /> Compose
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto py-2">
                    <nav className="space-y-1 px-2">
                        {['INBOX', 'SENT', 'TRASH'].map(folder => (
                            <button
                                key={folder}
                                onClick={() => { setFilter(folder); setSelectedEmail(null); }}
                                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${filter === folder ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                            >
                                <FiMail className="mr-3 flex-shrink-0" />
                                {folder}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="p-4 border-t">
                    <button onClick={handleSync} disabled={syncing} className="w-full flex justify-center items-center gap-2 bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 disabled:opacity-50 text-sm">
                        <FiRefreshCw className={syncing ? "animate-spin" : ""} />
                        {syncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                </div>
            </div>

            {/* Email List */}
            <div className={`${selectedEmail ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-96 bg-white border-r`}>
                <div className="p-4 border-b bg-gray-50">
                    <input
                        type="text"
                        placeholder="Search mail..."
                        className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                    />
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">Loading...</div>
                    ) : emails.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">No emails found</div>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {emails.map(email => (
                                <li
                                    key={email.id}
                                    onClick={() => handleSelectEmail(email)}
                                    className={`cursor-pointer hover:bg-gray-50 p-4 ${selectedEmail?.id === email.id ? 'bg-indigo-50' : ''} ${!email.is_read ? 'bg-blue-50' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-sm ${!email.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                            {email.from_name || email.from_email}
                                        </span>
                                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                            {new Date(email.date_received).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className={`text-sm mb-1 ${!email.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                        {email.subject}
                                    </h3>
                                    <p className="text-xs text-gray-500 line-clamp-2">
                                        {email.body_text?.substring(0, 100)}...
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Email Detail View */}
            {selectedEmail ? (
                <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b flex justify-between items-start bg-white z-10">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedEmail.subject}</h2>
                            <div className="flex items-center gap-2">
                                <span className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                    {selectedEmail.from_name?.[0] || 'U'}
                                </span>
                                <div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {selectedEmail.from_name} <span className="text-gray-500 font-normal">&lt;{selectedEmail.from_email}&gt;</span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        To: {selectedEmail.to_email} • {new Date(selectedEmail.date_received).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="text-gray-400 hover:text-yellow-500 p-2"><FiStar /></button>
                            <button className="text-gray-400 hover:text-gray-600 p-2"><FiCornerUpLeft /></button>
                            <button className="text-gray-400 hover:text-red-500 p-2"><FiTrash2 /></button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {selectedEmail.credential && (
                            <div className="mb-4 text-xs text-gray-400 bg-gray-50 p-2 rounded border">
                                Received via: {selectedEmail.credential.email}
                            </div>
                        )}

                        <div dangerouslySetInnerHTML={{ __html: selectedEmail.body_html || selectedEmail.body_text }} className="prose max-w-none text-sm" />

                        {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                            <div className="mt-8 pt-4 border-t">
                                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><FiPaperclip /> Attachments</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedEmail.attachments.map(att => (
                                        <a
                                            key={att.id}
                                            href={`${API_BASE_URL.replace('/api', '')}/storage/${att.path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 border rounded hover:bg-gray-200 text-sm"
                                        >
                                            <span className="truncate max-w-xs">{att.filename}</span>
                                            <span className="text-xs text-gray-500">({Math.round(att.size_bytes / 1024)} KB)</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 hidden lg:flex items-center justify-center flex-col text-gray-400 bg-gray-50">
                    <FiMail className="w-16 h-16 mb-4 text-gray-300" />
                    <p>Select an email to read</p>
                </div>
            )}

            {/* Compose Modal */}
            {showCompose && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                            <h3 className="font-bold text-gray-700">New Message</h3>
                            <button onClick={() => setShowCompose(false)} className="text-gray-400 hover:text-gray-600"><FiX /></button>
                        </div>
                        <div className="p-4 space-y-3 overflow-y-auto">
                            <div className="grid grid-cols-12 gap-2 items-center">
                                <label className="col-span-1 text-sm text-gray-500 font-medium">From:</label>
                                <select
                                    className="col-span-11 p-2 border rounded text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    value={composeData.from_email}
                                    onChange={(e) => setComposeData({ ...composeData, from_email: e.target.value })}
                                >
                                    {credentials.map(c => <option key={c.id} value={c.email}>{c.email}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-12 gap-2 items-center">
                                <label className="col-span-1 text-sm text-gray-500 font-medium">To:</label>
                                <input
                                    type="email"
                                    className="col-span-11 p-2 border rounded text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="recipient@example.com"
                                    value={composeData.to}
                                    onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-12 gap-2 items-center">
                                <label className="col-span-1 text-sm text-gray-500 font-medium">Subject:</label>
                                <input
                                    type="text"
                                    className="col-span-11 p-2 border rounded text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Subject line"
                                    value={composeData.subject}
                                    onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                                />
                            </div>
                            <div className="h-64">
                                <ReactQuill
                                    theme="snow"
                                    value={composeData.body}
                                    onChange={(value) => setComposeData({ ...composeData, body: value })}
                                    className="h-full pb-10" // Padding for toolbar
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t flex justify-end gap-2 bg-gray-50 rounded-b-lg mt-auto">
                            <button onClick={() => setShowCompose(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded text-sm">Cancel</button>
                            <button
                                onClick={handleSend}
                                disabled={sending}
                                className="px-6 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                            >
                                <FiSend /> {sending ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SharedInbox;
