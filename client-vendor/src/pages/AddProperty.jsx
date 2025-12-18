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
        CheckoutDate: '',
        price_mon_thu: '',
        price_fri_sun: '',
        price_sat: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('/api/vendor/properties', formData, {
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
                        {/* Row 1 */}
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

                        {/* Row 2 */}
                        <div>
                            <label className="form-label">Location *</label>
                            <input className="form-input" type="text" required value={formData.Location} onChange={e => setFormData({ ...formData, Location: e.target.value })} />
                        </div>

                        {/* Row 3: Price & Capacity */}
                        <div className="form-grid">
                            <div>
                                <label className="form-label">Default Price per Night (₹) *</label>
                                <input className="form-input" type="number" required min="0" value={formData.Price} onChange={e => setFormData({ ...formData, Price: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Max Capacity *</label>
                                <input className="form-input" type="number" required min="1" value={formData.MaxCapacity} onChange={e => setFormData({ ...formData, MaxCapacity: e.target.value })} />
                            </div>
                        </div>

                        {/* Dynamic Pricing Section */}
                        <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Dynamic Pricing (Optional)</label>
                            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                                <div>
                                    <label className="form-label" style={{ fontSize: '12px' }}>Mon-Thu Price</label>
                                    <input className="form-input" type="number" min="0" placeholder="Default" value={formData.price_mon_thu} onChange={e => setFormData({ ...formData, price_mon_thu: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label" style={{ fontSize: '12px' }}>Fri & Sun Price</label>
                                    <input className="form-input" type="number" min="0" placeholder="Default" value={formData.price_fri_sun} onChange={e => setFormData({ ...formData, price_fri_sun: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label" style={{ fontSize: '12px' }}>Saturday Price</label>
                                    <input className="form-input" type="number" min="0" placeholder="Default" value={formData.price_sat} onChange={e => setFormData({ ...formData, price_sat: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* Row 4 */}
                        <div>
                            <label className="form-label">Short Description</label>
                            <input className="form-input" type="text" value={formData.ShortDescription} onChange={e => setFormData({ ...formData, ShortDescription: e.target.value })} />
                        </div>

                        {/* Row 5 */}
                        <div>
                            <label className="form-label">Long Description</label>
                            <textarea className="form-input" rows="4" value={formData.LongDescription} onChange={e => setFormData({ ...formData, LongDescription: e.target.value })} style={{ resize: 'vertical' }} />
                        </div>

                        {/* Row 6 */}
                        <div>
                            <label className="form-label">Facilities (comma-separated)</label>
                            <input className="form-input" type="text" placeholder="WiFi, Pool, Parking..." value={formData.Facilities} onChange={e => setFormData({ ...formData, Facilities: e.target.value })} />
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                            <button type="submit" disabled={loading} className="btn" style={{ flex: 1, padding: '14px', fontSize: '16px', fontWeight: '600' }}>
                                {loading ? 'Creating...' : 'Create Property'}
                            </button>
                            <button type="button" onClick={() => navigate('/properties')} style={{ flex: 1, padding: '14px', fontSize: '16px', fontWeight: '600', background: 'transparent', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}>
                                Cancel
                            </button>
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
