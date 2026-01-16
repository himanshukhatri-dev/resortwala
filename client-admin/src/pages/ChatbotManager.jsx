import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaRobot } from 'react-icons/fa';

export default function ChatbotManager() {
    const { token } = useAuth();
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        action_type: 'none',
        action_payload: '',
        priority: 0,
        is_active: true
    });

    const fetchFaqs = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/chatbot/faqs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setFaqs(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFaqs();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            action_payload: formData.action_payload ? JSON.parse(formData.action_payload) : null
        };

        const url = editingFaq
            ? `${API_BASE_URL}/admin/chatbot/faqs/${editingFaq.id}`
            : `${API_BASE_URL}/admin/chatbot/faqs`;

        const method = editingFaq ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setIsModalOpen(false);
                setEditingFaq(null);
                setFormData({
                    question: '', answer: '', action_type: 'none', action_payload: '', priority: 0, is_active: true
                });
                fetchFaqs();
            }
        } catch (error) {
            alert("Failed to save");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this FAQ?")) return;
        try {
            await fetch(`${API_BASE_URL}/admin/chatbot/faqs/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchFaqs();
        } catch (e) { }
    };

    const openEdit = (faq) => {
        setEditingFaq(faq);
        setFormData({
            question: faq.question,
            answer: faq.answer,
            action_type: faq.action_type,
            action_payload: JSON.stringify(faq.action_payload || {}),
            priority: faq.priority,
            is_active: faq.is_active
        });
        setIsModalOpen(true);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2"><FaRobot /> Chatbot Manager</h1>
                <button
                    onClick={() => { setEditingFaq(null); setIsModalOpen(true); }}
                    className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <FaPlus /> Add Question
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                        <tr>
                            <th className="p-4">Priority</th>
                            <th className="p-4">Question</th>
                            <th className="p-4">Answer Preview</th>
                            <th className="p-4">Action</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {faqs.map(faq => (
                            <tr key={faq.id} className="hover:bg-gray-50">
                                <td className="p-4 font-mono text-sm">{faq.priority}</td>
                                <td className="p-4 font-bold text-gray-900">{faq.question}</td>
                                <td className="p-4 text-gray-500 truncate max-w-[200px]">{faq.answer}</td>
                                <td className="p-4">
                                    <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold uppercase">
                                        {faq.action_type}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${faq.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {faq.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="p-4 flex gap-2">
                                    <button onClick={() => openEdit(faq)} className="text-gray-500 hover:text-black"><FaEdit /></button>
                                    <button onClick={() => handleDelete(faq.id)} className="text-red-400 hover:text-red-600"><FaTrash /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {faqs.length === 0 && !loading && (
                    <div className="p-8 text-center text-gray-400">No questions found. Add one to get started.</div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{editingFaq ? 'Edit Question' : 'New Question'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Question (Button Label)</label>
                                <input
                                    className="w-full border border-gray-200 rounded-lg p-2"
                                    value={formData.question}
                                    onChange={e => setFormData({ ...formData, question: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Answer (Bot Response)</label>
                                <textarea
                                    className="w-full border border-gray-200 rounded-lg p-2 h-24"
                                    value={formData.answer}
                                    onChange={e => setFormData({ ...formData, answer: e.target.value })}
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-1">Supports HTML tags.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1">Action Type</label>
                                    <select
                                        className="w-full border border-gray-200 rounded-lg p-2"
                                        value={formData.action_type}
                                        onChange={e => setFormData({ ...formData, action_type: e.target.value })}
                                    >
                                        <option value="none">None</option>
                                        <option value="link">Link</option>
                                        <option value="whatsapp">WhatsApp</option>
                                        <option value="form">Form (Lead)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Priority</label>
                                    <input
                                        type="number"
                                        className="w-full border border-gray-200 rounded-lg p-2"
                                        value={formData.priority}
                                        onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Action Payload (JSON)</label>
                                <input
                                    className="w-full border border-gray-200 rounded-lg p-2 font-mono text-xs"
                                    value={formData.action_payload}
                                    onChange={e => setFormData({ ...formData, action_payload: e.target.value })}
                                    placeholder='{"url": "https://..."}'
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    />
                                    <span className="text-sm font-bold">Is Active</span>
                                </label>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 py-2 rounded-lg font-bold">Cancel</button>
                                <button type="submit" className="flex-1 bg-black text-white py-2 rounded-lg font-bold">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
