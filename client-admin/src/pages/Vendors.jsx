import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { useModal } from '../context/ModalContext';
import { API_BASE_URL } from '../config';
import { FaCheck, FaTimes, FaUser, FaPhone, FaEnvelope, FaBuilding, FaSearch, FaFilter, FaTrash, FaUserTie, FaWhatsapp } from 'react-icons/fa';

export default function Vendors() {
    const { token } = useAuth();
    const { showConfirm, showSuccess, showError } = useModal();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [filter, setFilter] = useState('all'); // all, approved, pending
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/vendors`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVendors(response.data);
        } catch (error) {
            console.error('Error fetching vendors:', error);
            showError('Error', 'Failed to fetch vendors');
        } finally {
            setLoading(false);
        }
    };

    // ... (Existing imports and code)

    const [selectedVendor, setSelectedVendor] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Triggered by "Approve" button or "View"
    const openApprovalModal = (vendor) => {
        setSelectedVendor(vendor);
        setShowDetailModal(true);
    };

    const confirmApprove = async () => {
        if (!selectedVendor) return;

        setActionLoading(true);
        try {
            console.log('Sending approval request for:', selectedVendor.id);
            await axios.post(`${API_BASE_URL}/admin/vendors/${selectedVendor.id}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Approval success');

            // Update local state
            setVendors(vendors.map(v => v.id === selectedVendor.id ? { ...v, is_approved: 1 } : v));
            showSuccess('Approved', 'Vendor approved successfully');
            setShowDetailModal(false);
            setSelectedVendor(null);
        } catch (error) {
            console.error('Error approving vendor:', error);
            showError('Error', 'Failed to approve vendor: ' + (error.response?.data?.message || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (id) => {
        const confirmed = await showConfirm(
            'Reject Vendor',
            'Are you sure you want to reject this vendor? This will delete their account permanently.',
            'Reject & Delete',
            'Cancel',
            'danger'
        );

        if (!confirmed) return;

        setActionLoading(true);
        try {
            await axios.delete(`${API_BASE_URL}/admin/vendors/${id}/reject`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVendors(vendors.filter(v => v.id !== id));
            showSuccess('Rejected', 'Vendor rejected/deleted successfully');
        } catch (error) {
            console.error('Error rejecting vendor:', error);
            showError('Deletion Failed', error.response?.data?.message || 'Failed to reject vendor');
        } finally {
            setActionLoading(false);
        }
    };

    const filteredVendors = vendors.filter(vendor => {
        const matchesFilter =
            filter === 'all' ? true :
                filter === 'approved' ? (vendor.is_approved === 1 || vendor.is_approved === true) :
                    filter === 'pending' ? (vendor.is_approved === 0 || vendor.is_approved === false) : true;

        const matchesSearch =
            vendor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vendor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vendor.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vendor.phone?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    if (loading) return <Loader message="Loading Vendors..." />;

    return (
        <div className="min-h-screen bg-gray-50 p-2 md:p-6">
            <div className="w-full space-y-6">

                {/* Header Stats / Title */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Vendors</h1>
                        <p className="text-gray-500 mt-1">Manage vendor accounts and approvals</p>
                    </div>
                    {/* ... stats ... */}
                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex gap-4 text-sm font-medium w-full md:w-auto justify-between md:justify-start">
                        <div className="text-center">
                            <span className="block text-xl font-bold text-gray-800">{vendors.length}</span>
                            <span className="text-gray-500">Total</span>
                        </div>
                        <div className="w-px bg-gray-200"></div>
                        <div className="text-center">
                            <span className="block text-xl font-bold text-green-600">{vendors.filter(v => v.is_approved).length}</span>
                            <span className="text-gray-500">Approved</span>
                        </div>
                        <div className="w-px bg-gray-200"></div>
                        <div className="text-center">
                            <span className="block text-xl font-bold text-amber-500">{vendors.filter(v => !v.is_approved).length}</span>
                            <span className="text-gray-500">Pending</span>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-10">

                    {/* Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
                        {['all', 'pending', 'approved'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all ${filter === f
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    } capitalize`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-96">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search vendors..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 md:overflow-hidden">
                    {filteredVendors.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <FaUserTie className="mx-auto text-4xl text-gray-300 mb-3" />
                            <p>No vendors found matching your criteria.</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            <th className="px-4 py-3">Vendor</th>
                                            <th className="px-4 py-3">Contact</th>
                                            <th className="px-4 py-3">Business</th>
                                            <th className="px-4 py-3 text-center">Status</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredVendors.map(vendor => (
                                            <tr key={vendor.id} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-200 shrink-0">
                                                            {vendor.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="font-bold text-gray-800 text-sm truncate max-w-[150px]" title={vendor.name}>{vendor.name}</h3>
                                                            <div className="text-xs text-gray-500 mt-0.5">ID: {vendor.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-sm text-gray-700" title={vendor.email}>
                                                            <FaEnvelope className="text-gray-300 text-xs shrink-0" />
                                                            <span className="truncate max-w-[180px]">{vendor.email}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                                            <FaPhone className="text-gray-300 text-xs shrink-0" />
                                                            <span className="truncate">{vendor.phone || 'N/A'}</span>
                                                            {vendor.phone && (
                                                                <a
                                                                    href={`https://wa.me/${vendor.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${vendor.name}, I am writing to you from ResortWala Admin regarding your account. \n\nMy query is: `)}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-green-500 hover:text-green-600 transition-colors ml-1 p-1 hover:bg-green-50 rounded"
                                                                    title="Chat on WhatsApp"
                                                                >
                                                                    <FaWhatsapp size={14} />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-start gap-2">
                                                        <FaBuilding className="text-gray-300 mt-1 shrink-0" />
                                                        <div className="min-w-0">
                                                            <div className="font-medium text-gray-800 text-sm truncate max-w-[150px]" title={vendor.business_name}>{vendor.business_name || 'N/A'}</div>
                                                            <div className="text-xs text-gray-500">{vendor.vendor_type || 'Vendor'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${vendor.is_approved
                                                        ? 'bg-green-50 text-green-700 border-green-100'
                                                        : 'bg-amber-50 text-amber-700 border-amber-100'
                                                        }`}>
                                                        {vendor.is_approved ? <FaCheck className="text-[10px]" /> : <FaFilter className="text-[10px]" />}
                                                        {vendor.is_approved ? 'Approved' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => openApprovalModal(vendor)}
                                                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap shadow-sm active:scale-95 ${vendor.is_approved
                                                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                : 'bg-green-600 text-white hover:bg-green-700'}`}
                                                            title={vendor.is_approved ? "View Details" : "Review & Approve"}
                                                        >
                                                            {vendor.is_approved ? 'View Details' : 'Review & Approve'}
                                                        </button>

                                                        <button
                                                            onClick={() => handleReject(vendor.id)}
                                                            className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Delete Vendor"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden grid grid-cols-1 gap-4 p-4 bg-gray-50">
                                {filteredVendors.map(vendor => (
                                    <div key={vendor.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-base border border-blue-200">
                                                    {vendor.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-800 text-sm">{vendor.name}</h3>
                                                    <div className="text-xs text-gray-500">ID: {vendor.id}</div>
                                                </div>
                                            </div>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${vendor.is_approved
                                                ? 'bg-green-50 text-green-700 border-green-100'
                                                : 'bg-amber-50 text-amber-700 border-amber-100'
                                                }`}>
                                                {vendor.is_approved ? 'Approved' : 'Pending'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2 text-sm border-t border-b border-gray-50 py-3">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <FaEnvelope className="text-gray-300 text-xs w-4" />
                                                <span className="truncate">{vendor.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <FaPhone className="text-gray-300 text-xs w-4" />
                                                <span>{vendor.phone || 'N/A'}</span>
                                                {vendor.phone && (
                                                    <a
                                                        href={`https://wa.me/${vendor.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${vendor.name}, I am writing to you from ResortWala Admin regarding your account. \n\nMy query is: `)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-green-500 hover:text-green-600 transition-colors ml-auto p-2 bg-green-50 rounded-lg"
                                                    >
                                                        <FaWhatsapp size={18} />
                                                    </a>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <FaBuilding className="text-gray-300 text-xs w-4" />
                                                <span>{vendor.business_name || 'N/A'}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openApprovalModal(vendor)}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-all"
                                            >
                                                {vendor.is_approved ? 'View Details' : 'Review & Approve'}
                                            </button>

                                            <button
                                                onClick={() => handleReject(vendor.id)}
                                                className={`flex items-center justify-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${!vendor.is_approved ? 'flex-1 border-red-200 text-red-600 bg-red-50' : 'w-full border-gray-200 text-gray-600 bg-gray-50'
                                                    }`}
                                            >
                                                <FaTrash /> {!vendor.is_approved ? 'Reject' : 'Delete'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Vendor Details Modal */}
            {showDetailModal && selectedVendor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">Vendor Details</h3>
                            <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-black transition-colors">
                                <FaTimes />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Profile Header */}
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl border border-blue-200">
                                    {selectedVendor.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{selectedVendor.name}</h2>
                                    <p className="text-sm text-gray-500">Member since {new Date(selectedVendor.created_at).toLocaleDateString()}</p>
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${selectedVendor.is_approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {selectedVendor.is_approved ? 'Approved' : 'Pending Approval'}
                                    </span>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Email</label>
                                    <p className="font-medium text-gray-800 break-all">{selectedVendor.email}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Phone</label>
                                    <p className="font-medium text-gray-800">{selectedVendor.phone || 'N/A'}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Business Name</label>
                                    <p className="font-medium text-gray-800">{selectedVendor.business_name || 'N/A'}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Vendor Type</label>
                                    <p className="font-medium text-gray-800">{selectedVendor.vendor_type || 'N/A'}</p>
                                </div>
                            </div>

                            {!selectedVendor.is_approved && (
                                <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg text-sm text-amber-800">
                                    <p><strong>Note:</strong> Approving this vendor will grant them access to the Vendor Dashboard and allow them to list properties.</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                            >
                                Close
                            </button>
                            {!selectedVendor.is_approved && (
                                <button
                                    onClick={confirmApprove}
                                    disabled={actionLoading}
                                    className="px-5 py-2.5 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-green-200 transition-all flex items-center gap-2"
                                >
                                    {actionLoading ? 'Approving...' : <><FaCheck /> Approve Vendor</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
