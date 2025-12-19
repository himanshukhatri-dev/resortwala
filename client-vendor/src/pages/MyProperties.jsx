import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useModal } from '../context/ModalContext';
import { FaPlus, FaSearch, FaMapMarkerAlt, FaBed, FaUsers, FaEdit, FaCalendarAlt, FaTrash, FaChartLine, FaClipboardList, FaHome } from 'react-icons/fa';
import Loader from '../components/Loader';

export default function MyProperties() {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const { showConfirm, showError, showSuccess } = useModal();
    const [properties, setProperties] = useState([]);
    const [filteredProperties, setFilteredProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProperties();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredProperties(properties);
        } else {
            const term = searchTerm.toLowerCase();
            setFilteredProperties(properties.filter(p =>
                p.Name?.toLowerCase().includes(term) ||
                p.Location?.toLowerCase().includes(term)
            ));
        }
    }, [searchTerm, properties]);

    const fetchProperties = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/vendor/properties`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProperties(response.data);
            setFilteredProperties(response.data);
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
            await axios.delete(`${API_BASE_URL}/vendor/properties/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await showSuccess('Deleted', 'Property deleted successfully');
            fetchProperties();
        } catch (err) {
            showError('Error', 'Failed to delete property');
        }
    };

    if (loading) return <Loader />;

    return (
        <div style={{ color: 'var(--text-color)', maxWidth: '1200px', margin: '0 auto', padding: '0 20px 40px' }}>

            {/* Header & Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>My Properties</h1>
                        <p style={{ opacity: 0.6, marginTop: '5px' }}>Manage your listings and availability</p>
                    </div>

                    {user?.is_approved ? (
                        <button
                            onClick={() => navigate('/properties/add')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                backgroundColor: 'var(--primary-color)', color: 'white', border: 'none',
                                padding: '12px 24px', borderRadius: '12px', cursor: 'pointer',
                                fontWeight: '600', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                transition: 'transform 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <FaPlus /> Add New Property
                        </button>
                    ) : (
                        <div style={{ padding: '10px 16px', backgroundColor: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '8px', color: '#856404', fontSize: '14px' }}>
                            ⚠️ Account pending approval. Listing creation is paused.
                        </div>
                    )}
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
                    <FaSearch style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                    <input
                        type="text"
                        placeholder="Search by name or location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '12px 12px 12px 45px', borderRadius: '12px',
                            border: '1px solid var(--border-color)', backgroundColor: 'var(--hover-bg)',
                            fontSize: '15px', outline: 'none', transition: 'box-shadow 0.2s'
                        }}
                        onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.05)'}
                        onBlur={e => e.target.style.boxShadow = 'none'}
                    />
                </div>
            </div>

            {/* Empty State */}
            {filteredProperties.length === 0 ? (
                <div style={{
                    backgroundColor: 'var(--sidebar-bg)', padding: '60px 20px', borderRadius: '16px',
                    textAlign: 'center', border: '1px solid var(--border-color)', margin: '20px 0'
                }}>
                    <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--hover-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <FaHome size={32} style={{ opacity: 0.3 }} />
                    </div>
                    <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>
                        {searchTerm ? 'No properties found' : 'No properties listed yet'}
                    </h3>
                    <p style={{ opacity: 0.6, marginBottom: '25px', maxWidth: '400px', margin: '0 auto 25px' }}>
                        {searchTerm ? `We couldn't find any properties matching "${searchTerm}"` : 'Start earning by listing your villa or resort with us.'}
                    </p>
                    {!searchTerm && user?.is_approved && (
                        <button
                            onClick={() => navigate('/properties/add')}
                            style={{ color: 'var(--primary-color)', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px' }}
                        >
                            Create Listing →
                        </button>
                    )}
                </div>
            ) : (
                /* Grid */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '30px' }}>
                    {filteredProperties.map(property => (
                        <div key={property.PropertyId} style={{
                            backgroundColor: 'var(--sidebar-bg)',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)',
                            transition: 'all 0.3s ease',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                            className="property-card"
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 20px 40px -5px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 10px 30px -5px rgba(0,0,0,0.05)';
                            }}
                        >
                            {/* Image Header */}
                            <div style={{ height: '220px', position: 'relative' }}>
                                <img
                                    src={property.Image || 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=500'}
                                    alt={property.Name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, rgba(0,0,0,0.6) 100%)'
                                }} />

                                {/* Status Badge */}
                                <div style={{
                                    position: 'absolute', top: '15px', right: '15px',
                                    padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                                    backgroundColor: property.is_approved ? '#4caf50' : '#ffa000',
                                    color: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                                    display: 'flex', alignItems: 'center', gap: '5px'
                                }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'white' }}></div>
                                    {property.is_approved ? 'Active' : 'In Review'}
                                </div>

                                {/* Price Tag */}
                                <div style={{
                                    position: 'absolute', bottom: '15px', left: '20px',
                                    color: 'white'
                                }}>
                                    <span style={{ fontSize: '24px', fontWeight: '800' }}>₹{property.Price}</span>
                                    <span style={{ fontSize: '14px', opacity: 0.9, fontWeight: '500' }}> /night</span>
                                </div>
                            </div>

                            {/* Content Body */}
                            <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0, lineHeight: 1.3, color: 'var(--text-color)' }}>
                                        {property.Name}
                                    </h3>
                                </div>

                                <p style={{ color: 'var(--text-color)', opacity: 0.6, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '15px' }}>
                                    <FaMapMarkerAlt size={12} color="var(--primary-color)" /> {property.Location}
                                </p>

                                {/* Quick Stats Row */}
                                <div style={{
                                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
                                    marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-color)', opacity: 0.8 }}>
                                        <FaUsers color="#888" /> {property.MaxGuest || 2} Guests
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-color)', opacity: 0.8 }}>
                                        <FaBed color="#888" /> {property.Bedrooms || 1} Rooms
                                    </div>
                                </div>

                                {/* Metrics */}
                                <div style={{
                                    backgroundColor: 'var(--hover-bg)', borderRadius: '12px', padding: '12px',
                                    display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px'
                                }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                                        <FaChartLine />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', opacity: 0.6, fontWeight: '600', textTransform: 'uppercase' }}>Upcoming</div>
                                        <div style={{ fontSize: '16px', fontWeight: '800' }}>{property.upcoming_bookings_count || 0} Bookings</div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: 'minmax(80px, 1fr) minmax(80px, 1fr) auto', gap: '8px' }}>
                                    <button
                                        onClick={() => navigate(`/properties/edit/${property.PropertyId}`)}
                                        title="Edit Details"
                                        style={{
                                            padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                            backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', fontWeight: '600', fontSize: '13px',
                                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
                                    >
                                        <FaEdit /> Edit
                                    </button>

                                    <button
                                        onClick={() => navigate(`/properties/${property.PropertyId}/calendar`)}
                                        title="View Calendar"
                                        style={{
                                            padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                            backgroundColor: 'var(--bg-color)', color: '#009688', fontWeight: '600', fontSize: '13px',
                                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e0f2f1'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
                                    >
                                        <FaCalendarAlt /> Cal
                                    </button>

                                    <button
                                        onClick={() => handleDelete(property.PropertyId)}
                                        title="Delete Property"
                                        style={{
                                            padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                            backgroundColor: '#ffebee', color: '#d32f2f', fontWeight: '600', fontSize: '13px',
                                            display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ffcdd2'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffebee'}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
