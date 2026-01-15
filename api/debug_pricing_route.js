const http = require('http');

http.get('http://127.0.0.1:8000/api/debug-property-29', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log(data);
    });
}).on("error", (err) => {
    console.error("Error: " + err.message);
});
