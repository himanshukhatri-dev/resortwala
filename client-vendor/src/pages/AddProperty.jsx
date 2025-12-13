import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useModal } from '../context/ModalContext';

export default function AddProperty() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const { showSuccess } = useModal();
    const [formData, setFormData] = useState({
        Name: '',
        PropertyType: 'Villa',
        Location: '',
        Price: '',
        ShortDescription: '',
        LongDescription: '',
        Facilities: '',
        MaxCapacity: '',
        CheckinDate: '',
        CheckoutDate: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('http://192.168.1.105:8000/api/vendor/properties', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await showSuccess('Success', response.data.message || 'Property added successfully');
            navigate('/properties');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create property');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            <div style={{ backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' }}>
                <div className="container">
                    <h1 style={{ fontSize: '24px', color: 'var(--primary-color)' }}>Add New Property</h1>
                </div>
            </div>

            <div className="container" style={{ padding: '40px 20px' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    {error && (
                        <div style={{ padding: '12px', backgroundColor: '#fee', color: '#c33', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Row 1: Name & Type */}
                        <div className="form-grid">
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Property Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.Name}
                                    onChange={e => setFormData({ ...formData, Name: e.target.value })}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Property Type *</label>
                                <select
                                    required
                                    value={formData.PropertyType}
                                    onChange={e => setFormData({ ...formData, PropertyType: e.target.value })}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                                >
                                    <option value="Villa">Villa</option>
                                    <option value="Waterpark">Waterpark</option>
                                </select>
                            </div>
                        </div>

                        {/* Row 2: Location (Full Width) */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Location *</label>
                            <input
                                type="text"
                                required
                                value={formData.Location}
                                onChange={e => setFormData({ ...formData, Location: e.target.value })}
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                            />
                        </div>

                        {/* Row 3: Price & Capacity */}
                        <div className="form-grid">
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Price per Night (₹) *</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.Price}
                                    onChange={e => setFormData({ ...formData, Price: e.target.value })}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Max Capacity *</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={formData.MaxCapacity}
                                    onChange={e => setFormData({ ...formData, MaxCapacity: e.target.value })}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                                />
                            </div>
                        </div>

                        {/* Row 4: Short Description */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Short Description</label>
                            <input
                                type="text"
                                value={formData.ShortDescription}
                                onChange={e => setFormData({ ...formData, ShortDescription: e.target.value })}
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                            />
                        </div>

                        {/* Row 5: Long Description */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Long Description</label>
                            <textarea
                                rows="4"
                                value={formData.LongDescription}
                                onChange={e => setFormData({ ...formData, LongDescription: e.target.value })}
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', resize: 'vertical' }}
                            />
                        </div>

                        {/* Row 6: Facilities */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Facilities (comma-separated)</label>
                            <input
                                type="text"
                                placeholder="WiFi, Pool, Parking, Restaurant"
                                value={formData.Facilities}
                                onChange={e => setFormData({ ...formData, Facilities: e.target.value })}
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn"
                                style={{ flex: 1, padding: '14px', fontSize: '16px', fontWeight: '600' }}
                            >
                                {loading ? 'Creating...' : 'Create Property'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/properties')}
                                style={{ flex: 1, padding: '14px', fontSize: '16px', fontWeight: '600', backgroundColor: 'transparent', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <style>{`
                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }
                @media (max-width: 768px) {
                    .form-grid {
                        grid-template-columns: 1fr;
                    }
                    .container {
                        padding: 20px 10px !important;
                    }
                }
            `}</style>
        </div>
    );
}
