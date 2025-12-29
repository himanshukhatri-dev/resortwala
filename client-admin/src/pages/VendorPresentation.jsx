import React, { useState } from 'react';
import { FaRocket, FaChartLine, FaUsers, FaMoneyBillWave, FaShieldAlt, FaClock, FaMobile, FaGlobe, FaHeadset, FaCheckCircle, FaStar, FaArrowRight, FaCalculator, FaPlay } from 'react-icons/fa';

export default function VendorPresentation() {
    const [activeTab, setActiveTab] = useState('features');
    const [roiInputs, setRoiInputs] = useState({ properties: 5, avgBooking: 5000, monthlyBookings: 20 });

    const calculateROI = () => {
        const { properties, avgBooking, monthlyBookings } = roiInputs;
        const monthlyRevenue = avgBooking * monthlyBookings * properties;
        const commission = monthlyRevenue * 0.15; // 15% commission
        const netRevenue = monthlyRevenue - commission;
        const yearlyRevenue = netRevenue * 12;
        return { monthlyRevenue, commission, netRevenue, yearlyRevenue };
    };

    const roi = calculateROI();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-20 px-6">
                <div className="absolute inset-0 bg-black opacity-10"></div>
                <div className="relative max-w-6xl mx-auto text-center">
                    <div className="inline-block mb-6 px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold">
                        🚀 Partner with ResortWala
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                        Transform Your<br />
                        <span className="text-yellow-300">Property Business</span>
                    </h1>
                    <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
                        Join India's fastest-growing resort & waterpark booking platform. Reach millions of travelers and maximize your revenue.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                            <div className="text-4xl font-black text-yellow-300">500+</div>
                            <div className="text-sm mt-2 text-white/80">Partner Properties</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                            <div className="text-4xl font-black text-yellow-300">50K+</div>
                            <div className="text-sm mt-2 text-white/80">Monthly Bookings</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                            <div className="text-4xl font-black text-yellow-300">₹10Cr+</div>
                            <div className="text-sm mt-2 text-white/80">Revenue Generated</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Problem Statement */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black mb-4">The Challenge You Face</h2>
                        <p className="text-xl text-gray-600">Traditional booking methods are holding you back</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            { title: 'Limited Reach', desc: 'Struggling to attract customers beyond local markets', icon: <FaGlobe /> },
                            { title: 'High Commission', desc: 'OTAs charging 20-30% commission eating into profits', icon: <FaMoneyBillWave /> },
                            { title: 'Manual Management', desc: 'Spending hours on phone calls and WhatsApp bookings', icon: <FaClock /> },
                            { title: 'No Analytics', desc: 'Flying blind without data on customer behavior and trends', icon: <FaChartLine /> }
                        ].map((problem, idx) => (
                            <div key={idx} className="group bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-2xl p-6 transition-all duration-300 hover:scale-105">
                                <div className="text-4xl text-red-500 mb-4">{problem.icon}</div>
                                <h3 className="text-xl font-bold mb-2 text-gray-900">{problem.title}</h3>
                                <p className="text-gray-700">{problem.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Solution Overview */}
            <section className="py-20 px-6 bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black mb-4">Our Solution</h2>
                        <p className="text-xl text-gray-600">Everything you need to grow your business</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: 'Smart Dashboard', desc: 'Manage bookings, pricing, and availability in one place', icon: <FaMobile />, color: 'blue' },
                            { title: 'Zero Marketing Cost', desc: 'We bring customers to you through our platform', icon: <FaUsers />, color: 'purple' },
                            { title: 'Instant Payments', desc: 'Get paid directly with transparent commission structure', icon: <FaMoneyBillWave />, color: 'green' },
                            { title: 'Real-time Analytics', desc: 'Track performance with detailed insights and reports', icon: <FaChartLine />, color: 'orange' },
                            { title: '24/7 Support', desc: 'Dedicated support team to help you succeed', icon: <FaHeadset />, color: 'pink' },
                            { title: 'Secure Platform', desc: 'Bank-grade security for all transactions', icon: <FaShieldAlt />, color: 'red' }
                        ].map((feature, idx) => (
                            <div key={idx} className={`group bg-white hover:shadow-2xl border-2 border-${feature.color}-200 rounded-2xl p-6 transition-all duration-300 hover:scale-105`}>
                                <div className={`text-5xl text-${feature.color}-500 mb-4`}>{feature.icon}</div>
                                <h3 className="text-xl font-bold mb-2 text-gray-900">{feature.title}</h3>
                                <p className="text-gray-600">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Platform Features with Tabs */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black mb-4">Platform Features</h2>
                        <p className="text-xl text-gray-600">Powerful tools to manage and grow your business</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 mb-12">
                        {['features', 'pricing', 'analytics', 'support'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-8 py-3 rounded-full font-bold transition-all ${activeTab === tab
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 md:p-12 min-h-[400px]">
                        {activeTab === 'features' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[
                                    'Calendar Management - Block dates, set pricing by season',
                                    'Multi-property Support - Manage all properties from one account',
                                    'Automated Confirmations - Instant booking confirmations via SMS/Email',
                                    'Dynamic Pricing - Adjust prices based on demand and occupancy',
                                    'Guest Communication - Built-in messaging system',
                                    'Review Management - Respond to reviews and build reputation'
                                ].map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-4 bg-white p-6 rounded-xl shadow-sm">
                                        <FaCheckCircle className="text-green-500 text-2xl flex-shrink-0 mt-1" />
                                        <p className="text-gray-800 font-medium">{feature}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {activeTab === 'pricing' && (
                            <div className="text-center">
                                <h3 className="text-3xl font-black mb-6">Transparent Pricing</h3>
                                <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 shadow-xl">
                                    <div className="text-6xl font-black text-blue-600 mb-4">15%</div>
                                    <div className="text-xl text-gray-700 mb-6">Commission on Bookings</div>
                                    <div className="space-y-4 text-left">
                                        <div className="flex items-center gap-3">
                                            <FaCheckCircle className="text-green-500" />
                                            <span>No listing fees or hidden charges</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <FaCheckCircle className="text-green-500" />
                                            <span>Pay only when you get bookings</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <FaCheckCircle className="text-green-500" />
                                            <span>Transparent payment tracking</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'analytics' && (
                            <div>
                                <h3 className="text-3xl font-black mb-6 text-center">Performance Analytics</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                        { label: 'Booking Trends', value: 'Track daily, weekly, monthly bookings' },
                                        { label: 'Revenue Reports', value: 'Detailed income and commission breakdown' },
                                        { label: 'Customer Insights', value: 'Understand your guest demographics' },
                                        { label: 'Occupancy Rates', value: 'Monitor property utilization' },
                                        { label: 'Pricing Analytics', value: 'Optimize rates for maximum revenue' },
                                        { label: 'Competitor Analysis', value: 'See how you stack up' }
                                    ].map((item, idx) => (
                                        <div key={idx} className="bg-white p-6 rounded-xl shadow-sm">
                                            <div className="font-bold text-lg mb-2 text-blue-600">{item.label}</div>
                                            <p className="text-gray-600 text-sm">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {activeTab === 'support' && (
                            <div>
                                <h3 className="text-3xl font-black mb-6 text-center">24/7 Support</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-white p-8 rounded-2xl shadow-lg">
                                        <FaHeadset className="text-5xl text-blue-500 mb-4" />
                                        <h4 className="text-xl font-bold mb-3">Dedicated Account Manager</h4>
                                        <p className="text-gray-600">Personal support to help you maximize bookings and revenue</p>
                                    </div>
                                    <div className="bg-white p-8 rounded-2xl shadow-lg">
                                        <FaMobile className="text-5xl text-purple-500 mb-4" />
                                        <h4 className="text-xl font-bold mb-3">Multi-channel Support</h4>
                                        <p className="text-gray-600">Phone, WhatsApp, Email - reach us however you prefer</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ROI Calculator */}
            <section className="py-20 px-6 bg-gradient-to-br from-green-50 to-blue-50">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <FaCalculator className="text-6xl text-green-600 mx-auto mb-4" />
                        <h2 className="text-4xl md:text-5xl font-black mb-4">Calculate Your Potential Revenue</h2>
                        <p className="text-xl text-gray-600">See how much you can earn with ResortWala</p>
                    </div>
                    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Number of Properties</label>
                                <input
                                    type="number"
                                    value={roiInputs.properties}
                                    onChange={(e) => setRoiInputs({ ...roiInputs, properties: parseInt(e.target.value) || 0 })}
                                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none text-lg font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Avg Booking Value (₹)</label>
                                <input
                                    type="number"
                                    value={roiInputs.avgBooking}
                                    onChange={(e) => setRoiInputs({ ...roiInputs, avgBooking: parseInt(e.target.value) || 0 })}
                                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none text-lg font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Monthly Bookings/Property</label>
                                <input
                                    type="number"
                                    value={roiInputs.monthlyBookings}
                                    onChange={(e) => setRoiInputs({ ...roiInputs, monthlyBookings: parseInt(e.target.value) || 0 })}
                                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none text-lg font-bold"
                                />
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-8 text-white">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="text-sm opacity-90 mb-1">Monthly Revenue</div>
                                    <div className="text-3xl font-black">₹{roi.monthlyRevenue.toLocaleString('en-IN')}</div>
                                </div>
                                <div>
                                    <div className="text-sm opacity-90 mb-1">Commission (15%)</div>
                                    <div className="text-3xl font-black">₹{roi.commission.toLocaleString('en-IN')}</div>
                                </div>
                                <div>
                                    <div className="text-sm opacity-90 mb-1">Your Net Revenue</div>
                                    <div className="text-3xl font-black">₹{roi.netRevenue.toLocaleString('en-IN')}</div>
                                </div>
                                <div>
                                    <div className="text-sm opacity-90 mb-1">Yearly Potential</div>
                                    <div className="text-3xl font-black">₹{roi.yearlyRevenue.toLocaleString('en-IN')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Success Stories */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black mb-4">Success Stories</h2>
                        <p className="text-xl text-gray-600">See how our partners are thriving</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { name: 'Sunshine Villa Resort', location: 'Lonavala', growth: '300%', bookings: '150+', quote: 'ResortWala transformed our business. We went from 5 bookings/month to 50+!' },
                            { name: 'AquaSplash Waterpark', location: 'Mumbai', growth: '250%', bookings: '500+', quote: 'The platform is incredibly easy to use and customer support is outstanding.' },
                            { name: 'Mountain View Cottages', location: 'Mahabaleshwar', growth: '400%', bookings: '200+', quote: 'Best decision we made. Revenue increased 4x in just 6 months!' }
                        ].map((story, idx) => (
                            <div key={idx} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-blue-200 hover:shadow-2xl transition-all duration-300">
                                <div className="flex items-center gap-2 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar key={i} className="text-yellow-400 text-xl" />
                                    ))}
                                </div>
                                <p className="text-gray-700 italic mb-6">"{story.quote}"</p>
                                <div className="border-t-2 border-blue-200 pt-4">
                                    <div className="font-bold text-lg text-gray-900">{story.name}</div>
                                    <div className="text-sm text-gray-600 mb-4">{story.location}</div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-2xl font-black text-green-600">{story.growth}</div>
                                            <div className="text-xs text-gray-600">Growth</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-black text-blue-600">{story.bookings}</div>
                                            <div className="text-xs text-gray-600">Monthly Bookings</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-20 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-6xl font-black mb-6">Ready to Get Started?</h2>
                    <p className="text-xl md:text-2xl mb-12 text-white/90">
                        Join hundreds of successful property owners on ResortWala
                    </p>
                    <div className="flex flex-col md:flex-row gap-6 justify-center">
                        <button className="bg-white text-blue-600 px-12 py-5 rounded-full font-black text-lg hover:scale-105 transition-transform shadow-2xl flex items-center justify-center gap-3">
                            <FaRocket /> List Your Property
                        </button>
                        <button className="bg-white/10 backdrop-blur-md border-2 border-white text-white px-12 py-5 rounded-full font-black text-lg hover:scale-105 transition-transform flex items-center justify-center gap-3">
                            <FaPlay /> Watch Demo
                        </button>
                    </div>
                    <div className="mt-12 text-white/80">
                        <p>Questions? Call us at <span className="font-bold text-yellow-300">+91 98765 43210</span></p>
                    </div>
                </div>
            </section>
        </div>
    );
}
