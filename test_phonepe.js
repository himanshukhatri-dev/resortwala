const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const axios = require('axios'); // Ensure axios is installed or use native

// 1. Load Configuration
const envPath = path.resolve(__dirname, 'beta.env');
console.log('Loading config from:', envPath);

const env = {};
try {
    const data = fs.readFileSync(envPath, 'utf8');
    data.replace(/\r\n/g, '\n').split('\n').forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        const idx = line.indexOf('=');
        if (idx !== -1) {
            let val = line.substring(idx + 1).trim();
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            env[line.substring(0, idx).trim()] = val;
        }
    });
} catch (e) {
    console.error("Failed to read .env file");
    process.exit(1);
}

const SALT_KEY = env.PHONEPE_SALT_KEY;
const SALT_INDEX = env.PHONEPE_SALT_INDEX;
const TARGET_URL = 'https://beta.resortwala.com/api/payment/callback'; // Default to Beta
// const TARGET_URL = 'http://localhost:8000/api/payment/callback'; // Local

if (!SALT_KEY || !SALT_INDEX) {
    console.error("Error: PHONEPE_SALT_KEY or PHONEPE_SALT_INDEX missing in beta.env");
    process.exit(1);
}

// 2. Helper Functions
function generateChecksum(base64Payload, endpoint = '') {
    const stringToHash = base64Payload + endpoint + SALT_KEY;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    return sha256 + '###' + SALT_INDEX;
}

function createSuccessPayload(merchantTxnId, amountPaise = 100) {
    const data = {
        code: "PAYMENT_SUCCESS",
        merchantId: env.PHONEPE_MERCHANT_ID || "TESTMERCHANT",
        transactionId: "TXN_PHONEPE_12345",
        amount: amountPaise,
        data: {
            merchantId: env.PHONEPE_MERCHANT_ID || "TESTMERCHANT",
            merchantTransactionId: merchantTxnId,
            transactionId: "TXN_PHONEPE_GEN_" + Date.now(),
            amount: amountPaise,
            state: "COMPLETED",
            responseCode: "SUCCESS",
            paymentInstrument: {
                type: "UPI",
                utr: "1234567890"
            }
        }
    };
    return Buffer.from(JSON.stringify(data)).toString('base64');
}

// 3. Execution Logic
const bookingId = process.argv[2] || "TEST_BOOKING_ID";
const txnId = `TXN_${bookingId}_${Math.floor(Date.now() / 1000)}`;

console.log(`\n--- PhonePe Callback Tester ---`);
console.log(`Target Booking ID: ${bookingId}`);
console.log(`Generated Txn ID:  ${txnId}`);

const base64Payload = createSuccessPayload(txnId);
// Checksum calculation for Callback usually DOES NOT include the endpoint path in the hash string 
// (It is strictly SHA256(base64Body + salt) + ### + index for standard callbacks, 
// BUT PhonePe documentation varies. Typically for S2S callback it is body+salt).
// Let's assume Standard Callback verification: SHA256(response + salt) + ### + index
const checksum = generateChecksum(base64Payload, "");

console.log(`\nGenerated Payload (Base64): ${base64Payload.substring(0, 50)}...`);
console.log(`Generated X-VERIFY: ${checksum}`);

console.log(`\n--- Curl Command ---`);
console.log(`curl -X POST "${TARGET_URL}" \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -H "X-VERIFY: ${checksum}" \\`);
console.log(`  -d "{\\"response\\": \\"${base64Payload}\\"}"`);

// 4. Auto-Send Option
if (process.argv.includes('--send')) {
    console.log(`\n--- Sending Request to ${TARGET_URL} ---`);
    axios.post(TARGET_URL, { response: base64Payload }, {
        maxRedirects: 0, // Disable following redirects to debug 3xx responses
        validateStatus: function (status) {
            return status >= 200 && status < 500; // Resolve promise for 3xx/4xx too
        },
        headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': checksum
        }
    })
        .then(res => {
            console.log("Response Status:", res.status);
            if (res.status >= 300 && res.status < 400) {
                console.log("Redirect Location:", res.headers.location);
            }
            console.log("Response Headers:", res.headers);
            console.log("Response Data Preview:", typeof res.data === 'string' ? res.data.substring(0, 200) : res.data);
        })
        .catch(err => {
            console.error("Request Failed:");
            if (err.response) {
                console.error("Status:", err.response.status);
                console.error("Data:", err.response.data);
            } else {
                console.error(err.message);
            }
        });
} else {
    console.log(`\nTo actually send the request, run: node test_phonepe.js <BookingId> --send`);
}
