import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isPast } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy · h:mm a')
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function isEventPast(date: string) {
  return isPast(new Date(date))
}

export function getSeatsPercent(filled: number, total: number) {
  if (total === 0) return 0
  return Math.min(100, Math.round((filled / total) * 100))
}

export function getSeatsColor(percent: number) {
  if (percent >= 90) return 'text-red-500'
  if (percent >= 70) return 'text-amber-500'
  return 'text-emerald-500'
}

export function validateEmail(email: string): boolean {
  const allowed = (process.env.NEXT_PUBLIC_ALLOWED_DOMAINS || 'ssn.edu.in,snu.edu.in').split(',')
  const domain = email.split('@')[1]
  return allowed.includes(domain)
}

export const NSS_GRADIENT = 'from-red-600 to-orange-500'
export const YRC_GRADIENT = 'from-red-700 to-red-400'
export const NSS_ACCENT = '#ef4444'
export const YRC_ACCENT = '#b91c1c'

export function orgGradient(org: 'NSS' | 'YRC') {
  return org === 'NSS' ? NSS_GRADIENT : YRC_GRADIENT
}

export function orgColor(org: 'NSS' | 'YRC') {
  return org === 'NSS' ? 'bg-red-500' : 'bg-red-800'
}
