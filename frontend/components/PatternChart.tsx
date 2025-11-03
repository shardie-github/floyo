'use client'

import { Pattern } from '@/lib/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface PatternChartProps {
  patterns: Pattern[]
}

export function PatternChart({ patterns }: PatternChartProps) {
  const chartData = patterns
    .slice(0, 10)
    .map((pattern) => ({
      name: pattern.file_extension || 'unknown',
      count: pattern.count,
    }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Top File Types by Usage
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            stroke="#6b7280"
            className="dark:text-gray-400"
          />
          <YAxis
            stroke="#6b7280"
            className="dark:text-gray-400"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-color)',
              border: '1px solid var(--border-color)',
            }}
          />
          <Legend />
          <Bar dataKey="count" fill="#0284c7" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
