import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env from api/.env
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
        console.log('Loading credentials from api/.env');
        const envConfig = dotenv.parse(fs.readFileSync(envPath));
        // Use 127.0.0.1 for host access, even if .env says 'db'
        dbConfig.host = '127.0.0.1';
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

// Laravel default bcrypt hash for "password"
const HASHED_PASSWORD_DEFAULT = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

async function seedVendor() {
    console.log(`Connecting to DB ${dbConfig.database} at ${dbConfig.host}...`);
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected!');

        // Check vendors table
        const [rows] = await connection.execute(`SELECT * FROM vendors WHERE email = ?`, ['vendor@resortwala.com']);

        if (rows.length > 0) {
            console.log('Vendor user "vendor@resortwala.com" already exists.');
            // Reset password just in case
            await connection.execute(`UPDATE vendors SET password = ? WHERE email = ?`, [HASHED_PASSWORD_DEFAULT, 'vendor@resortwala.com']);
            console.log('Password reset to "password".');
        } else {
            console.log('Creating vendor user "vendor@resortwala.com"...');
            await connection.execute(`
                INSERT INTO vendors (name, email, password, created_at, updated_at)
                VALUES (?, ?, ?, NOW(), NOW())
            `, ['Demo Vendor', 'vendor@resortwala.com', HASHED_PASSWORD_DEFAULT]);
            console.log('Vendor created successfully.');
        }

    } catch (err) {
        console.error('Vendor seeding failed:', err);
    } finally {
        if (connection) await connection.end();
    }
}

seedVendor();
