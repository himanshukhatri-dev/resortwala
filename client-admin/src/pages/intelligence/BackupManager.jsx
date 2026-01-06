import { useState, useEffect } from 'react';
import { FaDatabase, FaUndo, FaTrash, FaDownload, FaSync, FaExclamationTriangle } from 'react-icons/fa';
import axios from '../../utils/axios'; // Adjust path based on your setup
import { toast } from 'react-hot-toast';

export default function BackupManager() {
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [restoring, setRestoring] = useState(null); // filename being restored

    useEffect(() => {
        fetchBackups();
    }, []);

    const fetchBackups = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/admin/intelligence/backups');
            setBackups(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch backup list');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBackup = async () => {
        setCreating(true);
        try {
            await axios.post('/admin/intelligence/backups');
            toast.success('Backup created successfully!');
            fetchBackups();
        } catch (error) {
            console.error(error);
            toast.error('Failed to create backup');
        } finally {
            setCreating(false);
        }
    };

    const handleRestore = async (filename) => {
        if (!window.confirm(`DANGER: Are you sure you want to restore from ${filename}? This will OVERWRITE the current database!`)) {
            return;
        }

        // Double confirm
        const confirmText = prompt("Type 'RESTORE' to confirm this destructive action:");
        if (confirmText !== 'RESTORE') return;

        setRestoring(filename);
        try {
            await axios.post('/admin/intelligence/backups/restore', { filename });
            toast.success('Database restored successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Restore failed: ' + (error.response?.data?.details || error.message));
        } finally {
            setRestoring(null);
        }
    };

    const handleDelete = async (filename) => {
        if (!window.confirm(`Delete backup ${filename}?`)) return;

        try {
            await axios.delete(`/admin/intelligence/backups/${filename}`);
            toast.success('Backup deleted');
            setBackups(prev => prev.filter(b => b.filename !== filename));
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete backup');
        }
    };

    return (
        <div className="h-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <FaDatabase className="text-blue-600" />
                        Database Backups
                    </h2>
                    <p className="text-sm text-gray-500">Manage automated and manual database snapshots</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={fetchBackups}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Refresh"
                    >
                        <FaSync className={loading ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={handleCreateBackup}
                        disabled={creating}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {creating ? <FaSync className="animate-spin" /> : <FaDatabase />}
                        Create Backup
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-white rounded-xl border border-gray-200">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Filename</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Size</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Created At</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {backups.length === 0 && !loading && (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-gray-400">
                                    No backups found. Create one to get started.
                                </td>
                            </tr>
                        )}
                        {backups.map((backup) => (
                            <tr key={backup.filename} className="hover:bg-gray-50 group transition-colors">
                                <td className="px-6 py-4 font-mono text-sm text-gray-700">
                                    {backup.filename}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {backup.size}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {backup.created_at}
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleRestore(backup.filename)}
                                        disabled={restoring === backup.filename}
                                        className="flex items-center gap-1 text-xs font-bold px-3 py-1 bg-amber-50 text-amber-600 rounded-md hover:bg-amber-100 border border-amber-200"
                                        title="Restore Database"
                                    >
                                        {restoring === backup.filename ? (
                                            <FaSync className="animate-spin" />
                                        ) : (
                                            <FaUndo />
                                        )}
                                        Restore
                                    </button>

                                    <button
                                        onClick={() => handleDelete(backup.filename)}
                                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                        title="Delete Backup"
                                    >
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-start gap-3">
                <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                <div>
                    <strong>Warning:</strong> Restoring a backup is a destructive action. It will completely overwrite the current database with the data from the backup file.
                    Ensure no critical data has been generated since the backup was taken.
                </div>
            </div>
        </div>
    );
}
