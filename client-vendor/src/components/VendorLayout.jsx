import { useState } from 'react';
import Sidebar from './Sidebar';


export default function VendorLayout({ children, title }) {
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-color)' }}>
            {/* Mobile Hamburger Button */}
            <button
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
                style={{
                    position: 'fixed',
                    top: '20px',
                    left: '20px',
                    zIndex: 998,
                    background: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    display: 'none', // Shown via CSS media query
                    cursor: 'pointer'
                }}
                id="mobile-menu-toggle"
            >
                ☰
            </button>
            <style>{`
                @media (max-width: 768px) {
                    #mobile-menu-toggle { display: block !important; }
                }
            `}</style>

            <Sidebar
                onHoverChange={setIsSidebarHovered}
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            <div style={{
                flex: 1,
                marginLeft: isSidebarHovered ? '240px' : '70px',
                transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                overflowY: 'auto'
            }} className="content-area">
                <div style={{ padding: '30px' }} className="page-content">
                    {children}
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .content-area {
                        margin-left: 0 !important;
                    }
                    .page-content {
                        padding: 15px !important;
                    }
                }
            `}</style>
        </div>
    );
}
