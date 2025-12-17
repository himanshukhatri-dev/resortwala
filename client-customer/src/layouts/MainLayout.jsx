import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/ui/Header';
import Footer from '../components/ui/Footer';

import ChatWidget from '../components/common/ChatWidget';

export default function MainLayout() {
    return (
        <div className="flex flex-col min-h-screen bg-white font-sans text-gray-900">
            <Header />
            <main className="flex-grow">
                <Outlet />
            </main>
            <ChatWidget />
            <Footer />
        </div>
    );
}
