import React from 'react';
import { FaFacebook, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

export default function Footer() {
    return (
        <footer className="bg-gray-50 border-t border-gray-100 py-12 mt-auto">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <img
                            src="/resortwala-logo.png"
                            alt="ResortWala"
                            className="h-10 w-auto mb-4"
                        />
                        <p className="text-gray-500 text-sm">
                            Discover the most amazing villas and resorts for your next holiday.
                        </p>
                    </div>

                    {/* Links 1 */}
                    <div>
                        <h4 className="font-bold text-gray-900 mb-4">Support</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li><a href="#" className="hover:underline">Help Center</a></li>
                            <li><a href="#" className="hover:underline">Safety information</a></li>
                            <li><a href="#" className="hover:underline">Cancellation options</a></li>
                            <li><a href="#" className="hover:underline">Report a concern</a></li>
                        </ul>
                    </div>

                    {/* Links 2 */}
                    <div>
                        <h4 className="font-bold text-gray-900 mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li><a href="#" className="hover:underline">About us</a></li>
                            <li><a href="#" className="hover:underline">Careers</a></li>
                            <li><a href="#" className="hover:underline">Investors</a></li>
                            <li><a href="#" className="hover:underline">Villas</a></li>
                        </ul>
                    </div>

                    {/* Social */}
                    <div>
                        <h4 className="font-bold text-gray-900 mb-4">Follow us</h4>
                        <div className="flex gap-4 text-gray-600">
                            <a href="#" className="hover:text-[#FF385C] transition"><FaFacebook size={20} /></a>
                            <a href="#" className="hover:text-[#FF385C] transition"><FaXTwitter size={20} /></a>
                            <a href="#" className="hover:text-[#FF385C] transition"><FaInstagram size={20} /></a>
                            <a href="#" className="hover:text-[#FF385C] transition"><FaLinkedin size={20} /></a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                    <p>© 2024 ResortWala, Inc. All rights reserved.</p>
                    <div className="flex gap-4 mt-4 md:mt-0">
                        <a href="#" className="hover:underline">Privacy</a>
                        <a href="#" className="hover:underline">Terms</a>
                        <a href="#" className="hover:underline">Sitemap</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
