const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    propertyId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    checkInDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    checkOutDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    totalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
        defaultValue: 'pending'
    },
    guests: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    }
});

module.exports = Booking;
