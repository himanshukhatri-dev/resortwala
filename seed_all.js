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
        console.log('Loading credentials from api/.env');
        const envConfig = dotenv.parse(fs.readFileSync(envPath));
        dbConfig.host = '127.0.0.1'; // Force localhost
        dbConfig.user = envConfig.DB_USERNAME || dbConfig.user;
        dbConfig.password = envConfig.DB_PASSWORD || dbConfig.password;
        dbConfig.database = envConfig.DB_DATABASE || dbConfig.database;
        dbConfig.port = envConfig.DB_PORT || dbConfig.port;
    }
} catch (e) { console.error('Error reading .env', e); }

const HASHED_PASSWORD_DEFAULT = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // "password"

async function seedAll() {
    console.log(`\n🌱 Seeding ALL Data to ${dbConfig.database}...`);
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to Database.');

        // 0. ENSURE SCHEMA (Self-Healing)
        console.log('Checking Schema...');
        // Vendors Table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS vendors (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                remember_token VARCHAR(100) NULL,
                created_at TIMESTAMP NULL,
                updated_at TIMESTAMP NULL
            )
        `);
        // Users Table (Basic)
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                email_verified_at TIMESTAMP NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(255) DEFAULT 'user',
                remember_token VARCHAR(100) NULL,
                created_at TIMESTAMP NULL,
                updated_at TIMESTAMP NULL
            )
        `);
        // Property Masters columns
        try {
            const [cols] = await connection.execute(`SHOW COLUMNS FROM property_masters LIKE 'onboarding_data'`);
            if (cols.length === 0) {
                console.log('Adding missing column: onboarding_data');
                await connection.execute(`ALTER TABLE property_masters ADD COLUMN onboarding_data JSON NULL`);
            }
            const [vcols] = await connection.execute(`SHOW COLUMNS FROM property_masters LIKE 'video_url'`);
            if (vcols.length === 0) {
                console.log('Adding missing column: video_url');
                await connection.execute(`ALTER TABLE property_masters ADD COLUMN video_url VARCHAR(255) NULL`);
            }
            const [p1] = await connection.execute(`SHOW COLUMNS FROM property_masters LIKE 'price_mon_thu'`);
            if (p1.length === 0) {
                console.log('Adding missing column: price_mon_thu');
                await connection.execute(`ALTER TABLE property_masters ADD COLUMN price_mon_thu DECIMAL(10,2) NULL`);
            }
            const [p2] = await connection.execute(`SHOW COLUMNS FROM property_masters LIKE 'price_fri_sun'`);
            if (p2.length === 0) {
                console.log('Adding missing column: price_fri_sun');
                await connection.execute(`ALTER TABLE property_masters ADD COLUMN price_fri_sun DECIMAL(10,2) NULL`);
            }
            const [p3] = await connection.execute(`SHOW COLUMNS FROM property_masters LIKE 'price_sat'`);
            if (p3.length === 0) {
                console.log('Adding missing column: price_sat');
                await connection.execute(`ALTER TABLE property_masters ADD COLUMN price_sat DECIMAL(10,2) NULL`);
            }
        } catch (e) {
            console.log('Skipping property_masters schema check (table might not exist yet):', e.message);
        }


        // 1. SEED VENDOR
        const [vRows] = await connection.execute(`SELECT * FROM vendors WHERE email = ?`, ['vendor@resortwala.com']);
        if (vRows.length === 0) {
            await connection.execute(`INSERT INTO vendors (name, email, password, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`, ['Demo Vendor', 'vendor@resortwala.com', HASHED_PASSWORD_DEFAULT]);
            console.log('✅ Vendor Created: vendor@resortwala.com / password');
        } else {
            // Ensure password is reset to known default for "Ready to Use" guarantee
            await connection.execute(`UPDATE vendors SET password = ? WHERE email = ?`, [HASHED_PASSWORD_DEFAULT, 'vendor@resortwala.com']);
            console.log('ℹ️  Vendor Exists (Password Reset): vendor@resortwala.com');
        }

        // 2. SEED ADMIN
        const [aRows] = await connection.execute(`SELECT * FROM users WHERE email = ?`, ['admin@resortwala.com']);
        if (aRows.length === 0) {
            await connection.execute(`INSERT INTO users (name, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())`, ['System Admin', 'admin@resortwala.com', HASHED_PASSWORD_DEFAULT, 'admin']);
            console.log('✅ Admin Created: admin@resortwala.com / password');
        } else {
            await connection.execute(`UPDATE users SET password = ? WHERE email = ?`, [HASHED_PASSWORD_DEFAULT, 'admin@resortwala.com']);
            console.log('ℹ️  Admin Exists (Password Reset): admin@resortwala.com');
        }

        // 3. SEED CUSTOMER
        const [cRows] = await connection.execute(`SELECT * FROM users WHERE email = ?`, ['customer@resortwala.com']);
        if (cRows.length === 0) {
            await connection.execute(`INSERT INTO users (name, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())`, ['Demo Customer', 'customer@resortwala.com', HASHED_PASSWORD_DEFAULT, 'user']);
            console.log('✅ Customer Created: customer@resortwala.com / password');
        } else {
            await connection.execute(`UPDATE users SET password = ? WHERE email = ?`, [HASHED_PASSWORD_DEFAULT, 'customer@resortwala.com']);
            console.log('ℹ️  Customer Exists (Password Reset): customer@resortwala.com');
        }

        // 4. VERIFY ONBOARDING DATA (Quick Check)
        try {
            const [pRows] = await connection.execute(`SELECT count(*) as count FROM property_masters WHERE onboarding_data IS NOT NULL`);
            if (pRows[0].count === 0) {
                const dummy = JSON.stringify({
                    amenities: { big_pools: 1, wifi: true, parking: true },
                    rules: { "0": true, "1": true },
                    inclusions: { "Breakfast": true }
                });
                await connection.execute(`UPDATE property_masters SET onboarding_data = ? WHERE onboarding_data IS NULL`, [dummy]);
                console.log('✅ Filled missing property onboarding_data with defaults.');
            } else {
                console.log(`ℹ️  Properties with onboarding data: ${pRows[0].count}`);
            }
        } catch (e) { console.log('Skipping data check, table missing'); }

        // 5. SEED PROPERTIES (Request: 25+)
        console.log('\n🏗️  Seeding 25 Properties for Vendor...');
        const [vendorRes] = await connection.execute('SELECT id FROM vendors WHERE email = ?', ['vendor@resortwala.com']);

        if (vendorRes.length > 0) {
            const vendorId = vendorRes[0].id;
            const [existingCount] = await connection.execute('SELECT count(*) as count FROM property_masters WHERE vendor_id = ? AND Name LIKE "Seeded Property %"', [vendorId]);

            if (existingCount[0].count < 25) {
                const needed = 25 - existingCount[0].count;
                console.log(`Creating ${needed} new properties...`);

                for (let i = 1; i <= needed; i++) {
                    const isApproved = i > 20 ? 1 : 0; // Last 5 approved, rest pending
                    const name = `Seeded Property ${Date.now()}_${i}`;
                    const type = i % 2 === 0 ? 'Resort' : 'Villa';

                    const dummyOnboarding = JSON.stringify({
                        amenities: { pool: true, wifi: true, parking: true, ac: true },
                        rules: { "0": true, "2": true, "4": true },
                        inclusions: { "Breakfast": true, "Welcome Drink": true },
                        foodOptions: { breakfast: "Veg/Non-Veg", lunch: "Ala Carte" }
                    });

                    await connection.execute(`
                        INSERT INTO property_masters 
                        (Name, ShortName, PropertyType, Price, Location, CityName, vendor_id, is_approved, onboarding_data, IsActive, PropertyStatus, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                    `, [name, name, type, 15000 + (i * 100), 'Lonavala', 'Lonavala', vendorId, isApproved, dummyOnboarding, 1, 1]);
                }
                console.log(`✅ Added ${needed} properties.`);
            } else {
                console.log('ℹ️  Vendor already has 25+ seeded properties.');
            }
        } else {
            console.error('❌ Vendor not found, cannot seed properties.');
        }

        console.log('\n✨ All Seeding Complete! System Ready.');

    } catch (err) {
        console.error('❌ Seeding Failed:', err.message);
    } finally {
        if (connection) await connection.end();
    }
}

seedAll();
