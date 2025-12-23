import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { API_BASE_URL } from '../config';
import { FaUser, FaBuilding, FaEnvelope, FaPhone, FaCheck, FaTimes, FaArrowLeft, FaIdCard } from 'react-icons/fa';

export default function VendorDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const { showConfirm, showSuccess, showError } = useModal();
    const [vendor, setVendor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchVendor();
    }, [id]);

    const fetchVendor = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/vendors/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVendor(response.data);
        } catch (error) {
            console.error('Error fetching vendor:', error);
            showError('Error', 'Failed to fetch vendor details');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
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
            showSuccess('Approved', 'Vendor approved successfully');
            setVendor({ ...vendor, is_approved: 1 });
        } catch (error) {
            console.error('Error approving vendor:', error);
            showError('Error', 'Failed to approve vendor');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
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
            showSuccess('Rejected', 'Vendor rejected/deleted successfully');
            navigate('/admin/vendors');
        } catch (error) {
            console.error('Error rejecting vendor:', error);
            showError('Error', 'Failed to reject vendor');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading Vendor Details...</div>;
    if (!vendor) return <div className="p-8 text-red-500">Vendor not found.</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/vendors')}
                        className="p-2 rounded-full bg-white shadow-sm border border-gray-100 hover:bg-gray-100 transition-colors"
                    >
                        <FaArrowLeft className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Vendor Details</h1>
                        <p className="text-sm text-gray-500">Review vendor information before approval</p>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                            {/* Avatar Section */}
                            <div className="flex-shrink-0 text-center">
                                <div className="w-32 h-32 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-4xl border-4 border-white shadow-md">
                                    {vendor.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="mt-4">
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border ${vendor.is_approved
                                            ? 'bg-green-50 text-green-700 border-green-100'
                                            : 'bg-amber-50 text-amber-700 border-amber-100'
                                        }`}>
                                        {vendor.is_approved ? <FaCheck className="text-xs" /> : <FaTimes className="text-xs" />}
                                        {vendor.is_approved ? 'Approved' : 'Pending Approval'}
                                    </span>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <FaUser className="text-gray-400" /> Full Name
                                    </h3>
                                    <p className="text-lg font-medium text-gray-900">{vendor.name}</p>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <FaBuilding className="text-gray-400" /> Business Name
                                    </h3>
                                    <p className="text-lg font-medium text-gray-900">{vendor.business_name || 'Not Provided'}</p>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <FaEnvelope className="text-gray-400" /> Email Address
                                    </h3>
                                    <p className="text-lg font-medium text-gray-900 break-all">{vendor.email}</p>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <FaPhone className="text-gray-400" /> Phone Number
                                    </h3>
                                    <p className="text-lg font-medium text-gray-900">{vendor.phone || 'Not Provided'}</p>
                                </div>

                                <div className="space-y-1 md:col-span-2">
                                    <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <FaIdCard className="text-gray-400" /> Vendor Type
                                    </h3>
                                    <p className="text-lg font-medium text-gray-900 capitalize">{vendor.vendor_type || 'General Vendor'}</p>
                                </div>
                            </div>
                        </div>

                        {/* ID Verification Section (Placeholder for future) */}
                        <div className="mt-8 border-t pt-8">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Verification Documents</h3>
                            <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500 border border-dashed border-gray-300">
                                No documents uploaded.
                            </div>
                        </div>
                    </div>

                    {/* Action Footer */}
                    <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-100">
                        <div className="text-sm text-gray-500">
                            Registered on: {new Date(vendor.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex gap-4">
                            {!vendor.is_approved && (
                                <button
                                    onClick={handleApprove}
                                    disabled={actionLoading}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-70"
                                >
                                    <FaCheck /> Approve Vendor
                                </button>
                            )}
                            <button
                                onClick={handleReject}
                                disabled={actionLoading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-medium transition-all disabled:opacity-70"
                            >
                                <FaTimes /> {vendor.is_approved ? 'Delete Vendor' : 'Reject Vendor'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
