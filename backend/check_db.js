const sequelize = require('./src/config/database');
const { User, Property, Booking } = require('./src/models');

const checkDB = async () => {
    try {
        console.log('🔍 Checking Database Entries...\n');

        // Recreate database to fix schema issues
        await sequelize.sync({ force: true });
        console.log('✅ Database recreated and synced.');

        console.log('🌱 Seeding test data...');

        // Create User
        await User.create({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            role: 'user'
        });

        // Create Host
        const host = await User.create({
            username: 'hostuser',
            email: 'host@example.com',
            password: 'password123',
            role: 'host'
        });

        // Create Property
        await Property.create({
            title: 'Luxury Villa',
            description: 'A stunning villa with ocean view',
            pricePerNight: 15000,
            location: 'Goa',
            hostId: host.id,
            images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=1171&q=80'],
            amenities: ['Wifi', 'Pool', 'AC']
        });

        // Users
        const users = await User.findAll();
        console.log(`👥 Users (${users.length}):`);
        users.forEach(u => console.log(`   - ID: ${u.id}, Username: ${u.username}, Email: ${u.email}, Role: ${u.role}`));
        console.log('');

        // Properties
        const properties = await Property.findAll();
        console.log(`🏠 Properties (${properties.length}):`);
        properties.forEach(p => console.log(`   - ID: ${p.id}, Title: ${p.title}, Location: ${p.location}, Price: ${p.pricePerNight}`));
        console.log('');

        // Bookings
        const bookings = await Booking.findAll({
            include: [
                { model: User, attributes: ['username'] },
                { model: Property, attributes: ['title'] }
            ]
        });
        console.log(`📅 Bookings (${bookings.length}):`);
        bookings.forEach(b => {
            console.log(`   - ID: ${b.id}, Property: ${b.Property?.title}, User: ${b.User?.username}, Status: ${b.status}, Dates: ${b.checkInDate} to ${b.checkOutDate}`);
        });
        console.log('');

    } catch (error) {
        console.error('❌ Error checking database:', error);
    } finally {
        process.exit();
    }
};

checkDB();
