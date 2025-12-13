const sql = require('mssql');
const mysql = require('mysql2/promise');

const mssqlConfig = {
    user: 'rwala',
    password: 'rw@l@2025',
    server: '103.118.16.150',
    database: 'RVWala',
    options: { encrypt: true, trustServerCertificate: true }
};

const mysqlConfig = {
    host: 'localhost',
    port: 3307, // Docker exposed port
    user: 'resortwala',
    password: 'password',
    database: 'resortwala'
};

async function seed() {
    try {
        console.log("Connecting to MSSQL...");
        await sql.connect(mssqlConfig);
        console.log("Fetching properties...");
        const result = await sql.query("SELECT * FROM PropertyMaster");
        const properties = result.recordset;
        console.log(`Fetched ${properties.length} properties.`);

        console.log("Connecting to MySQL...");
        const conn = await mysql.createConnection(mysqlConfig);

        for (const prop of properties) {
            // Need to handle Date objects converting to MySQL string format or use parameterized query carefully
            // BUT MySQL 'property_masters' columns match almost 1:1 specifically because I designed it so.
            // I'll filter out props that don't match or clean data.
            // Actually, I can just build an INSERT object.

            // Map keys just to be safe (though names match)
            // Note: My duplicate logic...

            // Safety: Check if exists
            const [rows] = await conn.execute('SELECT PropertyId FROM property_masters WHERE PropertyId = ?', [prop.PropertyId]);
            if (rows.length > 0) {
                console.log(`Skipping ${prop.PropertyId} (exists)`);
                continue;
            }

            const query = `INSERT INTO property_masters SET ?`;
            // Clean undefineds
            const payload = { ...prop };
            // Remove keys not in my migration if any?
            // Actually, my migration has most.
            // But MySQL driver treats keys as columns. mismatch throws error.
            // I'll pick known keys.

            const validKeys = [
                'PropertyId', 'VendorId', 'Name', 'ShortName', 'PropertyType', 'Price', 'DealPrice', 'Tax',
                'Address', 'LongDescription', 'ShortDescription', 'Website', 'Email', 'MobileNo', 'IsActive',
                'GSTNo', 'ContactPerson', 'CityName', 'GoogleMapLink', 'CityLatitude', 'CityLongitude',
                'Location', 'PaymentFacitlity', 'AvailabilityType', 'NoofBathRooms', 'NoofQueenBeds',
                'Occupancy', 'BookingSpecailMessage', 'PropertyOffersDetails', 'PropertyRules', 'IsDeleted',
                'PerCost', 'ResortWalaRate', 'PropertyStatus', 'IsVendorPropAvailable', 'IsPropertyUpdate',
                'NoofRooms', 'CreatedBy', 'CreatedOn', 'UpdatedBy', 'UpdatedOn',
                'CheckinDate', 'CheckoutDate', 'Breakfast', 'Lunch', 'Dinner', 'HiTea', 'MaxCapacity'
            ];

            const insertData = {};
            validKeys.forEach(k => {
                if (payload[k] !== undefined) insertData[k] = payload[k];
            });
            // Convert 'IsActive' etc to 0/1 (Node MySQL might do this, but safe to force)

            try {
                await conn.query(query, insertData);
                console.log(`Inserted ${prop.PropertyId}: ${prop.Name}`);
            } catch (instErr) {
                console.error(`Error inserting ${prop.PropertyId}:`, instErr.message);
            }
        }

        console.log("Seeding complete.");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}
seed();
