import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import DebugPanel from '../components/DebugPanel';
import { useApiDebugger } from '../hooks/useApiDebugger';

export default function Dashboard() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const apiCalls = useApiDebugger(); // Track API calls for debug panel
    const [activeTab, setActiveTab] = useState('vendors');
    const [stats, setStats] = useState(null);
    const [pendingVendors, setPendingVendors] = useState([]);
    const [pendingProperties, setPendingProperties] = useState([]);
    const [bookings, setBookings] = useState([]);

    // Filters & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Loading...');

    // Modal state
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: null,
        showCancel: false
    });

    const showModal = (title, message, type = 'info', onConfirm = null, showCancel = false) => {
        setModal({ isOpen: true, title, message, type, onConfirm, showCancel });
    };

    const closeModal = () => {
        setModal({ ...modal, isOpen: false });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, vendorsRes, propertiesRes, bookingsRes] = await Promise.all([
                axios.get('/api/admin/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('/api/admin/vendors/pending', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('/api/admin/properties/pending', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('/api/admin/bookings', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            setStats(statsRes.data);
            setPendingVendors(vendorsRes.data);
            setPendingProperties(propertiesRes.data);
            setBookings(bookingsRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveVendor = async (vendorId) => {
        showModal(
            'Confirm Approval',
            'Are you sure you want to approve this vendor?',
            'warning',
            async () => {
                setActionLoading(true);
                setLoadingMessage('Approving vendor...');
                try {
                    await axios.post(`/api/admin/vendors/${vendorId}/approve`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setActionLoading(false);
                    showModal('Success', 'Vendor approved successfully!', 'success');
                    fetchData();
                } catch (err) {
                    setActionLoading(false);
                    showModal('Error', err.response?.data?.message || 'Failed to approve vendor', 'error');
                }
            },
            true
        );
    };

    const handleRejectVendor = async (vendorId) => {
        showModal(
            'Confirm Rejection',
            'Are you sure you want to reject and delete this vendor? This action cannot be undone.',
            'warning',
            async () => {
                setActionLoading(true);
                setLoadingMessage('Rejecting vendor...');
                try {
                    await axios.delete(`/api/admin/vendors/${vendorId}/reject`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setActionLoading(false);
                    showModal('Success', 'Vendor rejected and deleted', 'success');
                    fetchData();
                } catch (err) {
                    setActionLoading(false);
                    showModal('Error', err.response?.data?.message || 'Failed to reject vendor', 'error');
                }
            },
            true
        );
    };

    const handleApproveProperty = async (propertyId) => {
        console.log('Approve property clicked:', propertyId);
        showModal(
            'Confirm Approval',
            'Are you sure you want to approve this property?',
            'warning',
            async () => {
                setActionLoading(true);
                setLoadingMessage('Approving property...');
                try {
                    console.log('Sending approval request...');
                    const response = await axios.post(`/api/admin/properties/${propertyId}/approve`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log('Approval response:', response.data);
                    setActionLoading(false);
                    showModal('Success', 'Property approved successfully!', 'success');
                    fetchData();
                } catch (err) {
                    console.error('Approval error:', err);
                    setActionLoading(false);
                    showModal('Error', err.response?.data?.message || err.message, 'error');
                }
            },
            true
        );
    };

    const handleRejectProperty = async (propertyId) => {
        console.log('Reject property clicked:', propertyId);
        showModal(
            'Confirm Rejection',
            'Are you sure you want to reject and delete this property? This action cannot be undone.',
            'warning',
            async () => {
                setActionLoading(true);
                setLoadingMessage('Rejecting property...');
                try {
                    console.log('Sending rejection request...');
                    await axios.delete(`/api/admin/properties/${propertyId}/reject`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setActionLoading(false);
                    showModal('Success', 'Property rejected and deleted', 'success');
                    fetchData();
                } catch (err) {
                    console.error('Rejection error:', err);
                    setActionLoading(false);
                    showModal('Error', err.response?.data?.message || err.message, 'error');
                }
            },
            true
        );
    };

    const handleUpdateBookingStatus = async (bookingId, newStatus) => {
        showModal(
            'Confirm Status Change',
            `Are you sure you want to mark this booking as ${newStatus}?`,
            'warning',
            async () => {
                setActionLoading(true);
                setLoadingMessage(`Updating booking to ${newStatus}...`);
                try {
                    await axios.post(`/api/admin/bookings/${bookingId}/status`,
                        { status: newStatus },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setActionLoading(false);
                    showModal('Success', `Booking marked as ${newStatus}`, 'success');
                    fetchData();
                } catch (err) {
                    setActionLoading(false);
                    showModal('Error', err.response?.data?.message || 'Failed to update booking status', 'error');
                }
            },
            true
        );
    };

    const renderTable = () => {
        let data = [];
        let columns = [];
        let renderRow = null;

        const getStatusStyle = (status) => {
            const s = status?.toLowerCase() || 'pending';
            switch (s) {
                case 'confirmed': return { backgroundColor: '#d4edda', color: '#155724' };
                case 'rejected': return { backgroundColor: '#f8d7da', color: '#721c24' };
                case 'cancelled': return { backgroundColor: '#f8d7da', color: '#721c24' };
                default: return { backgroundColor: '#fff3cd', color: '#856404' }; // pending
            }
        };



        if (activeTab === 'vendors') {
            data = pendingVendors.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()));
            columns = ['Name', 'Email', 'Business', 'Type', 'Actions'];
            renderRow = (vendor) => (
                <tr key={vendor.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px' }}>{vendor.name}</td>
                    <td style={{ padding: '12px' }}>{vendor.email}</td>
                    <td style={{ padding: '12px' }}>{vendor.business_name}</td>
                    <td style={{ padding: '12px' }}>{vendor.vendor_type}</td>
                    <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleApproveVendor(vendor.id)} className="btn-approve" style={{ padding: '6px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Approve</button>
                        <button onClick={() => handleRejectVendor(vendor.id)} className="btn-reject" style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                    </td>
                </tr>
            );
        } else if (activeTab === 'properties') {
            data = pendingProperties.filter(p => p.Name.toLowerCase().includes(searchTerm.toLowerCase()));
            columns = ['Property', 'Location', 'Price', 'Vendor', 'Actions'];
            renderRow = (property) => (
                <tr key={property.PropertyId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px' }}>{property.Name}</td>
                    <td style={{ padding: '12px' }}>{property.Location}</td>
                    <td style={{ padding: '12px' }}>₹{property.Price}</td>
                    <td style={{ padding: '12px' }}>{property.vendor?.business_name || 'N/A'}</td>
                    <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleApproveProperty(property.PropertyId)} style={{ padding: '6px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Approve</button>
                        <button onClick={() => handleRejectProperty(property.PropertyId)} style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                    </td>
                </tr>
            );
        } else if (activeTab === 'bookings') {
            data = bookings.filter(b => b.CustomerName.toLowerCase().includes(searchTerm.toLowerCase()) || (b.Status || '').toLowerCase().includes(searchTerm.toLowerCase()));
            columns = ['ID', 'Customer', 'Property', 'Dates', 'Status', 'Actions'];
            renderRow = (booking) => (
                <tr key={booking.BookingId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px' }}>#{booking.BookingId}</td>
                    <td style={{ padding: '12px' }}>{booking.CustomerName}</td>
                    <td style={{ padding: '12px' }}>{booking.property?.Name || 'N/A'}</td>
                    <td style={{ padding: '12px' }}>{new Date(booking.CheckInDate).toLocaleDateString()}</td>
                    <td style={{ padding: '12px' }}>
                        <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            ...getStatusStyle(booking.Status),
                            textTransform: 'capitalize',
                            fontWeight: '600',
                            fontSize: '12px'
                        }}>
                            {booking.Status || 'pending'}
                        </span>
                    </td>
                    <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                        {(!booking.Status || booking.Status === 'pending') ? (
                            <>
                                <button onClick={() => handleUpdateBookingStatus(booking.BookingId, 'confirmed')} style={{ padding: '6px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Approve</button>
                                <button onClick={() => handleUpdateBookingStatus(booking.BookingId, 'rejected')} style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                            </>
                        ) : (
                            <span style={{ color: '#888', fontStyle: 'italic', fontSize: '12px' }}>
                                Action taken
                            </span>
                        )}
                    </td>
                </tr>
            );
        }

        // Pagination Logic
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
        const totalPages = Math.ceil(data.length / itemsPerPage);

        if (data.length === 0) return <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No records found.</p>;

        return (
            <div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #eee', backgroundColor: '#f9f9f9' }}>
                            {columns.map(col => <th key={col} style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>{col}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map(item => renderRow(item))}
                    </tbody>
                </table>

                {/* Internal Pagination Control passing state up or rendering here? 
                    Actually, we are rendering table inside renderTable, but pagination controls were outside.
                    To fix pagination state ("Next" disabled), we need access to totalPages OUTSIDE this function or return it.
                    However, simplistic fix: Render pagination INSIDE this function or move the data calculation out.
                    
                    Better approach: Move data filtering/calculation to the main body? 
                    No, that refactor is risky. 
                    
                    Simplest fix: Render the pagination controls HERE, inside renderTable, and remove the outer ones.
                */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '10px' }}>
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '4px', background: currentPage === 1 ? '#eee' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                    >
                        Previous
                    </button>
                    <span style={{ padding: '8px 16px' }}>Page {currentPage} of {totalPages}</span>
                    <button
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '4px', background: currentPage >= totalPages ? '#eee' : 'white', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    const handleLogout = async () => {
        setActionLoading(true);
        setLoadingMessage('Logging out...');

        try {
            await axios.post('/api/admin/logout', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            // Small delay for smooth UX
            setTimeout(() => {
                setActionLoading(false);
                logout();
                navigate('/login');
            }, 500);
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            {/* Header */}
            <div style={{ backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '24px', color: 'var(--primary-color)' }}>Admin Dashboard</h1>
                    <button onClick={handleLogout} className="btn" style={{ padding: '8px 16px' }}>
                        Logout
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="container" style={{ padding: '40px 20px' }}>
                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                    <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Properties</p>
                        <p style={{ fontSize: '32px', fontWeight: '700', color: 'var(--primary-color)' }}>{stats?.total_properties || 0}</p>
                    </div>
                    <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Bookings</p>
                        <p style={{ fontSize: '32px', fontWeight: '700', color: '#28a745' }}>{stats?.total_bookings || 0}</p>
                    </div>
                    <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', cursor: 'pointer' }} onClick={() => setActiveTab('vendors')}>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Pending Vendors</p>
                        <p style={{ fontSize: '32px', fontWeight: '700', color: '#ffc107' }}>{stats?.pending_vendors || 0}</p>
                    </div>
                    <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Approved Vendors</p>
                        <p style={{ fontSize: '32px', fontWeight: '700', color: '#17a2b8' }}>{stats?.approved_vendors || 0}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', borderBottom: '2px solid #f0f0f0' }}>
                        <button
                            onClick={() => { setActiveTab('vendors'); setCurrentPage(1); setSearchTerm(''); }}
                            style={{ flex: 1, padding: '15px', border: 'none', backgroundColor: activeTab === 'vendors' ? 'var(--primary-color)' : 'white', color: activeTab === 'vendors' ? 'white' : '#666', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                        >
                            Vendors
                        </button>
                        <button
                            onClick={() => { setActiveTab('properties'); setCurrentPage(1); setSearchTerm(''); }}
                            style={{ flex: 1, padding: '15px', border: 'none', backgroundColor: activeTab === 'properties' ? 'var(--primary-color)' : 'white', color: activeTab === 'properties' ? 'white' : '#666', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                        >
                            Properties
                        </button>
                        <button
                            onClick={() => { setActiveTab('bookings'); setCurrentPage(1); setSearchTerm(''); }}
                            style={{ flex: 1, padding: '15px', border: 'none', backgroundColor: activeTab === 'bookings' ? 'var(--primary-color)' : 'white', color: activeTab === 'bookings' ? 'white' : '#666', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
                        >
                            Bookings
                        </button>
                    </div>

                    {/* Filter Bar */}
                    <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', gap: '15px' }}>
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd', width: '300px' }}
                        />
                    </div>

                    <div style={{ padding: '30px' }}>
                        {renderTable()}
                    </div>

                </div>
            </div>

            <Modal
                isOpen={modal.isOpen}
                onClose={closeModal}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                onConfirm={modal.onConfirm}
                showCancel={modal.showCancel}
            />

            {actionLoading && <Loader message={loadingMessage} />}

            <DebugPanel apiCalls={apiCalls} />
        </div >
    );
}
