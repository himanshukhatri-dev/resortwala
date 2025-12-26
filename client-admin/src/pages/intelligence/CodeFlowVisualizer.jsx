import { useState, useCallback } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    applyNodeChanges,
    applyEdgeChanges,
    MiniMap,
    useNodesState,
    useEdgesState,
    Handle,
    Position,
    MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FaLaptopCode, FaServer, FaDatabase, FaGlobe, FaCogs } from 'react-icons/fa';

// Custom Node Types
const ProcessNode = ({ data }) => {
    let Icon = FaCogs;
    let bgColor = "bg-white";
    let borderColor = "border-gray-300";

    if (data.type === 'ui') { Icon = FaLaptopCode; bgColor = "bg-blue-50"; borderColor = "border-blue-200"; }
    if (data.type === 'server') { Icon = FaGlobe; bgColor = "bg-green-50"; borderColor = "border-green-200"; }
    if (data.type === 'controller') { Icon = FaServer; bgColor = "bg-purple-50"; borderColor = "border-purple-200"; }
    if (data.type === 'db') { Icon = FaDatabase; bgColor = "bg-amber-50"; borderColor = "border-amber-200"; }

    return (
        <div className={`shadow-lg border-2 ${borderColor} ${bgColor} rounded-xl p-4 min-w-[200px] flex items-center gap-3`}>
            <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                <Icon className="text-xl text-gray-700" />
            </div>
            <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{data.type}</div>
                <div className="font-bold text-gray-900">{data.label}</div>
                {data.subtext && <div className="text-[10px] text-gray-500">{data.subtext}</div>}
            </div>
            <Handle type="target" position={Position.Left} className="!bg-gray-400" />
            <Handle type="source" position={Position.Right} className="!bg-gray-400" />
        </div>
    );
};

const nodeTypes = { process: ProcessNode };

const initialNodes = [
    { id: '1', type: 'process', position: { x: 50, y: 100 }, data: { label: 'User Action', type: 'ui', subtext: 'Click "Login"' } },
    { id: '2', type: 'process', position: { x: 350, y: 100 }, data: { label: 'API Route', type: 'server', subtext: '/api/login' } },
    { id: '3', type: 'process', position: { x: 650, y: 100 }, data: { label: 'AuthController', type: 'controller', subtext: 'login()' } },
    { id: '4', type: 'process', position: { x: 950, y: 100 }, data: { label: 'Database', type: 'db', subtext: 'SELECT * FROM users' } },
    { id: '5', type: 'process', position: { x: 650, y: 300 }, data: { label: 'Response', type: 'server', subtext: 'JSON Token' } },
];

const initialEdges = [
    { id: 'e1-2', source: '1', target: '2', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e2-3', source: '2', target: '3', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e3-4', source: '3', target: '4', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e4-3-return', source: '4', target: '3', animated: true, style: { strokeDasharray: 5 }, label: 'Data' },
    { id: 'e3-5', source: '3', target: '5', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
];

export default function CodeFlowVisualizer() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    return (
        <div className="h-[700px] w-full bg-slate-50 relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
            >
                <Background color="#cbd5e1" gap={20} size={1} />
                <Controls className="bg-white shadow-xl border border-gray-100 rounded-lg p-1" />
                <MiniMap nodeColor="#64748b" className="!bg-white !border !border-gray-200 !shadow-lg rounded-lg overflow-hidden" />
            </ReactFlow>

            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur p-2 rounded-lg shadow-sm border border-gray-200 text-xs text-gray-500">
                Mock Flow: Login Request Lifecycle
            </div>
        </div>
    );
}
