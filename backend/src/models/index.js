const sequelize = require('../config/database');
const User = require('./User');
const Property = require('./Property');
const Booking = require('./Booking');
const Review = require('./Review');

// Associations
User.hasMany(Property, { foreignKey: 'hostId' });
Property.belongsTo(User, { as: 'host', foreignKey: 'hostId' });

User.hasMany(Booking, { foreignKey: 'userId' });
Booking.belongsTo(User, { foreignKey: 'userId' });

Property.hasMany(Booking, { foreignKey: 'propertyId' });
Booking.belongsTo(Property, { foreignKey: 'propertyId' });

User.hasMany(Review, { foreignKey: 'userId' });
Review.belongsTo(User, { foreignKey: 'userId' });

Property.hasMany(Review, { foreignKey: 'propertyId' });
Review.belongsTo(Property, { foreignKey: 'propertyId' });

module.exports = {
    sequelize,
    User,
    Property,
    Booking,
    Review
};
