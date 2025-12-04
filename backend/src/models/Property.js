const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Property = sequelize.define('Property', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('villa', 'waterpark'),
        allowNull: false,
        defaultValue: 'villa'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    pricePerNight: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true
    },
    state: {
        type: DataTypes.STRING,
        allowNull: true
    },
    zipCode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    latitude: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    longitude: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    amenities: {
        type: DataTypes.JSON, // Store as JSON array e.g. ["wifi", "pool"]
        defaultValue: []
    },
    images: {
        type: DataTypes.JSON, // Store as JSON array of URLs
        defaultValue: []
    },
    maxGuests: {
        type: DataTypes.INTEGER,
        defaultValue: 2
    },
    bedrooms: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    bathrooms: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    hostId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

module.exports = Property;
