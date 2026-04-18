'use client'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = saved === 'dark' || (!saved && prefersDark)
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggle}
      className={cn(
        'relative w-10 h-10 rounded-xl flex items-center justify-center',
        'text-gray-500 dark:text-gray-400',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'transition-all duration-200',
        className
      )}
      aria-label="Toggle theme"
    >
      <Sun className={cn('h-4 w-4 absolute transition-all duration-300', dark ? 'opacity-0 scale-0 rotate-90' : 'opacity-100 scale-100 rotate-0')} />
      <Moon className={cn('h-4 w-4 absolute transition-all duration-300', dark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 -rotate-90')} />
    </button>
  )
}
