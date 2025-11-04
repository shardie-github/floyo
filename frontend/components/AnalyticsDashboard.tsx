'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface ActivationStatus {
  is_activated: boolean;
  retention: {
    d7_retention: boolean;
    d30_retention: boolean;
    d90_retention: boolean;
    days_since_signup: number;
    is_activated: boolean;
  };
}

export function AnalyticsDashboard() {
  const { data: activationData, isLoading } = useQuery<ActivationStatus>({
    queryKey: ['analytics', 'activation'],
    queryFn: async () => {
      const response = await axios.get('/api/analytics/activation', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Your Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Activation Status</div>
          <div className="text-2xl font-bold">
            {activationData?.is_activated ? (
              <span className="text-green-600">✓ Activated</span>
            ) : (
              <span className="text-orange-600">Not Activated</span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {activationData?.is_activated
              ? 'You have completed activation criteria'
              : 'Create a workflow or apply a suggestion to activate'}
          </div>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Days Since Signup</div>
          <div className="text-2xl font-bold">
            {activationData?.retention?.days_since_signup || 0}
          </div>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">7-Day Retention</div>
          <div className="text-2xl font-bold">
            {activationData?.retention?.d7_retention ? (
              <span className="text-green-600">✓ Active</span>
            ) : (
              <span className="text-gray-400">Inactive</span>
            )}
          </div>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">30-Day Retention</div>
          <div className="text-2xl font-bold">
            {activationData?.retention?.d30_retention ? (
              <span className="text-green-600">✓ Active</span>
            ) : (
              <span className="text-gray-400">Inactive</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
