import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { useModal } from '../context/ModalContext';

export default function Users() {
    const { token } = useAuth();
    const { showConfirm, showSuccess, showError } = useModal();
    const [activeTab, setActiveTab] = useState('admins'); // 'admins' | 'vendors' | 'customers'
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', business_name: '' });

    useEffect(() => {
        fetchUsers();
    }, [activeTab]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let endpoint = '';
            if (activeTab === 'admins') endpoint = '/api/admin/users/admins';
            else if (activeTab === 'vendors') endpoint = '/api/admin/users/vendors';
            else endpoint = '/api/admin/users/customers';

            const res = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (error) {
            console.error(error);
            showError('Error', 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm(
            'Delete User',
            'Are you sure you want to delete this user?',
            'Delete',
            'Cancel',
            'danger'
        );
        if (!confirmed) return;

        try {
            // Vendors and Admins are in 'users' table, handled by deleteUser
            // Customers are in 'customers' table, handled by deleteCustomer
            const endpoint = activeTab === 'customers'
                ? `/api/admin/users/customers/${id}`
                : `/api/admin/users/${id}`;

            await axios.delete(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
            showSuccess('Deleted', 'User deleted successfully');
        } catch (error) {
            console.error(error);
            showError('Error', 'Failed to delete user');
        }
    };

    const openAddModal = () => {
        setIsEditMode(false);
        setEditId(null);
        setFormData({ name: '', email: '', password: '', phone: '', business_name: '' });
        setShowModal(true);
    };

    const openEditModal = (user) => {
        setIsEditMode(true);
        setEditId(user.id);
        setFormData({
            name: user.name || '',
            email: user.email || '',
            password: '', // Leave empty to keep unchanged
            phone: user.phone || '',
            business_name: user.business_name || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            let endpoint = '';
            let method = isEditMode ? 'put' : 'post';

            // Endpoint Logic
            if (activeTab === 'customers') {
                endpoint = isEditMode
                    ? `/api/admin/users/customers/${editId}`
                    : '/api/admin/users/customers';
            } else {
                // Admins or Vendors (Users Table)
                if (isEditMode) {
                    endpoint = `/api/admin/users/${editId}`;
                } else {
                    endpoint = '/api/admin/users/admins'; // Default create to Admin for now
                }
            }

            // Clean Payload
            const payload = { ...formData };
            if (!payload.password) delete payload.password; // Don't send empty password on edit

            // Remove business_name if it is empty string (Admin) to avoid clutter/validation issues
            if (activeTab === 'admins' || (!payload.business_name && activeTab !== 'vendors')) {
                delete payload.business_name;
            }

            console.log(`Sending ${method.toUpperCase()} to ${endpoint}`, payload);

            await axios[method](endpoint, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowModal(false);
            fetchUsers();
            showSuccess(isEditMode ? 'Updated' : 'Created', `User ${isEditMode ? 'updated' : 'created'} successfully`);
        } catch (error) {
            console.error("Submit Error:", error);
            const msg = error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} user`;
            showError('Error', msg);
        }
    };

    const handleLoginAs = async (userId) => {
        try {
            const res = await axios.post(`/api/admin/impersonate/${userId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const { token: newToken, redirect_url } = res.data;

            // Open in new tab with token appended
            const separator = redirect_url.includes('?') ? '&' : '?';
            const finalUrl = `${redirect_url}${separator}impersonate_token=${newToken}`;

            window.open(finalUrl, '_blank');
            showSuccess('Success', 'Redirecting to user dashboard...');
        } catch (error) {
            console.error('Impersonation Error:', error);
            showError('Error', 'Failed to impersonate user');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px' }}>User Management</h1>
                {/* Only show Add button for Admins and Customers to avoid complexity with Vendors tailored creation */}
                {activeTab !== 'vendors' && (
                    <button onClick={openAddModal} className="btn">
                        + Add {activeTab === 'admins' ? 'Admin' : 'Customer'}
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
                {['admins', 'vendors', 'customers'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '10px 20px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab ? '2px solid var(--primary-color)' : 'none',
                            color: activeTab === tab ? 'var(--primary-color)' : '#666',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            textTransform: 'capitalize'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* List */}
            {loading ? <p>Loading...</p> : (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
                                <th style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>ID</th>
                                <th style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>Name</th>
                                <th style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>Email</th>
                                {(activeTab === 'customers' || activeTab === 'vendors') && <th style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>Phone</th>}
                                {activeTab === 'vendors' && <th style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>Business Name</th>}
                                <th style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>Created At</th>
                                <th style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '15px' }}>{user.id}</td>
                                    <td style={{ padding: '15px' }}>{user.name}</td>
                                    <td style={{ padding: '15px' }}>{user.email}</td>
                                    {(activeTab === 'customers' || activeTab === 'vendors') && <td style={{ padding: '15px' }}>{user.phone || '-'}</td>}
                                    {activeTab === 'vendors' && <td style={{ padding: '15px' }}>{user.business_name || '-'}</td>}
                                    <td style={{ padding: '15px' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => handleLoginAs(user.id)}
                                                style={{
                                                    padding: '6px 12px',
                                                    backgroundColor: '#e8f5e9',
                                                    color: '#2e7d32',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Login As
                                            </button>
                                            <button
                                                onClick={() => openEditModal(user)}
                                                style={{
                                                    padding: '6px 12px',
                                                    backgroundColor: '#e3f2fd',
                                                    color: '#1565c0',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                style={{
                                                    padding: '6px 12px',
                                                    backgroundColor: '#ffebee',
                                                    color: '#c62828',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <Modal
                    title={`${isEditMode ? 'Edit' : 'Add New'} ${activeTab.slice(0, -1).replace(/^\w/, c => c.toUpperCase())}`}
                    onClose={() => setShowModal(false)}
                >
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '15px' }}>
                            <label>Name</label>
                            <input
                                type="text"
                                required
                                className="form-input"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label>Email</label>
                            <input
                                type="email"
                                required
                                className="form-input"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        {(activeTab === 'customers' || activeTab === 'vendors') && (
                            <div style={{ marginBottom: '15px' }}>
                                <label>Phone</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        )}
                        {activeTab === 'vendors' && (
                            <div style={{ marginBottom: '15px' }}>
                                <label>Business Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.business_name}
                                    onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                                />
                            </div>
                        )}
                        <div style={{ marginBottom: '15px' }}>
                            <label>Password {isEditMode && '(Leave blank to keep current)'}</label>
                            <input
                                type="password"
                                required={!isEditMode}
                                className="form-input"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn" style={{ width: '100%' }}>
                            {isEditMode ? 'Update' : 'Create'}
                        </button>
                    </form>
                </Modal>
            )}
        </div>
    );
}
