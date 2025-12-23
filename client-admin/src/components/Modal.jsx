export default function Modal({ isOpen = true, onClose, title, message, children, type = 'info', onConfirm, showCancel = false, showFooter = true }) {
    if (!isOpen) return null;

    const colors = {
        success: {
            bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            icon: '✓',
            iconBg: '#28a745'
        },
        error: {
            bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            icon: '✕',
            iconBg: '#dc3545'
        },
        warning: {
            bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            icon: '⚠',
            iconBg: '#ffc107'
        },
        info: {
            bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            icon: 'ℹ',
            iconBg: '#17a2b8'
        }
    };

    const color = colors[type] || colors.info;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(5px)',
            animation: 'fadeIn 0.2s ease-out'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                maxWidth: '500px',
                width: '90%',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                overflow: 'hidden',
                animation: 'slideUp 0.3s ease-out'
            }} onClick={e => e.stopPropagation()}>
                {/* Gradient Header */}
                <div style={{
                    background: color.bg,
                    padding: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        backgroundColor: color.iconBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        color: 'white',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                    }}>
                        {color.icon}
                    </div>
                    <h3 style={{
                        margin: 0,
                        color: 'white',
                        fontSize: '24px',
                        fontWeight: '700',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        {title}
                    </h3>
                </div>

                {/* Content */}
                <div style={{ padding: '30px' }}>
                    {children ? children : (
                        <p style={{
                            margin: '0 0 30px 0',
                            color: '#555',
                            fontSize: '16px',
                            lineHeight: '1.6'
                        }}>
                            {message}
                        </p>
                    )}

                    {/* Buttons */}
                    {showFooter && (
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'flex-end'
                        }}>
                            {showCancel && (
                                <button
                                    onClick={onClose}
                                    style={{
                                        padding: '12px 28px',
                                        backgroundColor: '#f0f0f0',
                                        color: '#666',
                                        border: 'none',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    }}
                                    onMouseOver={e => {
                                        e.target.style.backgroundColor = '#e0e0e0';
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                    }}
                                    onMouseOut={e => {
                                        e.target.style.backgroundColor = '#f0f0f0';
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                    }}
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (onConfirm) {
                                        onConfirm();
                                    } else {
                                        onClose();
                                    }
                                }}
                                style={{
                                    padding: '12px 28px',
                                    background: color.bg,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                                }}
                                onMouseOver={e => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
                                }}
                                onMouseOut={e => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                                }}
                            >
                                {showCancel ? 'Confirm' : 'OK'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                @keyframes slideUp {
                    from {
                        transform: translateY(30px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
