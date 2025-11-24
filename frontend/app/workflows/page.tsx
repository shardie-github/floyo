'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WorkflowBuilder } from '@/components/workflows/WorkflowBuilder';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Play, Trash2, Edit } from 'lucide-react';
import { useNotificationStore } from '@/lib/store';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows');
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.items || []);
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          message: 'Workflow deleted',
        });
        loadWorkflows();
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to delete workflow',
      });
    }
  };

  const handleExecute = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          message: 'Workflow execution started',
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to execute workflow',
      });
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (showBuilder || selectedWorkflow) {
    return (
      <div className="container mx-auto p-6 h-screen">
        <WorkflowBuilder
          workflowId={selectedWorkflow || undefined}
          onSave={() => {
            setShowBuilder(false);
            setSelectedWorkflow(null);
            loadWorkflows();
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">Automate your tasks with visual workflows</p>
        </div>
        <Button onClick={() => setShowBuilder(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {workflows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No workflows yet</p>
            <Button onClick={() => setShowBuilder(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((workflow) => (
            <Card key={workflow.id}>
              <CardHeader>
                <CardTitle>{workflow.name}</CardTitle>
                {workflow.description && <CardDescription>{workflow.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${workflow.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                    {workflow.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedWorkflow(workflow.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExecute(workflow.id)}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(workflow.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
