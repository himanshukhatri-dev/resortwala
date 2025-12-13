
const fs = require('fs');
const path = 'api_debug_log.json';

async function testApi() {
    try {
        console.log('Fetching properties...');
        const res = await fetch('http://192.168.1.105:8000/api/properties');
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        console.log(`Got ${data.length} records.`);
        fs.writeFileSync(path, JSON.stringify(data[0] || { error: "Empty Array" }, null, 2));
        console.log('Saved first record to ' + path);
    } catch (e) {
        console.error('Fetch failed:', e.message);
        fs.writeFileSync(path, JSON.stringify({ error: e.message }, null, 2));
    }
}

testApi();
