import { FaFacebook, FaInstagram, FaYoutube } from 'react-icons/fa';

export default function Footer() {
    return (

        <footer className="bg-brand-darker border-t border-white/10 py-6 mt-8 text-gray-400">
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
                        <ul className="space-y-3 text-sm">
                            <li><a href="/contact" className="hover:text-primary transition py-2 block">Help Center</a></li>
                            <li><a href="/policy/safety" className="hover:text-primary transition py-2 block">Safety information</a></li>
                            <li><a href="/policy/cancellation" className="hover:text-primary transition py-2 block">Cancellation options</a></li>
                        </ul>
                    </div>

                    {/* Links 2 */}
                    <div>
                        <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wider font-serif">Company</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="/about" className="hover:text-primary transition py-2 block">About us</a></li>
                            <li><a href="/policy/terms" className="hover:text-primary transition py-2 block">Terms of Service</a></li>
                            <li><a href="/policy/privacy" className="hover:text-primary transition py-2 block">Privacy Policy</a></li>
                            <li><a href="/" className="hover:text-primary transition py-2 block">Villas & Resorts</a></li>
                        </ul>
                    </div>

                    {/* Social */}
                    <div>
                        <h4 className="font-bold text-white mb-3 text-sm uppercase tracking-wider font-serif">Follow us</h4>
                        <div className="flex gap-4">
                            <a href="https://www.facebook.com/people/ResortWala/61574769120799/?rdid=WH84Mo0HyfYDJavP" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition p-2"><FaFacebook size={24} /></a>
                            <a href="https://www.instagram.com/resortwala.official/?igsh=MXByb3FnaXNmaHJxdw%3D%3D" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition p-2"><FaInstagram size={24} /></a>
                            <a href="https://www.youtube.com/@ResortWala.official" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition p-2"><FaYoutube size={24} /></a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-6 pt-6 flex flex-col md:flex-row justify-between items-center text-gray-400 gap-4">
                    <p className="text-sm order-2 md:order-1 text-center md:text-left">&copy; {new Date().getFullYear()} ResortWala. All rights reserved.</p>

                    <div className="flex gap-6 order-1 md:order-2">
                        <a href="/policy/privacy" className="hover:text-primary transition text-sm">Privacy</a>
                        <a href="/policy/terms" className="hover:text-primary transition text-sm">Terms</a>
                        <a href="/" className="hover:text-primary transition text-sm">Sitemap</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
