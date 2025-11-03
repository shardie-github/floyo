'use client'

import { useDarkMode } from '@/hooks/useDarkMode'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'

export function DarkModeToggle() {
  const { darkMode, toggle } = useDarkMode()

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Toggle dark mode"
    >
      {darkMode ? (
        <SunIcon className="w-5 h-5" />
      ) : (
        <MoonIcon className="w-5 h-5" />
      )}
    </button>
  )
}
