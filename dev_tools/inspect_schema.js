const axios = require('axios');

async function getSchema(table) {
    try {
        const res = await axios.post('http://localhost:3000/api/table-data', { tableName: table });
        if (res.data.length > 0) {
            console.log(`\nSchema for ${table}:`);
            console.log(Object.keys(res.data[0]));
            console.log('Sample Data:', res.data[0]);
        } else {
            console.log(`No data in ${table}`);
        }
    } catch (e) {
        console.error(e.message);
    }
}

getSchema('Web_Resort');
