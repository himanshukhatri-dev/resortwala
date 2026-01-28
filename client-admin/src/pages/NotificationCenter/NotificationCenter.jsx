import React, { useState } from 'react';
import { FiMail, FiMessageSquare, FiSmartphone, FiActivity, FiSettings, FiFileText } from 'react-icons/fi';
import EmailTemplates from './EmailTemplates';
import DltRegistry from './DltRegistry';
import TriggerManager from './TriggerManager';
import GatewaySettings from './GatewaySettings';
import DeliveryLogs from './DeliveryLogs';
import NotificationTester from './NotificationTester';

export default function NotificationCenter() {
    const [activeTab, setActiveTab] = useState('logs');

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto min-h-screen bg-slate-50/50">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                    Notification <span className="text-indigo-600">Center</span>
                </h1>
                <p className="text-sm font-medium text-slate-500 max-w-2xl">
                    Centralized management for all outbound communications. Configure templates, enforce DLT compliance, and manage event triggers using the Unified Notification Engine (UNE).
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 mb-8 flex flex-wrap gap-2 sticky top-4 z-30">
                <TabButton
                    id="logs"
                    label="Audit Logs"
                    icon={<FiFileText />}
                    active={activeTab}
                    onClick={setActiveTab}
                />
                <TabButton
                    id="test"
                    label="Test & Simulate"
                    icon={<FiActivity />} // Changed icon for better representation
                    active={activeTab}
                    onClick={setActiveTab}
                />
                <TabButton
                    id="templates"
                    label="Email Templates"
                    icon={<FiMail />}
                    active={activeTab}
                    onClick={setActiveTab}
                />
                <TabButton
                    id="dlt"
                    label="DLT Registry (SMS)"
                    icon={<FiMessageSquare />}
                    active={activeTab}
                    onClick={setActiveTab}
                />
                <TabButton
                    id="whatsapp"
                    label="WhatsApp"
                    icon={<FiSmartphone />}
                    active={activeTab}
                    onClick={setActiveTab}
                />
                <TabButton
                    id="triggers"
                    label="Event Triggers"
                    icon={<FiActivity />}
                    active={activeTab}
                    onClick={setActiveTab}
                />
                <TabButton
                    id="settings"
                    label="Gateway Settings"
                    icon={<FiSettings />}
                    active={activeTab}
                    onClick={setActiveTab}
                />
            </div>

            {/* Content Area */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'logs' && <DeliveryLogs />}
                {activeTab === 'test' && <NotificationTester />}
                {activeTab === 'templates' && <EmailTemplates />}
                {activeTab === 'dlt' && <DltRegistry />}
                {activeTab === 'whatsapp' && <div className="p-10 text-center text-slate-400 font-bold">WhatsApp Template Manager Coming Soon</div>}
                {activeTab === 'triggers' && <TriggerManager />}
                {activeTab === 'settings' && <GatewaySettings />}
            </div>
        </div>
    );
}

function TabButton({ id, label, icon, active, onClick }) {
    return (
        <button
            onClick={() => onClick(id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                ${active === id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
        >
            {icon}
            {label}
        </button>
    );
}
