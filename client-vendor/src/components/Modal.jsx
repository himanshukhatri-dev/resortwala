import React, { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, message, type = 'info', onConfirm, confirmText = 'OK', cancelText = 'Cancel' }) {
    if (!isOpen) return null;

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, animation: 'fadeIn 0.2s ease-out'
        }} onClick={onClose}>
            <style>
                {`
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                `}
            </style>
            <div style={{
                backgroundColor: 'var(--sidebar-bg, white)',
                color: 'var(--text-color, #333)',
                borderRadius: '12px',
                padding: '24px',
                width: '90%',
                maxWidth: '400px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                position: 'relative',
                animation: 'scaleIn 0.2s ease-out',
                border: '1px solid var(--border-color, #eee)'
            }} onClick={e => e.stopPropagation()}>

                <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '600' }}>{title}</h3>

                <p style={{ margin: '0 0 24px 0', opacity: 0.8, lineHeight: '1.5', fontSize: '15px' }}>
                    {message}
                </p>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    {(type === 'confirm') && (
                        <button onClick={onClose} style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color, #ddd)',
                            backgroundColor: 'transparent',
                            color: 'var(--text-color, #555)',
                            fontWeight: '500',
                            cursor: 'pointer',
                        }}>
                            {cancelText}
                        </button>
                    )}

                    <button onClick={onConfirm || onClose} style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: type === 'danger' || type === 'error' ? 'var(--danger-color, #dc3545)' : 'var(--primary-color, #007bff)',
                        color: 'white',
                        fontWeight: '500',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
