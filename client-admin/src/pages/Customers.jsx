import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { useModal } from '../context/ModalContext';
import { API_BASE_URL } from '../config';
import { FaUserCircle, FaTrash, FaEnvelope, FaPhone, FaSearch, FaUser } from 'react-icons/fa';

export default function Customers() {
    const { token } = useAuth();
    const { showConfirm, showSuccess, showError } = useModal();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/users/customers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCustomers(response.data);
        } catch (error) {
            console.error('Error fetching customers:', error);
            showError('Error', 'Failed to load customer list');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm(
            'Remove Customer',
            'Are you sure you want to delete this customer? All their booking history will be archived.',
            'Delete Account',
            'Cancel',
            'danger'
        );
        if (!confirmed) return;

        try {
            await axios.delete(`${API_BASE_URL}/admin/users/customers/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCustomers(customers.filter(c => c.id !== id));
            showSuccess('Deleted', 'Customer account removed successfully');
        } catch (error) {
            console.error('Error deleting customer:', error);
            showError('Error', 'Deletion failed. Please try again.');
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    );

    if (loading) return <Loader message="Accessing Customer Database..." />;

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                            Guest Management
                        </h1>
                        <p className="text-gray-500 font-medium font-outfit">View and manage all registered customers across resortwala</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                    <div className="relative group">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Find a guest by name, phone or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none font-bold text-gray-700 transition-all placeholder-gray-300"
                        />
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Identity</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Communication</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Membership</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredCustomers.map(customer => (
                                    <tr key={customer.id} className="hover:bg-blue-50/20 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                                    <FaUser className="text-lg" />
                                                </div>
                                                <div>
                                                    <div className="font-black text-gray-900 leading-tight">{customer.name}</div>
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">ID #{customer.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <div className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                    <FaEnvelope className="text-gray-300" /> {customer.email}
                                                </div>
                                                <div className="text-xs font-semibold text-gray-500 flex items-center gap-2">
                                                    <FaPhone className="text-gray-300" /> {customer.phone || 'NO MOBILE RECORD'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 inline-block uppercase tracking-wider">
                                                Joined {new Date(customer.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => handleDelete(customer.id)}
                                                className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all border border-red-100 group"
                                            >
                                                <FaTrash className="group-hover:scale-110 transition-transform" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden divide-y divide-gray-50">
                        {filteredCustomers.map(customer => (
                            <div key={customer.id} className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 border border-gray-100">
                                            <FaUserCircle size={32} />
                                        </div>
                                        <div>
                                            <div className="font-black text-gray-900">{customer.name}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Guest since {new Date(customer.created_at).getFullYear()}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(customer.id)} className="p-3 text-red-200 hover:text-red-500 transition-colors">
                                        <FaTrash />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-2 py-4 border-y border-gray-50">
                                    <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                                        <FaEnvelope className="text-gray-300 w-4" /> {customer.email}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                                        <FaPhone className="text-gray-300 w-4" /> {customer.phone || 'No Phone Sync'}
                                    </div>
                                </div>

                                <button className="w-full py-3.5 bg-blue-50 text-blue-700 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95">
                                    View Full History
                                </button>
                            </div>
                        ))}
                    </div>

                    {filteredCustomers.length === 0 && (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                <FaUserCircle size={40} className="text-gray-200" />
                            </div>
                            <div className="text-gray-400 font-black uppercase tracking-widest text-xs">No guests matching your query</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
