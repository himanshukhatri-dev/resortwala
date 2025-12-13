import { useState, useEffect } from 'react';

export default function DebugPanel({ apiCalls = [] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    // Check if debug mode is enabled via URL parameter
    const isDebugMode = new URLSearchParams(window.location.search).get('debug') === '1';

    if (!isDebugMode) return null;

    return (
        <>
            {/* Floating Toggle Button */}
            {isMinimized && (
                <div
                    onClick={() => setIsMinimized(false)}
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        right: '20px',
                        backgroundColor: '#ff6b6b',
                        color: 'white',
                        padding: '12px 20px',
                        borderRadius: '50px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(255,107,107,0.4)',
                        zIndex: 99999,
                        fontWeight: '600',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    🐛 Debug Panel ({apiCalls.length})
                </div>
            )}

            {/* Debug Panel */}
            {!isMinimized && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    width: '450px',
                    maxHeight: '600px',
                    backgroundColor: '#1e1e1e',
                    color: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    zIndex: 99999,
                    overflow: 'hidden',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '15px',
                        backgroundColor: '#ff6b6b',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'move'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px' }}>🐛</span>
                            <strong>Performance Debugger</strong>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                {isOpen ? '▼' : '▲'}
                            </button>
                            <button
                                onClick={() => setIsMinimized(true)}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    {isOpen && (
                        <div style={{
                            maxHeight: '500px',
                            overflowY: 'auto',
                            padding: '15px'
                        }}>
                            {/* Summary */}
                            <div style={{
                                backgroundColor: '#2d2d2d',
                                padding: '12px',
                                borderRadius: '8px',
                                marginBottom: '15px'
                            }}>
                                <div style={{ marginBottom: '8px' }}>
                                    <strong style={{ color: '#4fc3f7' }}>Total API Calls:</strong> {apiCalls.length}
                                </div>
                                <div style={{ marginBottom: '8px' }}>
                                    <strong style={{ color: '#4fc3f7' }}>Total Time:</strong>{' '}
                                    {apiCalls.reduce((sum, call) => sum + (call.duration || 0), 0).toFixed(2)}ms
                                </div>
                                <div>
                                    <strong style={{ color: '#4fc3f7' }}>Avg Time:</strong>{' '}
                                    {apiCalls.length > 0
                                        ? (apiCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / apiCalls.length).toFixed(2)
                                        : 0}ms
                                </div>
                            </div>

                            {/* API Calls List */}
                            <div>
                                <strong style={{ color: '#81c784', marginBottom: '10px', display: 'block' }}>
                                    API Calls Timeline:
                                </strong>
                                {apiCalls.length === 0 ? (
                                    <div style={{ color: '#999', padding: '20px', textAlign: 'center' }}>
                                        No API calls yet
                                    </div>
                                ) : (
                                    apiCalls.map((call, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                backgroundColor: call.status >= 200 && call.status < 300 ? '#2d4a2d' : '#4a2d2d',
                                                padding: '10px',
                                                borderRadius: '6px',
                                                marginBottom: '8px',
                                                borderLeft: `4px solid ${call.status >= 200 && call.status < 300 ? '#81c784' : '#e57373'}`
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                <span style={{ color: '#ffd54f', fontWeight: 'bold' }}>
                                                    {call.method}
                                                </span>
                                                <span style={{ color: call.status >= 200 && call.status < 300 ? '#81c784' : '#e57373' }}>
                                                    {call.status}
                                                </span>
                                            </div>
                                            <div style={{ color: '#b0bec5', marginBottom: '6px', wordBreak: 'break-all' }}>
                                                {call.url}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                                <span style={{ color: '#90caf9' }}>
                                                    ⏱️ {call.duration?.toFixed(2) || 0}ms
                                                </span>
                                                <span style={{ color: '#999' }}>
                                                    {new Date(call.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            {call.debug && (
                                                <details style={{ marginTop: '8px' }}>
                                                    <summary style={{ cursor: 'pointer', color: '#ce93d8' }}>
                                                        Debug Info
                                                    </summary>
                                                    <pre style={{
                                                        backgroundColor: '#1a1a1a',
                                                        padding: '8px',
                                                        borderRadius: '4px',
                                                        marginTop: '6px',
                                                        fontSize: '10px',
                                                        overflow: 'auto',
                                                        maxHeight: '200px'
                                                    }}>
                                                        {JSON.stringify(call.debug, null, 2)}
                                                    </pre>
                                                </details>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
