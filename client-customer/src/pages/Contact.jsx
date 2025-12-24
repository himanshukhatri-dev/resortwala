import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaPaperPlane, FaQuestionCircle } from 'react-icons/fa';

export default function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulate submission
        setTimeout(() => {
            setSubmitted(true);
            setFormData({ name: '', email: '', subject: '', message: '' });
        }, 1000);
    };

    return (
        <div className="pt-32 pb-20 min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <FaQuestionCircle className="text-blue-600 text-3xl" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Help Center
                    </h1>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        Have questions? We're here to help 24/7. Reach out and we'll get back to you within 2 hours.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* LEFT: Contact Info Cards */}
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <FaPhone className="text-blue-600 text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1">Call Us</h3>
                                    <p className="text-gray-500 text-sm mb-2">Available 24/7 for your convenience</p>
                                    <a href="tel:+919870646548" className="text-blue-600 font-semibold hover:underline">
                                        +91 98706 46548
                                    </a>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <FaEnvelope className="text-green-600 text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1">Email Us</h3>
                                    <p className="text-gray-500 text-sm mb-2">We'll respond within 2 hours</p>
                                    <a href="mailto:support@resortwala.com" className="text-green-600 font-semibold hover:underline">
                                        support@resortwala.com
                                    </a>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <FaMapMarkerAlt className="text-purple-600 text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1">Visit Us</h3>
                                    <p className="text-gray-500 text-sm mb-2">Our office location</p>
                                    <p className="text-gray-700 font-medium">
                                        Mumbai, India
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Quick Links */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-100"
                        >
                            <h3 className="font-bold text-gray-900 mb-3">Quick Links</h3>
                            <div className="space-y-2">
                                <a href="/bookings" className="block text-blue-600 hover:underline text-sm font-medium">
                                    → View My Bookings
                                </a>
                                <a href="/profile" className="block text-blue-600 hover:underline text-sm font-medium">
                                    → Manage Profile
                                </a>
                                <a href="/" className="block text-blue-600 hover:underline text-sm font-medium">
                                    → Browse Properties
                                </a>
                            </div>
                        </motion.div>
                    </div>

                    {/* RIGHT: Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
                    >
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Send us a message</h2>
                        <p className="text-gray-500 mb-6">Fill out the form and we'll get back to you soon.</p>

                        {submitted ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-green-50 border border-green-200 rounded-xl p-8 text-center"
                            >
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                    ✓
                                </div>
                                <h3 className="text-xl font-bold text-green-800 mb-2">Message Sent!</h3>
                                <p className="text-green-700 mb-4">Thank you for reaching out. We'll get back to you shortly.</p>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="text-green-700 font-semibold hover:underline"
                                >
                                    Send another message
                                </button>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        required
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        placeholder="How can we help?"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                                    <textarea
                                        name="message"
                                        required
                                        rows="5"
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                                        placeholder="Tell us more about your inquiry..."
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
                                >
                                    <span>Send Message</span>
                                    <FaPaperPlane className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </form>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
