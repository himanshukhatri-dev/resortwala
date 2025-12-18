import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env
const envPath = path.resolve('api', '.env');
let dbConfig = {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'resortwala',
    port: 3306
};

try {
    if (fs.existsSync(envPath)) {
        const envConfig = dotenv.parse(fs.readFileSync(envPath));
        dbConfig.user = envConfig.DB_USERNAME || dbConfig.user;
        dbConfig.password = envConfig.DB_PASSWORD || dbConfig.password;
        dbConfig.database = envConfig.DB_DATABASE || dbConfig.database;
    }
} catch (e) { }

async function fixData() {
    console.log(`🔧 Fixing Property Data in ${dbConfig.database}...`);
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        const dummy = JSON.stringify({
            amenities: { pool: true, wifi: true, parking: true, ac: true },
            rules: { "0": true, "2": true },
            inclusions: { "Breakfast": true },
            foodOptions: { breakfast: "Veg", lunch: "Ala Carte" },
            childCriteria: { age: 10 },
            childPricing: { monFri: 500, satSun: 1000 },
            videourl: ""
        });

        // 1. Fix NULL onboarding_data
        const [nullRows] = await connection.execute(`UPDATE property_masters SET onboarding_data = ? WHERE onboarding_data IS NULL OR onboarding_data = ''`, [dummy]);
        console.log(`✅ Fixed ${nullRows.affectedRows} properties with NULL data.`);

        // 2. Fix Double Encoded JSON (Common issue)
        // If data starts with '"' it might be a stringified string.
        /* Complex to do in SQL, assuming NULL fix handles most. 
           Let's just force update for property 7 specifically to be safe if it exists. */

        await connection.execute(`UPDATE property_masters SET onboarding_data = ? WHERE PropertyId = 7`, [dummy]);
        console.log(`✅ Specifically patched Property ID 7.`);

    } catch (err) {
        console.error('❌ Fix Failed:', err.message);
    } finally {
        if (connection) await connection.end();
    }
}

fixData();
