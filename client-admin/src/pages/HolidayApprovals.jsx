import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { toast } from 'react-hot-toast';
import { FaCheck, FaTimes, FaCalendarAlt, FaMoneyBillWave, FaArrowLeft, FaFilter, FaSearch, FaHistory, FaExclamationTriangle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function HolidayApprovals() {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'all'
    const [pendingHolidays, setPendingHolidays] = useState([]);
    const [allHolidays, setAllHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Bulk Action State
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);

    // Modal State
    const [modalConfig, setModalConfig] = useState(null); // { type: 'approve' | 'reject', holiday: object, isBulk: boolean }
    const [rejectReason, setRejectReason] = useState('');

    const fetchPending = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/admin/holidays/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingHolidays(res.data);
            setSelectedIds([]); // Reset selection on refresh
        } catch (error) {
            console.error(error);
            toast.error("Failed to load pending holidays");
        } finally {
            setLoading(false);
        }
    };

    const fetchAll = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/admin/holidays`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAllHolidays(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load all holidays");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            if (activeTab === 'pending') fetchPending();
            else fetchAll();
        }
    }, [token, activeTab]);

    // Selection Handlers
    const toggleSelection = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === pendingHolidays.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(pendingHolidays.map(h => h.id));
        }
    };

    const openModal = (type, holiday = null, isBulk = false) => {
        setModalConfig({ type, holiday, isBulk });
        setRejectReason('');
    };

    const closeModal = () => {
        setModalConfig(null);
        setRejectReason('');
    };

    const handleConfirmAction = async () => {
        if (!modalConfig) return;

        const { type, holiday, isBulk } = modalConfig;

        if (type === 'reject' && !rejectReason.trim()) {
            toast.error("Please provide a rejection reason");
            return;
        }

        try {
            closeModal();

            if (isBulk) {
                setIsBulkProcessing(true);
                const endpoint = `${API_BASE_URL}/admin/holidays/bulk-action`;
                const payload = {
                    ids: selectedIds,
                    action: type,
                    reason: type === 'reject' ? rejectReason : null
                };

                const res = await axios.post(endpoint, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                toast.success(res.data.message || `Bulk ${type} successful`);
                fetchPending();
            } else {
                setProcessingId(holiday.id);
                const id = holiday.id;
                const endpoint = type === 'approve'
                    ? `${API_BASE_URL}/admin/holidays/${id}/approve`
                    : `${API_BASE_URL}/admin/holidays/${id}/reject`;

                const payload = type === 'reject' ? { reason: rejectReason } : {};

                await axios.post(endpoint, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                toast.success(`Holiday rate ${type}d successfully`);

                // Refresh current view
                if (activeTab === 'pending') fetchPending();
                else fetchAll();
            }

        } catch (error) {
            console.error(error);
            toast.error(`Failed to ${type} holiday`);
        } finally {
            setProcessingId(null);
            setIsBulkProcessing(false);
        }
    };

    const filteredAllHolidays = allHolidays.filter(h =>
        (h.property?.Name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto relative pb-24">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link to="/dashboard" className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-gray-600">
                        <FaArrowLeft />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Holiday Management</h1>
                        <p className="text-gray-500 text-sm">Review, approve, and track holiday pricing</p>
                    </div>
                </div>
            </div>

            {/* TABS */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-3 px-4 font-bold text-sm transition-colors relative ${activeTab === 'pending' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Pending Approvals
                    {pendingHolidays.length > 0 && <span className="ml-2 bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full">{pendingHolidays.length}</span>}
                    {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('all')}
                    className={`pb-3 px-4 font-bold text-sm transition-colors relative ${activeTab === 'all' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    All Holiday Rates
                    {activeTab === 'all' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
            ) : (
                <>
                    {/* PENDING VIEW */}
                    {activeTab === 'pending' && (
                        <>
                            {pendingHolidays.length > 0 && (
                                <div className="mb-4 flex items-center justify-between bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === pendingHolidays.length && pendingHolidays.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-blue-900">
                                            {selectedIds.length === 0 ? 'Select All' : `${selectedIds.length} Selected`}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {pendingHolidays.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500 text-3xl">
                                        <FaCheck />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
                                    <p className="text-gray-500">No pending holiday rate approvals at the moment.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {pendingHolidays.map(holiday => (
                                        <div key={holiday.id} className={`bg-white rounded-2xl p-6 shadow-sm border transition-all relative group ${selectedIds.includes(holiday.id) ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-100 hover:shadow-lg'}`}>

                                            {/* Checkbox Overlay */}
                                            <div className="absolute top-4 right-4 z-10">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(holiday.id)}
                                                    onChange={() => toggleSelection(holiday.id)}
                                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shadow-sm"
                                                />
                                            </div>

                                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50 pr-8">
                                                <h3 className="font-bold text-lg text-gray-900 truncate" title={holiday.property?.Name}>
                                                    {holiday.property?.Name || 'Unknown Property'}
                                                </h3>
                                            </div>
                                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold uppercase absolute top-4 left-6">Pending</span>


                                            <div className="space-y-3 flex-1 mt-2">
                                                <div className="flex items-center gap-3 text-gray-600">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                                        <FaCalendarAlt size={14} />
                                                    </div>
                                                    <div className="text-sm">
                                                        <span className="block text-xs text-gray-400 font-bold uppercase">Date Range</span>
                                                        {format(new Date(holiday.from_date), 'MMM dd, yyyy')} - {format(new Date(holiday.to_date), 'MMM dd, yyyy')}
                                                    </div>
                                                </div>

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
                                                    onClick={() => openModal('reject', holiday)}
                                                    disabled={processingId === holiday.id || isBulkProcessing}
                                                    className="flex-1 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {processingId === holiday.id ? <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full" /> : <><FaTimes /> Reject</>}
                                                </button>
                                                <button
                                                    onClick={() => openModal('approve', holiday)}
                                                    disabled={processingId === holiday.id || isBulkProcessing}
                                                    className="flex-1 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {processingId === holiday.id ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <><FaCheck /> Approve</>}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* ALL HOLIDAYS VIEW */}
                    {activeTab === 'all' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Toolbar */}
                            <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
                                <div className="relative flex-1 max-w-sm">
                                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search Property or Holiday..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                                    />
                                </div>
                                <div className="text-xs text-gray-500 font-medium">
                                    Showing {filteredAllHolidays.length} Rates
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-600">
                                    <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4">Property</th>
                                            <th className="px-6 py-4">Dates</th>
                                            <th className="px-6 py-4">Rate</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredAllHolidays.map((holiday) => (
                                            <tr key={holiday.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-gray-900">
                                                    {holiday.property?.Name}
                                                    <div className="text-xs font-normal text-gray-400 mt-0.5">{holiday.name || 'Holiday'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="bg-blue-50 text-blue-600 p-1.5 rounded"><FaCalendarAlt size={10} /></div>
                                                        <span>{format(new Date(holiday.from_date), 'MMM dd')} - {format(new Date(holiday.to_date), 'MMM dd, yyyy')}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-mono font-medium text-gray-900">
                                                    ₹{holiday.base_price}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {holiday.approved === 1 || holiday.approved === true ? (
                                                        <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold">
                                                            <FaCheck size={10} /> Approved
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-bold">
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => openModal('reject', holiday)}
                                                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors text-xs font-bold flex items-center gap-1 ml-auto"
                                                        title="Delete / Reject"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredAllHolidays.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-gray-400 bg-gray-50/30">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <FaSearch size={24} className="opacity-20" />
                                                        <p>No holiday rates found matching your search.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ACTION MODAL */}
            {modalConfig && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={closeModal} />
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative z-10 p-6 animate-in fade-in zoom-in duration-200">
                        <div className="text-center mb-6">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${modalConfig.type === 'approve' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {modalConfig.type === 'approve' ? <FaCheck size={32} /> : <FaExclamationTriangle size={32} />}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">
                                {modalConfig.isBulk
                                    ? `Bulk ${modalConfig.type === 'approve' ? 'Approve' : 'Reject'}`
                                    : (modalConfig.type === 'approve' ? 'Confirm Approval' : 'Reject Holiday Rate')
                                }
                            </h3>
                            <p className="text-gray-500 text-sm mt-1">
                                {modalConfig.isBulk
                                    ? `You are about to ${modalConfig.type} ${selectedIds.length} holiday rates.`
                                    : (modalConfig.type === 'approve'
                                        ? `Are you sure you want to approve this rate for ${modalConfig.holiday.property?.Name}?`
                                        : `Please provide a reason for rejecting this rate. This will be sent to the vendor.`)
                                }
                            </p>
                        </div>

                        {modalConfig.type === 'reject' && (
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Rejection Reason {modalConfig.isBulk && '(Applied to All)'}</label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="e.g. Rate is too high compared to base price..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm min-h-[100px]"
                                    autoFocus
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={closeModal}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmAction}
                                className={`flex-1 py-3 font-bold rounded-xl text-white shadow-lg transition-all ${modalConfig.type === 'approve'
                                        ? 'bg-green-600 hover:bg-green-700 shadow-green-200'
                                        : 'bg-red-600 hover:bg-red-700 shadow-red-200'
                                    }`}
                            >
                                {modalConfig.isBulk
                                    ? `Confirm ${modalConfig.type === 'approve' ? 'Approve' : 'Reject'}`
                                    : (modalConfig.type === 'approve' ? 'Confirm Approve' : 'Reject Rate')
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FLOATING ACTION BAR FOR BULK */}
            {selectedIds.length > 0 && activeTab === 'pending' && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-40 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <span className="font-bold whitespace-nowrap">{selectedIds.length} Selected</span>
                    <div className="h-6 w-px bg-white/20"></div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => openModal('reject', null, true)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                        >
                            <FaTimes /> Reject All
                        </button>
                        <button
                            onClick={() => openModal('approve', null, true)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                        >
                            <FaCheck /> Approve All
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
