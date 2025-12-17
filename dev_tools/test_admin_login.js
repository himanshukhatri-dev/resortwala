const axios = require('axios');

async function testAdminLogin() {
    try {
        const response = await axios.post('http://localhost:8000/api/admin/login', {
            email: 'admin@resortwala.com',
            password: 'admin123'
        });
        console.log('Login successful!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Login failed!');
        console.error('Error:', error.response?.data || error.message);
    }
}

testAdminLogin();
