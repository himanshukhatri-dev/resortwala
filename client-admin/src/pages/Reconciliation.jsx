import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { FiUploadCloud, FiCheckCircle, FiAlertTriangle, FiFileText, FiRefreshCw, FiLink, FiXCircle } from 'react-icons/fi';
import Loader from '../components/Loader';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Reconciliation() {
    const { token } = useAuth();
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [linkingRecord, setLinkingRecord] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        fetchBatches();
    }, []);

    const fetchBatches = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/finance/reconciliation`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBatches(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBatchDetails = async (id) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/finance/reconciliation/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedBatch(res.data);
        } catch (error) {
            toast.error("Failed to load batch details");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/admin/finance/reconciliation/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            toast.success("Statement processed successfully");
            fetchBatches();
            fetchBatchDetails(res.data.batch_id);
        } catch (error) {
            toast.error("Upload failed: " + (error.response?.data?.error || error.message));
        } finally {
            setUploading(false);
        }
    };

    const handleStatusUpdate = async (recordId, status) => {
        try {
            await axios.put(`${API_BASE_URL}/admin/finance/reconciliation/record/${recordId}`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Status updated");
            fetchBatchDetails(selectedBatch.batch.id);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const searchBookings = async (q) => {
        if (!q || q.length < 2) return;
        setSearching(true);
        try {
            // Reusing admin bookings endpoint with a filter if possible, 
            // but for simple search we'll fetch and filter or use a dedicated endpoint
            const res = await axios.get(`${API_BASE_URL}/admin/bookings?search=${q}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Handle if index returns all vs searched
            const filtered = res.data.filter(b =>
                b.booking_reference?.toLowerCase().includes(q.toLowerCase()) ||
                b.CustomerName?.toLowerCase().includes(q.toLowerCase())
            );
            setSearchResults(filtered);
        } catch (error) {
            console.error(error);
        } finally {
            setSearching(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) searchBookings(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const performManualLink = async (bookingId) => {
        try {
            await axios.post(`${API_BASE_URL}/admin/finance/reconciliation/link`, {
                record_id: linkingRecord.id,
                booking_id: bookingId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Linked successfully");
            setLinkingRecord(null);
            fetchBatchDetails(selectedBatch.batch.id);
        } catch (error) {
            toast.error(error.response?.data?.message || "Linking failed");
        }
    };

    if (loading && batches.length === 0) return <Loader message="Loading Financial Data..." />;

    return (
        <div className="space-y-6 pb-20 text-left">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reconciliation <span className="text-indigo-600">Engine</span></h1>
                    <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-wider">Bank Statement vs System Ledger</p>
                </div>
                <div>
                    <input
                        type="file"
                        id="statement-upload"
                        className="hidden"
                        accept=".csv,.txt"
                        onChange={handleFileUpload}
                    />
                    <label
                        htmlFor="statement-upload"
                        className={`saas-button-primary flex items-center gap-2 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        {uploading ? <FiRefreshCw className="animate-spin" /> : <FiUploadCloud />}
                        {uploading ? 'Processing...' : 'Upload Bank Statement'}
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar: Batches */}
                <div className="saas-card p-4 h-[calc(100vh-200px)] overflow-y-auto">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Statement History</h3>
                    <div className="space-y-3">
                        {batches.map(batch => (
                            <div
                                key={batch.id}
                                onClick={() => fetchBatchDetails(batch.id)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedBatch?.batch?.id === batch.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 hover:border-indigo-100'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-slate-700 text-xs truncate max-w-[120px]">{batch.filename}</span>
                                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${batch.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{batch.status}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold mb-2">
                                    <FiFileText /> {new Date(batch.created_at).toLocaleDateString()}
                                </div>
                                {batch.status === 'completed' && (
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <div className="bg-emerald-50 rounded p-1 text-center">
                                            <div className="text-emerald-600 font-black text-xs">{batch.matched_records}</div>
                                            <div className="text-[8px] text-emerald-400 font-bold uppercase">Matched</div>
                                        </div>
                                        <div className="bg-red-50 rounded p-1 text-center">
                                            <div className="text-red-600 font-black text-xs">{batch.mismatched_records}</div>
                                            <div className="text-[8px] text-red-400 font-bold uppercase">Diff</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {batches.length === 0 && (
                            <div className="p-8 text-center text-slate-400 italic text-xs">No statements uploaded yet.</div>
                        )}
                    </div>
                </div>

                {/* Main: Details */}
                <div className="lg:col-span-3">
                    {selectedBatch ? (
                        <div className="space-y-6">
                            {/* Summary Card */}
                            <div className="saas-card p-6 flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-black text-slate-900">{selectedBatch.batch.filename}</h2>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                            Total: {selectedBatch.batch.total_records}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                            Matched: {selectedBatch.batch.matched_records}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-red-600">
                                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                            Issues: {selectedBatch.batch.mismatched_records + (selectedBatch.batch.total_records - selectedBatch.batch.matched_records - selectedBatch.batch.mismatched_records)}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <button className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Download Report</button>
                                </div>
                            </div>

                            {/* Records Table */}
                            <div className="saas-card overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="saas-table w-full">
                                        <thead>
                                            <tr>
                                                <th>Status</th>
                                                <th>Bank Txn ID</th>
                                                <th>Date</th>
                                                <th className="text-right">Bank Amount</th>
                                                <th className="text-right">System Amount</th>
                                                <th className="text-right">Diff</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {selectedBatch.records.map(record => (
                                                <tr key={record.id} className="hover:bg-slate-50/50">
                                                    <td className="py-4 px-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest 
                                                            ${record.status === 'matched' ? 'bg-emerald-50 text-emerald-600' :
                                                                record.status === 'mismatch' ? 'bg-red-50 text-red-600' :
                                                                    'bg-amber-50 text-amber-600'}`}>
                                                            {record.status === 'matched' ? <FiCheckCircle /> : <FiAlertTriangle />}
                                                            {record.status.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 font-mono text-xs text-slate-600">{record.transaction_id || '-'}</td>
                                                    <td className="py-4 px-4 text-xs font-bold text-slate-500">{record.transaction_date ? new Date(record.transaction_date).toLocaleDateString() : '-'}</td>
                                                    <td className="py-4 px-4 text-right font-black text-slate-900">₹{record.amount_bank}</td>
                                                    <td className="py-4 px-4 text-right font-bold text-slate-500">{record.amount_system ? `₹${record.amount_system}` : '-'}</td>
                                                    <td className={`py-4 px-4 text-right font-bold text-xs ${Math.abs(record.amount_bank - (record.amount_system || 0)) > 1 ? 'text-red-500' : 'text-slate-300'}`}>
                                                        {Math.abs(record.amount_bank - (record.amount_system || 0)) > 1 ? `₹${(record.amount_bank - (record.amount_system || 0)).toFixed(2)}` : '-'}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-2">
                                                            {record.booking ? (
                                                                <div className="text-xs font-bold text-indigo-600">#{record.booking.booking_reference || record.booking_id}</div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => setLinkingRecord(record)}
                                                                    className="flex items-center gap-1 text-[10px] font-black text-indigo-500 uppercase tracking-tighter hover:bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 transition-all"
                                                                >
                                                                    <FiLink /> Link
                                                                </button>
                                                            )}
                                                            {record.status !== 'ignored' && (
                                                                <button
                                                                    onClick={() => handleStatusUpdate(record.id, 'ignored')}
                                                                    className="p-1.5 text-slate-300 hover:text-red-400 transition-colors"
                                                                    title="Ignore record"
                                                                >
                                                                    <FiXCircle />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-50">
                            <FiUploadCloud size={48} className="text-slate-300 mb-4" />
                            <h3 className="text-lg font-black text-slate-400">Select or Upload a Statement</h3>
                            <p className="text-sm font-bold text-slate-300 mt-2">Process bank CSVs to start reconciliation</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Linking Modal */}
            <AnimatePresence>
                {linkingRecord && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setLinkingRecord(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">Manual <span className="text-indigo-600">Linking</span></h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Txn: {linkingRecord.transaction_id || 'Unknown'}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-black text-slate-900">₹{linkingRecord.amount_bank}</div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase">{linkingRecord.transaction_date}</div>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="relative mb-6">
                                    <input
                                        type="text"
                                        placeholder="Search by Booking Ref or Customer Name..."
                                        className="saas-input w-full pl-4 pr-10"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                    {searching && <FiRefreshCw className="absolute right-3 top-3.5 animate-spin text-slate-400" />}
                                </div>

                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {searchResults.map(b => (
                                        <div
                                            key={b.BookingId}
                                            onClick={() => performManualLink(b.BookingId)}
                                            className="group p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 cursor-pointer transition-all flex justify-between items-center"
                                        >
                                            <div>
                                                <div className="text-xs font-black text-slate-900 group-hover:text-indigo-700 transition-colors">#{b.booking_reference}</div>
                                                <div className="text-[10px] font-bold text-slate-400 mt-0.5">{b.CustomerName} • {new Date(b.CheckInDate).toLocaleDateString()}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-black text-slate-900">₹{b.TotalAmount}</div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase">{b.Status}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                                        <div className="text-center py-10 text-slate-400 italic text-sm">No bookings found for "{searchQuery}"</div>
                                    )}
                                    {searchQuery.length < 2 && (
                                        <div className="text-center py-10 text-slate-400 font-bold text-sm">Type to search bookings...</div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                <button onClick={() => setLinkingRecord(null)} className="px-6 py-2.5 rounded-xl text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
