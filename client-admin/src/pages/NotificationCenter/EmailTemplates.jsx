import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { FiPlus, FiEdit2, FiSave, FiCode, FiEye, FiList, FiCopy, FiCheck } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function EmailTemplates() {
    const { token } = useAuth();
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        channel: 'email',
        subject: '',
        content: '',
        variables: []
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async (channelOverride = null) => {
        setLoading(true);
        const ch = channelOverride || formData.channel;
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/notifications/setup/templates?channel=${ch}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTemplates(res.data);
        } catch (error) {
            toast.error("Failed to load templates");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (tpl) => {
        setSelectedTemplate(tpl);
        setFormData({ ...tpl, variables: tpl.variables || [] });
        setIsEditing(true);
    };

    const handleCreate = () => {
        setSelectedTemplate(null);
        setFormData({
            name: '',
            channel: 'email',
            subject: '',
            content: '<html>\n<body style="font-family: sans-serif;">\n  <h1>Hello {{name}}</h1>\n  <p>Here is your message...</p>\n</body>\n</html>',
            variables: ['name']
        });
        setIsEditing(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_BASE_URL}/admin/notifications/setup/templates`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Template saved!");
            fetchTemplates();
            setIsEditing(false);
        } catch (error) {
            toast.error("Failed to save template");
        }
    };

    const insertVariable = (v) => {
        // Simple append for now. Rich editor integration is complex for MVP.
        setFormData({ ...formData, content: formData.content + `{{${v}}}` });
        toast.success(`Inserted {{${v}}}`);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
            {/* List Sidebar */}
            <div className="w-full lg:w-1/4 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-700">Templates</h3>
                        <button onClick={handleCreate} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><FiPlus /></button>
                    </div>
                    {/* Channel Tabs */}
                    <div className="flex bg-slate-200 p-1 rounded-lg">
                        {['email', 'sms', 'whatsapp'].map(ch => (
                            <button
                                key={ch}
                                onClick={() => {
                                    setFormData({ ...formData, channel: ch });
                                    fetchTemplates(ch);
                                }}
                                className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${formData.channel === ch ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {ch}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                    {templates.map(tpl => (
                        <div
                            key={tpl.id}
                            onClick={() => handleEdit(tpl)}
                            className={`p-3 rounded-xl cursor-pointer border transition-all ${selectedTemplate?.id === tpl.id ? 'border-indigo-600 bg-indigo-50' : 'border-transparent hover:bg-slate-50'}`}
                        >
                            <div className="font-bold text-xs text-slate-800">{tpl.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{tpl.subject}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                {isEditing ? (
                    <form onSubmit={handleSave} className="flex flex-col h-full">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div className="flex-1 mr-4 space-y-2">
                                <input
                                    type="text"
                                    placeholder="Template Key Name (e.g. booking_confirmed)"
                                    className="w-full bg-white px-3 py-2 rounded-lg border border-slate-200 text-sm font-black text-slate-800 placeholder:text-slate-300 outline-none focus:border-indigo-400"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="Email Subject Line"
                                    className="w-full bg-white px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 outline-none focus:border-indigo-400"
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-100 transition-all">
                                <FiSave /> Save
                            </button>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            {/* Code Editor */}
                            <div className="flex-1 flex flex-col border-r border-slate-100">
                                <div className="p-2 bg-slate-100 text-[10px] font-bold text-slate-500 uppercase flex justify-between">
                                    <span>HTML Source</span>
                                    <div className="flex gap-2">
                                        {['customer_name', 'booking_id', 'amount', 'property_name'].map(v => (
                                            <button key={v} type="button" onClick={() => insertVariable(v)} className="px-2 bg-white rounded border border-slate-200 hover:text-indigo-600 text-[9px] lowercase font-mono">
                                                {`{{${v}}}`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <textarea
                                    className="flex-1 w-full bg-slate-900 text-slate-300 font-mono text-xs p-4 resize-none outline-none leading-relaxed"
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    spellCheck="false"
                                />
                            </div>

                            {/* Live Preview */}
                            <div className="w-1/2 flex flex-col hidden lg:flex">
                                <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-100">
                                    <FiEye className="inline mr-1" /> Preview
                                </div>
                                <div className="flex-1 overflow-y-auto bg-white p-4">
                                    <iframe
                                        srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f6; }.wrapper { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }.header { background-color: #f8fafc; padding: 20px; text-align: center; border-bottom: 3px solid #3b82f6; }.logo { height: 50px; width: auto; }.tagline { color: #64748b; font-size: 12px; margin-top: 5px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; }.content { padding: 30px; }.footer { background-color: #1e293b; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px; }.footer a { color: #3b82f6; text-decoration: none; }.btn { display: inline-block; background-color: #3b82f6; color: white !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 15px; font-weight: bold; }@media only screen and (max-width: 600px) { .wrapper { margin: 0; border-radius: 0; } .content { padding: 20px; } }</style></head><body><div class="wrapper"><div class="header"><img src="${API_BASE_URL.replace('/api', '')}/resortwala-logo.png" alt="ResortWala" class="logo"><div class="tagline">Your Gateway to Fun</div></div><div class="content">${formData.content}</div><div class="footer"><p style="margin-bottom: 10px; color: #fff; font-weight: bold;">Team ResortWala</p><p><a href="#">www.resortwala.com</a> | <a href="mailto:support@resortwala.com">support@resortwala.com</a></p></div></div></body></html>`}
                                        className="w-full h-full border-none pointer-events-none"
                                        title="Preview"
                                        sandbox="allow-same-origin"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                        <FiEdit2 size={48} className="mb-4 opacity-50" />
                        <p className="font-bold">Select a template to edit or create new</p>
                    </div>
                )}
            </div>
        </div>
    );
}
