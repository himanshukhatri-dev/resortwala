import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import ImageUpload from '../components/ImageUpload';

import { useModal } from '../context/ModalContext';

export default function EditProperty() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const { showConfirm, showSuccess, showError } = useModal();
    const [formData, setFormData] = useState({
        Name: '',
        Location: '',
        Price: '',
        ShortDescription: '',
        LongDescription: '',
        Facilities: '',
        MaxCapacity: '',
        CheckinDate: '',
        CheckoutDate: ''
    });
    const [images, setImages] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (token) {
            fetchProperty();
            fetchImages();
        }
    }, [id, token]);

    const fetchProperty = async () => {
        try {
            const response = await axios.get(`http://192.168.1.105:8000/api/vendor/properties/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFormData(response.data);
        } catch (err) {
            setError('Failed to load property');
        } finally {
            setLoading(false);
        }
    };

    const fetchImages = async () => {
        try {
            // Assuming endpoint exists, or we might need to rely on property.images if included
            // Let's try fetching directly if supported, otherwise rely on reload
            const response = await axios.get(`http://192.168.1.105:8000/api/vendor/properties/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.images) {
                setImages(response.data.images);
            }
        } catch (err) {
            console.error("Could not fetch images separately");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            await axios.put(`http://192.168.1.105:8000/api/vendor/properties/${id}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await showSuccess('Success', 'Property updated successfully');
            navigate('/properties');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update property');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUploadSuccess = () => {
        fetchImages(); // Refresh images
        showSuccess('Success', 'Images uploaded successfully!');
    };

    const handleDeleteImage = async (imageId) => {
        const confirmed = await showConfirm(
            'Delete Image',
            'Are you sure you want to delete this image?',
            'Delete',
            'Cancel',
            'danger'
        );
        if (!confirmed) return;

        try {
            await axios.delete(`http://192.168.1.105:8000/api/vendor/properties/${id}/images/${imageId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setImages(images.filter(img => img.id !== imageId));
            showSuccess('Deleted', 'Image deleted successfully');
        } catch (err) {
            showError('Error', 'Failed to delete image');
        }
    }

    const handleSetPrimary = async (imageId) => {
        try {
            await axios.put(`http://192.168.1.105:8000/api/vendor/properties/${id}/images/${imageId}/primary`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchImages(); // Refresh to show new primary status
            showSuccess('Updated', 'Primary image updated');
        } catch (err) {
            showError('Error', 'Failed to set primary image');
        }
    }


    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            <div style={{ backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' }}>
                <div className="container">
                    <h1 style={{ fontSize: '24px', color: 'var(--primary-color)' }}>Edit Property</h1>
                </div>
            </div>

            <div className="container" style={{ padding: '40px 20px' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    {error && (
                        <div style={{ padding: '12px', backgroundColor: '#fee', color: '#c33', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>
                            {error}
                        </div>
                    )}

                    {/* Image Management Section */}
                    <div style={{ marginBottom: '40px', borderBottom: '1px solid #eee', paddingBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Property Images</h2>

                        {/* Gallery */}
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
                            {images.map(img => (
                                <div key={img.id} style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden', border: img.is_primary ? '3px solid var(--primary-color)' : '1px solid #ddd' }}>
                                    <img src={`http://192.168.1.105:8000/storage/${img.image_path}`} alt="Property" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '4px', display: 'flex', justifyContent: 'space-around' }}>
                                        {!img.is_primary && (
                                            <button onClick={() => handleSetPrimary(img.id)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '12px', cursor: 'pointer' }} title="Set as Primary">★</button>
                                        )}
                                        <button onClick={() => handleDeleteImage(img.id)} style={{ background: 'none', border: 'none', color: '#ff5252', fontSize: '12px', cursor: 'pointer' }} title="Delete">🗑</button>
                                    </div>
                                    {img.is_primary && <div style={{ position: 'absolute', top: '5px', left: '5px', background: 'var(--primary-color)', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>Primary</div>}
                                </div>
                            ))}
                            {images.length === 0 && <p style={{ color: '#888', fontStyle: 'italic', fontSize: '14px' }}>No images uploaded yet.</p>}
                        </div>

                        <ImageUpload propertyId={id} onUploadSuccess={handleImageUploadSuccess} />
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                                    value={formData.PropertyType || 'Villa'}
                                    onChange={e => setFormData({ ...formData, PropertyType: e.target.value })}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                                >
                                    <option value="Villa">Villa</option>
                                    <option value="Waterpark">Waterpark</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-grid">
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
                        </div>

                        <div className="form-grid">
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Number of Rooms</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.NoofRooms || ''}
                                    onChange={e => setFormData({ ...formData, NoofRooms: e.target.value })}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Occupancy Type</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Double, Triple"
                                    value={formData.Occupancy || ''}
                                    onChange={e => setFormData({ ...formData, Occupancy: e.target.value })}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                                />
                            </div>
                        </div>

                        <div className="form-grid">
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Check-in Date/Time</label>
                                <input
                                    type="datetime-local"
                                    value={formData.CheckinDate ? new Date(formData.CheckinDate).toISOString().slice(0, 16) : ''}
                                    onChange={e => setFormData({ ...formData, CheckinDate: e.target.value })}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Check-out Date/Time</label>
                                <input
                                    type="datetime-local"
                                    value={formData.CheckoutDate ? new Date(formData.CheckoutDate).toISOString().slice(0, 16) : ''}
                                    onChange={e => setFormData({ ...formData, CheckoutDate: e.target.value })}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Short Description</label>
                            <input
                                type="text"
                                value={formData.ShortDescription || ''}
                                onChange={e => setFormData({ ...formData, ShortDescription: e.target.value })}
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Long Description</label>
                            <textarea
                                rows="4"
                                value={formData.LongDescription || ''}
                                onChange={e => setFormData({ ...formData, LongDescription: e.target.value })}
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', resize: 'vertical' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Facilities (comma-separated)</label>
                            <input
                                type="text"
                                placeholder="WiFi, Pool, Parking, Restaurant"
                                value={formData.Facilities || ''}
                                onChange={e => setFormData({ ...formData, Facilities: e.target.value })}
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn"
                                style={{ flex: 1, padding: '14px', fontSize: '16px', fontWeight: '600' }}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
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
