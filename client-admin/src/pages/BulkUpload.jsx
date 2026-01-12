import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaCloudUploadAlt, FaFileExcel, FaFileArchive, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

export default function BulkUpload() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [zipFile, setZipFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success'|'error', msg: '' }

    const handleDownloadTemplate = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/bulk-upload/template`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob', // Important
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'property_bulk_upload_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download failed', error);
            setStatus({ type: 'error', msg: 'Failed to download template.' });
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        if (zipFile) {
            formData.append('zip', zipFile);
        }

        setUploading(true);
        setStatus(null);

        try {
            const res = await axios.post(`${API_BASE_URL}/admin/bulk-upload/init`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data.id) {
                setStatus({
                    type: 'success',
                    msg: `Upload initialized! Processing ${res.data.total_rows} rows.`,
                    id: res.data.id
                });
                setFile(null);
                setZipFile(null);
            }
        } catch (err) {
            console.error(err);
            setStatus({
                type: 'error',
                msg: err.response?.data?.message || "Upload failed. Please check the file format."
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Bulk Property Upload</h1>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-3xl mx-auto">
                <div className="space-y-8">
                    {/* Step 1: Template */}
                    <div className="flex items-center justify-between p-5 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                                <FaFileExcel size={28} />
                            </div>
                            <div>
                                <h3 className="font-bold text-blue-900 text-lg">Step 1: Download Template</h3>
                                <p className="text-sm text-blue-700">Get the structured Excel file with instructions.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleDownloadTemplate}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-sm"
                        >
                            Download .xlsx
                        </button>
                    </div>

                    <div className="border-t border-gray-100 my-4"></div>

                    {/* Step 2: Uploads */}
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg mb-4">Step 2: Upload Files</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Excel Input */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Data File (.xlsx)</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-white hover:border-blue-400 transition-all cursor-pointer relative h-48">
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={(e) => setFile(e.target.files[0])}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <FaFileExcel className={`text-4xl mb-3 ${file ? 'text-green-600' : 'text-gray-400'}`} />
                                    {file ? (
                                        <div className="text-center">
                                            <p className="font-bold text-gray-800 break-all">{file.name}</p>
                                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <p className="font-bold text-gray-600">Select Excel File</p>
                                            <p className="text-xs text-gray-400">Required</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ZIP Input */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Media Files (.zip) <span className="text-gray-400 font-normal">(Optional)</span></label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-white hover:border-blue-400 transition-all cursor-pointer relative h-48">
                                    <input
                                        type="file"
                                        accept=".zip"
                                        onChange={(e) => setZipFile(e.target.files[0])}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <FaFileArchive className={`text-4xl mb-3 ${zipFile ? 'text-yellow-600' : 'text-gray-400'}`} />
                                    {zipFile ? (
                                        <div className="text-center">
                                            <p className="font-bold text-gray-800 break-all">{zipFile.name}</p>
                                            <p className="text-xs text-gray-500">{(zipFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <p className="font-bold text-gray-600">Select ZIP File</p>
                                            <p className="text-xs text-gray-400">Images organised by folder</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Message */}
                    {status && (
                        <div className={`p-4 rounded-xl flex items-center justify-between gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            <div className="flex items-center gap-3">
                                {status.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                                <span className="font-medium">{status.msg}</span>
                            </div>
                            {status.id && (
                                <button onClick={() => navigate(`/bulk-upload/${status.id}`)} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 shadow-sm">
                                    View Details
                                </button>
                            )}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black disabled:opacity-50 transition shadow-lg text-lg"
                    >
                        {uploading ? 'Processing...' : 'Upload & Process'}
                    </button>
                </div>
            </div>
        </div>
    );
}
