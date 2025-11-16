/**
 * Diagnostic Workflow Tracker Component
 * 
 * Initializes overlay diagnostics and cookie tracking for workflow automation.
 * This component runs on the client side to track user interactions.
 */

'use client';

import { useEffect } from 'react';
import { startOverlayTracking } from '@/lib/telemetry/overlay-diagnostics';
import { startCookieTracking } from '@/lib/telemetry/cookie-tracker';

export function DiagnosticWorkflowTracker() {
  useEffect(() => {
    // Start overlay diagnostics tracking
    startOverlayTracking();
    
    // Start cookie and indirect input tracking
    startCookieTracking();
    
    // Cleanup on unmount
    return () => {
      // Tracking cleanup is handled by the tracker instances
    };
  }, []);

  // This component doesn't render anything
  return null;
}
