import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env from api/.env
const envPath = path.resolve('api', '.env');
// Manually parse because dotenv.config() defaults to .env in cwd
let dbConfig = {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'resortwala',
    port: 3306
};

try {
    if (fs.existsSync(envPath)) {
        console.log('Loading credentials from api/.env');
        const envConfig = dotenv.parse(fs.readFileSync(envPath));
        dbConfig.host = envConfig.DB_HOST || dbConfig.host;
        dbConfig.user = envConfig.DB_USERNAME || dbConfig.user;
        dbConfig.password = envConfig.DB_PASSWORD || dbConfig.password;
        dbConfig.database = envConfig.DB_DATABASE || dbConfig.database;
        dbConfig.port = envConfig.DB_PORT || dbConfig.port;
    } else {
        console.log('api/.env not found, using defaults');
    }
} catch (e) {
    console.error('Error reading .env, using defaults', e);
}

const dummyData = {
    amenities: {
        big_pools: 1, small_pools: 1, big_slides: 0, small_slides: 0,
        wavepool: false, rain_dance: true, dj_system: true, waterfall: false,
        ice_bucket: false, lazy_river: false, crazy_river: false, kids_area: true,
        parking: true, selfie_point: true, garden: true
    },
    rules: {
        "0": true, "1": true, "2": true, "3": true, "4": true, "5": true,
        "6": false, "7": true, "8": true, "9": false, "10": true, "11": true
    },
    paymentMethods: { cash: true, upi: true, debit: true, credit: true },
    childCriteria: {
        freeAge: 5, freeHeight: 3, chargeAgeFrom: 6, chargeAgeTo: 12, chargeHeightFrom: 3, chargeHeightTo: 5
    },
    inclusions: { "Waterpark Entry": true, "Breakfast": true, "Parking": true },
    childPricing: { monFri: "500", satSun: "800" },
    foodOptions: { breakfast: "Veg", lunch: "Veg & Non Veg", hiTea: "Tea/Coffee" }
};

async function seed() {
    console.log(`Connecting to DB ${dbConfig.database} at ${dbConfig.host}...`);
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected!');

        // Check columns
        const [columns] = await connection.execute(`SHOW COLUMNS FROM property_masters LIKE 'onboarding_data'`);
        if (columns.length === 0) {
            console.log('Adding onboarding_data column...');
            await connection.execute(`ALTER TABLE property_masters ADD COLUMN onboarding_data JSON NULL`);
        } else {
            console.log('onboarding_data column exists.');
        }

        const [vColumns] = await connection.execute(`SHOW COLUMNS FROM property_masters LIKE 'video_url'`);
        if (vColumns.length === 0) {
            console.log('Adding video_url column...');
            await connection.execute(`ALTER TABLE property_masters ADD COLUMN video_url VARCHAR(255) NULL`);
        }

        // Fetch properties with NULL onboarding_data
        const [rows] = await connection.execute(`SELECT id, Name FROM property_masters WHERE onboarding_data IS NULL`);
        console.log(`Found ${rows.length} properties to seed.`);

        for (const row of rows) {
            // Customize slightly if needed, or just use dummy
            const dataStr = JSON.stringify(dummyData);
            await connection.execute(
                `UPDATE property_masters SET onboarding_data = ? WHERE id = ?`,
                [dataStr, row.id]
            );
            console.log(`Updated property [${row.id}] ${row.Name}`);
        }

        console.log('Seeding completed successfully.');

    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        if (connection) await connection.end();
    }
}

seed();
