import { useCallback } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    Handle,
    Position,
    MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FaSearch, FaHotel, FaCreditCard, FaCheckCircle, FaUserCheck, FaBan } from 'react-icons/fa';

// Custom Node
const WorkflowNode = ({ data }) => {
    let Icon = FaSearch;
    let colorClass = "bg-white border-gray-300";

    if (data.type === 'start') { Icon = FaSearch; colorClass = "bg-blue-50 border-blue-400"; }
    if (data.type === 'action') { Icon = FaHotel; colorClass = "bg-white border-gray-300"; }
    if (data.type === 'payment') { Icon = FaCreditCard; colorClass = "bg-purple-50 border-purple-400"; }
    if (data.type === 'success') { Icon = FaCheckCircle; colorClass = "bg-green-50 border-green-500"; }
    if (data.type === 'verify') { Icon = FaUserCheck; colorClass = "bg-amber-50 border-amber-400"; }
    if (data.type === 'cancel') { Icon = FaBan; colorClass = "bg-red-50 border-red-400"; }

    return (
        <div className={`shadow-lg border-2 ${colorClass} rounded-2xl p-4 min-w-[200px] flex flex-col items-center text-center gap-2`}>
            <div className="p-3 bg-white rounded-full shadow-sm">
                <Icon className="text-xl text-gray-700" />
            </div>
            <div>
                <div className="font-bold text-gray-800">{data.label}</div>
                <div className="text-[10px] text-gray-500 mt-1">{data.desc}</div>
            </div>
            <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-3 !h-3" />
            <Handle type="source" position={Position.Bottom} className="!bg-gray-400 !w-3 !h-3" />
        </div>
    );
};

const nodeTypes = { workflow: WorkflowNode };

const initialNodes = [
    { id: '1', type: 'workflow', position: { x: 250, y: 0 }, data: { label: 'Customer Search', type: 'start', desc: 'Filters: Location, Price, Type' } },
    { id: '2', type: 'workflow', position: { x: 250, y: 150 }, data: { label: 'Select Property', type: 'action', desc: 'View Details & Reviews' } },
    { id: '3', type: 'workflow', position: { x: 250, y: 300 }, data: { label: 'Booking Request', type: 'verify', desc: 'Check Availability' } },

    // Branching
    { id: '4', type: 'workflow', position: { x: 50, y: 450 }, data: { label: 'Auto-Confirmation', type: 'payment', desc: 'Instant Payment Gateway' } },
    { id: '5', type: 'workflow', position: { x: 450, y: 450 }, data: { label: 'Vendor Approval', type: 'action', desc: 'Manual Review (24h limit)' } },

    { id: '6', type: 'workflow', position: { x: 250, y: 600 }, data: { label: 'Booking Confirmed', type: 'success', desc: 'Email/SMS Sent' } },
    { id: '7', type: 'workflow', position: { x: 500, y: 300 }, data: { label: 'Drop Off', type: 'cancel', desc: 'Timeout / Cancellation' } },
];

const initialEdges = [
    { id: 'e1-2', source: '1', target: '2', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e2-3', source: '2', target: '3', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },

    // Split
    { id: 'e3-4', source: '3', target: '4', label: 'Instant Book', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e3-5', source: '3', target: '5', label: 'Request Mode', animated: true, style: { strokeDasharray: 5 }, markerEnd: { type: MarkerType.ArrowClosed } },

    // Merge
    { id: 'e4-6', source: '4', target: '6', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e5-6', source: '5', target: '6', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },

    // Drop
    { id: 'e5-7', source: '5', target: '7', label: 'Rejected', style: { stroke: 'red' }, animated: true },
];

export default function BusinessProcessVisualizer() {
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

            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800">Booking Lifecycle</h3>
                <p className="text-xs text-gray-500">Visualization of the core revenue workflow.</p>
            </div>
        </div>
    );
}
