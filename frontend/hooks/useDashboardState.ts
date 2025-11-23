/**
 * Dashboard State Hook
 * 
 * Convenience hook for accessing dashboard store.
 */

import { useDashboardStore } from '@/lib/store/dashboard-store';

/**
 * Hook to access dashboard state and actions.
 */
export function useDashboardState() {
  const store = useDashboardStore();
  
  return {
    // State
    insights: store.insights,
    patterns: store.patterns,
    stats: store.stats,
    loading: store.loading,
    error: store.error,
    selectedTimeRange: store.selectedTimeRange,
    
    // Actions
    setInsights: store.setInsights,
    setPatterns: store.setPatterns,
    setStats: store.setStats,
    setLoading: store.setLoading,
    setError: store.setError,
    setSelectedTimeRange: store.setSelectedTimeRange,
    reset: store.reset,
  };
}
