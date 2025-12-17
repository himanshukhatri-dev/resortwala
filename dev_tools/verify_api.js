const axios = require('axios');

async function testParam() {
    try {
        const res = await axios.get('http://localhost:8000/api/properties');
        if (res.data && res.data.length > 0) {
            console.log("First Property ID:", res.data[0].PropertyId);
            console.log("First Property Location:", res.data[0].Location);

            // Test single fetch
            const id = res.data[0].PropertyId;
            const singleRes = await axios.get(`http://localhost:8000/api/properties/${id}`);
            console.log("Single Fetch Success:", singleRes.status === 200);

            // Test Search
            const loc = res.data[0].Location;
            if (loc) {
                const searchRes = await axios.get(`http://localhost:8000/api/properties?location=${encodeURIComponent(loc)}`);
                console.log(`Search for '${loc}' found items:`, searchRes.data.length);
            }
        } else {
            console.log("No properties found.");
        }
    } catch (err) {
        console.error("Error:", err.message);
    }
}

testParam();
