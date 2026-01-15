import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env
const envPath = path.resolve('api', '.env');
console.log('Loading env from:', envPath);

let BASE_URL = 'http://localhost:8000/api';

try {
    if (fs.existsSync(envPath)) {
        const envConfig = dotenv.parse(fs.readFileSync(envPath));
        console.log('Env loaded.');
        // If needed, override BASE_URL from env, but localhost:8000 is standard for Laravel serve
    } else {
        console.log('Env file not found at', envPath);
    }
} catch (e) {
    console.error('Error loading env:', e);
}

// Admin Credentials
const EMAIL = 'admin@resortwala.com';
const PASSWORD = 'password';

async function runTest() {
    console.log('🚀 Starting CRM Lifecycle Test...');

    try {
        // 1. LOGIN
        console.log('\n🔐 Logging in as Admin...');
        const loginRes = await axios.post(`${BASE_URL}/login`, {
            email: EMAIL,
            password: PASSWORD
        });

        console.log('Login Status:', loginRes.status);
        const token = loginRes.data.token || loginRes.data.access_token;
        if (!token) throw new Error('No token received');
        console.log('✅ Login Successful. Token received.');

        const headers = { Authorization: `Bearer ${token}` };

        // 2. CREATE LEAD
        console.log('\n➕ Creating New Vendor Lead...');
        const leadData = {
            vendor_name: `Test Vendor ${Date.now()}`,
            contact_person: 'Tester',
            phone: '9876543210',
            email: `test_${Date.now()}@example.com`,
            city: 'Test City',
            property_type: 'Resort',
            source: 'Manual Test'
        };

        const createRes = await axios.post(`${BASE_URL}/admin/crm/leads`, leadData, { headers });
        const leadId = createRes.data.data?.id || createRes.data.id;
        if (!leadId) throw new Error('Lead ID not returned');
        console.log(`✅ Lead Created. ID: ${leadId}`);

        // 3. VERIFY IN LIST
        console.log('\n🔍 Verifying Lead in List...');
        const listRes = await axios.get(`${BASE_URL}/admin/crm/leads?search=${leadData.vendor_name}`, { headers });
        const found = listRes.data.data.find(l => l.id == leadId);
        if (!found) throw new Error('Lead not found in list');
        console.log(`✅ Lead found in list with status: ${found.status}`);

        // 4. UPDATE STATUS
        console.log('\n🔄 Updating Status to "contacted"...');
        const updateRes = await axios.put(`${BASE_URL}/admin/crm/leads/${leadId}`, { status: 'contacted' }, { headers });
        console.log('✅ Status Update Response:', updateRes.status);

        // 5. VERIFY UPDATE
        console.log('\n🔍 Verifying Status Update...');
        const verifyRes = await axios.get(`${BASE_URL}/admin/crm/leads?search=${leadData.vendor_name}`, { headers });
        const updatedLead = verifyRes.data.data.find(l => l.id == leadId);
        if (updatedLead.status !== 'contacted') throw new Error(`Status mismatch. Expected 'contacted', got '${updatedLead.status}'`);
        console.log('✅ Status verified as "contacted".');

        // 6. CHECK STATS
        console.log('\n📊 Checking CRM Stats...');
        const statsRes = await axios.get(`${BASE_URL}/admin/crm/stats`, { headers });
        console.log('✅ Stats received:', JSON.stringify(statsRes.data.by_status, null, 2));

        console.log('\n🎉 CRM Lifecycle Test COMPLETED SUCCESSFULLY!');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Stack:', error.stack);
        }
    }
}

runTest();
