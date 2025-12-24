import React from 'react';
import { motion } from 'framer-motion';
import { FaHeart, FaStar, FaShieldAlt, FaUsers } from 'react-icons/fa';

export default function About() {
    return (
        <div className="pt-24 pb-20 min-h-screen bg-white">
            {/* Hero Section */}
            <div className="relative h-[400px] flex items-center justify-center bg-gray-900 text-white overflow-hidden">
                <div className="absolute inset-0 bg-black/40 z-10" />
                <img
                    src="https://images.unsplash.com/photo-1571896349842-6e53ce41e887?q=80&w=2070&auto=format&fit=crop"
                    alt="Luxury Resort"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="relative z-20 text-center px-4">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-bold font-serif mb-4"
                    >
                        About ResortWala
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto"
                    >
                        Redefining luxury escapes and unforgettable experiences across India's most stunning destinations.
                    </motion.p>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-4 py-16 max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Founded with a passion for travel and a commitment to excellence, ResortWala began as a simple idea: to make discovering and booking luxury properties as effortless as the vacation itself.
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            From hidden hillside villas in Lonavala to sprawls of waterpark resorts in Mumbai, we strictly curate our portfolio to ensure every stay meets our high standards of comfort, amenities, and hospitality. We are not just a booking platform; we are your partners in planning the perfect getaway.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <img src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070&auto=format&fit=crop" alt="Resort" className="rounded-2xl shadow-lg w-full h-64 object-cover mt-8" />
                        <img src="https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=2070&auto=format&fit=crop" alt="Villa" className="rounded-2xl shadow-lg w-full h-64 object-cover" />
                    </div>
                </div>

                {/* Values Section */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Why Choose Us?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { icon: <FaStar />, title: "Premium Quality", desc: "Handpicked properties that guarantee a luxurious stay." },
                            { icon: <FaShieldAlt />, title: "Secure Booking", desc: "100% safe payment gateways and transparent policies." },
                            { icon: <FaHeart />, title: "Customer First", desc: "24/7 dedicated support to assist you at every step." },
                            { icon: <FaUsers />, title: "Trusted by Many", desc: "Thousands of happy travelers have found their paradise with us." }
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ y: -5 }}
                                className="bg-gray-50 p-8 rounded-2xl text-center hover:shadow-lg transition-all border border-gray-100"
                            >
                                <div className="w-14 h-14 bg-white text-secondary rounded-full flex items-center justify-center text-2xl shadow-sm mx-auto mb-4 text-[#FF385C]">
                                    {item.icon}
                                </div>
                                <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                                <p className="text-gray-500 text-sm">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Call to Action */}
                <div className="bg-[#FF385C] rounded-3xl p-12 text-center text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-4">Ready for your next adventure?</h2>
                        <p className="text-white/90 mb-8 max-w-xl mx-auto">Explore our exclusive collection of villas and resorts tailored just for you.</p>
                        <a href="/" className="inline-block bg-white text-[#FF385C] font-bold px-8 py-3 rounded-full hover:bg-gray-100 transition shadow-lg">
                            Browse Properties
                        </a>
                    </div>
                    {/* Decorative circles */}
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2 blur-2xl" />
                </div>
            </div>
        </div>
    );
}
