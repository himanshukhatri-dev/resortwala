import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaDatabase, FaCode, FaCogs, FaTable, FaHistory, FaNetworkWired } from 'react-icons/fa';

import SchemaVisualizer from './intelligence/SchemaVisualizer';

// Placeholder components for tabs
/* 
const SchemaVisualizer = () => (
    <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <FaNetworkWired className="text-6xl mb-4 opacity-20" />
        <h3 className="text-xl font-bold">Schema Visualization</h3>
        <p className="text-sm">Database structure and relationships</p>
    </div>
);
*/

import CodeFlowVisualizer from './intelligence/CodeFlowVisualizer';

/*
const CodeFlowVisualizer = () => (
    <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <FaCode className="text-6xl mb-4 opacity-20" />
        <h3 className="text-xl font-bold">Code Flow Analysis</h3>
        <p className="text-sm">Request lifecycle and API paths</p>
    </div>
);
*/

import BusinessProcessVisualizer from './intelligence/BusinessProcessVisualizer';

import LiveDataManager from './intelligence/LiveDataManager';

/*
const LiveDataManager = () => (
    <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <FaTable className="text-6xl mb-4 opacity-20" />
        <h3 className="text-xl font-bold">Live Data Manager</h3>
        <p className="text-sm">Safe inline editing with impact analysis</p>
    </div>
);
*/

import ImpactLogs from './intelligence/ImpactLogs';

export default function Intelligence() {
    const [activeTab, setActiveTab] = useState('schema');

    const tabs = [
        { id: 'schema', label: 'DB Architecture', icon: FaDatabase, component: SchemaVisualizer },
        { id: 'code', label: 'Code Flow', icon: FaCode, component: CodeFlowVisualizer },
        { id: 'process', label: 'Business Process', icon: FaCogs, component: BusinessProcessVisualizer },
        { id: 'data', label: 'Live Editor', icon: FaTable, component: LiveDataManager },
        { id: 'logs', label: 'Logs & Impact', icon: FaHistory, component: ImpactLogs },
    ];

    const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || SchemaVisualizer;

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-gray-50/50">
            {/* Header */}
            <div className="px-8 py-6 mb-2">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <span className="p-2 bg-gray-900 text-white rounded-lg text-xl shadow-lg border border-gray-700">
                        <FaNetworkWired />
                    </span>
                    System Intelligence
                </h1>
                <p className="text-gray-500 font-medium font-outfit mt-1 ml-14">
                    Architectural control and explainability interface
                </p>
            </div>

            {/* Tabs */}
            <div className="px-8 flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-1px custom-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-bold transition-all relative
                            ${activeTab === tab.id
                                ? 'bg-white text-blue-600 shadow-sm border border-b-0 border-gray-200 z-10'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 border border-transparent'
                            }
                        `}
                    >
                        <tab.icon className={activeTab === tab.id ? 'text-blue-500' : 'text-gray-400'} />
                        <span className="whitespace-nowrap">{tab.label}</span>
                        {activeTab === tab.id && (
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-600 rounded-t-xl" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8 overflow-hidden">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm h-full overflow-hidden relative">
                    <div className="absolute inset-0 overflow-auto custom-scrollbar p-6">
                        <AnimatePresence mode='wait'>
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                            >
                                <ActiveComponent />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
