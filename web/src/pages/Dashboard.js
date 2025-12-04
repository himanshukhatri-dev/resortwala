import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { bookingAPI, propertyAPI, userAPI } from '../services/api';
import { Loader2, LayoutDashboard, Home, Calendar, Users, Building } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [bookings, setBookings] = useState([]);
    const [properties, setProperties] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [user, activeTab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            if (user.role === 'customer') {
                const data = await bookingAPI.getMyBookings();
                setBookings(data);
            } else if (user.role === 'vendor') {
                if (activeTab === 'bookings') {
                    const data = await bookingAPI.getVendorBookings();
                    setBookings(data);
                } else if (activeTab === 'properties') {
                    const data = await propertyAPI.getAll();
                    setProperties(data.filter(p => p.host?.id === user.userId || p.hostId === user.userId));
                }
            } else if (user.role === 'admin') {
                if (activeTab === 'bookings') {
                    const data = await bookingAPI.getAllBookings();
                    setBookings(data);
                } else if (activeTab === 'properties') {
                    const data = await propertyAPI.getAll();
                    setProperties(data);
                } else if (activeTab === 'users') {
                    const data = await userAPI.getAll();
                    setUsers(data);
                }
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                </div>
            );
        }

        if (user.role === 'customer') {
            return (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">My Trips</h2>
                    {bookings.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                            <p className="text-gray-500">No trips booked yet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {(bookings || []).map((booking) => (
                                <div key={booking.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-lg">{booking.Property?.title}</h3>
                                        <p className="text-gray-600">{booking.Property?.location}</p>
                                        <div className="mt-2 text-sm text-gray-500">
                                            {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {booking.status}
                                        </span>
                                        <p className="mt-2 font-bold text-lg">₹{booking.totalPrice}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        if (user.role === 'vendor') {
            return (
                <div className="space-y-6">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="text-gray-500 text-sm font-medium">Total Bookings</h3>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{bookings.length}</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bookings' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {(bookings || []).map((booking) => (
                                        <tr key={booking.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{booking.Property?.title}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.User?.username || booking.User?.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{booking.totalPrice}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'properties' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(properties || []).map(property => (
                                <div key={property.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <img src={property.images?.[0]} alt={property.title} className="w-full h-48 object-cover" />
                                    <div className="p-4">
                                        <h3 className="font-bold text-lg mb-1">{property.title}</h3>
                                        <p className="text-gray-500 text-sm mb-4">{property.location}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-rose-500">₹{property.pricePerNight}</span>
                                            <button className="text-sm text-gray-600 hover:text-gray-900">Edit</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        // Admin View
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">Admin Dashboard</h2>

                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="text-gray-500 text-sm font-medium">System Status</h3>
                            <p className="text-xl font-bold text-green-600 mt-2">Operational</p>
                        </div>
                    </div>
                )}

                {activeTab === 'bookings' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(bookings || []).map((booking) => (
                                    <tr key={booking.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{booking.Property?.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.User?.username || booking.User?.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{booking.totalPrice}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(users || []).map((user) => (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{user.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                    user.role === 'vendor' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center gap-3 mb-6 px-2">
                            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 font-bold text-xl">
                                {user.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{user.username}</p>
                                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                            </div>
                        </div>

                        <nav className="space-y-1">
                            {user.role === 'vendor' && (
                                <>
                                    <button
                                        onClick={() => setActiveTab('overview')}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-rose-50 text-rose-600' : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <LayoutDashboard className="w-5 h-5" />
                                        Overview
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('properties')}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'properties' ? 'bg-rose-50 text-rose-600' : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Building className="w-5 h-5" />
                                        My Properties
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('bookings')}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'bookings' ? 'bg-rose-50 text-rose-600' : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Calendar className="w-5 h-5" />
                                        Bookings
                                    </button>
                                </>
                            )}

                            {user.role === 'admin' && (
                                <>
                                    <button
                                        onClick={() => setActiveTab('overview')}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-rose-50 text-rose-600' : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <LayoutDashboard className="w-5 h-5" />
                                        Overview
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('bookings')}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'bookings' ? 'bg-rose-50 text-rose-600' : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Calendar className="w-5 h-5" />
                                        All Bookings
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('users')}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-rose-50 text-rose-600' : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Users className="w-5 h-5" />
                                        Users
                                    </button>
                                </>
                            )}

                            {user.role === 'customer' && (
                                <button
                                    onClick={() => setActiveTab('trips')}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'trips' ? 'bg-rose-50 text-rose-600' : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <Home className="w-5 h-5" />
                                    My Trips
                                </button>
                            )}
                        </nav>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
