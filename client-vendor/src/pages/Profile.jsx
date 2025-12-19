import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import axios from 'axios';

export default function Profile() {
    const { user, token, updateUser } = useAuth();
    const { showSuccess, showError } = useModal();
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState({
        name: '',
        user_name: '',
        phone: '',
        email: '',
        business_name: '',
        business_logo: '',
        address: '',
        city: '',
        state: '',
        country: '',
        zip_code: '',
        description: ''
    });

    useEffect(() => {
        if (user) {
            setProfile({
                name: user.name || '',
                user_name: user.user_name || '',
                phone: user.phone || '',
                email: user.email || '',
                business_name: user.business_name || '',
                business_logo: user.business_logo || '',
                address: user.address || '',
                city: user.city || '',
                state: user.state || '',
                country: user.country || '',
                zip_code: user.zip_code || '',
                description: user.description || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.put(`${API_BASE_URL}/admin/vendor/profile`, profile, {
                headers: { Authorization: `Bearer ${token}` }
            });

            showSuccess('Success', 'Profile updated successfully!');
            updateUser(response.data.user);
        } catch (error) {
            console.error(error);
            showError('Error', error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '15px', color: '#333' }}>Vendor Profile</h2>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>

                <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '5px' }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#eee',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#888',
                        backgroundImage: profile.business_logo ? `url(${profile.business_logo})` : 'none',
                        backgroundSize: 'cover'
                    }}>
                        {!profile.business_logo && '🏢'}
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '13px' }}>Business Logo URL</label>
                        <input
                            type="text"
                            name="business_logo"
                            value={profile.business_logo}
                            onChange={handleChange}
                            placeholder="https://example.com/logo.png"
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', width: '100%', fontSize: '14px' }}
                        />
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#555', fontWeight: '500', fontSize: '13px' }}>Full Name</label>
                    <input
                        type="text"
                        name="name"
                        value={profile.name}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#555', fontWeight: '500', fontSize: '13px' }}>Username (Login)</label>
                    <input
                        type="text"
                        name="user_name"
                        value={profile.user_name}
                        onChange={handleChange}
                        disabled
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: '#f9f9f9', cursor: 'not-allowed', fontSize: '14px' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#555', fontWeight: '500', fontSize: '13px' }}>Email Address</label>
                    <input
                        type="email"
                        name="email"
                        value={profile.email}
                        onChange={handleChange}
                        disabled
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: '#f9f9f9', cursor: 'not-allowed', fontSize: '14px' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#555', fontWeight: '500', fontSize: '13px' }}>Phone Number</label>
                    <input
                        type="tel"
                        name="phone"
                        value={profile.phone}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
                    />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#555', fontWeight: '500', fontSize: '13px' }}>Business Name</label>
                    <input
                        type="text"
                        name="business_name"
                        value={profile.business_name}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
                    />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#555', fontWeight: '500', fontSize: '13px' }}>Description / Bio</label>
                    <textarea
                        name="description"
                        value={profile.description}
                        onChange={handleChange}
                        rows={2}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontFamily: 'inherit', fontSize: '14px' }}
                    />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                    <h3 style={{ fontSize: '16px', margin: '10px 0 5px', color: '#333' }}>Address</h3>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#555', fontWeight: '500', fontSize: '13px' }}>Street Address</label>
                    <input
                        type="text"
                        name="address"
                        value={profile.address}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#555', fontWeight: '500', fontSize: '13px' }}>City</label>
                    <input
                        type="text"
                        name="city"
                        value={profile.city}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#555', fontWeight: '500', fontSize: '13px' }}>State</label>
                    <input
                        type="text"
                        name="state"
                        value={profile.state}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#555', fontWeight: '500', fontSize: '13px' }}>Country</label>
                    <input
                        type="text"
                        name="country"
                        value={profile.country}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: '#555', fontWeight: '500', fontSize: '13px' }}>Zip Code</label>
                    <input
                        type="text"
                        name="zip_code"
                        value={profile.zip_code}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
                    />
                </div>


                <div style={{ gridColumn: 'span 2', marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: 'var(--primary-color)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
