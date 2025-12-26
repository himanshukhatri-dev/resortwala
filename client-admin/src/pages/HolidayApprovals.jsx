import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { toast } from 'react-hot-toast';
import { FaCheck, FaTimes, FaCalendarAlt, FaMoneyBillWave, FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function HolidayApprovals() {
    const { token } = useAuth();
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHolidays = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/admin/holidays/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHolidays(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load pending holidays");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchHolidays();
    }, [token]);

    const handleAction = async (id, action) => {
        try {
            if (!window.confirm(`Are you sure you want to ${action} this rate?`)) return;

            const endpoint = action === 'approve'
                ? `${API_BASE_URL}/admin/holidays/${id}/approve`
                : `${API_BASE_URL}/admin/holidays/${id}/reject`;

            await axios.post(endpoint, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(`Holiday rate ${action}d successfully`);
            fetchHolidays(); // Refresh list
        } catch (error) {
            console.error(error);
            toast.error(`Failed to ${action} holiday`);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link to="/dashboard" className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-gray-600">
                    <FaArrowLeft />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Holiday Rate Approvals</h1>
                    <p className="text-gray-500 text-sm">Review and approve vendor holiday pricing</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
            ) : holidays.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500 text-3xl">
                        <FaCheck />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
                    <p className="text-gray-500">No pending holiday rate approvals at the moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {holidays.map(holiday => (
                        <div key={holiday.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
                                <h3 className="font-bold text-lg text-gray-900 truncate" title={holiday.property?.Name}>
                                    {holiday.property?.Name || 'Unknown Property'}
                                </h3>
                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold uppercase">Pending</span>
                            </div>

                            <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-3 text-gray-600">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                        <FaCalendarAlt size={14} />
                                    </div>
                                    <div className="text-sm">
                                        <span className="block text-xs text-gray-400 font-bold uppercase">Date Range</span>
                                        {format(new Date(holiday.from_date), 'MMM dd, yyyy')} - {format(new Date(holiday.to_date), 'MMM dd, yyyy')}
                                    </div>
                                </div>

                                {holiday.old_rate && (
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600">
                                            <FaMoneyBillWave size={14} />
                                        </div>
                                        <div className="text-sm">
                                            <span className="block text-xs text-gray-400 font-bold uppercase">Old Rate</span>
                                            <span className="text-base font-semibold text-gray-600 line-through">₹{holiday.old_rate}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-3 text-gray-600">
                                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                                        <FaMoneyBillWave size={14} />
                                    </div>
                                    <div className="text-sm">
                                        <span className="block text-xs text-gray-400 font-bold uppercase">New Rate</span>
                                        <span className="text-lg font-bold text-gray-900">₹{holiday.base_price}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => handleAction(holiday.id, 'reject')}
                                    className="flex-1 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    <FaTimes /> Reject
                                </button>
                                <button
                                    onClick={() => handleAction(holiday.id, 'approve')}
                                    className="flex-1 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <FaCheck /> Approve
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
