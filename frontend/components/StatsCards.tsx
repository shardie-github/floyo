'use client'

import { Stats } from '@/lib/api'

interface StatsCardsProps {
  stats: Stats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Events',
      value: stats.total_events,
      color: 'bg-blue-500',
    },
    {
      title: 'Patterns Detected',
      value: stats.total_patterns,
      color: 'bg-green-500',
    },
    {
      title: 'Relationships',
      value: stats.total_relationships,
      color: 'bg-purple-500',
    },
    {
      title: 'Suggestions',
      value: stats.total_suggestions,
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <p className="text-sm font-medium text-gray-600 mb-2">{card.title}</p>
          <p className={`text-3xl font-bold ${card.color.replace('bg-', 'text-')}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}
