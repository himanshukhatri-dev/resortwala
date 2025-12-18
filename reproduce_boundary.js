import axios from 'axios';

const API_URL = 'http://localhost:8000/api';
const EMAIL = 'vendor@resortwala.com';
const PASSWORD = 'password';

async function reproduce() {
    try {
        const loginRes = await axios.post(`${API_URL}/vendor/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        const token = loginRes.data.token;
        const propsRes = await axios.get(`${API_URL}/vendor/properties`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const propertyId = propsRes.data[0].PropertyId;

        console.log(`PropertyId: ${propertyId}`);

        // 1. Create a base booking (Feb 10 - Feb 15)
        // We use the lock endpoint to create it easily, assuming lock works for empty slots
        const baseStart = '2026-02-10';
        const baseEnd = '2026-02-15';

        try {
            console.log(`Creating base booking: ${baseStart} to ${baseEnd}`);
            await axios.post(`${API_URL}/vendor/bookings/lock`, {
                property_id: propertyId,
                start_date: baseStart,
                end_date: baseEnd
            }, { headers: { Authorization: `Bearer ${token}` } });
            console.log('Base booking created.');
        } catch (e) {
            console.log('Base booking might already exist or failed:', e.message);
        }

        // 2. Try to lock adjacent AFTER (Feb 15 - Feb 18)
        // Should SUCCEED in a correct system (Check-in on Check-out day)
        // Will FAIL in current implementation
        console.log(`Attempting to lock adjacent AFTER: ${baseEnd} to 2026-02-18`);
        try {
            await axios.post(`${API_URL}/vendor/bookings/lock`, {
                property_id: propertyId,
                start_date: baseEnd,
                end_date: '2026-02-18'
            }, { headers: { Authorization: `Bearer ${token}` } });
            console.log('SUCCESS: Locked adjacent range.');
        } catch (e) {
            console.error('FAILURE: Could not lock adjacent range.');
            console.error('Response:', e.response?.data);
        }

    } catch (error) {
        console.error('Script failed:', error.message);
    }
}

reproduce();
