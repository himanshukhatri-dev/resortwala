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
        // Login
        const login = await request('POST', '/admin/login', { email: CONFIG.email, password: CONFIG.password });
        const token = login.body.token;

        // Get Jobs
        const jobs = await request('GET', '/admin/video-generator', null, token);

        console.log("\n🎥 VIDEO GENERATION HISTORY 🎥");
        console.log("=================================");

        if (!Array.isArray(jobs.body)) {
            console.log("No jobs found or error retrieving jobs.");
            console.log(jobs.body);
            return;
        }

        jobs.body.slice(0, 10).forEach(job => {
            const date = new Date(job.created_at).toLocaleString();
            const status = job.status.toUpperCase();
            const propName = job.property ? job.property.Name : 'Unknown Property';

            console.log(`\n[${status}] ${propName}`);
            console.log(`Job ID:   ${job.id}`);
            console.log(`Created:  ${date}`);

            if (job.status === 'completed' && job.output_path) {
                const url = `https://www.resortwala.com/storage/${job.output_path}`;
                console.log(`VIDEO URL: ${url}`);
            } else if (job.status === 'failed') {
                console.log(`Error:    ${job.error_message || 'Unknown Error'}`);
            }
        });
        console.log("\n=================================");

    } catch (e) {
        console.error(e);
    }
})();
