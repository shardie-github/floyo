'use client';

import { useEffect, useRef } from 'react';
import { trapFocus } from '@/lib/accessibility/a11y';

interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
}

export function FocusTrap({ children, active = true }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!active || !containerRef.current) return;
    
    const cleanup = trapFocus(containerRef.current);
    return cleanup;
  }, [active]);
  
  return <div ref={containerRef}>{children}</div>;
}
