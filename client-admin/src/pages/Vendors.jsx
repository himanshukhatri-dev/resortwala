import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { useModal } from '../context/ModalContext';
import { API_BASE_URL } from '../config';
import { FaCheck, FaTimes, FaUser, FaPhone, FaEnvelope, FaBuilding, FaSearch, FaFilter, FaTrash, FaUserTie } from 'react-icons/fa';

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

    const handleApprove = async (id) => {
        const confirmed = await showConfirm(
            'Approve Vendor',
            'Are you sure you want to approve this vendor? They will be allowed to log in and add properties.',
            'Approve Vendor',
            'Cancel',
            'success'
        );

        if (!confirmed) return;

        setActionLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/admin/vendors/${id}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state: is_approved = 1
            setVendors(vendors.map(v => v.id === id ? { ...v, is_approved: 1 } : v));
            showSuccess('Approved', 'Vendor approved successfully');
        } catch (error) {
            console.error('Error approving vendor:', error);
            showError('Error', 'Failed to approve vendor');
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
            showError('Error', 'Failed to reject vendor');
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
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Stats / Title */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Vendors</h1>
                        <p className="text-gray-500 mt-1">Manage vendor accounts and approvals</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex gap-4 text-sm font-medium">
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row gap-4 justify-between items-center">

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
                            placeholder="Search vendors, email, phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {filteredVendors.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <FaUserTie className="mx-auto text-4xl text-gray-300 mb-3" />
                            <p>No vendors found matching your criteria.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="px-6 py-4">Vendor Profile</th>
                                        <th className="px-6 py-4">Contact Info</th>
                                        <th className="px-6 py-4">Business Details</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredVendors.map(vendor => (
                                        <tr key={vendor.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-200">
                                                        {vendor.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-800">{vendor.name}</h3>
                                                        <div className="text-xs text-gray-500 mt-0.5">ID: {vendor.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <FaEnvelope className="text-gray-300 text-xs" />
                                                        {vendor.email}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <FaPhone className="text-gray-300 text-xs" />
                                                        {vendor.phone || 'N/A'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-2">
                                                    <FaBuilding className="text-gray-300 mt-1" />
                                                    <div>
                                                        <div className="font-medium text-gray-800">{vendor.business_name || 'N/A'}</div>
                                                        <div className="text-xs text-gray-500">{vendor.vendor_type || 'Vendor'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${vendor.is_approved
                                                        ? 'bg-green-50 text-green-700 border-green-100'
                                                        : 'bg-amber-50 text-amber-700 border-amber-100'
                                                    }`}>
                                                    {vendor.is_approved ? <FaCheck className="text-[10px]" /> : <FaFilter className="text-[10px]" />}
                                                    {vendor.is_approved ? 'Approved' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    {!vendor.is_approved && (
                                                        <button
                                                            onClick={() => handleApprove(vendor.id)}
                                                            className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-medium transition-colors"
                                                            title="Approve Vendor"
                                                        >
                                                            <FaCheck /> Approve
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleReject(vendor.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
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
                    )}
                </div>
            </div>
        </div>
    );
}
