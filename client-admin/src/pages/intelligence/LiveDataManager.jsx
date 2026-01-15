import { useState, useEffect } from 'react';
import { FaTable, FaSave, FaUndo, FaSearch, FaExclamationTriangle, FaFilter } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import toast from 'react-hot-toast';

export default function LiveDataManager() {
    const { token } = useAuth();
    const [selectedTable, setSelectedTable] = useState('');
    const [targetDb, setTargetDb] = useState('');
    const [tables, setTables] = useState([]);
    const [data, setData] = useState([]);
    const [fullSchema, setFullSchema] = useState({}); // New state to hold details

    const [schema, setSchema] = useState([]);
    const [loading, setLoading] = useState(false);
    const [edits, setEdits] = useState({}); // { rowId: { colName: newValue } }
    const [showImpactModal, setShowImpactModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [primaryKey, setPrimaryKey] = useState('id');

    const [connectionInfo, setConnectionInfo] = useState(null);

    // Fetch Tables List on Mount
    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/intelligence/schema`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success || res.status === 200) {
                // Correctly access the schema object
                const schemaObj = res.data.schema || res.data;
                setFullSchema(schemaObj); // Store full schema

                // Filter out non-table keys
                const tableNames = Object.keys(schemaObj).filter(k => k !== 'success' && k !== 'connection');

                setTables(tableNames);
                if (res.data.connection) {
                    setConnectionInfo(res.data.connection);
                }

                if (tableNames.length > 0 && !selectedTable) {
                    setSelectedTable(tableNames[0]);
                }
            }
        } catch (err) {
            console.error("Failed to fetch tables schema", err);
        }
    };

    // Detect Primary Key when table changes
    useEffect(() => {
        if (selectedTable && fullSchema[selectedTable]) {
            const cols = fullSchema[selectedTable].columns || [];
            // Safe detection with optional chaining/checks
            const pkCol = cols.find(c => c.primary)
                || cols.find(c => c.name && c.name.toLowerCase() === 'id')
                || cols.find(c => c.name && c.name.toLowerCase().includes('id'))
                || cols[0]; // Fallback to first column if nothing matches

            setPrimaryKey(pkCol ? pkCol.name : 'id');
            setSchema(cols.map(c => c.name || 'Unknown')); // Update column headers safely
        }
    }, [selectedTable, fullSchema]);

    const fetchData = async () => {
        if (!selectedTable) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/intelligence/data/${selectedTable}`, {
                params: { search: searchTerm },
                headers: {
                    Authorization: `Bearer ${token}`,
                    'X-Target-DB': targetDb
                }
            });
            // Handle different pagination structures or direct arrays
            const rawData = res.data.data || res.data;
            setData(Array.isArray(rawData) ? rawData : []);

            // Fallback PK detection if schema failed (e.g. from data structure)
            if (res.data.pk) {
                setPrimaryKey(res.data.pk);
            }
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    // Trigger Fetch on selection/search
    useEffect(() => {
        fetchData();
    }, [selectedTable, targetDb]); // Add targetDb dependency

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            fetchData();
        }
    };

    const handleEdit = (id, field, value) => {
        setEdits(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const saveChanges = async () => {
        const rowIds = Object.keys(edits);
        setLoading(true);

        try {
            // Sequential updates for safety (could be parallelized)
            for (const id of rowIds) {
                const updates = edits[id];
                await axios.put(`${API_BASE_URL}/admin/intelligence/data/${selectedTable}/${id}`, updates, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'X-Target-DB': targetDb
                    }
                });
            }
            toast.success(`Successfully updated ${rowIds.length} records`);

            // Refresh data
            await fetchData();
            setEdits({});
            setShowImpactModal(false);
            // Optionally show success toast
        } catch (err) {
            console.error("Failed to save changes", err);
            alert("Error saving changes: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const hasEdits = Object.keys(edits).length > 0;

    // Helper to get value case-insensitively
    const getValue = (row, colName) => {
        // 1. Direct match
        if (row[colName] !== undefined) return row[colName];

        // 2. Case insensitive match
        const lowerCol = colName.toLowerCase();
        const key = Object.keys(row).find(k => k.toLowerCase() === lowerCol);
        return key ? row[key] : undefined;
    };

    const [selectedRows, setSelectedRows] = useState(new Set());

    // Selection Handling
    const toggleRow = (id) => {
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === data.length) {
            setSelectedRows(new Set());
        } else {
            const allIds = data.map((row, idx) => getValue(row, primaryKey) || `idx-${idx}`);
            setSelectedRows(new Set(allIds));
        }
    };

    const handleDelete = async (ids) => {
        if (!window.confirm(`Are you sure you want to delete ${ids.length} records? This cannot be undone.`)) return;

        setLoading(true);
        try {
            // Sequential delete for safety
            for (const id of ids) {
                await axios.delete(`${API_BASE_URL}/admin/intelligence/data/${selectedTable}/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'X-Target-DB': targetDb
                    }
                });
            }
            toast.success(`Deleted ${ids.length} records`);
            await fetchData();
            setSelectedRows(new Set());
            // toast.success(`Deleted ${ids.length} records`);
        } catch (err) {
            console.error("Delete failed", err);
            alert("Delete failed: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-full gap-6">
            {/* Sidebar Table List */}
            <div className="w-64 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <FaTable className="text-blue-500" /> Database Tables
                    </h3>
                    <div className="mt-3">
                        <select
                            value={targetDb}
                            onChange={(e) => setTargetDb(e.target.value)}
                            className="w-full text-xs p-1.5 rounded border border-gray-200 bg-white text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">(Default Connection)</option>
                            <option value="resortwala">ResortWala (Beta/Staging)</option>
                            <option value="resortwala_prod">ResortWala (Production)</option>
                            <option value="resortwala_staging">ResortWala (Legacy Staging)</option>
                        </select>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {tables.map(t => (
                        <button
                            key={t}
                            onClick={() => { setSelectedTable(t); setSelectedRows(new Set()); }}
                            className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors mb-1
                                ${selectedTable === t ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}
                            `}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white z-10">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-gray-800 capitalize">{selectedTable}</h2>
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                            <input
                                type="text"
                                placeholder="Search records (Enter)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearch}
                                className="pl-9 pr-4 py-1.5 rounded-lg border border-gray-300 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {selectedRows.size > 0 && (
                            <button
                                onClick={() => handleDelete(Array.from(selectedRows))}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-2"
                            >
                                Delete ({selectedRows.size})
                            </button>
                        )}
                        <button
                            disabled={!hasEdits}
                            onClick={() => setEdits({})}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            <FaUndo /> Discard
                        </button>
                        <button
                            disabled={!hasEdits}
                            onClick={() => setShowImpactModal(true)}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                        >
                            <FaSave /> Save Changes
                        </button>
                    </div>
                </div>

                {/* Data Table */}
                <div className="flex-1 overflow-auto relative">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">Loading data...</div>
                    ) : (data.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">No data found</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 sticky top-0 z-0">
                                <tr>
                                    <th className="px-4 py-3 border-b border-gray-200 w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.size === data.length && data.length > 0}
                                            onChange={toggleAll}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </th>
                                    {schema.map(col => (
                                        <th key={col} className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                            {col}
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 border-b border-gray-200"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.map((row, idx) => {
                                    // Use getValue for safe PK access
                                    const recordId = getValue(row, primaryKey) || `idx-${idx}`;
                                    const rowEdits = edits[recordId] || {};
                                    const isSelected = selectedRows.has(recordId);

                                    return (
                                        <tr key={recordId} className={`hover:bg-blue-50/30 transition-colors group ${isSelected ? 'bg-blue-50/50' : ''}`}>
                                            <td className="px-4 py-3 border-r border-transparent">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleRow(recordId)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </td>
                                            {schema.map(col => {
                                                const rawVal = getValue(row, col);
                                                const value = rowEdits[col] !== undefined ? rowEdits[col] : rawVal;

                                                // Handle objects/arrays for display
                                                const displayValue = (typeof value === 'object' && value !== null)
                                                    ? JSON.stringify(value)
                                                    : (value === undefined || value === null ? '' : value);

                                                const isEdited = rowEdits[col] !== undefined;
                                                const isReadOnly = col === primaryKey || col === 'created_at' || col === 'updated_at'; // Read-only cols

                                                return (
                                                    <td key={col} className={`px-6 py-3 text-sm border-r border-transparent group-hover:border-gray-100 last:border-r-0 relative
                                                        ${isEdited ? 'bg-yellow-50 text-amber-700 font-medium' : 'text-gray-600'}
                                                    `}>
                                                        {isReadOnly ? (
                                                            <span className="text-gray-400 select-none block max-w-[200px] truncate" title={String(displayValue)}>
                                                                {displayValue}
                                                            </span>
                                                        ) : (
                                                            <input
                                                                type="text"
                                                                value={displayValue}
                                                                onChange={(e) => handleEdit(recordId, col, e.target.value)}
                                                                className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-inherit placeholder-gray-300 min-w-[100px]"
                                                            />
                                                        )}
                                                        {isEdited && <div className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-bl" />}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleDelete([recordId])}
                                                    className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Delete Row"
                                                >
                                                    &times;
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ))}
                </div>
            </div>

            {/* Impact Analysis Modal */}
            {showImpactModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 bg-amber-50">
                            <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                                <FaExclamationTriangle className="text-amber-600" />
                                Impact Analysis
                            </h3>
                            <p className="text-amber-700 text-sm mt-1">
                                You are about to modify {Object.keys(edits).length} records in <strong>{selectedTable}</strong>.
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="bg-blue-100 text-blue-700 px-1.5 rounded text-xs font-bold mt-0.5">API</span>
                                        <span>May invalidate cache for <strong>GET /api/{selectedTable}</strong></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="bg-green-100 text-green-700 px-1.5 rounded text-xs font-bold mt-0.5">UI</span>
                                        <span>Frontend dashboards will reflect changes immediately.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="bg-red-100 text-red-700 px-1.5 rounded text-xs font-bold mt-0.5">AUDIT</span>
                                        <span>Action will be logged to <strong>AdminEventLogs</strong> by <em>{token ? 'Super Admin' : 'Unknown'}</em>.</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowImpactModal(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveChanges}
                                    className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/20"
                                >
                                    Confirm Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
