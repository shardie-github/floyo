/**
 * Memoized Button Component
 * 
 * Performance-optimized button component with React.memo.
 */

'use client';

import React, { memo } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';

export const MemoizedButton = memo(function MemoizedButton(props: ButtonProps) {
  return <Button {...props} />;
}, (prevProps, nextProps) => {
  return (
    prevProps.children === nextProps.children &&
    prevProps.variant === nextProps.variant &&
    prevProps.size === nextProps.size &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.className === nextProps.className &&
    prevProps.onClick === nextProps.onClick
  );
});
