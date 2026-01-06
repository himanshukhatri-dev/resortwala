import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCloudUploadAlt, FaFileExcel, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

export default function BulkUpload({ onClose, onSuccess }) {
    const { token } = useAuth();
    const [file, setFile] = useState(null);
    const [vendors, setVendors] = useState([]);
    const [selectedVendor, setSelectedVendor] = useState('');
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success'|'error', msg: '' }

    useEffect(() => {
        // Fetch vendors for dropdown
        axios.get(`${API_BASE_URL}/admin/vendors`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
            if (res.data.success) setVendors(res.data.data || []);
        });
    }, [token]);

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        if (selectedVendor) {
            formData.append('vendor_id', selectedVendor);
        }

        setUploading(true);
        setStatus(null);

        try {
            const res = await axios.post(`${API_BASE_URL}/admin/properties/import`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data.success) {
                setStatus({
                    type: 'success',
                    msg: `Successfully imported ${res.data.imported_count} properties!`
                });
                if (onSuccess) onSuccess();
                setFile(null);
            }
        } catch (err) {
            console.error(err);
            setStatus({
                type: 'error',
                msg: err.response?.data?.error || "Upload failed. Please check the file format."
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-2xl w-full mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Bulk Property Import</h2>
            <p className="text-gray-500 mb-6">Upload an Excel/CSV file to add multiple properties at once.</p>

            <div className="space-y-6">
                {/* 1. Download Template */}
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <FaFileExcel size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-blue-900">Step 1: Get the Template</h3>
                            <p className="text-sm text-blue-700">Download the required format file.</p>
                        </div>
                    </div>
                    <a
                        href="/property_import_template.csv"
                        download
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition"
                    >
                        Download CSV
                    </a>
                </div>

                {/* 2. Select Vendor (Optional) */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Assign to Vendor (Optional)</label>
                    <select
                        value={selectedVendor}
                        onChange={(e) => setSelectedVendor(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                        <option value="">Auto-create or use email from file</option>
                        {vendors.map(v => (
                            <option key={v.id} value={v.id}>{v.brand_name} ({v.user?.name})</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1 pl-1">
                        If left blank, the system will use the 'Owner Email' column to find or create vendors.
                    </p>
                </div>

                {/* 3. Drop Zone */}
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-white hover:border-blue-400 transition-all cursor-pointer relative">
                    <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <FaCloudUploadAlt className={`text-5xl mb-3 ${file ? 'text-blue-500' : 'text-gray-300'}`} />
                    {file ? (
                        <div className="text-center">
                            <p className="font-bold text-gray-800">{file.name}</p>
                            <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="font-bold text-gray-600">Drag & Drop or Click to Upload</p>
                            <p className="text-sm text-gray-400">Supports .csv, .xlsx</p>
                        </div>
                    )}
                </div>

                {/* Status Message */}
                {status && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {status.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                        <span className="font-medium">{status.msg}</span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black disabled:opacity-50 transition shadow-lg"
                    >
                        {uploading ? 'Importing...' : 'Start Import'}
                    </button>
                </div>
            </div>
        </div>
    );
}
