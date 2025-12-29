import React, { useState } from 'react';
import { FaRocket, FaChartLine, FaUsers, FaMoneyBillWave, FaShieldAlt, FaGlobe, FaMobile, FaCheckCircle, FaStar, FaArrowRight, FaLightbulb, FaTrophy, FaHandshake } from 'react-icons/fa';

export default function InvestorPresentation() {
    const [activeTab, setActiveTab] = useState('market');

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white py-20 px-6">
                <div className="absolute inset-0 bg-black opacity-10"></div>
                <div className="relative max-w-6xl mx-auto text-center">
                    <div className="inline-block mb-6 px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold">
                        💎 Investment Opportunity
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                        Invest in India's<br />
                        <span className="text-yellow-300">Resort Revolution</span>
                    </h1>
                    <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
                        Join us in building India's largest resort & waterpark booking platform. Massive market, proven model, exponential growth.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto mt-12">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                            <div className="text-4xl font-black text-yellow-300">₹50Cr</div>
                            <div className="text-sm mt-2 text-white/80">Market Size</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                            <div className="text-4xl font-black text-yellow-300">300%</div>
                            <div className="text-sm mt-2 text-white/80">YoY Growth</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                            <div className="text-4xl font-black text-yellow-300">500+</div>
                            <div className="text-sm mt-2 text-white/80">Properties</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                            <div className="text-4xl font-black text-yellow-300">15%</div>
                            <div className="text-sm mt-2 text-white/80">Commission</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Market Opportunity */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black mb-4">Massive Market Opportunity</h2>
                        <p className="text-xl text-gray-600">India's leisure travel market is exploding</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: '₹2.5 Lakh Cr', desc: 'Indian domestic tourism market size', icon: <FaGlobe />, color: 'blue' },
                            { title: '40% CAGR', desc: 'Resort & waterpark segment growth', icon: <FaChartLine />, color: 'green' },
                            { title: '1.4B People', desc: 'Target market - Indian population', icon: <FaUsers />, color: 'purple' }
                        ].map((stat, idx) => (
                            <div key={idx} className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100 p-8 rounded-2xl border-2 border-${stat.color}-200 hover:shadow-2xl transition-all duration-300`}>
                                <div className={`text-5xl text-${stat.color}-500 mb-4`}>{stat.icon}</div>
                                <div className={`text-4xl font-black text-${stat.color}-600 mb-2`}>{stat.title}</div>
                                <p className="text-gray-700">{stat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Business Model */}
            <section className="py-20 px-6 bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black mb-4">Proven Business Model</h2>
                        <p className="text-xl text-gray-600">Commission-based revenue with multiple streams</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-blue-100">
                            <h3 className="text-2xl font-black mb-4 text-blue-600">Revenue Streams</h3>
                            <div className="space-y-4">
                                {[
                                    '15% commission on bookings',
                                    'Premium listing fees',
                                    'Featured property placements',
                                    'Advertising revenue',
                                    'Data analytics services'
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <FaCheckCircle className="text-green-500 flex-shrink-0" />
                                        <span className="text-gray-700">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-purple-100">
                            <h3 className="text-2xl font-black mb-4 text-purple-600">Unit Economics</h3>
                            <div className="space-y-6">
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Avg Booking Value</div>
                                    <div className="text-3xl font-black text-gray-900">₹8,000</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Commission per Booking</div>
                                    <div className="text-3xl font-black text-green-600">₹1,200</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Customer Acquisition Cost</div>
                                    <div className="text-3xl font-black text-orange-600">₹150</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Traction & Metrics */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black mb-4">Impressive Traction</h2>
                        <p className="text-xl text-gray-600">Growing fast with strong metrics</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Monthly Bookings', value: '2,500+', growth: '+180%' },
                            { label: 'Active Properties', value: '500+', growth: '+250%' },
                            { label: 'Monthly Revenue', value: '₹30L', growth: '+300%' },
                            { label: 'Repeat Rate', value: '45%', growth: '+15%' }
                        ].map((metric, idx) => (
                            <div key={idx} className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border-2 border-indigo-100">
                                <div className="text-sm text-gray-600 mb-2">{metric.label}</div>
                                <div className="text-3xl font-black text-indigo-600 mb-1">{metric.value}</div>
                                <div className="text-xs text-green-600 font-bold">{metric.growth} MoM</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Competitive Advantage */}
            <section className="py-20 px-6 bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black mb-4">Competitive Advantages</h2>
                        <p className="text-xl text-gray-600">What sets us apart from competition</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: 'Niche Focus', desc: 'Exclusively resorts & waterparks - no hotels or homestays', icon: <FaTrophy /> },
                            { title: 'Lower Commission', desc: '15% vs 20-30% charged by OTAs', icon: <FaMoneyBillWave /> },
                            { title: 'Tech-First', desc: 'Modern platform with AI-powered recommendations', icon: <FaRocket /> },
                            { title: 'Vendor-Friendly', desc: 'Easy onboarding, instant payments, dedicated support', icon: <FaHandshake /> },
                            { title: 'Data Insights', desc: 'Advanced analytics for vendors and customers', icon: <FaChartLine /> },
                            { title: 'Mobile-First', desc: 'Seamless experience across all devices', icon: <FaMobile /> }
                        ].map((advantage, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-purple-100">
                                <div className="text-4xl text-purple-500 mb-4">{advantage.icon}</div>
                                <h3 className="text-xl font-bold mb-2 text-gray-900">{advantage.title}</h3>
                                <p className="text-gray-600">{advantage.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Financial Projections */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black mb-4">5-Year Projections</h2>
                        <p className="text-xl text-gray-600">Conservative estimates with proven growth trajectory</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full bg-white rounded-2xl overflow-hidden shadow-xl">
                            <thead className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                                <tr>
                                    <th className="px-6 py-4 text-left font-bold">Year</th>
                                    <th className="px-6 py-4 text-right font-bold">Properties</th>
                                    <th className="px-6 py-4 text-right font-bold">Bookings</th>
                                    <th className="px-6 py-4 text-right font-bold">Revenue</th>
                                    <th className="px-6 py-4 text-right font-bold">Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { year: 'Year 1', properties: '1,000', bookings: '50K', revenue: '₹6 Cr', profit: '₹1.5 Cr' },
                                    { year: 'Year 2', properties: '2,500', bookings: '150K', revenue: '₹18 Cr', profit: '₹5.4 Cr' },
                                    { year: 'Year 3', properties: '5,000', bookings: '400K', revenue: '₹48 Cr', profit: '₹16.8 Cr' },
                                    { year: 'Year 4', properties: '10,000', bookings: '1M', revenue: '₹120 Cr', profit: '₹48 Cr' },
                                    { year: 'Year 5', properties: '20,000', bookings: '2.5M', revenue: '₹300 Cr', profit: '₹135 Cr' }
                                ].map((row, idx) => (
                                    <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                        <td className="px-6 py-4 font-bold text-gray-900">{row.year}</td>
                                        <td className="px-6 py-4 text-right text-gray-700">{row.properties}</td>
                                        <td className="px-6 py-4 text-right text-gray-700">{row.bookings}</td>
                                        <td className="px-6 py-4 text-right font-bold text-green-600">{row.revenue}</td>
                                        <td className="px-6 py-4 text-right font-bold text-blue-600">{row.profit}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Investment Ask */}
            <section className="py-20 px-6 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-6xl font-black mb-6">Investment Opportunity</h2>
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-12 border-2 border-white/20 mb-12">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div>
                                <div className="text-sm text-white/70 mb-2">Seeking</div>
                                <div className="text-4xl font-black text-yellow-300">₹10 Cr</div>
                            </div>
                            <div>
                                <div className="text-sm text-white/70 mb-2">Valuation</div>
                                <div className="text-4xl font-black text-yellow-300">₹50 Cr</div>
                            </div>
                            <div>
                                <div className="text-sm text-white/70 mb-2">Equity</div>
                                <div className="text-4xl font-black text-yellow-300">20%</div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4 mb-12">
                        <h3 className="text-2xl font-bold">Use of Funds</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            {[
                                { item: 'Technology & Product Development', amount: '40%' },
                                { item: 'Marketing & Customer Acquisition', amount: '30%' },
                                { item: 'Team Expansion', amount: '20%' },
                                { item: 'Operations & Working Capital', amount: '10%' }
                            ].map((use, idx) => (
                                <div key={idx} className="bg-white/10 backdrop-blur-sm p-4 rounded-xl flex justify-between items-center">
                                    <span>{use.item}</span>
                                    <span className="font-black text-yellow-300">{use.amount}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-6 justify-center">
                        <button className="bg-white text-indigo-600 px-12 py-5 rounded-full font-black text-lg hover:scale-105 transition-transform shadow-2xl flex items-center justify-center gap-3">
                            <FaRocket /> Request Pitch Deck
                        </button>
                        <button className="bg-white/10 backdrop-blur-md border-2 border-white text-white px-12 py-5 rounded-full font-black text-lg hover:scale-105 transition-transform flex items-center justify-center gap-3">
                            <FaHandshake /> Schedule Meeting
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
