const axios = require('axios');

const TARGET_URL = 'https://beta.resortwala.com/api/payment/callback';

console.log(`Sending INVALID request to ${TARGET_URL}...`);

// Send empty body to trigger "Invalid Callback"
axios.post(TARGET_URL, {}, {
    validateStatus: () => true, // Accept all status codes
    headers: {
        'Content-Type': 'application/json'
    }
})
    .then(res => {
        console.log("Status:", res.status);
        console.log("Response Data:", JSON.stringify(res.data, null, 2));
    })
    .catch(err => {
        console.error("Error:", err.message);
    });
