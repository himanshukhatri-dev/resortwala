const express = require('express');
const { Property, User, Review } = require('../models');
const { authenticateToken, requireHost } = require('../middleware/auth');
const router = express.Router();

// Get all properties (with filtering)
router.get('/', async (req, res) => {
    try {
        const { location, guests, type, city } = req.query;
        const { Op } = require('sequelize');

        const whereClause = {};

        if (location) {
            whereClause.location = { [Op.like]: `%${location}%` };
        }

        if (guests) {
            whereClause.maxGuests = { [Op.gte]: guests };
        }

        if (type) {
            whereClause.type = type;
        }

        if (city) {
            whereClause.city = { [Op.like]: `%${city}%` };
        }

        const properties = await Property.findAll({
            where: whereClause,
            include: [
                { model: User, as: 'host', attributes: ['id', 'username', 'email'] },
                { model: Review, attributes: ['rating'] }
            ]
        });
        res.json(properties);
    } catch (error) {
        console.error('Error fetching properties:', error);
        res.status(500).json({ error: 'Failed to fetch properties' });
    }
});

// Get single property
router.get('/:id', async (req, res) => {
    try {
        const property = await Property.findByPk(req.params.id, {
            include: [
                { model: User, as: 'host', attributes: ['id', 'username', 'email'] }
            ]
        });

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        res.json(property);
    } catch (error) {
        console.error('Error fetching property:', error);
        res.status(500).json({ error: 'Failed to fetch property' });
    }
});

// Create property (Host only)
router.post('/', authenticateToken, requireHost, async (req, res) => {
    try {
        const { title, description, pricePerNight, location, address, city, state, zipCode, type, amenities, images, maxGuests, bedrooms, bathrooms } = req.body;

        const newProperty = await Property.create({
            title,
            description,
            pricePerNight,
            location,
            address,
            city,
            state,
            zipCode,
            type,
            amenities,
            images,
            maxGuests,
            bedrooms,
            bathrooms,
            hostId: req.user.userId
        });

        res.status(201).json(newProperty);
    } catch (error) {
        console.error('Error creating property:', error);
        res.status(500).json({ error: 'Failed to create property' });
    }
});

// Update property (Host only)
router.put('/:id', authenticateToken, requireHost, async (req, res) => {
    try {
        const property = await Property.findByPk(req.params.id);

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        if (property.hostId !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await property.update(req.body);
        res.json(property);
    } catch (error) {
        console.error('Error updating property:', error);
        res.status(500).json({ error: 'Failed to update property' });
    }
});

// Delete property (Host only)
router.delete('/:id', authenticateToken, requireHost, async (req, res) => {
    try {
        const property = await Property.findByPk(req.params.id);

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        if (property.hostId !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await property.destroy();
        res.json({ message: 'Property deleted successfully' });
    } catch (error) {
        console.error('Error deleting property:', error);
        res.status(500).json({ error: 'Failed to delete property' });
    }
});

module.exports = router;
