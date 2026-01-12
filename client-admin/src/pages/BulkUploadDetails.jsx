import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { FaArrowLeft, FaCheckCircle, FaExclamationCircle, FaSpinner } from 'react-icons/fa';

export default function BulkUploadDetails() {
    const { id } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();

    const [summary, setSummary] = useState(null);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ERROR'); // Default show errors
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchSummary();
    }, [id]);

    useEffect(() => {
        fetchEntries();
    }, [id, filter, page]);

    const fetchSummary = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/bulk-upload/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSummary(res.data);
            // Auto switch filter if all valid
            if (res.data.error_count === 0) setFilter('ALL');
        } catch (error) {
            console.error(error);
        }
    };

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const endpoint = `${API_BASE_URL}/admin/bulk-upload/${id}/entries?page=${page}`;
            const url = filter === 'ALL' ? endpoint : `${endpoint}&status=${filter}`;

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEntries(res.data.data);
            setTotalPages(res.data.last_page);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!window.confirm(`Are you sure you want to import ${summary.valid_count} properties? This will create live records.`)) return;

        try {
            await axios.post(`${API_BASE_URL}/admin/bulk-upload/${id}/import`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Import started! It runs in the background.');
            fetchSummary(); // Refresh status
        } catch (error) {
            console.error(error);
            alert('Failed to start import. ' + (error.response?.data?.message || ''));
        }
    };

    if (!summary) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <button onClick={() => navigate('/bulk-upload')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 font-medium">
                <FaArrowLeft /> Back to Upload
            </button>

            <div className="flex flex-col md:flex-row gap-6 mb-8">
                {/* Header Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">Upload #{summary.id}</h1>
                            <p className="text-gray-500 text-sm">{new Date(summary.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${summary.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                summary.status === 'COMPLETED_WITH_ERRORS' ? 'bg-orange-100 text-orange-700' :
                                    summary.status === 'COMPLETED_IMPORT' ? 'bg-purple-100 text-purple-700' :
                                        'bg-blue-100 text-blue-700'
                                }`}>
                                {summary.status.replace(/_/g, ' ')}
                            </span>

                            {(summary.status === 'COMPLETED' || summary.status === 'COMPLETED_WITH_ERRORS') && summary.valid_count > 0 && (
                                <button
                                    onClick={handleImport}
                                    className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 shadow-sm transition"
                                >
                                    Import {summary.valid_count} Properties
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-40 text-center">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Rows</p>
                        <p className="text-3xl font-black text-gray-900 mt-2">{summary.total_rows}</p>
                    </div>
                    <div className="bg-green-50 p-6 rounded-2xl border border-green-100 w-40 text-center">
                        <p className="text-green-600 text-xs font-bold uppercase tracking-wider">Valid</p>
                        <p className="text-3xl font-black text-green-700 mt-2">{summary.valid_count}</p>
                    </div>
                    <div className="bg-red-50 p-6 rounded-2xl border border-red-100 w-40 text-center">
                        <p className="text-red-600 text-xs font-bold uppercase tracking-wider">Errors</p>
                        <p className="text-3xl font-black text-red-700 mt-2">{summary.error_count}</p>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4 border-b border-gray-200">
                <button
                    onClick={() => { setFilter('ERROR'); setPage(1); }}
                    className={`px-6 py-3 font-bold border-b-2 transition ${filter === 'ERROR' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Errors ({summary.error_count})
                </button>
                <button
                    onClick={() => { setFilter('VALID'); setPage(1); }}
                    className={`px-6 py-3 font-bold border-b-2 transition ${filter === 'VALID' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Valid ({summary.valid_count})
                </button>
                <button
                    onClick={() => { setFilter('ALL'); setPage(1); }}
                    className={`px-6 py-3 font-bold border-b-2 transition ${filter === 'ALL' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    All Rows
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 font-bold text-gray-600 text-sm w-20">Row #</th>
                                <th className="p-4 font-bold text-gray-600 text-sm">Status</th>
                                <th className="p-4 font-bold text-gray-600 text-sm">Vendor ID</th>
                                <th className="p-4 font-bold text-gray-600 text-sm">Property Name</th>
                                <th className="p-4 font-bold text-gray-600 text-sm">Message / Error</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-10 text-center text-gray-500">
                                        <FaSpinner className="animate-spin inline mr-2" /> Loading entries...
                                    </td>
                                </tr>
                            ) : entries.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-10 text-center text-gray-500 italic">No entries found for this filter.</td>
                                </tr>
                            ) : (
                                entries.map(entry => {
                                    const data = JSON.parse(entry.data || '{}');
                                    return (
                                        <tr key={entry.id} className="hover:bg-gray-50 group">
                                            <td className="p-4 text-gray-500 font-mono text-sm">{entry.row_number}</td>
                                            <td className="p-4">
                                                {entry.status === 'VALID' ? (
                                                    <span className="flex items-center gap-1 text-green-600 font-bold text-xs uppercase bg-green-50 px-2 py-1 rounded w-fit">
                                                        <FaCheckCircle /> Valid
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-red-600 font-bold text-xs uppercase bg-red-50 px-2 py-1 rounded w-fit">
                                                        <FaExclamationCircle /> Error
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-gray-800 font-medium">{data.vendor_id || '-'}</td>
                                            <td className="p-4 text-gray-800 font-medium">{data.property_name || '-'}</td>
                                            <td className="p-4 text-sm">
                                                {entry.status === 'ERROR' ? (
                                                    <span className="text-red-600 font-medium bg-red-50 px-2 py-1 rounded block w-full">{entry.error_message}</span>
                                                ) : (
                                                    <span className="text-gray-400">Ready to import</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-200 flex justify-between items-center">
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-200"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-500 font-medium">Page {page} of {totalPages}</span>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-600 disabled:opacity-50 hover:bg-gray-200"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
