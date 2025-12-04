const { sequelize, User, Property } = require('../models');
require('dotenv').config();

const seedData = async () => {
    try {
        console.log('🌱 Starting database seed...');

        // Sync database to create tables
        await sequelize.sync({ force: true });
        console.log('✅ Database synced');

        // Create a vendor user
        const vendor = await User.create({
            username: 'vendor1',
            email: 'vendor@resortwala.com',
            password: 'password123',
            role: 'vendor'
        });

        console.log('✅ Created vendor user');

        // Create an admin user
        const admin = await User.create({
            username: 'admin',
            email: 'admin@resortwala.com',
            password: 'password123',
            role: 'admin'
        });

        console.log('✅ Created admin user');

        // Sample properties
        const properties = [
            {
                title: 'Luxury Beach Villa in Alibaug',
                type: 'villa',
                description: 'Beautiful beachfront villa with private pool and stunning ocean views. Perfect for family getaways.',
                pricePerNight: 15000,
                location: 'Alibaug Beach Road',
                address: '123 Beach Road',
                city: 'Alibaug',
                state: 'Maharashtra',
                zipCode: '402201',
                amenities: ['WiFi', 'Pool', 'Beach Access', 'Kitchen', 'Parking'],
                images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'],
                maxGuests: 8,
                bedrooms: 4,
                bathrooms: 3,
                hostId: vendor.id
            },
            {
                title: 'Modern Villa with Pool - Lonavala',
                type: 'villa',
                description: 'Spacious modern villa in the hills with infinity pool and mountain views.',
                pricePerNight: 12000,
                location: 'Lonavala Hills',
                address: '456 Hill View',
                city: 'Lonavala',
                state: 'Maharashtra',
                zipCode: '410401',
                amenities: ['WiFi', 'Pool', 'Garden', 'BBQ', 'Parking'],
                images: ['https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=800'],
                maxGuests: 6,
                bedrooms: 3,
                bathrooms: 2,
                hostId: vendor.id
            },
            {
                title: 'Aqua Adventure Water Park',
                type: 'waterpark',
                description: 'Family-friendly water park with thrilling slides, wave pool, and lazy river.',
                pricePerNight: 500,
                location: 'Mumbai Highway',
                address: '789 Entertainment Zone',
                city: 'Mumbai',
                state: 'Maharashtra',
                zipCode: '400001',
                amenities: ['Wave Pool', 'Slides', 'Food Court', 'Lockers', 'Parking'],
                images: ['https://images.unsplash.com/photo-1561459074-e0e5c2e3d0f4?w=800'],
                maxGuests: 50,
                bedrooms: 0,
                bathrooms: 10,
                hostId: vendor.id
            },
            {
                title: 'Cozy Cottage in Mahabaleshwar',
                type: 'villa',
                description: 'Charming cottage surrounded by strawberry farms and misty mountains.',
                pricePerNight: 8000,
                location: 'Mahabaleshwar Valley',
                address: '321 Valley Road',
                city: 'Mahabaleshwar',
                state: 'Maharashtra',
                zipCode: '412806',
                amenities: ['WiFi', 'Fireplace', 'Garden', 'Kitchen', 'Parking'],
                images: ['https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800'],
                maxGuests: 4,
                bedrooms: 2,
                bathrooms: 1,
                hostId: vendor.id
            },
            {
                title: 'Splash Paradise Water Park',
                type: 'waterpark',
                description: 'Exciting water park with kids zone, adventure slides, and rain dance area.',
                pricePerNight: 400,
                location: 'Pune Expressway',
                address: '555 Fun City',
                city: 'Pune',
                state: 'Maharashtra',
                zipCode: '411001',
                amenities: ['Kids Zone', 'Slides', 'Rain Dance', 'Food Court', 'Parking'],
                images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'],
                maxGuests: 100,
                bedrooms: 0,
                bathrooms: 15,
                hostId: vendor.id
            },
            {
                title: 'Heritage Villa in Alibaug',
                type: 'villa',
                description: 'Restored heritage property with modern amenities and traditional charm.',
                pricePerNight: 18000,
                location: 'Alibaug Fort Area',
                address: '888 Heritage Lane',
                city: 'Alibaug',
                state: 'Maharashtra',
                zipCode: '402201',
                amenities: ['WiFi', 'Pool', 'Garden', 'Kitchen', 'Parking', 'AC'],
                images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
                maxGuests: 10,
                bedrooms: 5,
                bathrooms: 4,
                hostId: vendor.id
            }
        ];

        await Property.bulkCreate(properties);
        console.log(`✅ Created ${properties.length} properties`);

        console.log('🎉 Database seeded successfully!');
        console.log('\nVendor Login:');
        console.log('Email: vendor@resortwala.com');
        console.log('Password: password123');
        console.log('\nAdmin Login:');
        console.log('Email: admin@resortwala.com');
        console.log('Password: password123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
};

seedData();
