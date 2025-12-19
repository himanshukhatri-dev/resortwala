import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { useModal } from '../context/ModalContext';

export default function Properties() {
    const { token } = useAuth();
    const { showConfirm, showSuccess, showError } = useModal();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [filter, setFilter] = useState('all'); // all, approved, pending

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const response = await axios.get('/admin/properties', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProperties(response.data);
        } catch (error) {
            console.error('Error fetching properties:', error);
            showError('Error', 'Failed to fetch properties');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        const confirmed = await showConfirm(
            'Approve Property',
            'Are you sure you want to approve this property?',
            'Approve',
            'Cancel',
            'warning'
        );

        if (!confirmed) return;

        setActionLoading(true);
        try {
            await axios.post(`/admin/properties/${id}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state: is_approved = 1
            setProperties(properties.map(p => p.PropertyId === id ? { ...p, is_approved: 1 } : p));
            showSuccess('Approved', 'Property approved successfully');
        } catch (error) {
            console.error('Error approving property:', error);
            showError('Error', 'Failed to approve property');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (id) => {
        const confirmed = await showConfirm(
            'Reject Property',
            'Are you sure you want to reject this property? This will delete it.',
            'Reject / Delete',
            'Cancel',
            'danger'
        );

        if (!confirmed) return;

        setActionLoading(true);
        try {
            await axios.delete(`/admin/properties/${id}/reject`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProperties(properties.filter(p => p.PropertyId !== id));
            showSuccess('Rejected', 'Property rejected and deleted successfully');
        } catch (error) {
            console.error('Error rejecting property:', error);
            showError('Error', 'Failed to reject property');
        } finally {
            setActionLoading(false);
        }
    };

    const filteredProperties = properties.filter(property => {
        if (filter === 'all') return true;
        if (filter === 'approved') return property.is_approved == 1; // Strict check might fail if string '1' return
        if (filter === 'pending') return !property.is_approved;
        return true;
    });

    if (loading) return <Loader message="Loading Properties..." />;

    return (
        <div className="container" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>All Properties</h1>
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
                            <th style={{ padding: '15px', textAlign: 'left' }}>Property</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Location</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Vendor</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Price</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProperties.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                    No properties found.
                                </td>
                            </tr>
                        ) : (
                            filteredProperties.map(property => (
                                <tr key={property.PropertyId} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {/* Simplified Image Placeholder or Actual Image if available */}
                                        <div style={{ width: '40px', height: '40px', backgroundColor: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                                            {property.primary_image && <img src={property.primary_image.image_path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{property.Name}</div>
                                            <div style={{ fontSize: '12px', color: '#888' }}>ID: {property.PropertyId}</div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '15px' }}>{property.Location}</td>
                                    <td style={{ padding: '15px' }}>
                                        <div>{property.vendor?.business_name || property.vendor?.name || <span className="text-red-500 text-xs">Unassigned</span>}</div>
                                        {property.vendor && <div style={{ fontSize: '11px', color: '#888' }}>{property.vendor.email}</div>}
                                    </td>
                                    <td style={{ padding: '15px' }}>₹{property.Price}</td>
                                    <td style={{ padding: '15px' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            backgroundColor: property.is_approved ? '#d4edda' : '#fff3cd',
                                            color: property.is_approved ? '#155724' : '#856404'
                                        }}>
                                            {property.is_approved ? 'Approved' : 'Pending'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        {!property.is_approved && (
                                            <button
                                                onClick={() => handleApprove(property.PropertyId)}
                                                style={{ marginRight: '8px', padding: '6px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                Approve
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleReject(property.PropertyId)}
                                            style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            {property.is_approved ? 'Delete' : 'Reject'}
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
