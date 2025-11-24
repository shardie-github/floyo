/**
 * Workflow Builder Component
 * 
 * Visual workflow builder using React Flow.
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Play, Save, Trash2, Plus, Settings } from 'lucide-react';
import { useNotificationStore } from '@/lib/store';

interface WorkflowNode extends Node {
  data: {
    label: string;
    type: 'trigger' | 'action' | 'condition';
    config?: Record<string, any>;
  };
}

const nodeTypes: NodeTypes = {
  trigger: ({ data }) => (
    <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900 rounded-lg border-2 border-blue-500">
      <div className="font-semibold text-blue-900 dark:text-blue-100">{data.label}</div>
      <div className="text-xs text-blue-700 dark:text-blue-300">{data.type}</div>
    </div>
  ),
  action: ({ data }) => (
    <div className="px-4 py-2 bg-green-100 dark:bg-green-900 rounded-lg border-2 border-green-500">
      <div className="font-semibold text-green-900 dark:text-green-100">{data.label}</div>
      <div className="text-xs text-green-700 dark:text-green-300">{data.type}</div>
    </div>
  ),
  condition: ({ data }) => (
    <div className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg border-2 border-yellow-500">
      <div className="font-semibold text-yellow-900 dark:text-yellow-100">{data.label}</div>
      <div className="text-xs text-yellow-700 dark:text-yellow-300">{data.type}</div>
    </div>
  ),
};

export function WorkflowBuilder({ workflowId, onSave }: { workflowId?: string; onSave?: (workflow: any) => void }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [showAddNode, setShowAddNode] = useState(false);
  const [selectedNodeType, setSelectedNodeType] = useState<'trigger' | 'action' | 'condition'>('action');
  const { addNotification } = useNotificationStore();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = useCallback(() => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type: selectedNodeType,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: `New ${selectedNodeType}`,
        type: selectedNodeType,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setShowAddNode(false);
  }, [selectedNodeType, setNodes]);

  const handleSave = useCallback(async () => {
    if (!workflowName.trim()) {
      addNotification({
        type: 'error',
        message: 'Please enter a workflow name',
      });
      return;
    }

    const workflow = {
      name: workflowName,
      description: workflowDescription,
      definition: {
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
      },
    };

    try {
      const response = await fetch(workflowId ? `/api/workflows/${workflowId}` : '/api/workflows', {
        method: workflowId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow),
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          message: `Workflow ${workflowId ? 'updated' : 'created'} successfully`,
        });
        onSave?.(workflow);
      } else {
        throw new Error('Failed to save workflow');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to save workflow',
      });
    }
  }, [workflowName, workflowDescription, nodes, edges, workflowId, onSave, addNotification]);

  const handleExecute = useCallback(async () => {
    if (!workflowId) {
      addNotification({
        type: 'error',
        message: 'Please save the workflow before executing',
      });
      return;
    }

    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          message: 'Workflow execution started',
        });
      } else {
        throw new Error('Failed to execute workflow');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to execute workflow',
      });
    }
  }, [workflowId, addNotification]);

  return (
    <div className="h-full flex flex-col">
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Workflow Name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="text-lg font-semibold"
              />
              <Textarea
                placeholder="Description (optional)"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex gap-2 ml-4">
              <Button onClick={handleSave} variant="default">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              {workflowId && (
                <Button onClick={handleExecute} variant="default">
                  <Play className="w-4 h-4 mr-2" />
                  Execute
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="flex-1 relative border rounded-lg">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>

        <Dialog open={showAddNode} onOpenChange={setShowAddNode}>
          <DialogTrigger asChild>
            <Button className="absolute top-4 right-4 z-10" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Node
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Node</DialogTitle>
              <DialogDescription>Select the type of node to add</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Node Type</Label>
                <Select value={selectedNodeType} onValueChange={(v: any) => setSelectedNodeType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trigger">Trigger</SelectItem>
                    <SelectItem value="action">Action</SelectItem>
                    <SelectItem value="condition">Condition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addNode} className="w-full">
                Add Node
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
