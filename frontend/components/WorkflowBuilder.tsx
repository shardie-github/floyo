'use client';

import { useState, useCallback, useEffect } from 'react';
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
  NodeTypes,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { trackEvent } from '@/lib/analytics';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

interface WorkflowBuilderProps {
  initialWorkflow?: any;
  onSave?: (workflow: any) => void;
  onTest?: (workflow: any) => void;
  onExecute?: (workflow: any) => void;
}

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  label: string;
  config?: Record<string, any>;
}

const nodeStyles = {
  trigger: { background: '#dbeafe', border: '2px solid #3b82f6', color: '#1e40af' },
  action: { background: '#dcfce7', border: '2px solid #22c55e', color: '#166534' },
  condition: { background: '#fef3c7', border: '2px solid #f59e0b', color: '#92400e' },
};

const CustomNode = ({ data }: { data: any }) => {
  const style = nodeStyles[data.type as keyof typeof nodeStyles] || nodeStyles.action;
  
  return (
    <div
      style={{
        padding: '10px 15px',
        borderRadius: '8px',
        border: style.border,
        background: style.background,
        color: style.color,
        minWidth: '120px',
        textAlign: 'center',
        fontWeight: '600',
      }}
    >
      <div className="text-sm font-semibold">{data.label}</div>
      {data.config && (
        <div className="text-xs mt-1 opacity-75">{JSON.stringify(data.config)}</div>
      )}
    </div>
  );
};

const nodeTypes: NodeTypes = {
  default: CustomNode,
};

export function WorkflowBuilder({ initialWorkflow, onSave, onTest, onExecute }: WorkflowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState(initialWorkflow?.name || '');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (initialWorkflow) {
      setWorkflowName(initialWorkflow.name || '');
      if (initialWorkflow.steps) {
        const initialNodes: Node[] = initialWorkflow.steps.map((step: WorkflowStep, idx: number) => ({
          id: step.id,
          type: 'default',
          position: step.position || { x: idx * 200, y: 100 },
          data: {
            label: step.label,
            type: step.type,
            config: step.config,
          },
        }));
        setNodes(initialNodes);
      }
      if (initialWorkflow.connections) {
        const initialEdges: Edge[] = initialWorkflow.connections.map((conn: any) => ({
          id: `e${conn.source}-${conn.target}`,
          source: conn.source,
          target: conn.target,
          markerEnd: { type: MarkerType.ArrowClosed },
        }));
        setEdges(initialEdges);
      }
    }
  }, [initialWorkflow, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds));
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
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nodes.filter(n => n.data.type === type).length + 1}`,
        type,
        config: {},
      },
    };
    setNodes((nds) => [...nds, newNode]);
    trackEvent('workflow_node_added', { node_type: type });
  }, [setNodes, nodes]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [setNodes, setEdges, selectedNode]);

  const validateWorkflow = useCallback((): string[] => {
    const errors: string[] = [];
    
    if (!workflowName.trim()) {
      errors.push('Workflow name is required');
    }
    
    if (nodes.length === 0) {
      errors.push('Workflow must have at least one node');
    }
    
    const triggers = nodes.filter(n => n.data.type === 'trigger');
    if (triggers.length === 0) {
      errors.push('Workflow must have at least one trigger');
    }
    
    const nodesWithEdges = new Set([...edges.map(e => e.source), ...edges.map(e => e.target)]);
    const isolatedNodes = nodes.filter(n => !nodesWithEdges.has(n.id));
    if (isolatedNodes.length > 0 && nodes.length > 1) {
      errors.push('All nodes must be connected');
    }
    
    return errors;
  }, [workflowName, nodes, edges]);

  const handleSave = useCallback(async () => {
    const errors = validateWorkflow();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors([]);
    setIsSaving(true);
    
    const workflow = {
      name: workflowName,
      steps: nodes.map((node) => ({
        id: node.id,
        type: node.data.type,
        label: node.data.label,
        position: node.position,
        config: node.data.config || {},
      })),
      connections: edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
      })),
    };

    try {
      trackEvent('workflow_saved', {
        workflow_name: workflowName,
        node_count: nodes.length,
        edge_count: edges.length,
      });

      // Save to backend
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(workflow),
      });

      if (response.ok) {
        onSave?.(workflow);
      } else {
        setValidationErrors(['Failed to save workflow']);
      }
    } catch (error) {
      setValidationErrors(['Failed to save workflow']);
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  }, [workflowName, nodes, edges, onSave, validateWorkflow]);

  const handleTest = useCallback(async () => {
    const errors = validateWorkflow();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors([]);
    setIsTesting(true);
    
    const workflow = {
      name: workflowName,
      steps: nodes.map((node) => ({
        id: node.id,
        type: node.data.type,
        label: node.data.label,
        config: node.data.config || {},
      })),
      connections: edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
      })),
    };

    try {
      trackEvent('workflow_tested', {
        workflow_name: workflowName,
      });

      onTest?.(workflow);
      setPreviewMode(true);
    } catch (error) {
      setValidationErrors(['Failed to test workflow']);
      console.error('Test error:', error);
    } finally {
      setIsTesting(false);
    }
  }, [workflowName, nodes, edges, onTest, validateWorkflow]);

  const handleExecute = useCallback(async () => {
    const errors = validateWorkflow();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors([]);
    
    const workflow = {
      name: workflowName,
      steps: nodes.map((node) => ({
        id: node.id,
        type: node.data.type,
        label: node.data.label,
        config: node.data.config || {},
      })),
      connections: edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
      })),
    };

    try {
      trackEvent('workflow_executed', {
        workflow_name: workflowName,
      });

      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(workflow),
      });

      if (response.ok) {
        const result = await response.json();
        onExecute?.(result);
        alert('Workflow executed successfully!');
      } else {
        setValidationErrors(['Failed to execute workflow']);
      }
    } catch (error) {
      setValidationErrors(['Failed to execute workflow']);
      console.error('Execute error:', error);
    }
  }, [workflowName, nodes, edges, onExecute, validateWorkflow]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="p-4 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="Workflow name"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-4 py-2 rounded-lg ${
                previewMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {previewMode ? 'Edit Mode' : 'Preview Mode'}
            </button>
            <button
              onClick={handleTest}
              disabled={isTesting}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400"
            >
              {isTesting ? 'Testing...' : 'Test'}
            </button>
            <button
              onClick={handleExecute}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Execute
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {validationErrors.length > 0 && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <ul className="list-disc list-inside">
              {validationErrors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {!previewMode && (
          <div className="flex gap-2">
            <button
              onClick={() => addNode('trigger')}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
            >
              + Trigger
            </button>
            <button
              onClick={() => addNode('action')}
              className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium"
            >
              + Action
            </button>
            <button
              onClick={() => addNode('condition')}
              className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-sm font-medium"
            >
              + Condition
            </button>
          </div>
        )}
      </div>

      {/* Flow Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedNode(node)}
          nodeTypes={nodeTypes}
          nodesDraggable={!previewMode}
          nodesConnectable={!previewMode}
          elementsSelectable={!previewMode}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>

        {/* Node Configuration Panel */}
        {selectedNode && !previewMode && (
          <div className="absolute top-4 right-4 bg-white border rounded-lg shadow-lg p-4 w-64">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Node Configuration</h3>
              <button
                onClick={() => {
                  deleteNode(selectedNode.id);
                  setSelectedNode(null);
                }}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-sm text-gray-600">Type</label>
                <p className="font-medium capitalize">{selectedNode.data.type}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Label</label>
                <input
                  type="text"
                  value={selectedNode.data.label}
                  onChange={(e) => {
                    setNodes((nds) =>
                      nds.map((n) =>
                        n.id === selectedNode.id
                          ? { ...n, data: { ...n.data, label: e.target.value } }
                          : n
                      )
                    );
                    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, label: e.target.value } });
                  }}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
