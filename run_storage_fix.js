const https = require('https');

const CONFIG = {
    hostname: 'www.resortwala.com',
    baseUrl: '/api',
    email: 'admin@resortwala.com',
    password: 'admin123'
};

function request(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: CONFIG.hostname,
            port: 443,
            path: CONFIG.baseUrl + path,
            method: method,
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try { resolve({ statusCode: res.statusCode, body: JSON.parse(body) }); }
                catch (e) { resolve({ statusCode: res.statusCode, body: body }); }
            });
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

(async () => {
    try {
        console.log("🔐 Authenticating...");
        const login = await request('POST', '/admin/login', { email: CONFIG.email, password: CONFIG.password });
        const token = login.body.token;

        console.log("🛠️  Triggering Storage Fix...");
        const fix = await request('GET', '/admin/voice-studio/fix-storage', null, token);
        
        console.log("Response Code:", fix.statusCode);
        console.log("Response Body:", JSON.stringify(fix.body, null, 2));

    } catch (e) {
        console.error("Error:", e);
    }
})();
