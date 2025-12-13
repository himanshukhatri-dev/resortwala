import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useModal } from '../context/ModalContext';

export default function MyProperties() {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const { showConfirm, showError, showSuccess } = useModal();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const response = await axios.get('http://192.168.1.105:8000/api/vendor/properties', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProperties(response.data);
        } catch (err) {
            console.error('Error fetching properties:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm(
            'Delete Property',
            'Are you sure you want to delete this property? This action cannot be undone.',
            'Delete',
            'Cancel',
            'danger'
        );

        if (!confirmed) return;

        try {
            await axios.delete(`http://192.168.1.105:8000/api/vendor/properties/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await showSuccess('Deleted', 'Property deleted successfully');
            fetchProperties();
        } catch (err) {
            showError('Error', 'Failed to delete property');
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-color)' }}>Loading...</div>;

    return (
        <div style={{ color: 'var(--text-color)' }}>

            <div style={{ padding: '30px', color: 'var(--text-color)' }}>
                {!user?.is_approved && (
                    <div style={{ padding: '15px 20px', backgroundColor: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '8px', marginBottom: '25px', color: '#856404' }}>
                        <strong>Pending Approval:</strong> Your account is pending admin approval. You can only view properties.
                    </div>
                )}

                {properties.length === 0 ? (
                    <div style={{ backgroundColor: 'var(--sidebar-bg)', padding: '50px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <p style={{ color: 'var(--text-color)', fontSize: '16px' }}>No properties found.</p>
                        {user?.is_approved && (
                            <button onClick={() => navigate('/properties/add')} style={{ marginTop: '15px', color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                                Create your first listing →
                            </button>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
                        {properties.map(property => (
                            <div key={property.PropertyId} style={{
                                backgroundColor: 'var(--sidebar-bg)',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                                transition: 'transform 0.2s',
                                border: '1px solid var(--border-color)'
                            }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ height: '200px', backgroundColor: '#e0e0e0', position: 'relative' }}>
                                    <div style={{
                                        width: '100%', height: '100%',
                                        background: `url(${property.Image || 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400'}) center/cover`
                                    }} />
                                    <span style={{
                                        position: 'absolute', top: '15px', right: '15px',
                                        padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                                        backgroundColor: property.is_approved ? 'rgba(40, 167, 69, 0.9)' : 'rgba(255, 193, 7, 0.9)',
                                        color: property.is_approved ? 'white' : '#333',
                                        backdropFilter: 'blur(4px)'
                                    }}>
                                        {property.is_approved ? 'Active' : 'Pending Review'}
                                    </span>
                                </div>
                                <div style={{ padding: '20px' }}>
                                    <div style={{ marginBottom: '15px' }}>
                                        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '5px', color: 'var(--text-color)' }}>{property.Name}</h3>
                                        <p style={{ color: 'var(--text-color)', opacity: 0.7, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            📍 {property.Location}
                                        </p>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary-color)' }}>
                                            ₹{property.Price}<span style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--text-color)', opacity: 0.6 }}>/night</span>
                                        </span>
                                    </div>

                                    <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(102, 126, 234, 0.1)', borderRadius: '8px', border: '1px solid rgba(102, 126, 234, 0.2)' }}>
                                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--primary-color)', fontWeight: '600' }}>
                                            📅 Upcoming Bookings (30 days): {property.upcoming_bookings_count || 0}
                                        </p>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => navigate(`/properties/edit/${property.PropertyId}`)}
                                            style={{ flex: 1, padding: '10px', backgroundColor: 'var(--hover-bg)', color: 'var(--primary-color)', border: '1px solid transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => navigate(`/day-wise-booking?propertyId=${property.PropertyId}`)}
                                            style={{ flex: 1, padding: '10px', backgroundColor: '#e3f2fd', color: '#1976d2', border: '1px solid transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                                        >
                                            Bookings
                                        </button>
                                        <button
                                            onClick={() => handleDelete(property.PropertyId)}
                                            style={{ flex: 1, padding: '10px', backgroundColor: 'var(--hover-bg-red)', color: 'var(--danger-color)', border: '1px solid transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
