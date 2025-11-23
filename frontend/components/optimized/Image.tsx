/**
 * Optimized Image Component
 * 
 * Wrapper around next/image with performance optimizations.
 */

'use client';

import React, { memo } from 'react';
import NextImage, { ImageProps as NextImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends NextImageProps {
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  className?: string;
}

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  loading = 'lazy',
  className,
  ...props
}: OptimizedImageProps) {
  return (
    <NextImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      loading={loading}
      className={cn('object-cover', className)}
      placeholder="blur"
      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=="
      {...props}
    />
  );
});
