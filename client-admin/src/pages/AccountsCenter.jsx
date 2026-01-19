import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import {
    FiDollarSign, FiTrendingUp, FiTrendingDown, FiActivity,
    FiArrowRight, FiPlus, FiSearch, FiFilter, FiCalendar
} from 'react-icons/fi';
import Loader from '../components/Loader';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function AccountsCenter() {
    const { token } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [accountHistory, setAccountHistory] = useState([]);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Form for manual adjustment
    const [adjustmentForm, setAdjustmentForm] = useState({
        debit_account_id: '',
        credit_account_id: '',
        amount: '',
        description: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [accRes, sumRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/admin/intelligence/accounts`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_BASE_URL}/admin/intelligence/accounts/summary`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            setAccounts(accRes.data);
            setSummary(sumRes.data);
        } catch (error) {
            toast.error("Failed to fetch account data");
        } finally {
            setLoading(false);
        }
    };

    const fetchAccountHistory = async (accountId) => {
        setHistoryLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/intelligence/accounts/${accountId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedAccount(res.data.account);
            setAccountHistory(res.data.history.data || []);
        } catch (error) {
            toast.error("Failed to fetch history");
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleAdjustmentSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE_URL}/admin/intelligence/accounts/adjust`, adjustmentForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Transaction recorded successfully");
            setShowAdjustModal(false);
            fetchData();
            if (selectedAccount) fetchAccountHistory(selectedAccount.account_id);
            setAdjustmentForm({ debit_account_id: '', credit_account_id: '', amount: '', description: '' });
        } catch (error) {
            toast.error(error.response?.data?.error || "Adjustment failed");
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) return <Loader message="Accessing Authorized Ledger..." />;

    return (
        <div className="space-y-6 pb-20 text-left">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Accounts <span className="text-indigo-600">Center</span></h1>
                    <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-wider">Authoritative Double-Entry Financial Engine</p>
                </div>
                <button
                    onClick={() => setShowAdjustModal(true)}
                    className="saas-button-primary flex items-center gap-2"
                >
                    <FiPlus /> New Manual Entry
                </button>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <FiTrendingUp size={20} />
                            </div>
                            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full uppercase">Receivables</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor Escrow</p>
                        <p className="text-2xl font-black text-slate-900">{formatCurrency(summary.receivables)}</p>
                    </div>

                    <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                                <FiTrendingDown size={20} />
                            </div>
                            <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-2 py-1 rounded-full uppercase">Payables</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Owner Payouts</p>
                        <p className="text-2xl font-black text-slate-900">{formatCurrency(summary.payables)}</p>
                    </div>

                    <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <FiDollarSign size={20} />
                            </div>
                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full uppercase">Platform</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Revenue</p>
                        <p className="text-2xl font-black text-slate-900">{formatCurrency(summary.platform_revenue)}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Account List */}
                <div className="lg:col-span-5 h-[calc(100vh-250px)] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Entity Accounts</h3>
                    {accounts.map(acc => (
                        <div
                            key={acc.account_id}
                            onClick={() => fetchAccountHistory(acc.account_id)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedAccount?.account_id === acc.account_id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 hover:border-indigo-100'}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${acc.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{acc.entity_type}: {acc.entity_reference_id}</p>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1">ID: ACC-{acc.account_id}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-black text-sm ${acc.current_balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                                        {formatCurrency(acc.current_balance)}
                                    </p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Balance</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* History View */}
                <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl overflow-hidden flex flex-col h-[calc(100vh-250px)]">
                    {selectedAccount ? (
                        <>
                            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Transaction History</h3>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1">Showing most recent ledger entries</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-indigo-600">ACC-{selectedAccount.account_id}</p>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {historyLoading ? (
                                    <div className="h-full flex items-center justify-center"><Loader /></div>
                                ) : (
                                    <table className="w-full saas-table">
                                        <thead>
                                            <tr className="bg-slate-50/30 sticky top-0 z-10">
                                                <th>Reference</th>
                                                <th>Date</th>
                                                <th>Description</th>
                                                <th className="text-right">Debit</th>
                                                <th className="text-right">Credit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {accountHistory.map((entry, idx) => {
                                                const isDebit = entry.debit_account_id === selectedAccount.account_id;
                                                return (
                                                    <tr key={idx} className="hover:bg-slate-50/50">
                                                        <td className="py-3 px-4">
                                                            <div className="text-[10px] font-black text-slate-600 uppercase tabular-nums">
                                                                {entry.reference_type || 'Internal'}
                                                            </div>
                                                            <div className="text-[9px] text-slate-400">ID: {entry.reference_id || '-'}</div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
                                                                {new Date(entry.created_at).toLocaleDateString()}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="text-[10px] text-slate-500 leading-relaxed max-w-[150px] line-clamp-2">
                                                                {entry.description}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            {isDebit ? (
                                                                <span className="text-[10px] font-black text-red-600 tabular-nums">-{formatCurrency(entry.amount)}</span>
                                                            ) : '-'}
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            {!isDebit ? (
                                                                <span className="text-[10px] font-black text-emerald-600 tabular-nums">+{formatCurrency(entry.amount)}</span>
                                                            ) : '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {accountHistory.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="py-20 text-center text-slate-400 italic text-xs">No transactions recorded for this account.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-50">
                            <FiActivity size={48} className="text-slate-300 mb-4" />
                            <h3 className="text-lg font-black text-slate-400 uppercase">Select an Account</h3>
                            <p className="text-sm font-bold text-slate-300 mt-2">To view granular ledger entries and balance history</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Adjustment Modal */}
            <AnimatePresence>
                {showAdjustModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowAdjustModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Manual <span className="text-indigo-600">Adjustment</span></h3>
                                <p className="text-xs font-bold text-slate-400 mt-1">Record a double-entry transaction between entities.</p>
                            </div>

                            <form onSubmit={handleAdjustmentSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Debit From (Entity -)</label>
                                        <select
                                            required
                                            value={adjustmentForm.debit_account_id}
                                            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, debit_account_id: e.target.value })}
                                            className="saas-input w-full"
                                        >
                                            <option value="">Select Account</option>
                                            {accounts.map(acc => (
                                                <option key={acc.account_id} value={acc.account_id}>
                                                    {acc.entity_type}: {acc.entity_reference_id}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Credit To (Entity +)</label>
                                        <select
                                            required
                                            value={adjustmentForm.credit_account_id}
                                            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, credit_account_id: e.target.value })}
                                            className="saas-input w-full"
                                        >
                                            <option value="">Select Account</option>
                                            {accounts.map(acc => (
                                                <option key={acc.account_id} value={acc.account_id}>
                                                    {acc.entity_type}: {acc.entity_reference_id}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Transaction Amount (INR)</label>
                                    <div className="relative">
                                        <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="number"
                                            required
                                            placeholder="0.00"
                                            className="saas-input w-full pl-10"
                                            value={adjustmentForm.amount}
                                            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Memo / Description</label>
                                    <textarea
                                        required
                                        placeholder="Reason for adjustment, reconciliation reference, etc."
                                        className="saas-input w-full min-h-[100px] py-4"
                                        value={adjustmentForm.description}
                                        onChange={(e) => setAdjustmentForm({ ...adjustmentForm, description: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAdjustModal(false)}
                                        className="flex-1 px-6 py-4 rounded-2xl text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 saas-button-primary py-4"
                                    >
                                        Commit Transaction
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
