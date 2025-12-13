
import React, { useState, useEffect } from 'react';

const Status = () => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const checkStatus = async () => {
        setLoading(true);
        setError(null);
        try {
            // Using Port 8002 as configured in docker-compose
            const res = await fetch('http://localhost:8002/api/status');
            const data = await res.json();
            setStatus(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkStatus();
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>System Status (ResortWala)</h1>
            <button
                onClick={checkStatus}
                style={{ marginBottom: '20px', padding: '10px 20px', cursor: 'pointer', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '5px' }}
            >
                Refresh Status
            </button>

            {loading && <p>Loading...</p>}

            {error && (
                <div style={{ color: 'red', border: '1px solid red', padding: '10px', marginBottom: '20px' }}>
                    <strong>Network Error:</strong> {error}
                    <p>Ensure API is running on Port 8002.</p>
                </div>
            )}

            {status && (
                <div style={{ display: 'grid', gap: '20px' }}>
                    <div style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
                        <h3>🌐 API Server</h3>
                        <div>Status: <span style={{ color: 'green', fontWeight: 'bold' }}>{status.app?.toUpperCase()}</span></div>
                        <div>Environment: {status.environment}</div>
                        <div>Server Time: {status.server_time}</div>
                    </div>

                    <div style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
                        <h3>🗄️ Database (MySQL)</h3>
                        <div>Status: <span style={{ color: status.database === 'connected' ? 'green' : 'red', fontWeight: 'bold' }}>
                            {status.database?.toUpperCase()}
                        </span></div>
                        {status.db_error && <div style={{ color: 'red', marginTop: '5px' }}>Error: {status.db_error}</div>}
                        <div>Host: {status.db_host}</div>
                        <div>Name: {status.db_database}</div>
                    </div>

                    <div style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
                        <h3>⚡ Cache</h3>
                        <div>Status: <span style={{ color: status.cache === 'working' ? 'green' : 'orange', fontWeight: 'bold' }}>
                            {status.cache?.toUpperCase()}
                        </span></div>
                        {status.cache_error && <div style={{ color: 'red', marginTop: '5px' }}>Error: {status.cache_error}</div>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Status;
