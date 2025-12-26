import { useState, useCallback, useEffect } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    applyNodeChanges,
    applyEdgeChanges,
    MiniMap,
    addEdge,
    useNodesState,
    useEdgesState,
    Handle,
    Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { FaKey, FaColumns, FaTable, FaSearch, FaSync } from 'react-icons/fa';

// Custom Node for Database Table
const TableNode = ({ data }) => {
    return (
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 min-w-[250px] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FaTable className="text-blue-400" />
                    <span className="font-bold text-white text-sm">{data.label}</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">{data.displayColumns?.length || 0} cols</span>
            </div>

            {/* Columns */}
            <div className="p-2 bg-slate-50">
                {data.displayColumns?.map((col, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 px-2 text-xs border-b last:border-0 border-gray-100 hover:bg-white transition-colors rounded">
                        <div className="flex items-center gap-2 text-gray-700">
                            {col.primary && <FaKey className="text-amber-500 text-[10px]" />}
                            <span className={col.primary ? 'font-bold' : ''}>{col.name}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">{col.type}</span>
                    </div>
                ))}
                {data.hiddenCount > 0 && (
                    <div className="text-center text-[10px] text-gray-400 py-1 italic">
                        + {data.hiddenCount} more columns
                    </div>
                )}
            </div>

            {/* Handles for connections */}
            <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-3 !h-3" />
            <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-3 !h-3" />
        </div>
    );
};

const nodeTypes = { table: TableNode };

export default function SchemaVisualizer() {
    const { token } = useAuth();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initial Fetch
    const fetchSchema = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/intelligence/schema`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                const { nodes: backendNodes, edges: backendEdges } = processSchemaToGraph(res.data.schema);
                setNodes(backendNodes);
                setEdges(backendEdges);
            }
        } catch (err) {
            console.error("Schema fetch error:", err);
            // Fallback for demo/dev if API not ready
            const { nodes: demoNodes, edges: demoEdges } = getDemoData();
            setNodes(demoNodes);
            setEdges(demoEdges);
            // setError("Failed to load live schema. Showing demo data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchema();
    }, []);

    // Helper to process Schema into Nodes/Edges
    const processSchemaToGraph = (schema) => {
        // Layout logic placeholder (simple grid for now)
        const nodes = [];
        const edges = [];
        let x = 0;
        let y = 0;
        const GRID_cols = 4;

        Object.keys(schema).forEach((tableName, index) => {
            const table = schema[tableName];

            // Positioning
            x = (index % GRID_cols) * 350;
            y = Math.floor(index / GRID_cols) * 400;

            // Columns limiting for display
            const MAX_DISPLAY = 8;
            const columns = table.columns || [];
            const displayColumns = columns.slice(0, MAX_DISPLAY);
            const hiddenCount = Math.max(0, columns.length - MAX_DISPLAY);

            nodes.push({
                id: tableName,
                type: 'table',
                position: { x, y },
                data: {
                    label: tableName,
                    displayColumns: displayColumns,
                    hiddenCount: hiddenCount
                },
            });

            // Edges (Foreign Keys)
            if (table.foreignKeys) {
                table.foreignKeys.forEach(fk => {
                    edges.push({
                        id: `${tableName}-${fk.target_table}`,
                        source: tableName,
                        target: fk.target_table,
                        animated: true,
                        style: { stroke: '#94a3b8' },
                    });
                });
            }
        });

        return { nodes, edges };
    };

    const getDemoData = () => {
        // Fallback demo data structure
        const demoSchema = {
            users: { columns: [{ name: 'id', type: 'int', primary: true }, { name: 'name', type: 'varchar' }, { name: 'email', type: 'varchar' }, { name: 'role', type: 'enum' }] },
            bookings: { columns: [{ name: 'id', type: 'int', primary: true }, { name: 'user_id', type: 'int' }, { name: 'property_id', type: 'int' }, { name: 'amount', type: 'decimal' }], foreignKeys: [{ target_table: 'users' }, { target_table: 'properties' }] },
            properties: { columns: [{ name: 'id', type: 'int', primary: true }, { name: 'name', type: 'varchar' }, { name: 'location', type: 'varchar' }], foreignKeys: [{ target_table: 'vendors' }] },
            vendors: { columns: [{ name: 'id', type: 'int', primary: true }, { name: 'user_id', type: 'int' }, { name: 'business_name', type: 'varchar' }], foreignKeys: [{ target_table: 'users' }] }
        };
        return processSchemaToGraph(demoSchema);
    }

    if (loading) return <div className="h-full flex items-center justify-center text-gray-400">Loading Database Schema...</div>;

    return (
        <div className="h-[700px] w-full bg-slate-50 relative group">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                className="bg-slate-50"
            >
                <Background color="#cbd5e1" gap={20} size={1} />
                <Controls className="bg-white shadow-xl border border-gray-100 rounded-lg p-1" />
                <MiniMap
                    nodeColor={() => '#64748b'}
                    maskColor="rgba(241, 245, 249, 0.7)"
                    className="!bg-white !border !border-gray-200 !shadow-lg rounded-lg overflow-hidden"
                />
            </ReactFlow>

            {/* Toolbar */}
            <div className="absolute top-4 right-4 flex gap-2">
                <button
                    onClick={fetchSchema}
                    className="p-2 bg-white text-gray-600 rounded-lg shadow-md hover:text-blue-600 hover:shadow-lg transition-all"
                    title="Refresh Schema"
                >
                    <FaSync className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {error && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-amber-50 text-amber-600 px-4 py-2 rounded-full text-xs font-bold shadow-lg border border-amber-100 flex items-center gap-2">
                    <span>⚠️ {error}</span>
                </div>
            )}
        </div>
    );
}
