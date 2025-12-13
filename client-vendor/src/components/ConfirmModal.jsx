import React from 'react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, type = 'danger', confirmText, cancelText, isLoading }) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000
        }}>
            <div style={{
                backgroundColor: 'var(--sidebar-bg, white)', padding: '25px', borderRadius: '12px',
                width: '90%', maxWidth: '400px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                color: 'var(--text-color, #333)'
            }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>{title}</h3>
                <p style={{ margin: '0 0 25px 0', color: 'var(--text-color, #666)', opacity: 0.8 }}>{message}</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onClose} disabled={isLoading} style={{
                        padding: '10px 20px', border: '1px solid var(--border-color, #ddd)', borderRadius: '8px',
                        background: 'transparent', cursor: isLoading ? 'not-allowed' : 'pointer', color: 'var(--text-color, #666)', fontWeight: '500',
                        opacity: isLoading ? 0.5 : 1
                    }}>{cancelText || 'Cancel'}</button>
                    <button onClick={onConfirm} disabled={isLoading} style={{
                        padding: '10px 20px', border: 'none', borderRadius: '8px',
                        background: type === 'danger' ? 'var(--danger-color, #dc3545)' : 'var(--primary-color, #667eea)',
                        color: 'white', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: '500',
                        opacity: isLoading ? 0.7 : 1,
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        {isLoading && <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>}
                        {confirmText || (type === 'danger' ? 'Delete' : 'Confirm')}
                    </button>
                    <style>{`
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    `}</style>
                </div>
            </div>
        </div>
    );
}
