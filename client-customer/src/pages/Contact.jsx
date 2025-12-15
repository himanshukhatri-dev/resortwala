import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaPaperPlane } from 'react-icons/fa';

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
        <div className="pt-20 min-h-screen bg-gray-50">
            {/* 1. HERO SECTION */}
            <div className="relative h-[40vh] w-full bg-[#0F172A] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop"
                    alt="Contact Support"
                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent" />

                <div className="relative z-10 max-w-4xl mx-auto animate-fade-up">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        We're here to <span className="text-primary">help</span>
                    </h1>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                        Have questions about a booking, a property, or just want to say hello? Our team is ready to assist you 24/7.
                    </p>
                </div>
            </div>

            {/* 2. CONTACT CONTENT */}
            <div className="container mx-auto px-4 py-16 -mt-20 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                    {/* LEFT: INFO CARD */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-[#0F172A] text-white p-10 rounded-3xl shadow-xl h-full flex flex-col justify-between"
                    >
                        <div>
                            <h2 className="text-3xl font-bold mb-8">Contact Information</h2>
                            <p className="text-gray-400 mb-12 text-lg">
                                Reach out to us through any of these channels. We prioritize customer satisfaction above all else.
                            </p>

                            <div className="space-y-8">
                                <div className="flex items-center gap-6 group cursor-pointer">
                                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-primary transition-colors">
                                        <FaPhone className="text-white text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Call Us</p>
                                        <p className="text-xl font-medium">+91 98765 43210</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 group cursor-pointer">
                                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-primary transition-colors">
                                        <FaEnvelope className="text-white text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Email Us</p>
                                        <p className="text-xl font-medium">support@resortwala.com</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 group cursor-pointer">
                                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-primary transition-colors">
                                        <FaMapMarkerAlt className="text-white text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Visit Us</p>
                                        <p className="text-xl font-medium">123 Paradise Lane, Goa, India</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-16 pt-8 border-t border-white/10">
                            <div className="flex gap-4">
                                {['Twitter', 'Instagram', 'LinkedIn'].map(social => (
                                    <div key={social} className="w-10 h-10 rounded-full bg-white/5 hover:bg-primary flex items-center justify-center transition-colors cursor-pointer text-sm">
                                        {social[0]}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT: FORM */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100"
                    >
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Send us a message</h2>
                        <p className="text-gray-500 mb-8">We usually respond within 2 hours.</p>

                        {submitted ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center"
                            >
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
                                <h3 className="text-2xl font-bold text-green-800 mb-2">Message Sent!</h3>
                                <p className="text-green-700">Thank you for reaching out. We'll get back to you shortly.</p>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="mt-6 text-green-700 font-semibold hover:text-green-900"
                                >
                                    Send another message
                                </button>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Your Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-gray-50 focus:bg-white"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-gray-50 focus:bg-white"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Subject</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        required
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-gray-50 focus:bg-white"
                                        placeholder="How can we help?"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Message</label>
                                    <textarea
                                        name="message"
                                        required
                                        rows="4"
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-gray-50 focus:bg-white resize-none"
                                        placeholder="Tell us more about your inquiry..."
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
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
