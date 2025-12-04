const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// Create a transporter (Mock for now, or use real credentials)
// For development, we'll use Ethereal or just log it if no env vars
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your preferred service
    auth: {
        user: process.env.EMAIL_USER || 'test@example.com',
        pass: process.env.EMAIL_PASS || 'password'
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // In a real app, you would send the email here
        // await transporter.sendMail({
        //   from: email,
        //   to: process.env.EMAIL_USER,
        //   subject: `New Contact from ${name}`,
        //   text: message
        // });

        // For this demo, we'll just log it and simulate success
        console.log('📨 New Contact Form Submission:');
        console.log('Name:', name);
        console.log('Email:', email);
        console.log('Message:', message);

        res.json({ message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Contact error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

module.exports = router;
