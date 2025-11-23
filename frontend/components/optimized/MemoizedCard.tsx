/**
 * Memoized Card Component
 * 
 * Performance-optimized card component with React.memo.
 */

'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MemoizedCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const MemoizedCard = memo(function MemoizedCard({
  title,
  description,
  children,
  footer,
  className,
}: MemoizedCardProps) {
  return (
    <Card className={cn(className)}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.title === nextProps.title &&
    prevProps.description === nextProps.description &&
    prevProps.className === nextProps.className &&
    prevProps.children === nextProps.children &&
    prevProps.footer === nextProps.footer
  );
});
