const express = require('express');
const { Booking, Property, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Create a booking
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { propertyId, checkInDate, checkOutDate, guests } = req.body;

        const property = await Property.findByPk(propertyId);
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Calculate total price (simplified)
        const start = new Date(checkInDate);
        const end = new Date(checkOutDate);
        const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const totalPrice = nights * property.pricePerNight;

        // Check for overlapping bookings (double-booking validation)
        const { Op } = require('sequelize');
        const existingBooking = await Booking.findOne({
            where: {
                propertyId,
                status: {
                    [Op.ne]: 'cancelled' // Exclude cancelled bookings
                },
                [Op.or]: [
                    // New booking starts during existing booking
                    {
                        checkInDate: {
                            [Op.lte]: checkInDate
                        },
                        checkOutDate: {
                            [Op.gt]: checkInDate
                        }
                    },
                    // New booking ends during existing booking
                    {
                        checkInDate: {
                            [Op.lt]: checkOutDate
                        },
                        checkOutDate: {
                            [Op.gte]: checkOutDate
                        }
                    },
                    // New booking encompasses existing booking
                    {
                        checkInDate: {
                            [Op.gte]: checkInDate
                        },
                        checkOutDate: {
                            [Op.lte]: checkOutDate
                        }
                    }
                ]
            }
        });

        if (existingBooking) {
            return res.status(409).json({
                error: 'Property is already booked for the selected dates',
                message: 'This property is not available for your selected dates. Please choose different dates.'
            });
        }

        const booking = await Booking.create({
            userId: req.user.userId,
            propertyId,
            checkInDate,
            checkOutDate,
            guests,
            totalPrice,
            status: 'confirmed' // Auto-confirm for now
        });

        res.status(201).json(booking);
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// Get my bookings
router.get('/my-bookings', authenticateToken, async (req, res) => {
    try {
        const bookings = await Booking.findAll({
            where: { userId: req.user.userId },
            include: [{ model: Property, attributes: ['title', 'location', 'images'] }]
        });
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Get bookings for vendor's properties
router.get('/vendor-bookings', authenticateToken, async (req, res) => {
    try {
        // First find all properties owned by the user
        const properties = await Property.findAll({
            where: { hostId: req.user.userId },
            attributes: ['id']
        });

        const propertyIds = properties.map(p => p.id);

        if (propertyIds.length === 0) {
            return res.json([]);
        }

        const bookings = await Booking.findAll({
            where: { propertyId: propertyIds },
            include: [
                { model: Property, attributes: ['title', 'location'] },
                { model: User, attributes: ['username', 'email'] }
            ]
        });
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching vendor bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Get all bookings (Admin only)
router.get('/all-bookings', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const bookings = await Booking.findAll({
            include: [
                { model: Property, attributes: ['title', 'location'] },
                { model: User, attributes: ['username', 'email'] } // The user who booked
            ]
        });
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching all bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

module.exports = router;
