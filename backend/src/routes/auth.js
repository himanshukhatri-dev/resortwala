const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Create new user
    const newUser = await User.create({
      username,
      email,
      password,
      role: role || 'customer'
    });

    // Create JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || 'resortwala-secret-key-change-this',
      { expiresIn: '24h' }
    );

    // Return user data (without password)
    const userResponse = newUser.toJSON();
    delete userResponse.password;

    res.status(201).json({
      message: 'Registration successful',
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // If user has no password (google only), prompt to login with google
    if (!user.password) {
      return res.status(400).json({ error: 'Please login with Google' });
    }

    // Verify password
    const isValidPassword = await user.validatePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'resortwala-secret-key-change-this',
      { expiresIn: '24h' }
    );

    // Return user data (without password)
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json({
      message: 'Login successful',
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Google Login
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    // Verify Google Token
    // NOTE: In a real app with a real Client ID, you would use:
    // const ticket = await client.verifyIdToken({
    //   idToken: credential,
    //   audience: process.env.GOOGLE_CLIENT_ID,
    // });
    // const payload = ticket.getPayload();

    // For this local demo without a real Client ID, we will decode the token directly
    // WARNING: This is less secure but allows the demo to work without configuration
    const jwt = require('jsonwebtoken');
    const payload = jwt.decode(credential);

    if (!payload) {
      return res.status(400).json({ error: 'Invalid Google Token' });
    }

    const { email, name, sub: googleId, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ where: { email } });

    if (user) {
      // Update googleId if missing
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Create new user
      // Generate a unique username if needed
      let username = name.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000);

      user = await User.create({
        username,
        email,
        googleId,
        role: 'customer',
        profileImage: picture
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'resortwala-secret-key-change-this',
      { expiresIn: '24h' }
    );

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json({
      message: 'Google Login successful',
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Google Login error:', error);
    res.status(500).json({ error: 'Google Login failed' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json({
      user: userResponse
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

module.exports = router;