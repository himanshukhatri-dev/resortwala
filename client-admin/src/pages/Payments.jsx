import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import {
    FiSearch, FiFilter, FiDownload, FiDollarSign,
    FiCheckCircle, FiClock, FiXCircle, FiCalendar
} from 'react-icons/fi';
import Loader from '../components/Loader';
import { toast } from 'react-hot-toast';

export default function Payments() {
    const { token } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => {
        fetchData();
        fetchStats();
    }, [filterStatus]);

    const fetchData = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/finance/transactions`, {
                params: {
                    search: searchTerm,
                    status: filterStatus
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            setTransactions(res.data.data || []);
        } catch (error) {
            toast.error("Failed to fetch transactions");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/finance/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (error) { }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'paid':
                return <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1 w-fit"><FiCheckCircle /> Paid</span>;
            case 'pending':
                return <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-1 w-fit"><FiClock /> Pending</span>;
            case 'failed':
                return <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100 flex items-center gap-1 w-fit"><FiXCircle /> Failed</span>;
            default:
                return <span className="bg-slate-50 text-slate-500 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100 w-fit">{status || 'N/A'}</span>;
        }
    };

    if (loading) return <Loader message="Accessing Financial Ledger..." />;

    return (
        <div className="space-y-6 pb-20">
            {/* Header & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial <span className="text-indigo-600">Overview</span></h1>
                    <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-wider">Revenue & Reconciliation Dashboard</p>
                </div>

                {stats && (
                    <>
                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <FiDollarSign size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Revenue</p>
                                <p className="text-2xl font-black text-slate-900">{formatCurrency(stats.total_revenue)}</p>
                            </div>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                <FiClock size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Pending Payments</p>
                                <p className="text-2xl font-black text-slate-900">{formatCurrency(stats.pending_amount)}</p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[300px] relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search transaction ID, booking ref, or customer..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase py-2 pl-3 pr-8 focus:ring-2 focus:ring-indigo-500"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>
            </div>

            {/* Transaction Ledger */}
            <div className="saas-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="saas-table w-full">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th>Transaction Ref</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Property</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {transactions.map((tx) => (
                                <tr key={tx.BookingId} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-4">
                                        <div className="font-bold text-slate-900 text-xs">{tx.transaction_id || 'N/A'}</div>
                                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">#{tx.booking_reference}</div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                                            <FiCalendar size={12} />
                                            {new Date(tx.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="text-xs font-bold text-slate-900">{tx.CustomerName}</div>
                                        <div className="text-[10px] text-slate-400">{tx.CustomerEmail}</div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="text-xs font-bold text-slate-700">{tx.property?.Name || 'Unknown Property'}</div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="font-black text-slate-900">{formatCurrency(tx.TotalAmount)}</div>
                                    </td>
                                    <td className="py-4 px-4">
                                        {getStatusBadge(tx.payment_status)}
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <button className="text-[10px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest">
                                            View Invoice
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {transactions.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200">
                            <FiDollarSign size={32} />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 uppercase">No Transactions Found</h3>
                        <p className="text-[10px] font-bold text-slate-400 max-w-xs mx-auto mt-1">
                            Use the search bar or adjust filters to find specific payments.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
