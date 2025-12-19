import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { useModal } from '../context/ModalContext';
import { API_BASE_URL } from '../config';

export default function Vendors() {
    const { token } = useAuth();
    const { showConfirm, showSuccess, showError } = useModal();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [filter, setFilter] = useState('all'); // all, approved, pending

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
            'Are you sure you want to approve this vendor?',
            'Approve',
            'Cancel',
            'warning'
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
            'Are you sure you want to reject this vendor? This might delete their account.',
            'Reject / Delete',
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
        if (filter === 'all') return true;
        if (filter === 'approved') return vendor.is_approved === 1 || vendor.is_approved === true;
        if (filter === 'pending') return vendor.is_approved === 0 || vendor.is_approved === false;
        return true;
    });

    if (loading) return <Loader message="Loading Vendors..." />;

    return (
        <div className="container" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>All Vendors</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setFilter('all')}
                        className={`btn ${filter === 'all' ? 'active' : ''}`}
                        style={{ opacity: filter === 'all' ? 1 : 0.6 }}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('approved')}
                        className={`btn ${filter === 'approved' ? 'active' : ''}`}
                        style={{ opacity: filter === 'approved' ? 1 : 0.6, backgroundColor: '#28a745' }}
                    >
                        Approved
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`btn ${filter === 'pending' ? 'active' : ''}`}
                        style={{ opacity: filter === 'pending' ? 1 : 0.6, backgroundColor: '#ffc107', color: '#000' }}
                    >
                        Pending
                    </button>
                </div>
            </div>

            {actionLoading && <div style={{ textAlign: 'center', marginBottom: '10px' }}>Processing...</div>}

            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f8f9fa' }}>
                        <tr>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Vendor Name</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Business</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Email</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Phone</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredVendors.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                    No vendors found.
                                </td>
                            </tr>
                        ) : (
                            filteredVendors.map(vendor => (
                                <tr key={vendor.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '15px' }}>{vendor.name}</td>
                                    <td style={{ padding: '15px' }}>{vendor.business_name || 'N/A'}</td>
                                    <td style={{ padding: '15px' }}>{vendor.email}</td>
                                    <td style={{ padding: '15px' }}>{vendor.phone || 'N/A'}</td>
                                    <td style={{ padding: '15px' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            backgroundColor: vendor.is_approved ? '#d4edda' : '#fff3cd',
                                            color: vendor.is_approved ? '#155724' : '#856404'
                                        }}>
                                            {vendor.is_approved ? 'Approved' : 'Pending'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        {!vendor.is_approved && (
                                            <button
                                                onClick={() => handleApprove(vendor.id)}
                                                style={{ marginRight: '8px', padding: '6px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                Approve
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleReject(vendor.id)}
                                            style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            {vendor.is_approved ? 'Delete' : 'Reject'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>


        </div>
    );
}
