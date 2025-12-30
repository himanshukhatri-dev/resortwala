const axios = require('axios');

const API_URL = 'http://72.61.242.42/api'; // Assuming /api is the prefix via Nginx or similar, or direct port?
// Actually stagingapi.resortwala.com resolves to the IP. 
// Let's try the IP directly if host headers are handled, or the domain if DNS works (user said IP).
// The user said "testing to be done staging URL which is IP on server".
// Deploy script uses domains but they might map to folders.
// Let's try the assumed path from earlier: http://72.61.242.42/api/properties?page=1?
// Or maybe specific port?
// Let's check deploy.ps1 again for API URL structure if needed.
// Earlier debug showed Access to /admin etc.
// Let's assume the API is at http://72.61.242.42/api (common pattern) or the separate domain folder.
// Actually, earlier I cleared route cache in /var/www/html/stagingapi.resortwala.com
// This implies the API is hosting on a vhost.
// If I use IP, I might typically hit the default site.
// But the user said "staging URL which is IP". 
// I'll try catching the response.

async function verify() {
    try {
        // Try with Host header just in case, or direct IP path if mapped
        // Inspecting local .env might reveal the VITE_API_BASE_URL used in Customer App.

        // Let's guess standard Laravel API path
        const url = 'http://72.61.242.42/api/properties?page=1';
        console.log(`Fetching ${url}...`);

        const res = await axios.get(url, { validateStatus: () => true });
        console.log(`Status: ${res.status}`);

        if (res.data.data && Array.isArray(res.data.data)) {
            console.log('✅ Pagination structure found (data.data exists).');
            console.log(`Items count: ${res.data.data.length}`);
            console.log(`Next Page URL: ${res.data.next_page_url}`);
        } else {
            console.log('❌ Pagination structure NOT found.');
            console.log('Keys:', Object.keys(res.data));
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

verify();
