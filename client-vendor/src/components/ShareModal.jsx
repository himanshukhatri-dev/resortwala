import React, { useState, useEffect } from 'react';
import { FaWhatsapp, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function ShareModal({ isOpen, onClose }) {
    const { token } = useAuth();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchProperties();
        }
    }, [isOpen]);

    const fetchProperties = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/vendor/properties', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const allProperties = response.data;
            const approvedProperties = allProperties.filter(p => p.is_approved == 1 || p.is_approved === true);
            setProperties(approvedProperties);
        } catch (error) {
            console.error('Error fetching properties', error);
        } finally {
            setLoading(false);
        }
    };

    const handleShare = (property) => {
        // Use environment variable for client URL or fallback to current origin logic
        // If we are on vendor app, we want to link to customer app.
        // In local: window default is 5173 (Customer) vs 8081/3002 (Vendor)
        // In prod: window usually same domain different port or path.

        // Better logic: Use the known production customer URL if available, else standard fallback
        const customerBaseUrl = import.meta.env.VITE_CUSTOMER_URL ||
            (window.location.hostname === 'localhost' ? 'http://localhost:5173' : window.location.origin.replace(':8081', ''));

        const link = `${customerBaseUrl}/stay/${property.share_token || property.PropertyId}`;
        const message = `Check out *${property.Name}* in ${property.Location}!\n\n${property.ShortDescription || 'Beautiful property available for booking.'}\n\nPrice: ₹${property.Price}/night\n\nView details & availability: ${link}`;

        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '16px', width: '90%', maxWidth: '500px',
                padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Share Property</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>
                        <FaTimes />
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>Loading properties...</div>
                ) : properties.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No properties found to share.</div>
                ) : (
                    <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {properties.map(p => (
                            <div key={p.PropertyId} style={{
                                border: '1px solid #eee', borderRadius: '12px', padding: '16px',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                transition: 'background-color 0.2s', backgroundColor: '#f9fafb'
                            }}>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '16px', color: '#1f2937' }}>{p.Name}</div>
                                    <div style={{ fontSize: '13px', color: '#6b7280' }}>📍 {p.Location} • ₹{p.Price}</div>
                                </div>
                                <button
                                    onClick={() => handleShare(p)}
                                    style={{
                                        backgroundColor: '#25D366', color: 'white', border: 'none',
                                        padding: '10px 16px', borderRadius: '8px', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        fontWeight: '600', fontSize: '13px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <FaWhatsapp size={16} /> Share
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
