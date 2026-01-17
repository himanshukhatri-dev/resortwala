import React, { useState } from 'react';
import { FaServer, FaCheck, FaExclamationTriangle, FaArrowRight, FaDatabase, FaFolderOpen, FaNetworkWired } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

// Steps
const STEP_CONNECT = 'connect';
const STEP_SCAN = 'scan';
const STEP_SELECT = 'select';
const STEP_MIGRATE = 'migrate';
const STEP_COMPLETE = 'complete';

export default function ServerMigration() {
    const { token } = useAuth();
    const [step, setStep] = useState(STEP_CONNECT);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);

    // Connection State
    const [connection, setConnection] = useState({
        ip: '',
        user: 'root',
        status: 'idle', // idle, verified, error
        sudo_access: false
    });

    const [sourceConfig, setSourceConfig] = useState({
        ip: '', // Optional Source IP for SSH-Loopback
        user: 'root',
        host: '127.0.0.1',
        dbUser: 'root',
        dbPass: ''
    });

    // SSH Key State
    const [sshKeys, setSshKeys] = useState(null);

    // Scan Data
    const [scanData, setScanData] = useState(null);
    const [selectedAssets, setSelectedAssets] = useState({ databases: [], sites: [], media: [], codebases: [] });
    const [migrationProgress, setMigrationProgress] = useState(0);
    const [migrating, setMigrating] = useState(false);

    // Pre-select all assets when scan completes
    React.useEffect(() => {
        if (scanData) {
            setSelectedAssets({
                databases: scanData.databases.map(d => d.name),
                sites: scanData.web_roots.map(s => s.site), // Configs
                codebases: scanData.codebases ? scanData.codebases.map(c => c.path) : [], // Full Code
                media: scanData.media ? scanData.media.map(m => m.path) : []
            });
        }
    }, [scanData]);

    // Migration Runner (Real API)
    const runMigrationList = async () => {
        setMigrating(true);
        let completed = 0;

        // Build flat list of tasks
        const tasks = [
            ...selectedAssets.databases.map(name => ({ type: 'database', name })),
            ...selectedAssets.sites.map(name => ({ type: 'site', name })), // Nginx Config
            ...selectedAssets.codebases.map(name => ({ type: 'codebase', name })), // Source Code
            ...selectedAssets.media.map(name => ({ type: 'media', name }))
        ];

        const total = tasks.length;
        if (total === 0) {
            toast.success("Nothing to migrate!");
            setMigrating(false);
            return;
        }

        try {
            for (let i = 0; i < total; i++) {
                const task = tasks[i];
                addLog(`[PULL] Downloading ${task.type}: ${task.name} from ${connection.ip}...`, "info");

                // Real API Call
                const res = await axios.post(`${API_BASE_URL}/admin/server-migration/migrate-asset`, {
                    ...task,
                    ip: connection.ip,
                    user: connection.user,
                    source_ip: sourceConfig.ip,
                    source_user: sourceConfig.user,
                    source_host: sourceConfig.host,
                    source_db_user: sourceConfig.dbUser,
                    source_db_pass: sourceConfig.dbPass
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data.status === 'success') {
                    addLog(`Done: ${res.data.message}`, "success");
                } else {
                    addLog(`Failed: ${res.data.message}`, "error");
                }

                completed++;
                setMigrationProgress(Math.round((completed / total) * 100));
            }

            toast.success("Migration Process Completed!");
            addLog("All tasks finished.", "success");
        } catch (err) {
            addLog("Migration Error: " + (err.response?.data?.message || err.message), "error");
            toast.error("Migration interrupted.");
        } finally {
            setMigrating(false);
        }
    };

    // Auto-Run when entering step
    React.useEffect(() => {
        if (step === STEP_MIGRATE && !migrating && migrationProgress === 0) {
            runMigrationList();
        }
    }, [step]);

    // Manual Start / Retry
    const handleStartMigration = () => {
        if (migrating) return;
        setStep(STEP_MIGRATE);
        runMigrationList();
    };

    const toggleAsset = (type, value) => {
        setSelectedAssets(prev => {
            const list = prev[type];
            const exists = list.includes(value);
            return {
                ...prev,
                [type]: exists ? list.filter(item => item !== value) : [...list, value]
            };
        });
    };

    const addLog = (msg, type = 'info') => {
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }]);
    };

    const handleGenerateKeys = async () => {
        setLoading(true);
        addLog('Generating SSH Keys...', 'info');
        try {
            const { data } = await axios.post(`${API_BASE_URL}/admin/server-migration/keys`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSshKeys(data);
            addLog('SSH Keys Generated Successfully', 'success');
            toast.success('SSH Keys Generated');
        } catch (error) {
            addLog('Failed to generate keys: ' + (error.response?.data?.message || error.message), 'error');
            toast.error('Key Gen Failed');
        } finally {
            setLoading(false);
        }
    };

    const handleTestConnection = async () => {
        if (!connection.ip || !connection.user) return toast.error("IP and User required");

        setLoading(true);
        addLog(`Connecting to ${connection.user}@${connection.ip}...`, 'info');

        try {
            const { data } = await axios.post(`${API_BASE_URL}/admin/server-migration/connect`, {
                ip: connection.ip,
                user: connection.user
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.status === 'success') {
                setConnection(prev => ({ ...prev, status: 'verified', sudo_access: data.sudo_check }));
                addLog('Connection Verified!', 'success');
                if (data.sudo_check) addLog('Sudo Access Confirmed', 'success');
                else addLog('Warning: No Passwordl-ess Sudo Detected', 'warning');

                setStep(STEP_SCAN);
            }
        } catch (error) {
            setConnection(prev => ({ ...prev, status: 'error' }));
            const msg = error.response?.data?.message || error.message;
            addLog('Connection Failed: ' + msg, 'error');
            if (error.response?.data?.debug) {
                addLog('Debug: ' + error.response.data.debug, 'error');
            }
            toast.error('Connection Failed');
        } finally {
            setLoading(false);
        }
    };

    const handleAutoSetup = async (password) => {
        if (!password) return toast.error("Password required");
        setLoading(true);
        addLog("Attempting Auto-Key Installation...", "info");
        try {
            await axios.post(`${API_BASE_URL}/admin/server-migration/auto-setup`, {
                ip: connection.ip,
                user: connection.user,
                password: password
            }, { headers: { Authorization: `Bearer ${token}` } });

            addLog("Key Installed! Retrying Connection...", "success");
            toast.success("Key Installed");
            handleTestConnection(); // Retry immediately
        } catch (error) {
            addLog("Auto-Setup Failed: " + (error.response?.data?.message || error.message), "error");
            toast.error("Auto-Setup Failed");
        } finally {
            setLoading(false);
        }
    };

    // Trigger scan when entering SCAN step
    React.useEffect(() => {
        if (step === STEP_SCAN && !scanData) {
            handleScan();
        }
    }, [step]);

    const handleScan = async () => {
        setLoading(true);
        addLog('Starting Remote Server Scan...', 'info');

        try {
            const { data } = await axios.post(`${API_BASE_URL}/admin/server-migration/scan`, {
                ip: connection.ip,
                user: connection.user,
                // New Source Config for Local Scan
                source_ip: sourceConfig.ip,
                source_user: sourceConfig.user,
                source_host: sourceConfig.host,
                source_db_user: sourceConfig.dbUser,
                source_db_pass: sourceConfig.dbPass
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.status === 'success') {
                setScanData(data);
                addLog('Scan Complete. Found ' + data.databases.length + ' DBs and ' + data.nginx.length + ' Sites.', 'success');
            }
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            addLog('Scan Failed: ' + msg, 'error');
            toast.error('Scan Failed');
            setStep(STEP_CONNECT); // Go back
        } finally {
            setLoading(false);
        }
    };

    const renderScanResults = () => {
        if (!scanData) return <div className="p-10 text-center text-gray-400">Waiting for scan data...</div>;

        return (
            <div className="space-y-6">
                {/* System Info */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <span className="text-xs uppercase font-bold text-blue-500">OS</span>
                        <p className="font-bold text-gray-800">{scanData.system.os}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                        <span className="text-xs uppercase font-bold text-purple-500">PHP Version</span>
                        <p className="font-bold text-gray-800">{scanData.system.php}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                        <span className="text-xs uppercase font-bold text-green-500">Web Disk Usage</span>
                        <p className="font-bold text-gray-800">{scanData.disk.www_size}</p>
                    </div>
                </div>

                {/* Databases */}
                <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-4 py-2 border-b font-bold text-xs uppercase text-gray-500 flex justify-between">
                        <span>Databases Found</span>
                        <span>{scanData.databases.length}</span>
                    </div>
                    <div className="divide-y max-h-40 overflow-y-auto">
                        {scanData.databases.map((db, i) => (
                            <div key={i} className="px-4 py-2 flex justify-between items-center text-sm">
                                <span className="font-mono text-gray-700">{db.name}</span>
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">{db.size_mb} MB</span>
                            </div>
                        ))}
                        {scanData.databases.length === 0 && <div className="p-4 text-center text-gray-400 text-sm">No databases found</div>}
                    </div>
                </div>

                {/* Nginx Sites */}
                <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-4 py-2 border-b font-bold text-xs uppercase text-gray-500 flex justify-between">
                        <span>Web Sites (Nginx)</span>
                        <span>{scanData.nginx ? scanData.nginx.length : 0}</span>
                    </div>
                    <div className="divide-y max-h-40 overflow-y-auto">
                        {scanData.web_roots && scanData.web_roots.map((site, i) => (
                            <div key={i} className="px-4 py-2 flex justify-between items-center text-sm">
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-800">{site.site}</span>
                                    <span className="text-xs text-gray-400 font-mono">{site.root}</span>
                                </div>
                                <FaServer className="text-gray-300" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Media Assets (New) */}
                <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-4 py-2 border-b font-bold text-xs uppercase text-gray-500 flex justify-between">
                        <span>Media & Storage</span>
                        <span>{scanData.media ? scanData.media.length : 0} Sources</span>
                    </div>
                    <div className="divide-y max-h-40 overflow-y-auto">
                        {scanData.media && scanData.media.map((m, i) => (
                            <div key={i} className="px-4 py-2 flex justify-between items-center text-sm">
                                <span className="font-mono text-gray-600 text-xs truncate w-2/3" title={m.path}>{m.path}</span>
                                <span className="font-bold text-blue-600 bg-blue-50 px-2 rounded">{m.size}</span>
                            </div>
                        ))}
                        {(!scanData.media || scanData.media.length === 0) && <div className="p-4 text-center text-gray-400 text-sm">No specific media folders found</div>}
                    </div>
                </div>

                <div className="flex justify-between pt-4">
                    <button onClick={() => setStep(STEP_CONNECT)} className="text-gray-500 underline text-sm">Re-Connect</button>
                    <button
                        onClick={() => setStep(STEP_SELECT)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"
                    >
                        Next: Select Assets <FaArrowRight />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FaServer className="text-blue-600" /> Server Migration Manager
                    </h1>
                    <p className="text-gray-500 mt-2">Migrate code, database, and assets from Source VPS to this server.</p>
                </div>
                <div className="flex items-center gap-2">
                    <StepIndicator current={step} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">

                    {/* STEP 1: CONNECT */}
                    {step === STEP_CONNECT && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <FaNetworkWired /> Connection Setup
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                {/* SOURCE BLOCK */}
                                <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><FaServer /></div>
                                        <div>
                                            <span className="text-xs font-bold text-gray-500 uppercase block">Source (This Server)</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs text-gray-500 font-bold">Source IP (Optional SSH)</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. 1.2.3.4"
                                                    value={sourceConfig.ip}
                                                    onChange={e => setSourceConfig({ ...sourceConfig, ip: e.target.value })}
                                                    className="w-full text-xs p-1 border rounded"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 font-bold">SSH User</label>
                                                <input
                                                    type="text"
                                                    value={sourceConfig.user}
                                                    onChange={e => setSourceConfig({ ...sourceConfig, user: e.target.value })}
                                                    className="w-full text-xs p-1 border rounded"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 font-bold">Source DB Host</label>
                                            <input
                                                type="text"
                                                value={sourceConfig.host}
                                                onChange={e => setSourceConfig({ ...sourceConfig, host: e.target.value })}
                                                className="w-full text-xs p-1 border rounded"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs text-gray-500 font-bold">DB User</label>
                                                <input
                                                    type="text"
                                                    placeholder="root"
                                                    value={sourceConfig.dbUser}
                                                    onChange={e => setSourceConfig({ ...sourceConfig, dbUser: e.target.value })}
                                                    className="w-full text-xs p-1 border rounded"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 font-bold">DB Pass</label>
                                                <input
                                                    type="password"
                                                    placeholder="Optional"
                                                    value={sourceConfig.dbPass}
                                                    onChange={e => setSourceConfig({ ...sourceConfig, dbPass: e.target.value })}
                                                    className="w-full text-xs p-1 border rounded"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* DESTINATION BLOCK */}
                                <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="bg-purple-100 text-purple-600 p-2 rounded-lg"><FaArrowRight /></div>
                                        <div>
                                            <span className="text-xs font-bold text-gray-500 uppercase block">Destination (Remote)</span>
                                            <span className="font-bold text-gray-800">Target Server</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-2">
                                        Data will be <strong>sent TO</strong> this address.
                                    </p>
                                    <div className="bg-white p-2 border rounded text-xs font-mono text-gray-600 flex items-center gap-1">
                                        <span>Target:</span>
                                        <span className="font-bold text-purple-700">{connection.ip || 'Not Set'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Destination IP Address</label>
                                        <input
                                            type="text"
                                            value={connection.ip}
                                            onChange={(e) => setConnection({ ...connection, ip: e.target.value })}
                                            placeholder="e.g. 192.168.1.50"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">SSH User</label>
                                        <input
                                            type="text"
                                            value={connection.user}
                                            onChange={(e) => setConnection({ ...connection, user: e.target.value })}
                                            placeholder="root"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        />
                                    </div>
                                </div>

                                {/* SSH Key Section */}
                                <div className="border-t pt-4">
                                    <h3 className="text-sm font-semibold mb-2">Authentication Setup</h3>
                                    {!sshKeys ? (
                                        <button
                                            onClick={handleGenerateKeys}
                                            disabled={loading}
                                            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
                                        >
                                            {loading ? 'Generating...' : '1. Generate Migration Keys'}
                                        </button>
                                    ) : (
                                        <div className="bg-gray-50 p-4 rounded border">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-green-600 font-bold text-sm flex items-center gap-1">
                                                    <FaCheck /> Keys Generated
                                                </span>
                                                <button
                                                    onClick={() => { navigator.clipboard.writeText(sshKeys.public_key); toast.success("Copied!"); }}
                                                    className="text-blue-600 text-xs hover:underline"
                                                >
                                                    Copy Public Key
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-600 mb-2">
                                                Copy this key and run it on the <strong>DESTINATION</strong> server to allow access:
                                            </p>
                                            <code className="block bg-black text-green-400 p-2 rounded text-xs overflow-x-auto select-all">
                                                echo "{sshKeys.public_key.trim()}" &gt;&gt; ~/.ssh/authorized_keys
                                            </code>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleTestConnection}
                                    disabled={!sshKeys || loading || !connection.ip}
                                    className={`px-6 py-2 rounded font-bold text-white transition-colors ${(!sshKeys || !connection.ip) ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {loading ? 'Testing...' : '2. Test & Continue'} <FaArrowRight className="inline ml-2" />
                                </button>
                            </div>

                            {/* Auto Setup Fallback */}
                            {connection.status === 'error' && (
                                <div className="bg-yellow-50 p-4 rounded border border-yellow-200 mt-4">
                                    <h4 className="font-bold text-yellow-800 text-sm mb-2 flex items-center gap-2">
                                        <FaExclamationTriangle /> Connection Failed?
                                    </h4>
                                    <p className="text-xs text-yellow-700 mb-3">
                                        If you can't manually add the key, enter the <strong>root password</strong> below and we will validly install it for you.
                                    </p>
                                    <div className="flex gap-2">
                                        <input
                                            type="password"
                                            placeholder="Enter Root Password for Auto-Setup"
                                            className="flex-1 p-2 border rounded text-sm"
                                            id="auto-pass"
                                        />
                                        <button
                                            onClick={() => handleAutoSetup(document.getElementById('auto-pass').value)}
                                            className="bg-yellow-600 text-white text-xs px-4 rounded font-bold hover:bg-yellow-700"
                                        >
                                            Auto-Install Key
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Placeholder for future steps */}
                    {/* STEP 2: SCAN */}
                    {step === STEP_SCAN && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <FaFolderOpen className="text-yellow-500" /> Source Analysis
                            </h2>
                            {loading && !scanData ? (
                                <div className="text-center py-20">
                                    <div className="animate-spin text-4xl text-blue-600 mx-auto mb-4"><FaNetworkWired /></div>
                                    <p className="text-gray-500">Scanning remote system...</p>
                                </div>
                            ) : renderScanResults()}
                        </div>
                    )}

                    {/* STEP 3: SELECT ASSETS */}
                    {step === STEP_SELECT && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <FaCheck className="text-green-600" /> Select Assets to Migrate
                            </h2>

                            {/* Destination Info (Clarification) */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6 flex justify-between items-center">
                                <div>
                                    <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Destination (This Server)</span>
                                    <div className="font-mono text-gray-700 text-sm mt-1">/var/www/html/api.resortwala.com</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Database Host</span>
                                    <div className="font-mono text-gray-700 text-sm mt-1">localhost (MySQL)</div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Databases */}
                                <div>
                                    <h3 className="font-bold text-gray-700 mb-2 flex justify-between">
                                        <span>Databases</span>
                                        <span className="text-xs font-normal text-gray-500">{selectedAssets.databases.length} selected</span>
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {scanData?.databases.map(db => (
                                            <label key={db.name} className={`flex items-center gap-3 p-3 rounded border cursor-pointer ${selectedAssets.databases.includes(db.name) ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAssets.databases.includes(db.name)}
                                                    onChange={() => toggleAsset('databases', db.name)}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <div>
                                                    <div className="font-mono font-bold text-sm text-gray-700">{db.name}</div>
                                                    <div className="text-xs text-gray-500">{db.size_mb} MB</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Media */}
                                <div>
                                    <h3 className="font-bold text-gray-700 mb-2 flex justify-between">
                                        <span>Media & Code</span>
                                    </h3>
                                    <div className="space-y-2">
                                        {scanData?.web_roots.map(site => (
                                            <label key={site.site} className={`flex items-center gap-3 p-3 rounded border cursor-pointer ${selectedAssets.sites.includes(site.site) ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAssets.sites.includes(site.site)}
                                                    onChange={() => toggleAsset('sites', site.site)}
                                                    className="w-4 h-4 text-green-600"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-bold text-sm text-gray-800">Site: {site.site}</div>
                                                    <div className="text-xs font-mono text-gray-500">{site.root}</div>
                                                </div>
                                            </label>
                                        ))}
                                        {scanData?.media?.map(m => (
                                            <label key={m.path} className={`flex items-center gap-3 p-3 rounded border cursor-pointer ${selectedAssets.media.includes(m.path) ? 'bg-purple-50 border-purple-200' : 'bg-gray-50'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAssets.media.includes(m.path)}
                                                    onChange={() => toggleAsset('media', m.path)}
                                                    className="w-4 h-4 text-purple-600"
                                                />
                                                <div>
                                                    <div className="font-mono text-xs text-gray-700">{m.path}</div>
                                                    <div className="text-xs text-blue-600 font-bold w-16">{m.size}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Project Codebases (New) */}
                                {scanData?.codebases && scanData.codebases.length > 0 && (
                                    <div>
                                        <h3 className="font-bold text-gray-700 mb-2 flex justify-between">
                                            <span>Project Source Code (Entire Root)</span>
                                            <span className="text-xs font-normal text-gray-500">{selectedAssets.codebases.length} selected</span>
                                        </h3>
                                        <div className="space-y-2">
                                            {scanData.codebases.map(code => (
                                                <label key={code.path} className={`flex items-center gap-3 p-3 rounded border cursor-pointer ${selectedAssets.codebases.includes(code.path) ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50'}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedAssets.codebases.includes(code.path)}
                                                        onChange={() => toggleAsset('codebases', code.path)}
                                                        className="w-4 h-4 text-indigo-600"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-bold text-sm text-gray-800 break-all">{code.path}</div>
                                                        <div className="text-xs text-gray-500">Includes all files in this directory</div>
                                                    </div>
                                                    <div className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                                        {code.size}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between pt-6 border-t mt-6">
                                <button
                                    onClick={() => setStep(STEP_SCAN)}
                                    className="text-gray-500 hover:text-gray-800 font-medium px-4 py-2 rounded flex items-center gap-2"
                                >
                                    &larr; Back to Scan Results
                                </button>
                                <button
                                    onClick={handleStartMigration}
                                    disabled={!selectedAssets.databases.length && !selectedAssets.sites.length && !selectedAssets.media.length && !selectedAssets.codebases.length}
                                    className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:shadow-none"
                                >
                                    <FaNetworkWired /> Start Migration
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: MIGRATE (Progress) */}
                    {
                        step === STEP_MIGRATE && (
                            <div className="bg-white p-10 rounded-xl shadow text-center">
                                <div className="animate-pulse text-6xl mb-4">🚀</div>
                                <h2 className="text-2xl font-bold text-gray-800">Migration In Progress</h2>
                                <p className="text-gray-500 mt-2">Moving {selectedAssets.databases.length} DBs, {selectedAssets.codebases.length} Projects, {selectedAssets.sites.length} Configs, and {selectedAssets.media.length} Media Folders...</p>

                                <div className="mt-8 relative w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-full transition-all duration-500"
                                        style={{ width: `${migrationProgress}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400 mt-2">
                                    <span>{migrationProgress}% Complete</span>
                                    <span>Check Console &rarr;</span>
                                </div>

                                <div className="mt-8 bg-black/5 p-4 rounded text-left font-mono text-xs text-gray-600 h-32 overflow-y-auto">
                                    <div className="text-gray-400 mb-2 border-b border-gray-300 pb-1">Recent Activity:</div>
                                    {logs.slice(-5).map((l, i) => (
                                        <div key={i} className="truncate">
                                            <span className="text-gray-400">[{l.time}]</span> {l.msg}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    }

                </div>

                {/* Console / Logs Sidebar */}
                <div className="bg-gray-900 rounded-xl p-4 text-xs font-mono text-gray-300 h-[600px] overflow-y-auto flex flex-col">
                    <h3 className="text-gray-500 font-bold mb-2 uppercase border-b border-gray-700 pb-2">Migration Console</h3>
                    <div className="flex-1 space-y-1">
                        {logs.length === 0 && <span className="text-gray-600 italic">Ready to initialize...</span>}
                        {logs.map((log, i) => (
                            <div key={i} className={`flex gap-2 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : log.type === 'warning' ? 'text-yellow-400' : 'text-blue-300'}`}>
                                <span className="text-gray-600">[{log.time}]</span>
                                <span>{log.msg}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepIndicator({ current }) {
    const steps = [STEP_CONNECT, STEP_SCAN, STEP_SELECT, STEP_MIGRATE];
    return (
        <div className="flex gap-1">
            {steps.map((s, i) => (
                <div key={s} className={`h-2 w-8 rounded-full ${current === s ? 'bg-blue-600' : steps.indexOf(current) > i ? 'bg-green-500' : 'bg-gray-200'}`} />
            ))}
        </div>
    );
}
