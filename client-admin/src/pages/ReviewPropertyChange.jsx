import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft, FaCheck, FaTimes, FaBuilding, FaExclamationTriangle } from 'react-icons/fa';

export default function ReviewPropertyChange() {
    const { id, requestId } = useParams(); // Using requestId from route
    const { token, showSuccess, showError } = useAuth(); // Assuming showSuccess/Error provided or I'll implement local
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchRequest();
    }, [requestId]);

    const fetchRequest = async () => {
        try {
            const baseURL = import.meta.env.VITE_API_BASE_URL || '';
            const res = await axios.get(`${baseURL}/admin/property-changes/${requestId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequest(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!window.confirm('Are you sure you want to approve and apply these changes?')) return;
        setProcessing(true);
        try {
            const baseURL = import.meta.env.VITE_API_BASE_URL || '';
            await axios.post(`${baseURL}/admin/properties/${request.property_id}/changes/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Changes approved successfully!');
            navigate('/property-changes');
        } catch (err) {
            console.error(err);
            alert('Failed to approve changes.');
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!window.confirm('Are you sure you want to REJECT these changes?')) return;
        setProcessing(true);
        try {
            const baseURL = import.meta.env.VITE_API_BASE_URL || '';
            await axios.post(`${baseURL}/admin/properties/${request.property_id}/changes/reject`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Changes rejected.');
            navigate('/property-changes');
        } catch (err) {
            console.error(err);
            alert('Failed to reject changes.');
            setProcessing(false);
        }
    };

    const renderValue = (val) => {
        if (typeof val === 'object' && val !== null) {
            return <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto max-w-sm">{JSON.stringify(val, null, 2)}</pre>;
        }
        if (typeof val === 'boolean') return val ? 'Yes' : 'No';
        return val;
    };

    if (loading) return <div className="p-8 text-center">Loading request...</div>;
    if (!request) return <div className="p-8 text-center">Request not found.</div>;

    const changes = request.changes_json || {};
    const property = request.property || {};

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-5xl mx-auto">
                <button onClick={() => navigate('/property-changes')} className="flex items-center gap-2 text-gray-500 hover:text-black mb-6 font-bold">
                    <FaArrowLeft /> Back to List
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center text-xl">
                                <FaBuilding />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{property.Name}</h1>
                                <p className="text-sm text-gray-500">Vendor: {request.vendor?.name}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Request Status</div>
                            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                {request.status}
                            </span>
                        </div>
                    </div>

                    <div className="p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            Proposed Changes
                        </h3>
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="p-4 w-1/4 font-bold text-gray-600 uppercase text-xs">Field</th>
                                        <th className="p-4 w-1/3 font-bold text-gray-600 uppercase text-xs">Current Value</th>
                                        <th className="p-4 w-1/3 font-bold text-gray-600 uppercase text-xs">New Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {Object.keys(changes).map((key) => {
                                        // Handle nested 'onboarding_data' difference if specific keys changed
                                        // For now, if key is 'onboarding_data', simply show JSON dump.
                                        // Ideally we should flatten it or show diff.

                                        return (
                                            <tr key={key} className="hover:bg-yellow-50/30 transition-colors">
                                                <td className="p-4 font-mono text-sm text-purple-600 font-bold">{key}</td>
                                                <td className="p-4 text-sm text-gray-500">
                                                    {renderValue(property[key])}
                                                </td>
                                                <td className="p-4 text-sm font-bold text-gray-800 bg-yellow-50">
                                                    {renderValue(changes[key])}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-4">
                        <button
                            onClick={handleReject}
                            disabled={processing}
                            className="px-6 py-3 rounded-xl font-bold text-red-600 bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 transition disabled:opacity-50"
                        >
                            <FaTimes className="inline mr-2" /> Reject Changes
                        </button>
                        <button
                            onClick={handleApprove}
                            disabled={processing}
                            className="px-6 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition shadow-lg hover:shadow-green-200 hover:-translate-y-0.5 disabled:opacity-50"
                        >
                            <FaCheck className="inline mr-2" /> Approve & Apply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
