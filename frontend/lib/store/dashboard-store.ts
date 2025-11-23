/**
 * Dashboard Store (Zustand)
 * 
 * State management for dashboard data and UI.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface DashboardState {
  // Data
  insights: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  patterns: Array<{
    id: string;
    fileExtension: string;
    count: number;
    lastUsed: Date;
  }>;
  stats: {
    totalEvents: number;
    totalPatterns: number;
    insightsGenerated: number;
  } | null;
  
  // UI state
  loading: boolean;
  error: string | null;
  selectedTimeRange: '7d' | '30d' | '90d';
  
  // Actions
  setInsights: (insights: DashboardState['insights']) => void;
  setPatterns: (patterns: DashboardState['patterns']) => void;
  setStats: (stats: DashboardState['stats']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedTimeRange: (range: DashboardState['selectedTimeRange']) => void;
  reset: () => void;
}

const initialState = {
  insights: [],
  patterns: [],
  stats: null,
  loading: false,
  error: null,
  selectedTimeRange: '30d' as const,
};

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set) => ({
      ...initialState,
      
      setInsights: (insights) => set({ insights }),
      
      setPatterns: (patterns) => set({ patterns }),
      
      setStats: (stats) => set({ stats }),
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),
      
      setSelectedTimeRange: (selectedTimeRange) => set({ selectedTimeRange }),
      
      reset: () => set(initialState),
    }),
    { name: 'DashboardStore' }
  )
);
