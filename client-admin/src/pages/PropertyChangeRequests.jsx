import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import {
    FaClipboardList, FaSearch, FaCheck, FaTimes, FaEye, FaArrowLeft, FaBuilding, FaUser, FaClock, FaCalendarAlt
} from 'react-icons/fa';

export default function PropertyChangeRequests() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/property-changes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const filteredRequests = requests.filter(req =>
        req.property?.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <FaClipboardList className="text-orange-600" /> Property Change Requests
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Review and approve changes made by vendors to live properties.</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Search */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <FaSearch className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by property or vendor..."
                        className="flex-1 outline-none text-gray-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Desktop View */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Property</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Vendor</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Request Date</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400">No pending change requests found.</td>
                                </tr>
                            ) : (
                                filteredRequests.map(req => (
                                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 font-bold">
                                                    <FaBuilding />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800">{req.property?.Name || 'Unknown Property'}</p>
                                                    <p className="text-xs text-gray-500">ID: {req.property_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs">
                                                    <FaUser />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800 text-sm">{req.vendor?.name}</p>
                                                    <p className="text-xs text-gray-400">{req.vendor?.business_name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => navigate(`/properties/${req.property_id}/changes/${req.id}`)}
                                                className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition shadow-sm hover:shadow flex items-center gap-2 ml-auto"
                                            >
                                                <FaEye /> Review
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {filteredRequests.length === 0 ? (
                        <div className="bg-white p-8 text-center text-gray-400 rounded-xl border border-dashed">
                            No pending change requests.
                        </div>
                    ) : (
                        filteredRequests.map(req => (
                            <div key={req.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                                            <FaBuilding />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-gray-900 leading-tight">{req.property?.Name || 'Unknown'}</h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: {req.property_id}</p>
                                        </div>
                                    </div>
                                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                                        {req.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                            <FaUser className="text-[8px]" /> Vendor
                                        </p>
                                        <p className="text-xs font-bold text-gray-700 truncate">{req.vendor?.business_name || req.vendor?.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                            <FaCalendarAlt className="text-[8px]" /> Date
                                        </p>
                                        <p className="text-xs font-bold text-gray-700">{new Date(req.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate(`/properties/${req.property_id}/changes/${req.id}`)}
                                    className="w-full bg-blue-600 text-white p-3 rounded-xl font-black text-sm hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                                >
                                    <FaEye /> Review Request
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
