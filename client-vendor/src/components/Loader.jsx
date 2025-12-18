import React from 'react';

const Loader = () => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '300px',
            width: '100%'
        }}>
            <div className="logo-loader" style={{
                position: 'relative',
                width: '120px',
                height: '120px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                {/* Glowing Ring Effect */}
                <div style={{
                    position: 'absolute',
                    inset: '-10px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255, 56, 92, 0.2) 0%, rgba(255, 255, 255, 0) 70%)',
                    animation: 'pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite'
                }}></div>

                {/* Logo */}
                <img
                    src="/loader-logo.png"
                    alt="Loading..."
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        zIndex: 10,
                        animation: 'breathing 2s ease-in-out infinite'
                    }}
                />
            </div>

            <p style={{
                marginTop: '20px',
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--text-color)',
                opacity: 0.7,
                letterSpacing: '0.5px',
                animation: 'fade 2s ease-in-out infinite'
            }}>
                Loading your experience...
            </p>

            <style>{`
                @keyframes breathing {
                    0% { transform: scale(1); filter: drop-shadow(0 0 0px rgba(0,0,0,0)); }
                    50% { transform: scale(1.05); filter: drop-shadow(0 10px 10px rgba(0,0,0,0.1)); }
                    100% { transform: scale(1); filter: drop-shadow(0 0 0px rgba(0,0,0,0)); }
                }
                @keyframes pulse-ring {
                    0% { transform: scale(0.8); opacity: 0.5; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                @keyframes fade {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 0.8; }
                }
            `}</style>
        </div>
    );
};

export default Loader;
