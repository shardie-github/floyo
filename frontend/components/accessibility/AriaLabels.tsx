/**
 * ARIA Label Components
 * 
 * Accessible components with proper ARIA attributes.
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface AriaLabelProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function AriaLabel({ id, children, className }: AriaLabelProps) {
  return (
    <label htmlFor={id} className={cn('sr-only', className)}>
      {children}
    </label>
  );
}

interface AriaLiveRegionProps {
  children: React.ReactNode;
  level?: 'polite' | 'assertive';
  className?: string;
}

export function AriaLiveRegion({ children, level = 'polite', className }: AriaLiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={level}
      aria-atomic="true"
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  );
}

interface AriaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ariaLabel: string;
  children: React.ReactNode;
}

export function AriaButton({ ariaLabel, children, ...props }: AriaButtonProps) {
  return (
    <button aria-label={ariaLabel} {...props}>
      {children}
    </button>
  );
}
