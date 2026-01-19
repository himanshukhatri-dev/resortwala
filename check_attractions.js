const axios = require('axios');

async function checkAttractions() {
    try {
        const list = await axios.get('https://api.resortwala.com/properties');
        const ids = list.data.slice(0, 3).map(p => p.PropertyId || p.id); // Get 3 props

        for (const id of ids) {
            const detail = await axios.get(`https://api.resortwala.com/properties/${id}`);
            const ob = typeof detail.data.onboarding_data === 'string'
                ? JSON.parse(detail.data.onboarding_data)
                : detail.data.onboarding_data;

            console.log(`Property ${id} (${detail.data.Name}):`);
            if (ob && ob.otherAttractions) {
                console.log(ob.otherAttractions);
            } else {
                console.log("No attractions.");
            }
            console.log('---');
        }
    } catch (e) {
        console.error(e.message);
    }
}

checkAttractions();
