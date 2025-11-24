/**
 * Chart Components
 * 
 * Wrapper components for Recharts with consistent styling.
 */

'use client';

import * as React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

interface ChartContainerProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export function ChartContainer({ children, className, title, description }: ChartContainerProps) {
  return (
    <div className={cn('w-full', className)}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <ResponsiveContainer width="100%" height={300}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

interface ChartConfig {
  [key: string]: {
    label: string;
    color: string;
  };
}

interface LineChartProps {
  data: any[];
  dataKey: string;
  config: ChartConfig;
  className?: string;
  title?: string;
  description?: string;
}

export function ChartLine({ data, dataKey, config, className, title, description }: LineChartProps) {
  return (
    <ChartContainer className={className} title={title} description={description}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={dataKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {Object.entries(config).map(([key, { label, color }]) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={color}
            name={label}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}

interface AreaChartProps {
  data: any[];
  dataKey: string;
  config: ChartConfig;
  className?: string;
  title?: string;
  description?: string;
}

export function ChartArea({ data, dataKey, config, className, title, description }: AreaChartProps) {
  return (
    <ChartContainer className={className} title={title} description={description}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={dataKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {Object.entries(config).map(([key, { label, color }]) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={color}
            fill={color}
            fillOpacity={0.6}
            name={label}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}

interface BarChartProps {
  data: any[];
  dataKey: string;
  config: ChartConfig;
  className?: string;
  title?: string;
  description?: string;
}

export function ChartBar({ data, dataKey, config, className, title, description }: BarChartProps) {
  return (
    <ChartContainer className={className} title={title} description={description}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={dataKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {Object.entries(config).map(([key, { label, color }]) => (
          <Bar key={key} dataKey={key} fill={color} name={label} />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

interface PieChartProps {
  data: Array<{ name: string; value: number }>;
  config: ChartConfig;
  className?: string;
  title?: string;
  description?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function ChartPie({ data, config, className, title, description }: PieChartProps) {
  return (
    <ChartContainer className={className} title={title} description={description}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ChartContainer>
  );
}
