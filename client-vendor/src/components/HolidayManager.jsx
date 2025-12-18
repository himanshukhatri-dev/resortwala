
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTrash, FaPlus, FaCalendarAlt } from 'react-icons/fa';

export default function HolidayManager({ propertyId, token }) {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newHoliday, setNewHoliday] = useState({
        name: '',
        from_date: '',
        to_date: '',
        base_price: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (propertyId) {
            fetchHolidays();
        }
    }, [propertyId]);

    const fetchHolidays = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/holidays?property_id=${propertyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHolidays(response.data);
        } catch (err) {
            console.error("Failed to fetch holidays", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        setError('');

        if (!newHoliday.name || !newHoliday.from_date || !newHoliday.to_date || !newHoliday.base_price) {
            setError('All fields are required');
            return;
        }

        try {
            const payload = {
                ...newHoliday,
                property_id: propertyId
            };
            const response = await axios.post('/api/holidays', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHolidays([...holidays, response.data]);
            setNewHoliday({ name: '', from_date: '', to_date: '', base_price: '' }); // Reset form
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add holiday');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this holiday?')) return;
        try {
            await axios.delete(`/api/holidays/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHolidays(holidays.filter(h => h.id !== id));
        } catch (err) {
            alert('Failed to delete holiday');
        }
    };

    return (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', marginTop: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaCalendarAlt /> Manage Holiday Pricing
            </h3>

            {/* List Existing Holidays */}
            <div style={{ marginBottom: '20px' }}>
                {loading ? <p>Loading holidays...</p> : (
                    holidays.length === 0 ? <p style={{ color: '#666', fontSize: '14px' }}>No holidays added yet.</p> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {holidays.map(h => (
                                <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', padding: '10px', borderRadius: '6px', fontSize: '14px' }}>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>{h.name}</div>
                                        <div style={{ color: '#666', fontSize: '12px' }}>
                                            {new Date(h.from_date).toLocaleDateString()} - {new Date(h.to_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>₹{parseFloat(h.base_price).toLocaleString()}</span>
                                        <button type="button" onClick={() => handleDelete(h.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Add New Holiday Form */}
            <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '10px', fontWeight: '600' }}>Add New Holiday</h4>
                {error && <p style={{ color: 'red', fontSize: '12px', marginBottom: '10px' }}>{error}</p>}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                    <input
                        type="text"
                        placeholder="Holiday Name (e.g. Christmas)"
                        value={newHoliday.name}
                        onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })}
                        style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <input
                        type="date"
                        value={newHoliday.from_date}
                        onChange={e => setNewHoliday({ ...newHoliday, from_date: e.target.value })}
                        style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <input
                        type="date"
                        value={newHoliday.to_date}
                        onChange={e => setNewHoliday({ ...newHoliday, to_date: e.target.value })}
                        style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <input
                        type="number"
                        placeholder="Price (₹)"
                        value={newHoliday.base_price}
                        onChange={e => setNewHoliday({ ...newHoliday, base_price: e.target.value })}
                        style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <button
                        type="button"
                        onClick={handleAdd}
                        style={{ padding: '8px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                    >
                        <FaPlus size={12} /> Add
                    </button>
                </div>
            </div>
        </div>
    );
}
