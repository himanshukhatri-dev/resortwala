const express = require('express');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        const users = await User.findAll({
            attributes: ['id', 'username', 'email', 'role', 'createdAt'] // Exclude password
        });

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

module.exports = router;
