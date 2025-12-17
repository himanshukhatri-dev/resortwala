import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaTimes, FaMapMarkerAlt } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function CalendarSelectorModal({ isOpen, onClose }) {
    const { token } = useAuth();
    const navigate = useNavigate();
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

    const handleSelect = (propertyId) => {
        navigate(`/properties/${propertyId}/calendar`);
        onClose();
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
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Select Property for Calendar</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>
                        <FaTimes />
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>Loading properties...</div>
                ) : properties.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No properties found.</div>
                ) : (
                    <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {properties.map(p => (
                            <div
                                key={p.PropertyId}
                                onClick={() => handleSelect(p.PropertyId)}
                                style={{
                                    border: '1px solid #eee', borderRadius: '12px', padding: '16px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    transition: 'all 0.2s', backgroundColor: '#f9fafb',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor = '#f0f9ff';
                                    e.currentTarget.style.borderColor = '#b3e5fc';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = '#f9fafb';
                                    e.currentTarget.style.borderColor = '#eee';
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '16px', color: '#1f2937' }}>{p.Name}</div>
                                    <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <FaMapMarkerAlt size={10} /> {p.Location}
                                    </div>
                                </div>
                                <div style={{ color: '#009688' }}>
                                    <FaCalendarAlt size={20} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
