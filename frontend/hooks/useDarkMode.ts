'use client'

import { useEffect, useState } from 'react'

export function useDarkMode() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    const shouldBeDark = savedTheme ? savedTheme === 'dark' : prefersDark
    setDarkMode(shouldBeDark)
    updateTheme(shouldBeDark)
  }, [])

  const updateTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const toggle = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    updateTheme(newMode)
  }

  const enable = () => {
    setDarkMode(true)
    updateTheme(true)
  }

  const disable = () => {
    setDarkMode(false)
    updateTheme(false)
  }

  return { darkMode, toggle, enable, disable }
}
