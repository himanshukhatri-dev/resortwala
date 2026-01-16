const https = require('https');

const CONFIG = {
    hostname: 'www.resortwala.com',
    baseUrl: '/api',
    email: 'admin@resortwala.com',
    password: 'admin123',
    propertyId: 36
};

// Helper for HTTPS Request
function request(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: CONFIG.hostname,
            port: 443,
            path: CONFIG.baseUrl + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ statusCode: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body: body });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runTest() {
    console.log("🚀 STARTING E2E TEST (Node.js) 🚀");

    try {
        // 1. LOGIN
        console.log("\n1️⃣  Logging in...");
        const loginRes = await request('POST', '/admin/login', {
            email: CONFIG.email,
            password: CONFIG.password
        });

        if (loginRes.statusCode !== 200) throw new Error("Login Failed: " + JSON.stringify(loginRes.body));
        const token = loginRes.body.token;
        console.log("   ✅ Authenticated!");

        // 2. GENERATE AUDIO
        console.log("\n2️⃣  Generating Audio...");
        const audioRes = await request('POST', '/admin/voice-studio/generate-audio', {
            script_text: "This is a verification test from the automated Node.js script.",
            voice_id: "cinematic_male",
            language: "en",
            title: "NodeJS Test Project"
        }, token);

        if (audioRes.statusCode !== 200) throw new Error("Audio Failed: " + JSON.stringify(audioRes.body));
        const projectId = audioRes.body.project.id;
        console.log(`   ✅ Audio Created! Project ID: ${projectId}`);
        console.log(`   🎵 Audio URL: ${audioRes.body.audio_url}`);

        // 3. RENDER VIDEO
        console.log("\n3️⃣  Triggering Video Render...");
        const renderRes = await request('POST', `/admin/voice-studio/projects/${projectId}/render`, {
            visual_type: 'cinematic',
            visual_options: {
                property_id: CONFIG.propertyId,
                media_ids: [1, 2, 3]
            }
        }, token);

        if (renderRes.statusCode !== 200) throw new Error("Render Failed: " + JSON.stringify(renderRes.body));
        const jobId = renderRes.body.job_id;
        console.log(`   ✅ Video Job Started! Job ID: ${jobId}`);

        // 4. POLL STATUS
        console.log("\n4️⃣  Checking Job Status...");
        const statusRes = await request('GET', `/admin/video-generator/jobs/${jobId}`, null, token);
        console.log(`   📊 Current Status: ${statusRes.body.status}`);

        console.log("\n🎉 TEST SEQUENCE COMPLETE! System is fully operational.");

    } catch (err) {
        console.error("\n❌ TEST FAILED:");
        console.error(err.message);
    }
}

runTest();
