'use client';

import { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { trackEvent } from '@/lib/analytics';

interface WorkflowBuilderProps {
  initialWorkflow?: any;
  onSave?: (workflow: any) => void;
}

const nodeTypes = {
  trigger: {
    type: 'input',
    data: { label: 'Trigger' },
    style: { background: '#f9fafb', border: '2px solid #3b82f6' },
  },
  action: {
    type: 'default',
    data: { label: 'Action' },
    style: { background: '#f0fdf4', border: '2px solid #22c55e' },
  },
  condition: {
    type: 'default',
    data: { label: 'Condition' },
    style: { background: '#fef3c7', border: '2px solid #f59e0b' },
  },
};

export function WorkflowBuilder({ initialWorkflow, onSave }: WorkflowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState(initialWorkflow?.name || '');

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
      trackEvent('workflow_connection_created', {
        source: params.source,
        target: params.target,
      });
    },
    [setEdges]
  );

  const addNode = useCallback((type: 'trigger' | 'action' | 'condition') => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { 
        label: type.charAt(0).toUpperCase() + type.slice(1),
        type,
      },
      style: nodeTypes[type].style,
    };
    setNodes((nds) => [...nds, newNode]);
    trackEvent('workflow_node_added', { node_type: type });
  }, [setNodes]);

  const handleSave = useCallback(() => {
    // Convert visual workflow to JSON
    const workflow = {
      name: workflowName,
      steps: nodes.map((node) => ({
        id: node.id,
        type: node.data.type,
        label: node.data.label,
        position: node.position,
      })),
      connections: edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
      })),
    };

    trackEvent('workflow_saved', {
      workflow_name: workflowName,
      node_count: nodes.length,
      edge_count: edges.length,
    });

    onSave?.(workflow);
  }, [workflowName, nodes, edges, onSave]);

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <div className="p-4 bg-white border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="Workflow name"
            className="px-3 py-2 border rounded-lg"
          />
          <div className="flex gap-2">
            <button
              onClick={() => addNode('trigger')}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              + Trigger
            </button>
            <button
              onClick={() => addNode('action')}
              className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              + Action
            </button>
            <button
              onClick={() => addNode('condition')}
              className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
            >
              + Condition
            </button>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Save Workflow
        </button>
      </div>

      {/* Flow Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}
