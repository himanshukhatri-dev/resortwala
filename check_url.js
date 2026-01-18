const https = require('https');

const url = 'https://www.resortwala.com/storage/videos/video_render_1768561024.mp4';

const req = https.request(url, { method: 'HEAD' }, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
});

req.on('error', (e) => {
    console.error(`ERROR: ${e.message}`);
});

req.end();
