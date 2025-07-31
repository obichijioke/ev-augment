'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-md border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
      </div>
    )
  }

  const themes = [
    { name: 'light', icon: Sun, label: 'Light' },
    { name: 'dark', icon: Moon, label: 'Dark' },
    { name: 'system', icon: Monitor, label: 'System' }
  ]

  return (
    <div className="relative">
      <button
        onClick={() => {
          const currentIndex = themes.findIndex(t => t.name === theme)
          const nextIndex = (currentIndex + 1) % themes.length
          setTheme(themes[nextIndex].name)
        }}
        className="w-9 h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
        aria-label="Toggle theme"
      >
        {theme === 'light' && <Sun className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
        {theme === 'dark' && <Moon className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
        {theme === 'system' && <Monitor className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
      </button>
    </div>
  )
}
