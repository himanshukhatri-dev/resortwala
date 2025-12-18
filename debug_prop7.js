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

async function checkProp() {
    console.log(`🔍 Checking Property 7 in ${dbConfig.database}...`);
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(`SELECT PropertyId, Name, is_approved, onboarding_data FROM property_masters WHERE PropertyId = 7`);

        if (rows.length === 0) {
            console.log('❌ Property 7 NOT FOUND.');
        } else {
            const p = rows[0];
            console.log('✅ Property 7 Found:', p.Name);
            console.log('Onboarding Data Type:', typeof p.onboarding_data);
            console.log('Onboarding Data Value:', p.onboarding_data);
        }
    } catch (err) {
        console.error('❌ Check Failed:', err.message);
    } finally {
        if (connection) await connection.end();
    }
}

checkProp();
