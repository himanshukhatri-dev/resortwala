import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FaCalendarCheck, FaUserClock, FaBan, FaMoneyBillWave, FaCheckCircle } from 'react-icons/fa';

const ProcessNode = ({ data }) => {
    let bgColor = "bg-white";
    let iconColor = "text-gray-500";
    let Icon = FaUserClock;

    switch (data.state) {
        case 'pending': bgColor = "bg-yellow-50 border-yellow-200"; iconColor = "text-yellow-600"; Icon = FaUserClock; break;
        case 'approved': bgColor = "bg-blue-50 border-blue-200"; iconColor = "text-blue-600"; Icon = FaCheckCircle; break;
        case 'paid': bgColor = "bg-green-50 border-green-200"; iconColor = "text-green-600"; Icon = FaMoneyBillWave; break;
        case 'cancelled': bgColor = "bg-red-50 border-red-200"; iconColor = "text-red-600"; Icon = FaBan; break;
        case 'completed': bgColor = "bg-purple-50 border-purple-200"; iconColor = "text-purple-600"; Icon = FaCalendarCheck; break;
    }

    return (
        <div className={`shadow-md border-2 ${bgColor} rounded-xl p-3 min-w-[150px] flex flex-col items-center gap-2 text-center`}>
            <div className={`p-2 rounded-full bg-white shadow-sm`}>
                <Icon className={`text-xl ${iconColor}`} />
            </div>
            <div>
                <div className="font-bold text-gray-800 capitalize">{data.label}</div>
                <div className="text-[10px] text-gray-500">{data.desc}</div>
            </div>
        </div>
    );
};

const nodeTypes = { process: ProcessNode };

const initialNodes = [
    { id: 'start', type: 'input', position: { x: 300, y: 0 }, data: { label: 'Start' }, style: { background: '#333', color: '#fff', width: 50, borderRadius: '50%' } },
    { id: 'pending', type: 'process', position: { x: 250, y: 80 }, data: { label: 'Pending', state: 'pending', desc: 'Customer creates request' } },
    { id: 'approved', type: 'process', position: { x: 100, y: 220 }, data: { label: 'Approved', state: 'approved', desc: 'Vendor accepts dates' } },
    { id: 'rejected', type: 'process', position: { x: 450, y: 220 }, data: { label: 'Rejected', state: 'cancelled', desc: 'Vendor declines / Conflict' } },
    { id: 'payment', type: 'process', position: { x: 100, y: 350 }, data: { label: 'Confirmed', state: 'paid', desc: 'Payment verified' } },
    { id: 'cancelled', type: 'process', position: { x: 450, y: 350 }, data: { label: 'Cancelled', state: 'cancelled', desc: 'User cancels booking' } },
    { id: 'completed', type: 'process', position: { x: 250, y: 480 }, data: { label: 'Completed', state: 'completed', desc: 'Stay finished' } },
];

const initialEdges = [
    { id: 'e-start-pending', source: 'start', target: 'pending', animated: true },
    { id: 'e-pend-app', source: 'pending', target: 'approved', label: 'Vendor Approves', markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e-pend-rej', source: 'pending', target: 'rejected', label: 'Vendor Rejects', style: { stroke: 'red' }, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e-app-pay', source: 'approved', target: 'payment', label: 'Payment', markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e-app-canc', source: 'approved', target: 'cancelled', label: 'User Cancels', style: { stroke: 'orange' }, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e-pay-comp', source: 'payment', target: 'completed', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e-pay-canc', source: 'payment', target: 'cancelled', style: { stroke: 'orange' }, label: 'Refund Req', markerEnd: { type: MarkerType.ArrowClosed } },
];

export default function BookingProcessVisualizer() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    return (
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
        </ReactFlow>
    );
}
