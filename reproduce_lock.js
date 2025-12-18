import axios from 'axios';

const API_URL = 'http://localhost:8000/api';
const EMAIL = 'vendor@resortwala.com';
const PASSWORD = 'password';

async function reproduce() {
    try {
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/vendor/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        const token = loginRes.data.token;
        console.log('Logged in. Token acquired.');

        console.log('Fetching properties...');
        const propsRes = await axios.get(`${API_URL}/vendor/properties`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (propsRes.data.length === 0) {
            console.error('No properties found for this vendor.');
            return;
        }

        const propertyId = propsRes.data[0].PropertyId;
        console.log(`Using PropertyId: ${propertyId}`);

        // Try to lock dates for next month to avoid conflicts
        const startDate = '2026-01-20';
        const endDate = '2026-01-22';

        console.log(`Attempting to lock dates: ${startDate} to ${endDate}...`);

        try {
            const lockRes = await axios.post(`${API_URL}/vendor/bookings/lock`, {
                property_id: propertyId,
                start_date: startDate,
                end_date: endDate
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Lock successful:', lockRes.data);
        } catch (lockError) {
            console.error('Lock failed!');
            if (lockError.response) {
                console.error('Status:', lockError.response.status);
                console.error('Data:', JSON.stringify(lockError.response.data, null, 2));
            } else {
                console.error('Error:', lockError.message);
            }
        }

    } catch (error) {
        console.error('Script failed:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
        }
    }
}

reproduce();
