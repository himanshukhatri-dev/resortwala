import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { FiPlus, FiSearch, FiEdit2, FiCheckCircle, FiXCircle, FiMoreVertical } from 'react-icons/fi';
import { createPortal } from 'react-dom';

export default function Connectors() {
    const { token } = useAuth();
    const [connectors, setConnectors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('active'); // active, inactive, all
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingConnector, setEditingConnector] = useState(null);

    useEffect(() => {
        fetchConnectors();
    }, [token, activeTab]);

    const fetchConnectors = async () => {
        setLoading(true);
        try {
            const params = { search: searchTerm };
            if (activeTab !== 'all') params.active = activeTab === 'active' ? 1 : 0;

            const res = await axios.get(`${API_BASE_URL}/admin/connectors`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            // Handle pagination if needed, assuming first page for now
            setConnectors(res.data.data || res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchConnectors();
    };

    const handleToggleStatus = async (id) => {
        try {
            await axios.put(`${API_BASE_URL}/admin/connectors/${id}/status`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchConnectors();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const openModal = (connector = null) => {
        setEditingConnector(connector);
        setIsModalOpen(true);
    };

    const saveConnector = async (formData) => {
        try {
            const url = editingConnector
                ? `${API_BASE_URL}/admin/connectors/${editingConnector.id}`
                : `${API_BASE_URL}/admin/connectors`;

            const method = editingConnector ? 'put' : 'post';

            await axios[method](url, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setIsModalOpen(false);
            fetchConnectors();
        } catch (error) {
            console.error("Save Error:", error);
            alert(error.response?.data?.message || 'Failed to save');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Connector Management</h1>
                    <p className="text-gray-500 text-sm">Manage relationship managers and commission agents</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                    <FiPlus /> Add Connector
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between">
                <div className="flex gap-2">
                    {['active', 'inactive', 'all'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${activeTab === tab
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <form onSubmit={handleSearch} className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search name or email..."
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </form>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Contact</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan="4" className="p-8 text-center text-gray-400">Loading...</td></tr>
                        ) : connectors.length === 0 ? (
                            <tr><td colSpan="4" className="p-8 text-center text-gray-400">No connectors found.</td></tr>
                        ) : (
                            connectors.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{c.name}</div>
                                        <div className="text-xs text-gray-400">ID: {c.id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-700">{c.email}</div>
                                        <div className="text-sm text-gray-500">{c.phone || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase ${c.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {c.active ? <FiCheckCircle /> : <FiXCircle />} {c.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button
                                            onClick={() => openModal(c)}
                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                                            title="Edit"
                                        >
                                            <FiEdit2 />
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(c.id)}
                                            className={`p-2 rounded ${c.active ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                                            title={c.active ? "Deactivate" : "Activate"}
                                        >
                                            {c.active ? <FiXCircle /> : <FiCheckCircle />}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && <ConnectorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={editingConnector}
                onSave={saveConnector}
            />}
        </div>
    );
}

function ConnectorModal({ isOpen, onClose, initialData, onSave }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        active: true
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                email: initialData.email || '',
                phone: initialData.phone || '',
                active: initialData.active
            });
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                        {initialData ? 'Edit Connector' : 'New Connector'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <FiXCircle size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                        <input
                            required
                            type="text"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                        <input
                            required
                            type="email"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.active}
                            onChange={e => setFormData({ ...formData, active: e.target.checked })}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active Status</label>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-bold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200"
                        >
                            Save Connector
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
