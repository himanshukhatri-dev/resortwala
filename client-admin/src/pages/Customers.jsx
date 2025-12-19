import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import Modal from '../components/Modal';

export default function Customers() {
    const { token } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Modal state
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: null,
        showCancel: false
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await axios.get('/admin/users/customers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCustomers(response.data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        setModal({
            isOpen: true,
            title: 'Delete Customer',
            message: 'Are you sure you want to delete this customer? This action cannot be undone.',
            type: 'danger',
            showCancel: true,
            onConfirm: async () => {
                setActionLoading(true);
                try {
                    await axios.delete(`/admin/users/customers/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setCustomers(customers.filter(c => c.id !== id));
                    setModal({ ...modal, isOpen: false });
                } catch (error) {
                    console.error('Error deleting customer:', error);
                    alert('Failed to delete customer');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    if (loading) return <Loader message="Loading Customers..." />;

    return (
        <div className="container" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>All Customers</h1>
            </div>

            {actionLoading && <div style={{ textAlign: 'center', marginBottom: '10px' }}>Processing...</div>}

            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f8f9fa' }}>
                        <tr>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Name</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Email</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Phone</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Joined Date</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                    No customers found.
                                </td>
                            </tr>
                        ) : (
                            customers.map(customer => (
                                <tr key={customer.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '15px' }}>{customer.name}</td>
                                    <td style={{ padding: '15px' }}>{customer.email}</td>
                                    <td style={{ padding: '15px' }}>{customer.phone || 'N/A'}</td>
                                    <td style={{ padding: '15px' }}>{new Date(customer.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '15px' }}>
                                        <button
                                            onClick={() => handleDelete(customer.id)}
                                            style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                onConfirm={modal.onConfirm}
                showCancel={modal.showCancel}
            />
        </div>
    );
}
