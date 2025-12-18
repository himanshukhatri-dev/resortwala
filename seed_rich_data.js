import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('api', '.env');
let dbConfig = { host: '127.0.0.1', user: 'root', password: '', database: 'resortwala', port: 3306 };
try {
    if (fs.existsSync(envPath)) {
        const envConfig = dotenv.parse(fs.readFileSync(envPath));
        dbConfig.user = envConfig.DB_USERNAME || dbConfig.user;
        dbConfig.password = envConfig.DB_PASSWORD || dbConfig.password;
        dbConfig.database = envConfig.DB_DATABASE || dbConfig.database;
    }
} catch (e) { }

async function seedRichData() {
    console.log(`🌱 Seeding Rich Data for Property 7...`);
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // Authentic Data Plan
        const richData = {
            Name: "Royal Sunset Villa",
            ShortName: "Royal Sunset",
            PropertyType: "Villa",
            Location: "Lonavala",
            CityName: "Lonavala",
            Address: "Plot No. 45, Tungarli Lake Road, Near Lagoona Resort, Lonavala, Maharashtra 410401",
            ContactPerson: "Rajesh Kumar",
            MobileNo: "9876543210",
            Email: "bookings@royalsunset.com",
            Website: "https://www.royalsunsetlonavala.com",
            LongDescription: "Experience luxury living at Royal Sunset Villa, a premium 5BHK property nestled in the hills of Lonavala. Features a private infinity pool, lush green lawn, and modern amenities including high-speed Wi-Fi and a fully equipped kitchen. Perfect for family getaways and corporate retreats.",
            ShortDescription: "Luxury 5BHK Villa with Private Pool & Mountain View",
            price_mon_thu: 15000,
            price_fri_sun: 25000,
            is_approved: 1,
            video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        };

        const onboardingData = {
            amenities: {
                pool: true, wifi: true, ac: true, parking: true,
                kitchen: true, tv: true, garden: true,
                caretaker: true, sound_system: true, bbq: true,
                big_pools: 1, small_pools: 0, big_slides: 0
            },
            rules: {
                "0": true, // Primary guest 18+
                "1": true, // ID Proof
                "2": true, // Pets Allowed
                "3": true, // Outside food allowed
                "6": true, // Special requests
                "10": true // Alcohol allowed
            },
            inclusions: {
                "Breakfast": true,
                "Parking": true,
                "Wi-Fi": true,
                "Welcome Drink": true
            },
            paymentMethods: {
                cash: true,
                upi: true,
                credit: true
            },
            childCriteria: {
                freeAge: 6,
                chargeAgeFrom: 6,
                chargeAgeTo: 12
            },
            childPricing: {
                monFri: 1000,
                satSun: 1500
            },
            foodOptions: {
                breakfast: "Veg & Non Veg",
                lunch: "Ala Carte",
                dinner: "Ala Carte",
                hiTea: "Tea/Coffee"
            }
        };

        await connection.execute(`
            UPDATE property_masters 
            SET 
                Name = ?, ShortName = ?, PropertyType = ?, Location = ?, CityName = ?, Address = ?,
                ContactPerson = ?, MobileNo = ?, Email = ?, Website = ?,
                LongDescription = ?, ShortDescription = ?,
                price_mon_thu = ?, price_fri_sun = ?, price_sat = ?,
                is_approved = ?, video_url = ?, onboarding_data = ?
            WHERE PropertyId = 7
        `, [
            richData.Name, richData.ShortName, richData.PropertyType, richData.Location, richData.CityName, richData.Address,
            richData.ContactPerson, richData.MobileNo, richData.Email, richData.Website,
            richData.LongDescription, richData.ShortDescription,
            richData.price_mon_thu, richData.price_fri_sun, richData.price_fri_sun,
            richData.is_approved, richData.video_url, JSON.stringify(onboardingData)
        ]);

        console.log("✅ Property 7 Updated with Rich Data!");

    } catch (err) {
        console.error('❌ Seeding Failed:', err.message);
    } finally {
        if (connection) await connection.end();
    }
}

seedRichData();
