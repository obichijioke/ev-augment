'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'
import { useEffect } from 'react'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  useEffect(() => {
    // Ensure our theme system takes precedence over browser preferences
    const root = document.documentElement

    // Remove any browser-applied dark mode classes
    root.style.colorScheme = 'light'

    // Listen for theme changes and update color-scheme accordingly
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const isDark = root.classList.contains('dark')
          root.style.colorScheme = isDark ? 'dark' : 'light'
        }
      })
    })

    observer.observe(root, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
