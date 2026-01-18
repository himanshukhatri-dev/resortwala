import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { FiDollarSign, FiClock, FiCheckCircle, FiDownload, FiRefreshCw, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ConnectorReports() {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total_earned: 0, total_paid: 0, total_pending: 0, total_bookings: 0 });
    const [earnings, setEarnings] = useState({ data: [], current_page: 1, last_page: 1 });
    const [filterStatus, setFilterStatus] = useState('all');
    const [connectorId, setConnectorId] = useState(''); // For filtering specific connector
    const [connectors, setConnectors] = useState([]); // List for dropdown

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchEarnings();
    }, [filterStatus, connectorId, earnings.current_page]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [statsRes, connRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/admin/connectors/reports/stats`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE_URL}/admin/connectors`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setStats(statsRes.data);
            setConnectors(connRes.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load report data");
        }
        setLoading(false);
    };

    const fetchEarnings = async () => {
        try {
            const params = { page: earnings.current_page };
            if (filterStatus !== 'all') params.status = filterStatus;
            if (connectorId) params.connector_id = connectorId;

            const res = await axios.get(`${API_BASE_URL}/admin/connectors/reports/earnings`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            setEarnings(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    };

    const StatusBadge = ({ status }) => {
        const colors = {
            paid: 'bg-green-100 text-green-700',
            pending: 'bg-yellow-100 text-yellow-700',
            failed: 'bg-red-100 text-red-700'
        };
        return (
            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${colors[status] || 'bg-gray-100'}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="p-6 md:p-10 space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Connector Accounting</h1>
                    <p className="text-sm text-gray-500">Track commissions, payouts, and balances</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchInitialData} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium">
                        <FiRefreshCw /> Refresh
                    </button>
                    <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
                        <FiDownload /> Export
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-full text-blue-600"><FiDollarSign className="text-xl" /></div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Total Earnings</p>
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.total_earned)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="bg-green-100 p-3 rounded-full text-green-600"><FiCheckCircle className="text-xl" /></div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Total Paid</p>
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.total_paid)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="bg-yellow-100 p-3 rounded-full text-yellow-600"><FiClock className="text-xl" /></div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Pending Balance</p>
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.total_pending)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="bg-purple-100 p-3 rounded-full text-purple-600"><FiFilter className="text-xl" /></div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Total Bookings</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.total_bookings}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 bg-gray-50/50">
                    <select
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <select
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={connectorId}
                        onChange={(e) => setConnectorId(e.target.value)}
                    >
                        <option value="">All Connectors</option>
                        {connectors.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                        ))}
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Connector</th>
                                <th className="p-4">Booking Ref</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-400">Loading...</td></tr>
                            ) : earnings.data.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-400">No records found.</td></tr>
                            ) : (
                                earnings.data.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition">
                                        <td className="p-4 text-gray-600">{new Date(item.created_at).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900">{item.connector?.name || 'Unknown'}</div>
                                            <div className="text-xs text-gray-400">{item.connector?.phone}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-mono text-gray-600">{item.booking?.BookingId || 'N/A'}</div>
                                            <div className="text-xs text-gray-400">{item.booking?.GuestName}</div>
                                        </td>
                                        <td className="p-4 font-bold text-gray-800">
                                            {formatCurrency(item.amount)}
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={item.status} />
                                        </td>
                                        <td className="p-4">
                                            {item.status === 'pending' && (
                                                <button
                                                    onClick={() => toast.success("Payout Feature coming in v2")}
                                                    className="text-indigo-600 hover:text-indigo-800 font-medium text-xs bg-indigo-50 px-2 py-1 rounded"
                                                >
                                                    Mark Paid
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
                    <button
                        disabled={earnings.current_page === 1}
                        onClick={() => setEarnings(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
                        className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                    >
                        Previous
                    </button>
                    <span className="px-3 py-1 text-gray-500">Page {earnings.current_page} of {earnings.last_page}</span>
                    <button
                        disabled={earnings.current_page === earnings.last_page}
                        onClick={() => setEarnings(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
                        className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
