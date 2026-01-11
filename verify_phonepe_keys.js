const axios = require('axios');
const crypto = require('crypto');

// CREDENTIALS TO TEST (From User's Input)
const MERCHANT_ID = "M223R7WEM0IRX"; // User provided this (Correct format)
const SALT_KEY = "156711f6-bdb7-4734-b490-f53d25b69d69"; // "Client Secret" -> Salt Key
const SALT_INDEX = "1";
const ENV = "PROD";

const BASE_URL = "https://api.phonepe.com/apis/hermes";
const API_ENDPOINT = "/pg/v1/pay";

// Test Payload (Standard Init)
const payload = {
    merchantId: MERCHANT_ID,
    merchantTransactionId: "TEST_VERIFY_" + Date.now(),
    merchantUserId: "USER_TEST_123",
    amount: 100, // ₹1.00
    redirectUrl: "https://www.resortwala.com/payment/success",
    redirectMode: "POST",
    callbackUrl: "https://www.resortwala.com/api/payment/callback",
    mobileNumber: "9999999999",
    paymentInstrument: {
        type: "PAY_PAGE"
    }
};

const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
const stringToHash = base64Payload + API_ENDPOINT + SALT_KEY;
const checksum = crypto.createHash('sha256').update(stringToHash).digest('hex') + "###" + SALT_INDEX;

console.log("--- PhonePe Key Verification ---");
console.log(`Using Merchant ID: ${MERCHANT_ID}`);
console.log(`Environment: ${ENV}`);
console.log(`Target URL: ${BASE_URL}${API_ENDPOINT}`);

axios.post(BASE_URL + API_ENDPOINT, { request: base64Payload }, {
    headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum
    }
})
    .then(res => {
        console.log("\n✅ SUCCESS!");
        console.log("Status:", res.status);
        console.log("Response:", JSON.stringify(res.data, null, 2));
        console.log("\nConclusion: KEYS ARE VALID.");
    })
    .catch(err => {
        console.log("\n❌ FAILED!");
        if (err.response) {
            console.log("Status:", err.response.status);
            console.log("Error Response:", JSON.stringify(err.response.data, null, 2));

            const code = err.response.data?.code;
            if (code === 'BAD_REQUEST' || err.response.data?.message?.includes('Key not found')) {
                console.log("\nDiagnosis: WRONG KEYS. The Merchant ID or Salt Key is incorrect.");
                console.log("Tip: Ensure you are using the MERCHANT ID (short string), not the Client ID (SU25...).");
            } else if (code === 'UNAUTHORIZED') {
                console.log("\nDiagnosis: UNAUTHORIZED. Check Salt Key or Index.");
            }
        } else {
            console.log("Error:", err.message);
        }
    });
