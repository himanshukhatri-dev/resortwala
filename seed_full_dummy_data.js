import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// --- CONFIGURATION ---
const envPath = path.resolve('api', '.env');

// HARDCODED STARTING CONFIG FOR TUNNEL
let dbConfig = {
    host: '127.0.0.1',
    user: 'resort_user',
    password: 'SecurePassword123',
    database: 'resortwala_staging',
    port: 3307 // TUNNEL PORT
};

// --- DATA GENERATORS ---

const LOCATIONS = ["Lonavala", "Khandala", "Alibaug", "Mahabaleshwar", "Igatpuri", "Karjat"];

const AMENITIES = {
    big_pools: 1, small_pools: 0, big_slides: 0, small_slides: 0,
    wavepool: false, rain_dance: true, dj_system: true, waterfall: false,
    kids_area: true, parking: true, selfie_point: true, garden: true,
    wifi: true, ac: true, kitchen: true, tv: true, sound_system: true,
    bonfire: true, bbq: true, power_backup: true
};

const RULES = {
    "0": true, // Primary guest 18+
    "1": true, // Valid ID
    "2": true, // Pets allowed
    "3": true, // Outside food allowed
    "6": true, // Smoking allowed
    "7": true  // Alcohol allowed
};

const INCLUSIONS = {
    "Breakfast": true, "Parking": true, "Wi-Fi": true, "Welcome Drink": true, "Pool Access": true
};

const PAYMENT_METHODS = { cash: true, upi: true, credit: true, debit: true };

const CHILD_CRITERIA = { freeAge: 5, freeHeight: 3, chargeAgeFrom: 6, chargeAgeTo: 12, chargeHeightFrom: 3, chargeHeightTo: 5 };

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateVillaData(id) {
    const bedrooms = getRandomInt(3, 8);
    const capacity = bedrooms * 3; // Approx capacity
    const basePrice = getRandomInt(10, 30) * 1000;

    // Room Config
    const roomConfig = {
        livingRoom: { bedType: 'Sofa cum Bed', ac: true, bathroom: true, toiletType: 'Western', balcony: true },
        bedrooms: []
    };
    for (let i = 0; i < bedrooms; i++) {
        roomConfig.bedrooms.push({
            id: i + 1,
            bedType: Math.random() > 0.5 ? 'King' : 'Queen',
            ac: true,
            bathroom: true,
            toiletType: 'Western',
            balcony: Math.random() > 0.3
        });
    }

    return {
        type: 'Villa',
        maxCapacity: capacity,
        noofRooms: bedrooms,
        pricing: {
            weekday: basePrice,
            weekend: basePrice + 5000,
            saturday: basePrice + 8000,
            extraGuestLimit: 10,
            extraGuestCharge: 1000,
            extraMattressCharge: 500,
            foodPricePerPerson: 1200
        },
        foodRates: { veg: 1000, nonVeg: 1200, jain: 1000, perPerson: 1100 },
        roomConfig
    };
}

function generateWaterparkData(id) {
    const adultPrice = getRandomInt(5, 12) * 100;
    return {
        type: 'Waterpark',
        maxCapacity: 500,
        noofRooms: 0,
        pricing: {
            weekday: adultPrice, // Base entry price
            weekend: adultPrice + 200,
            saturday: adultPrice + 300,
            extraGuestLimit: 0,
            extraGuestCharge: 0
        },
        ticketPrices: {
            adult: adultPrice,
            child: adultPrice - 200,
            includesEntry: true,
            includesFood: Math.random() > 0.5
        },
        amenities: { ...AMENITIES, big_slides: getRandomInt(2, 5), wavepool: true, lazy_river: true }
    };
}

// --- MAIN SEEDER ---

async function seed() {
    console.log(`🚀 Starting Full Dummy Data Seeder...`);
    console.log(`Database: ${dbConfig.database} @ ${dbConfig.host}:${dbConfig.port}`);

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to Database.');

        const [rows] = await connection.execute(`SELECT PropertyId, Name FROM property_masters`);
        console.log(`found ${rows.length} properties.`);

        for (const row of rows) {
            // Determine type: 80% Villa, 20% Waterpark
            const isWaterpark = row.Name.toLowerCase().includes('water') || Math.random() > 0.8;
            const data = isWaterpark ? generateWaterparkData(row.PropertyId) : generateVillaData(row.PropertyId);

            // Onboarding JSON
            const onboardingData = {
                amenities: data.amenities || AMENITIES,
                rules: RULES,
                paymentMethods: PAYMENT_METHODS,
                inclusions: INCLUSIONS,
                childCriteria: CHILD_CRITERIA,

                // Type Specific
                roomConfig: data.roomConfig,
                ticketPrices: data.ticketPrices,
                foodRates: data.foodRates,
                pricing: data.pricing
            };

            // Location Logic (Random if missing)
            const city = LOCATIONS[getRandomInt(0, LOCATIONS.length - 1)];

            // Update Query
            await connection.execute(`
                UPDATE property_masters 
                SET 
                    PropertyType = ?,
                    MaxCapacity = ?, 
                    NoofRooms = ?,
                    CityName = COALESCE(NULLIF(CityName, ''), ?),
                    Location = COALESCE(NULLIF(Location, ''), ?),
                    price_mon_thu = ?,
                    price_fri_sun = ?,
                    price_sat = ?,
                    Price = ?,  /* SYNCING LEGACY PRICE COLUMN */
                    onboarding_data = ?,
                    is_approved = 1
                WHERE PropertyId = ?
            `, [
                data.type,
                data.maxCapacity,
                data.noofRooms,
                city, // Fallback City
                city, // Fallback Location
                data.pricing.weekday,
                data.pricing.weekend,
                data.pricing.saturday,
                data.pricing.weekday, // Set Price = Weekday Price (Starting From)
                JSON.stringify(onboardingData),
                row.PropertyId
            ]);

            process.stdout.write(`\rUpdated Property ${row.PropertyId}: ${data.type}                       `);
        }

        console.log('\n\n✅ All properties seeded with rich dummy data!');

    } catch (err) {
        console.error('\n❌ Seeding Failed:', err);
    } finally {
        if (connection) await connection.end();
    }
}

seed();
