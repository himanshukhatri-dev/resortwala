import { useState, useCallback, useEffect } from 'react';
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
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { FaLaptopCode, FaServer, FaDatabase, FaGlobe, FaCogs, FaSync } from 'react-icons/fa';

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
        <div className={`shadow-lg border-2 ${borderColor} ${bgColor} rounded-xl p-4 min-w-[250px] flex items-center gap-3 transition-all hover:scale-105`}>
            <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                <Icon className="text-xl text-gray-700" />
            </div>
            <div className='flex-1'>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{data.method || data.type}</div>
                <div className="font-bold text-gray-900 text-sm truncate w-48" title={data.label}>{data.label}</div>
                {data.subtext && <div className="text-[10px] text-gray-500 font-mono mt-1">{data.subtext}</div>}
            </div>
            <Handle type="target" position={Position.Left} className="!bg-gray-400" />
            <Handle type="source" position={Position.Right} className="!bg-gray-400" />
        </div>
    );
};

const nodeTypes = { process: ProcessNode };

export default function CodeFlowVisualizer() {
    const { token } = useAuth();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);

    const fetchRoutes = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/intelligence/routes`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data) {
                const { nodes: backendNodes, edges: backendEdges } = processRoutesToGraph(res.data);
                setNodes(backendNodes);
                setEdges(backendEdges);
            }
        } catch (err) {
            console.error("Route fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoutes();
    }, []);

    const processRoutesToGraph = (routes) => {
        const nodes = [];
        const edges = [];
        let y = 0;

        // Create a central "API Gateway" node
        nodes.push({
            id: 'gateway',
            type: 'process',
            position: { x: 50, y: (routes.length * 100) / 2 },
            data: { label: 'API Gateway', type: 'server', subtext: 'api.resortwala.com' }
        });

        routes.forEach((route, index) => {
            const routeId = `route-${index}`;
            const controllerId = `controller-${index}`;

            // Route Node
            nodes.push({
                id: routeId,
                type: 'process',
                position: { x: 400, y: index * 120 },
                data: {
                    label: route.uri,
                    type: 'ui',
                    method: route.method,
                    subtext: route.middleware?.join(', ')
                }
            });

            // Controller Node
            const actionParts = route.action ? route.action.split('\\').pop().split('@') : ['Closure', ''];
            nodes.push({
                id: controllerId,
                type: 'process',
                position: { x: 800, y: index * 120 },
                data: {
                    label: actionParts[0],
                    type: 'controller',
                    subtext: actionParts[1] + '()'
                }
            });

            // Edges
            edges.push({ id: `e-gw-${routeId}`, source: 'gateway', target: routeId, animated: true, style: { stroke: '#94a3b8' } });
            edges.push({ id: `e-${routeId}-${controllerId}`, source: routeId, target: controllerId, animated: true, markerEnd: { type: MarkerType.ArrowClosed } });
        });

        return { nodes, edges };
    };

    if (loading) return <div className="h-full flex items-center justify-center text-gray-400">Analyzing System Routes...</div>;

    return (
        <div className="h-[700px] w-full bg-slate-50 relative group">
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

            {/* Toolbar */}
            <div className="absolute top-4 right-4 flex gap-2">
                <button
                    onClick={fetchRoutes}
                    className="p-2 bg-white text-gray-600 rounded-lg shadow-md hover:text-blue-600 hover:shadow-lg transition-all"
                    title="Refresh Routes"
                >
                    <FaSync className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur p-2 rounded-lg shadow-sm border border-gray-200 text-xs text-gray-500">
                Live Route Analysis: {nodes.length > 0 ? (nodes.length - 1) / 2 : 0} Endpoints Detected
            </div>
        </div>
    );
}
