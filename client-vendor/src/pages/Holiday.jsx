import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';

export default function Holiday() {
    const { token } = useAuth();
    const { showConfirm, showSuccess, showError } = useModal();
    const [holidays, setHolidays] = useState([]);
    const [properties, setProperties] = useState([]);
    const [formData, setFormData] = useState({
        property_id: '',
        name: '',
        from_date: '',
        to_date: '',
        base_price: '',
        extra_person_price: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProperties();
        fetchHolidays();
    }, []);

    const fetchProperties = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/vendor/properties`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProperties(response.data);
        } catch (error) {
            console.error('Error fetching properties:', error);
        }
    };

    const fetchHolidays = async () => {
        setLoading(true);
        try {
            // Fetch all holidays
            // Ideally backend should support filtering by vendor's properties
            // For now assuming getAll returns standard list or properties linked
            const response = await axios.get(`${API_BASE_URL}/holidays`);
            setHolidays(response.data);
        } catch (error) {
            console.error('Error fetching holidays:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE_URL}/holidays`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await showSuccess('Success', 'Holiday created successfully!');
            fetchHolidays();
            setFormData({
                property_id: '',
                name: '',
                from_date: '',
                to_date: '',
                base_price: '',
                extra_person_price: ''
            });
        } catch (error) {
            console.error('Error creating holiday:', error);
            showError('Error', 'Failed to create holiday');
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm(
            'Delete Holiday',
            'Are you sure you want to delete this holiday?',
            'Delete',
            'Cancel',
            'danger'
        );
        if (!confirmed) return;

        try {
            await axios.delete(`${API_BASE_URL}/holidays/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchHolidays();
            showSuccess('Deleted', 'Holiday deleted successfully');
        } catch (error) {
            console.error('Error deleting holiday:', error);
            showError('Error', 'Failed to delete holiday');
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            <Sidebar activePage="/holidays" />

            <div className="main-content" style={{ flex: 1, marginLeft: '200px', padding: '30px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#333' }}>Holiday</h2>

                {/* Form */}
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <label style={labelStyle}>From Date</label>
                                <input
                                    type="date"
                                    style={inputStyle}
                                    value={formData.from_date}
                                    onChange={e => setFormData({ ...formData, from_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>To Date</label>
                                <input
                                    type="date"
                                    style={inputStyle}
                                    value={formData.to_date}
                                    onChange={e => setFormData({ ...formData, to_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Property Name</label>
                                <select
                                    style={inputStyle}
                                    value={formData.property_id}
                                    onChange={e => setFormData({ ...formData, property_id: e.target.value })}
                                >
                                    <option value="">Select Property</option>
                                    {properties.map(p => (
                                        <option key={p.PropertyId} value={p.PropertyId}>{p.Name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Holiday Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter Holiday Name"
                                    style={inputStyle}
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Base Price</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 5000"
                                    style={inputStyle}
                                    value={formData.base_price}
                                    onChange={e => setFormData({ ...formData, base_price: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Extra Person Price</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 1000"
                                    style={inputStyle}
                                    value={formData.extra_person_price}
                                    onChange={e => setFormData({ ...formData, extra_person_price: e.target.value })}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="submit" style={saveButtonStyle}>Save</button>
                            <button type="button" style={filterButtonStyle} onClick={fetchHolidays}>Filter</button>
                        </div>
                    </form>
                </div>

                {/* Table */}
                <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#03a9f4', color: 'white', textAlign: 'left' }}>
                                <th style={thStyle}>SR.No</th>
                                <th style={thStyle}>From Date</th>
                                <th style={thStyle}>To Date</th>
                                <th style={thStyle}>Holiday Name</th>
                                <th style={thStyle}>Property Name</th>
                                <th style={thStyle}>Base Price</th>
                                <th style={thStyle}>Extra Person Price</th>
                                <th style={thStyle}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {holidays.length > 0 ? (
                                holidays.map((holiday, index) => (
                                    <tr key={holiday.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={tdStyle}>{index + 1}</td>
                                        <td style={tdStyle}>{new Date(holiday.from_date).toLocaleDateString()}</td>
                                        <td style={tdStyle}>{new Date(holiday.to_date).toLocaleDateString()}</td>
                                        <td style={tdStyle}>{holiday.name}</td>
                                        <td style={tdStyle}>{holiday.property ? holiday.property.Name : 'All'}</td>
                                        <td style={tdStyle}>{holiday.base_price ? `₹${holiday.base_price}` : '-'}</td>
                                        <td style={tdStyle}>{holiday.extra_person_price ? `₹${holiday.extra_person_price}` : '-'}</td>
                                        <td style={tdStyle}>
                                            <button
                                                onClick={() => handleDelete(holiday.id)}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'red' }}
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                        No records found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <style>{`
                    @media (max-width: 768px) {
                        .main-content { margin-left: 60px !important; padding: 15px !important; }
                        div[style*="grid-template-columns: repeat(3, 1fr)"] {
                            grid-template-columns: 1fr !important;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
}

const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    color: '#666',
    fontSize: '14px',
    fontWeight: '500'
};

const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    backgroundColor: '#f8f9fa'
};

const saveButtonStyle = {
    backgroundColor: '#ff4081',
    color: 'white',
    border: 'none',
    padding: '10px 30px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px'
};

const filterButtonStyle = {
    backgroundColor: '#ff4081',
    color: 'white',
    border: 'none',
    padding: '10px 30px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    opacity: 0.8
};

const thStyle = {
    padding: '12px 15px',
    fontSize: '13px',
    fontWeight: '600',
    whiteSpace: 'nowrap'
};

const tdStyle = {
    padding: '12px 15px',
    fontSize: '13px',
    color: '#333'
};
