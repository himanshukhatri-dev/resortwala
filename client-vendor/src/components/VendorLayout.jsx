import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function VendorLayout({ children, title }) {
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-color)' }}>
            <Sidebar onHoverChange={setIsSidebarHovered} />
            <div style={{
                flex: 1,
                marginLeft: isSidebarHovered ? '240px' : '70px',
                transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                overflowY: 'auto' // Make this div scrollable
            }}>
                <Header title={title} />
                <div style={{ padding: '30px' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
