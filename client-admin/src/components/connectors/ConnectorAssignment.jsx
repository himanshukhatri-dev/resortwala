import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { FiPlus, FiTrash2, FiClock, FiAlertCircle } from 'react-icons/fi';

export default function ConnectorAssignment({ propertyId }) {
    const { token } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [connectors, setConnectors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // New Assignment State
    const [newAssignment, setNewAssignment] = useState({
        connector_id: '',
        commission_type: 'percentage', // percentage, flat
        commission_value: 0,
        effective_from: new Date().toISOString().split('T')[0],
        effective_to: ''
    });

    useEffect(() => {
        if (propertyId) {
            fetchData();
        }
    }, [propertyId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [assignRes, connRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/admin/properties/${propertyId}/connector`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_BASE_URL}/admin/connectors?active=1`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            setAssignments(assignRes.data);
            setConnectors(connRes.data.data || connRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE_URL}/admin/properties/${propertyId}/connector`, newAssignment, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowForm(false);
            setNewAssignment({
                connector_id: '',
                commission_type: 'percentage',
                commission_value: 0,
                effective_from: new Date().toISOString().split('T')[0],
                effective_to: ''
            });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to assign');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Connector Assignments</h3>
                        <p className="text-sm text-gray-500">Manage sales agents and commissions for this property.</p>
                    </div>
                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-bold text-sm"
                        >
                            <FiPlus /> Assign New
                        </button>
                    )}
                </div>

                {showForm && (
                    <div className="bg-gray-50 p-6 rounded-xl border border-indigo-100 mb-6 relative">
                        <button
                            onClick={() => setShowForm(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <FiAlertCircle className="rotate-45" /> Cancel
                        </button>
                        <h4 className="font-bold text-indigo-900 mb-4">New Assignment</h4>
                        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Connector</label>
                                <select
                                    className="w-full p-2 border rounded-lg"
                                    required
                                    value={newAssignment.connector_id}
                                    onChange={e => setNewAssignment({ ...newAssignment, connector_id: e.target.value })}
                                >
                                    <option value="">Select Connector...</option>
                                    {connectors.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Type</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={newAssignment.commission_type}
                                        onChange={e => setNewAssignment({ ...newAssignment, commission_type: e.target.value })}
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="flat">Flat Amount (₹)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Value</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full p-2 border rounded-lg"
                                        required
                                        value={newAssignment.commission_value}
                                        onChange={e => setNewAssignment({ ...newAssignment, commission_value: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Effective From</label>
                                <input
                                    type="date"
                                    className="w-full p-2 border rounded-lg"
                                    required
                                    value={newAssignment.effective_from}
                                    onChange={e => setNewAssignment({ ...newAssignment, effective_from: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Effective To (Optional)</label>
                                <input
                                    type="date"
                                    className="w-full p-2 border rounded-lg"
                                    value={newAssignment.effective_to}
                                    onChange={e => setNewAssignment({ ...newAssignment, effective_to: e.target.value })}
                                />
                            </div>

                            <div className="md:col-span-2 pt-2">
                                <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 w-full md:w-auto">
                                    Save Assignment
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="overflow-hidden border rounded-lg">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-3">Connector</th>
                                <th className="p-3">Commission</th>
                                <th className="p-3">Effective Date</th>
                                <th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? <tr><td colSpan="4" className="p-4 text-center">Loading...</td></tr> : assignments.length === 0 ? (
                                <tr><td colSpan="4" className="p-8 text-center text-gray-400">No connectors assigned yet.</td></tr>
                            ) : (
                                assignments.map((a, idx) => {
                                    const isCurrent = new Date(a.pivot.effective_from) <= new Date() && (!a.pivot.effective_to || new Date(a.pivot.effective_to) >= new Date());
                                    return (
                                        <tr key={idx} className={isCurrent ? "bg-green-50/50" : "opacity-60"}>
                                            <td className="p-3 font-medium">
                                                {a.name}
                                                <div className="text-xs text-gray-400">{a.email}</div>
                                            </td>
                                            <td className="p-3 font-mono text-indigo-600 font-bold">
                                                {a.pivot.commission_type === 'flat' ? `₹${a.pivot.commission_value}` : `${a.pivot.commission_value}%`}
                                            </td>
                                            <td className="p-3 text-xs">
                                                <div className="flex items-center gap-1"><FiClock /> {a.pivot.effective_from}</div>
                                                {a.pivot.effective_to && <div className="text-gray-400">to {a.pivot.effective_to}</div>}
                                            </td>
                                            <td className="p-3">
                                                {isCurrent ? (
                                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Active</span>
                                                ) : (
                                                    <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Inactive</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
