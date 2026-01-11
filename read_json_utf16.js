const fs = require('fs');
try {
    let raw = fs.readFileSync('properties.json', 'utf16le');
    // Strip BOM
    if (raw.charCodeAt(0) === 0xFEFF || raw.charCodeAt(0) === 0xFFFE) {
        raw = raw.slice(1);
    }
    const props = JSON.parse(raw);
    const p15 = props.find(p => p.PropertyId === 15);
    if (p15) {
        console.log(JSON.stringify(p15, null, 2));
    } else {
        console.log('Property 15 not found in properties.json');
    }
} catch (err) {
    console.error('Error:', err.message);
}
