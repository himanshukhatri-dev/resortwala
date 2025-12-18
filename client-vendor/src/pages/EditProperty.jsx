import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import ImageUpload from '../components/ImageUpload';
import HolidayManager from '../components/HolidayManager';
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
        CheckoutDate: '',
        price_mon_thu: '',
        price_fri_sun: '',
        price_sat: '',
        NoofRooms: '',
        Occupancy: '',
        PropertyType: 'Villa'
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
            const response = await axios.get(`/api/vendor/properties/${id}`, {
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
            const response = await axios.get(`/api/vendor/properties/${id}`, {
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
            await axios.put(`/api/vendor/properties/${id}`, formData, {
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
        fetchImages();
        showSuccess('Success', 'Images uploaded successfully!');
    };

    const handleDeleteImage = async (imageId) => {
        const confirmed = await showConfirm('Delete Image', 'Are you sure?', 'Delete', 'Cancel', 'danger');
        if (!confirmed) return;
        try {
            await axios.delete(`/api/vendor/properties/${id}/images/${imageId}`, { headers: { Authorization: `Bearer ${token}` } });
            setImages(images.filter(img => img.id !== imageId));
            showSuccess('Deleted', 'Image deleted successfully');
        } catch (err) {
            showError('Error', 'Failed to delete image');
        }
    }

    const handleSetPrimary = async (imageId) => {
        try {
            await axios.put(`/api/vendor/properties/${id}/images/${imageId}/primary`, {}, { headers: { Authorization: `Bearer ${token}` } });
            fetchImages();
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
                    {error && <div style={{ padding: '12px', backgroundColor: '#fee', color: '#c33', borderRadius: '6px', marginBottom: '20px' }}>{error}</div>}

                    {/* Image Management */}
                    <div style={{ marginBottom: '40px', borderBottom: '1px solid #eee', paddingBottom: '30px' }}>
                        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Property Images</h2>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
                            {images.map(img => (
                                <div key={img.id} style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden', border: img.is_primary ? '3px solid var(--primary-color)' : '1px solid #ddd' }}>
                                    <img src={`/storage/${img.image_path}`} alt="Property" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '4px', display: 'flex', justifyContent: 'space-around' }}>
                                        {!img.is_primary && <button onClick={() => handleSetPrimary(img.id)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>★</button>}
                                        <button onClick={() => handleDeleteImage(img.id)} style={{ background: 'none', border: 'none', color: '#ff5252', cursor: 'pointer' }}>🗑</button>
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
                                <label className="form-label">Property Name *</label>
                                <input className="form-input" type="text" required value={formData.Name} onChange={e => setFormData({ ...formData, Name: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">PropertyType *</label>
                                <select className="form-input" required value={formData.PropertyType} onChange={e => setFormData({ ...formData, PropertyType: e.target.value })}>
                                    <option value="Villa">Villa</option>
                                    <option value="Waterpark">Waterpark</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Location *</label>
                            <input className="form-input" type="text" required value={formData.Location} onChange={e => setFormData({ ...formData, Location: e.target.value })} />
                        </div>

                        <div className="form-grid">
                            <div>
                                <label className="form-label">Price per Night (₹) *</label>
                                <input className="form-input" type="number" required min="0" value={formData.Price} onChange={e => setFormData({ ...formData, Price: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Max Capacity *</label>
                                <input className="form-input" type="number" required min="1" value={formData.MaxCapacity} onChange={e => setFormData({ ...formData, MaxCapacity: e.target.value })} />
                            </div>
                        </div>

                        {/* Dynamic Pricing */}
                        <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Dynamic Pricing (Optional)</label>
                            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                                <div>
                                    <label className="form-label" style={{ fontSize: '12px' }}>Mon-Thu Price</label>
                                    <input className="form-input" type="number" min="0" value={formData.price_mon_thu || ''} onChange={e => setFormData({ ...formData, price_mon_thu: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label" style={{ fontSize: '12px' }}>Fri & Sun Price</label>
                                    <input className="form-input" type="number" min="0" value={formData.price_fri_sun || ''} onChange={e => setFormData({ ...formData, price_fri_sun: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label" style={{ fontSize: '12px' }}>Saturday Price</label>
                                    <input className="form-input" type="number" min="0" value={formData.price_sat || ''} onChange={e => setFormData({ ...formData, price_sat: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* Holiday Pricing Manager */}
                        <HolidayManager propertyId={id} token={token} />

                        <div className="form-grid">
                            <div>
                                <label className="form-label">Number of Rooms</label>
                                <input className="form-input" type="number" min="0" value={formData.NoofRooms || ''} onChange={e => setFormData({ ...formData, NoofRooms: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Occupancy Type</label>
                                <input className="form-input" type="text" placeholder="e.g. Double" value={formData.Occupancy || ''} onChange={e => setFormData({ ...formData, Occupancy: e.target.value })} />
                            </div>
                        </div>

                        <div className="form-grid">
                            <div>
                                <label className="form-label">Check-in</label>
                                <input className="form-input" type="datetime-local" value={formData.CheckinDate ? new Date(formData.CheckinDate).toISOString().slice(0, 16) : ''} onChange={e => setFormData({ ...formData, CheckinDate: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Check-out</label>
                                <input className="form-input" type="datetime-local" value={formData.CheckoutDate ? new Date(formData.CheckoutDate).toISOString().slice(0, 16) : ''} onChange={e => setFormData({ ...formData, CheckoutDate: e.target.value })} />
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Short Description</label>
                            <input className="form-input" type="text" value={formData.ShortDescription || ''} onChange={e => setFormData({ ...formData, ShortDescription: e.target.value })} />
                        </div>

                        <div>
                            <label className="form-label">Long Description</label>
                            <textarea className="form-input" rows="4" value={formData.LongDescription || ''} onChange={e => setFormData({ ...formData, LongDescription: e.target.value })} style={{ resize: 'vertical' }} />
                        </div>

                        <div>
                            <label className="form-label">Facilities</label>
                            <input className="form-input" type="text" value={formData.Facilities || ''} onChange={e => setFormData({ ...formData, Facilities: e.target.value })} />
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                            <button type="submit" disabled={saving} className="btn" style={{ flex: 1, padding: '14px', fontSize: '16px', fontWeight: '600' }}>{saving ? 'Saving...' : 'Save Changes'}</button>
                            <button type="button" onClick={() => navigate('/properties')} style={{ flex: 1, padding: '14px', fontSize: '16px', fontWeight: '600', background: 'transparent', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
            <style>{`
                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .form-label { display: block; margin-bottom: 6px; fontSize: 14px; font-weight: 500; }
                .form-input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; fontSize: 14px; }
                .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
                @media (max-width: 768px) {
                    .form-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    );
}
