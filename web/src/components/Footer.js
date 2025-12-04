import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="bg-rose-500 p-1.5 rounded-lg transform transition-transform group-hover:rotate-12">
                                <img
                                    src="https://www.resortwala.com/favicon.ico"
                                    alt="ResortWala Logo"
                                    className="w-6 h-6 object-contain"
                                />
                            </div>
                            <span className="text-2xl font-bold text-white">
                                ResortWala
                            </span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Discover handpicked luxury villas, resorts, and private stays for your perfect getaway. Experience hospitality like never before.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-full hover:bg-rose-500 transition-colors">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-full hover:bg-rose-500 transition-colors">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-full hover:bg-rose-500 transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-bold mb-6">Quick Links</h3>
                        <ul className="space-y-3">
                            <li><Link to="/" className="text-gray-400 hover:text-rose-500 transition-colors">Home</Link></li>
                            <li><Link to="/search" className="text-gray-400 hover:text-rose-500 transition-colors">Browse Properties</Link></li>
                            <li><Link to="/contact" className="text-gray-400 hover:text-rose-500 transition-colors">Contact Us</Link></li>
                            <li><Link to="/login" className="text-gray-400 hover:text-rose-500 transition-colors">Login</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-lg font-bold mb-6">Support</h3>
                        <ul className="space-y-3">
                            <li><Link to="/help" className="text-gray-400 hover:text-rose-500 transition-colors">Help Center</Link></li>
                            <li><Link to="/terms" className="text-gray-400 hover:text-rose-500 transition-colors">Terms of Service</Link></li>
                            <li><Link to="/privacy" className="text-gray-400 hover:text-rose-500 transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/cancellation" className="text-gray-400 hover:text-rose-500 transition-colors">Cancellation Policy</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-lg font-bold mb-6">Contact Us</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-gray-400">
                                <MapPin className="w-5 h-5 text-rose-500 shrink-0 mt-1" />
                                <span>123 Luxury Lane, Paradise City, Mumbai, India 400001</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-400">
                                <Phone className="w-5 h-5 text-rose-500 shrink-0" />
                                <span>+91 98765 43210</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-400">
                                <Mail className="w-5 h-5 text-rose-500 shrink-0" />
                                <span>hello@resortwala.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} ResortWala. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
