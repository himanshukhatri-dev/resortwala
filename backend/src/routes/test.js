const express = require('express');
const { sequelize, Property, User, Booking, Review } = require('../models');
const router = express.Router();

// Database test endpoint
router.get('/db', async (req, res) => {
    try {
        const results = {
            connection: 'unknown',
            models: {},
            sampleQuery: null,
            error: null
        };

        // Test connection
        try {
            await sequelize.authenticate();
            results.connection = 'connected';
        } catch (error) {
            results.connection = 'failed';
            results.error = error.message;
        }

        // Get model schemas
        try {
            results.models = {
                Property: Object.keys(Property.rawAttributes),
                User: Object.keys(User.rawAttributes),
                Booking: Object.keys(Booking.rawAttributes),
                Review: Object.keys(Review.rawAttributes)
            };
        } catch (error) {
            results.models.error = error.message;
        }

        // Try to query properties
        try {
            const properties = await Property.findAll({ limit: 5 });
            results.sampleQuery = {
                success: true,
                count: properties.length,
                properties: properties.map(p => ({
                    id: p.id,
                    title: p.title,
                    type: p.type,
                    city: p.city
                }))
            };
        } catch (error) {
            results.sampleQuery = {
                success: false,
                error: error.message,
                sql: error.sql || 'N/A'
            };
        }

        res.json(results);
    } catch (error) {
        res.status(500).json({
            error: 'Test endpoint failed',
            message: error.message
        });
    }
});

module.exports = router;
