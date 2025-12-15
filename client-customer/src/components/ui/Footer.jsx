import React from 'react';
import { FaFacebook, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

export default function Footer() {
    return (

        <footer className="bg-brand-darker border-t border-white/10 py-8 mt-12 text-gray-400">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <img
                            src="/resortwala-logo.png"
                            alt="ResortWala"
                            className="h-8 w-auto mb-3 opacity-90"
                        />
                        <p className="text-sm">
                            Discover the most amazing villas and resorts for your next holiday.
                        </p>
                    </div>

                    {/* Links 1 */}
                    <div>
                        <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wider font-serif">Support</h4>
                        <ul className="space-y-1.5 text-sm">
                            <li><a href="#" className="hover:text-primary transition">Help Center</a></li>
                            <li><a href="#" className="hover:text-primary transition">Safety information</a></li>
                            <li><a href="#" className="hover:text-primary transition">Cancellation options</a></li>
                            <li><a href="#" className="hover:text-primary transition">Report a concern</a></li>
                        </ul>
                    </div>

                    {/* Links 2 */}
                    <div>
                        <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wider font-serif">Company</h4>
                        <ul className="space-y-1.5 text-sm">
                            <li><a href="#" className="hover:text-primary transition">About us</a></li>
                            <li><a href="#" className="hover:text-primary transition">Careers</a></li>
                            <li><a href="#" className="hover:text-primary transition">Investors</a></li>
                            <li><a href="#" className="hover:text-primary transition">Villas</a></li>
                        </ul>
                    </div>

                    {/* Social */}
                    <div>
                        <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wider font-serif">Follow us</h4>
                        <div className="flex gap-4">
                            <a href="#" className="hover:text-primary transition"><FaFacebook size={18} /></a>
                            <a href="#" className="hover:text-primary transition"><FaXTwitter size={18} /></a>
                            <a href="#" className="hover:text-primary transition"><FaInstagram size={18} /></a>
                            <a href="#" className="hover:text-primary transition"><FaLinkedin size={18} /></a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center text-xs">
                    <p>© {new Date().getFullYear()} ResortWala, Inc. All rights reserved.</p>
                    <div className="flex gap-4 mt-4 md:mt-0">
                        <a href="#" className="hover:text-primary transition">Privacy</a>
                        <a href="#" className="hover:text-primary transition">Terms</a>
                        <a href="#" className="hover:text-primary transition">Sitemap</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
