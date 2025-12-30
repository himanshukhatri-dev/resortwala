
const axios = require('axios');

async function checkPropertyData() {
    try {
        const response = await axios.get('http://72.61.242.42/api/properties?page=1');
        const properties = response.data.data;

        console.log(`Fetched ${properties.length} properties.`);

        properties.slice(0, 5).forEach((p, i) => {
            console.log(`\n--- Property ${i + 1}: ${p.Name} (ID: ${p.PropertyId}) ---`);
            const img = p.ImageUrl || p.primary_image?.image_url || p.images?.[0]?.image_url;
            console.log(`Image URL: ${img}`);
            console.log(`NoofRooms: ${p.NoofRooms}`);

            if (p.onboarding_data) {
                const od = p.onboarding_data;
                const amenities = od.amenities ? Object.keys(od.amenities).filter(k => od.amenities[k]) : [];
                console.log(`Amenities: ${amenities.length} found`);
            } else {
                console.log("No onboarding_data");
            }
        });
    } catch (error) {
        console.error("Error fetching properties:", error.message);
    }
}

checkPropertyData();
