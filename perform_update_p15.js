const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

async function run() {
    const envPath = path.resolve('api', '.env');
    let dbConfig = {
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'resortwala',
        port: 3306
    };

    if (fs.existsSync(envPath)) {
        const envConfig = dotenv.parse(fs.readFileSync(envPath));
        dbConfig.user = envConfig.DB_USERNAME || dbConfig.user;
        dbConfig.password = envConfig.DB_PASSWORD || dbConfig.password;
        dbConfig.database = envConfig.DB_DATABASE || dbConfig.database;
        dbConfig.port = envConfig.DB_PORT || dbConfig.port;
    } else {
        console.log('Using default Docker credentials');
        dbConfig.user = 'root';
        dbConfig.password = 'root';
        dbConfig.database = 'resortwala';
    }

    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.execute('SELECT admin_pricing, onboarding_data FROM property_masters WHERE PropertyId = 15');
        if (rows.length === 0) {
            console.error('Property 15 not found');
            process.exit(1);
        }

        let adminPricing = rows[0].admin_pricing;
        let onboardingData = rows[0].onboarding_data;

        // Handle JSON strings if necessary
        if (typeof adminPricing === 'string') adminPricing = JSON.parse(adminPricing);
        if (typeof onboardingData === 'string') onboardingData = JSON.parse(onboardingData);

        // Update admin_pricing
        const days = ['mon_thu', 'fri_sun', 'sat'];
        days.forEach(day => {
            if (!adminPricing[day]) adminPricing[day] = {};
            if (!adminPricing[day].villa) adminPricing[day].villa = {};

            adminPricing[day].villa.current = 40000;
            adminPricing[day].villa.final = 40000;
            adminPricing[day].villa.discounted = 40000;
            adminPricing[day].villa.ourMarginPercentage = "0.00";
            adminPricing[day].villa.vendorDiscountPercentage = "0.00";
        });

        // Update onboarding_data pricing
        if (!onboardingData.pricing) onboardingData.pricing = {};
        onboardingData.pricing.weekday = "40000";
        onboardingData.pricing.weekend = "40000";
        onboardingData.pricing.saturday = "40000";

        // Sync main columns
        const sql = `
            UPDATE property_masters 
            SET admin_pricing = ?, 
                onboarding_data = ?,
                Price = 40000,
                price_mon_thu = 40000,
                price_fri_sun = 40000,
                price_sat = 40000,
                ResortWalaRate = 40000,
                DealPrice = 40000
            WHERE PropertyId = 15
        `;

        await connection.execute(sql, [JSON.stringify(adminPricing), JSON.stringify(onboardingData)]);
        console.log('Successfully updated Property 15 pricing to 40,000 for all days.');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

run();
