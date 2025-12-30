const axios = require('axios');

const IP = 'http://72.61.242.42';
const paths = [
    '/',
    '/admin',
    '/vendor',
    '/client-vendor',
    '/stagingvendor.resortwala.com',
    '/login'
];

async function probe() {
    console.log(`Probing ${IP}...`);
    for (const path of paths) {
        try {
            const url = `${IP}${path}`;
            const res = await axios.get(url, { timeout: 3000, validateStatus: () => true });
            console.log(`[${res.status}] ${url} - Title: ${res.data.toString().match(/<title>(.*?)<\/title>/)?.[1] || 'No Title'}`);
        } catch (err) {
            console.log(`[Error] ${IP}${path}: ${err.message}`);
        }
    }
}

probe();
