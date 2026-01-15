const http = require('http');

const options = {
    hostname: '127.0.0.1',
    port: 8000,
    path: '/api/properties/29',
    method: 'GET',
    family: 4 // Force IPv4
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            if (res.statusCode !== 200) {
                console.error(`Status Code: ${res.statusCode}, Body: ${data}`);
                return;
            }
            const json = JSON.parse(data);
            console.log(JSON.stringify({
                Price: json.Price,
                ResortWalaRate: json.ResortWalaRate,
                admin_pricing: json.admin_pricing,
                price_mon_thu: json.price_mon_thu,
                price_fri_sun: json.price_fri_sun,
                price_sat: json.price_sat
            }, null, 2));
        } catch (e) {
            console.error("Parse Error:", e.message);
        }
    });
});

req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
});

req.end();
