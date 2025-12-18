import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FaUsers, FaHome, FaCalendarCheck, FaTags, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import DebugPanel from '../components/DebugPanel';
import { useApiDebugger } from '../hooks/useApiDebugger';

export default function Dashboard() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const apiCalls = useApiDebugger();
    const [activeTab, setActiveTab] = useState('vendors');
    const [stats, setStats] = useState(null);
    const [pendingVendors, setPendingVendors] = useState([]);
    const [pendingProperties, setPendingProperties] = useState([]);
    const [bookings, setBookings] = useState([]);

    // Filters & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Loading...');

    // Modal state
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: null,
        showCancel: false
    });

    const showModal = (title, message, type = 'info', onConfirm = null, showCancel = false) => {
        setModal({ isOpen: true, title, message, type, onConfirm, showCancel });
    };

    const closeModal = () => {
        setModal({ ...modal, isOpen: false });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, vendorsRes, propertiesRes, bookingsRes] = await Promise.all([
                axios.get('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/admin/vendors/pending', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/admin/properties/pending', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/admin/bookings', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setStats(statsRes.data);
            setPendingVendors(vendorsRes.data);
            setPendingProperties(propertiesRes.data);
            setBookings(bookingsRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Action Handlers (Approve/Reject)
    const handleAction = async (actionType, id, confirmMsg, apiCall) => {
        showModal(
            'Confirm Action',
            confirmMsg,
            'warning',
            async () => {
                setActionLoading(true);
                setLoadingMessage('Processing...');
                try {
                    await apiCall();
                    setActionLoading(false);
                    showModal('Success', 'Action completed successfully!', 'success');
                    fetchData();
                } catch (err) {
                    setActionLoading(false);
                    showModal('Error', err.response?.data?.message || 'Action failed', 'error');
                }
            },
            true
        );
    };

    const handleLogout = async () => {
        setActionLoading(true);
        setLoadingMessage('Logging out...');
        try {
            await axios.post('/api/admin/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setTimeout(() => {
                setActionLoading(false);
                logout();
                navigate('/login');
            }, 500);
        }
    };

    const renderTable = () => {
        let data = [];
        let columns = [];
        let renderRow = null;

        if (activeTab === 'vendors') {
            data = pendingVendors.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()));
            columns = ['Name', 'Email', 'Business', 'Type', 'Actions'];
            renderRow = (vendor) => (
                <tr key={vendor.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="py-4 font-bold text-gray-700">{vendor.name}</td>
                    <td className="py-4 text-gray-500">{vendor.email}</td>
                    <td className="py-4 font-medium text-gray-800">{vendor.business_name}</td>
                    <td className="py-4"><span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-bold uppercase">{vendor.vendor_type}</span></td>
                    <td className="py-4 flex gap-2">
                        <ActionButton
                            onClick={() => handleAction('Approve', vendor.id, 'Approve this vendor?', () => axios.post(`/api/admin/vendors/${vendor.id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } }))}
                            icon={<FaCheckCircle />} color="text-green-600 bg-green-100 hover:bg-green-200"
                        />
                        <ActionButton
                            onClick={() => handleAction('Reject', vendor.id, 'Reject (delete) this vendor?', () => axios.delete(`/api/admin/vendors/${vendor.id}/reject`, { headers: { Authorization: `Bearer ${token}` } }))}
                            icon={<FaTimesCircle />} color="text-red-600 bg-red-100 hover:bg-red-200"
                        />
                    </td>
                </tr>
            );
        } else if (activeTab === 'properties') {
            data = pendingProperties.filter(p => p.Name.toLowerCase().includes(searchTerm.toLowerCase()));
            columns = ['Property', 'Location', 'Price', 'Vendor', 'Actions'];
            renderRow = (property) => (
                <tr key={property.PropertyId} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="py-4 font-bold text-gray-700">{property.Name}</td>
                    <td className="py-4 text-gray-500">{property.Location}</td>
                    <td className="py-4 font-bold">₹{property.Price}</td>
                    <td className="py-4 text-sm text-gray-600">{property.vendor?.business_name || 'N/A'}</td>
                    <td className="py-4 flex gap-2">
                        <ActionButton
                            onClick={() => handleAction('Approve', property.PropertyId, 'Approve this property?', () => axios.post(`/api/admin/properties/${property.PropertyId}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } }))}
                            icon={<FaCheckCircle />} color="text-green-600 bg-green-100 hover:bg-green-200"
                        />
                        <ActionButton
                            onClick={() => handleAction('Reject', property.PropertyId, 'Reject (delete) this property?', () => axios.delete(`/api/admin/properties/${property.PropertyId}/reject`, { headers: { Authorization: `Bearer ${token}` } }))}
                            icon={<FaTimesCircle />} color="text-red-600 bg-red-100 hover:bg-red-200"
                        />
                    </td>
                </tr>
            );
        } else if (activeTab === 'bookings') {
            data = bookings.filter(b => b.CustomerName.toLowerCase().includes(searchTerm.toLowerCase()));
            columns = ['ID', 'Customer', 'Property', 'Dates', 'Status', 'Actions'];
            renderRow = (booking) => (
                <tr key={booking.BookingId} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="py-4 font-bold text-gray-700">#{booking.BookingId}</td>
                    <td className="py-4">
                        <div className="font-bold text-gray-800">{booking.CustomerName}</div>
                        <div className="text-xs text-gray-500">{booking.CustomerMobile || 'No Mobile'}</div>
                    </td>
                    <td className="py-4 text-sm text-gray-600">{booking.property?.Name || 'N/A'}</td>
                    <td className="py-4 text-sm text-gray-500">
                        {new Date(booking.CheckInDate).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                        <StatusBadge status={booking.Status} />
                    </td>
                    <td className="py-4 flex gap-2">
                        {(!booking.Status || booking.Status === 'pending') ? (
                            <>
                                <ActionButton
                                    onClick={() => handleAction('Confirm', booking.BookingId, 'Confirm this booking?', () => axios.post(`/api/admin/bookings/${booking.BookingId}/status`, { status: 'confirmed' }, { headers: { Authorization: `Bearer ${token}` } }))}
                                    icon={<FaCheckCircle />} color="text-green-600 bg-green-100 hover:bg-green-200"
                                />
                                <ActionButton
                                    onClick={() => handleAction('Reject', booking.BookingId, 'Reject this booking?', () => axios.post(`/api/admin/bookings/${booking.BookingId}/status`, { status: 'rejected' }, { headers: { Authorization: `Bearer ${token}` } }))}
                                    icon={<FaTimesCircle />} color="text-red-600 bg-red-100 hover:bg-red-200"
                                />
                            </>
                        ) : <span className="text-gray-400 text-xs italic">Completed</span>}
                    </td>
                </tr>
            );
        }

        // Pagination
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
        const totalPages = Math.ceil(data.length / itemsPerPage);

        return (
            <div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                                {columns.map(col => <th key={col} className="pb-4 font-semibold">{col}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length > 0 ? currentItems.map(item => renderRow(item)) : (
                                <tr><td colSpan={columns.length} className="text-center py-8 text-gray-400">No records found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center mt-6 gap-2">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">Previous</button>
                        <span className="px-4 py-2 text-sm text-gray-600 font-medium">Page {currentPage} of {totalPages}</span>
                        <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">Next</button>
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-gray-500 font-medium">Loading Dashboard...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up pb-20 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
                    <p className="text-gray-500 mt-2 text-lg font-medium">Overview of system performance and pending approvals.</p>
                </div>
                <button onClick={handleLogout} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-6 py-2.5 rounded-xl font-bold shadow-sm transition">
                    Logout
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Properties" value={stats?.total_properties || 0} icon={<FaHome />} color="bg-blue-500" />
                <StatCard label="Total Bookings" value={stats?.total_bookings || 0} icon={<FaCalendarCheck />} color="bg-purple-500" />
                <StatCard label="Active Vendors" value={stats?.approved_vendors || 0} icon={<FaUsers />} color="bg-green-500" />
                <StatCard label="Pending Vendors" value={stats?.pending_vendors || 0} icon={<FaClock />} color="bg-amber-500" highlight={stats?.pending_vendors > 0} />
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-100/50">
                {/* Tabs */}
                <div className="flex border-b border-gray-100 mb-6 gap-6">
                    {['vendors', 'properties', 'bookings'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setCurrentPage(1); setSearchTerm(''); }}
                            className={`pb-4 text-sm font-bold uppercase tracking-wider transition relative ${activeTab === tab ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {tab}
                            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full"></div>}
                        </button>
                    ))}
                </div>

                {/* Filter */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800 capitalize">{activeTab} Management</h3>
                    <input
                        type="text"
                        placeholder={`Search ${activeTab}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100 w-64"
                    />
                </div>

                {/* Table */}
                {renderTable()}
            </div>

            <Modal isOpen={modal.isOpen} onClose={closeModal} title={modal.title} message={modal.message} type={modal.type} onConfirm={modal.onConfirm} showCancel={modal.showCancel} />
            {actionLoading && <Loader message={loadingMessage} />}
            <DebugPanel apiCalls={apiCalls} />

            <style>{`
                @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
}

// Helper Components (Reused/Adapted)
const StatCard = ({ label, value, icon, color, highlight }) => (
    <div className={`bg-white rounded-3xl p-6 border ${highlight ? 'border-amber-200 ring-4 ring-amber-50' : 'border-gray-100'} shadow-xl shadow-gray-100/50 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300`}>
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-5xl text-black`}>{icon}</div>
        <div className="relative z-10">
            <div className={`w-12 h-12 rounded-2xl ${color} text-white flex items-center justify-center text-xl shadow-lg mb-4`}>
                {icon}
            </div>
            <p className="text-gray-500 font-medium text-sm mb-1">{label}</p>
            <h3 className="text-3xl font-extrabold text-gray-800 tracking-tight">{value}</h3>
        </div>
    </div>
);

const ActionButton = ({ onClick, icon, color }) => (
    <button onClick={onClick} className={`w-8 h-8 rounded-full flex items-center justify-center transition ${color}`}>
        {icon}
    </button>
);

const StatusBadge = ({ status }) => {
    let styles = "bg-gray-100 text-gray-600";
    if (status === 'confirmed') styles = "bg-green-100 text-green-700 border border-green-200";
    if (status === 'pending') styles = "bg-amber-100 text-amber-700 border border-amber-200";
    if (status === 'cancelled' || status === 'rejected') styles = "bg-red-50 text-red-600 border border-red-100";
    return <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${styles}`}>{status || 'Pending'}</span>;
};
