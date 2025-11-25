'use client';

import { useEffect, useRef } from 'react';

interface ChartData {
  labels: string[];
  values: number[];
  label: string;
}

interface MetricsChartProps {
  data: ChartData;
  type?: 'line' | 'bar';
  color?: string;
}

export default function MetricsChart({ data, type = 'line', color = '#3B82F6' }: MetricsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    if (data.values.length === 0) return;

    // Calculate scales
    const maxValue = Math.max(...data.values, 1);
    const minValue = Math.min(...data.values, 0);
    const valueRange = maxValue - minValue || 1;
    const stepX = chartWidth / Math.max(data.values.length - 1, 1);
    const scaleY = chartHeight / valueRange;

    // Draw data
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.values.forEach((value, index) => {
      const x = padding + index * stepX;
      const y = height - padding - (value - minValue) * scaleY;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    ctx.fillStyle = color;
    data.values.forEach((value, index) => {
      const x = padding + index * stepX;
      const y = height - padding - (value - minValue) * scaleY;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = '#6B7280';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    data.labels.forEach((label, index) => {
      const x = padding + index * stepX;
      ctx.fillText(label, x, height - padding + 20);
    });

    // Draw value labels
    ctx.textAlign = 'right';
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const value = minValue + (valueRange / steps) * i;
      const y = height - padding - (value - minValue) * scaleY;
      ctx.fillText(Math.round(value).toString(), padding - 10, y + 4);
    }
  }, [data, type, color]);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{data.label}</h3>
      <canvas
        ref={canvasRef}
        width={600}
        height={300}
        className="w-full h-auto border border-gray-200 rounded"
      />
    </div>
  );
}
