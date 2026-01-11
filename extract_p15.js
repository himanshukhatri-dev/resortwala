const fs = require('fs');
try {
    const raw = fs.readFileSync('properties.json', 'utf8');
    // Remove BOM if present
    const clean = raw.replace(/^\uFEFF/, '');
    const props = JSON.parse(clean);
    const p15 = props.find(p => p.PropertyId === 15);
    if (p15) {
        console.log(JSON.stringify(p15, null, 2));
    } else {
        console.log('Property 15 not found in properties.json');
    }
} catch (err) {
    console.error('Error:', err.message);
}
