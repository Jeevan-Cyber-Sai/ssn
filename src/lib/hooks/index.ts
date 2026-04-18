'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Event, Registration, Certificate, Notification, LeaderboardEntry } from '@/types/database'

// ─── useProfile ───────────────────────────────────────────────
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    setProfile(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  return { profile, loading, refetch: fetchProfile }
}

// ─── useEvents ────────────────────────────────────────────────
export function useEvents(orgFilter?: 'NSS' | 'YRC', showPast = false) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchEvents = useCallback(async () => {
    let query = supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('date', { ascending: !showPast })

    if (orgFilter) query = query.eq('event_type', orgFilter)

    if (!showPast) {
      query = query.gte('date', new Date().toISOString())
    } else {
      query = query.lt('date', new Date().toISOString())
    }

    const { data } = await query
    setEvents(data || [])
    setLoading(false)
  }, [supabase, orgFilter, showPast])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  return { events, loading, refetch: fetchEvents }
}

// ─── useAllEvents (no date filter) ───────────────────────────
export function useAllEvents(orgFilter?: 'NSS' | 'YRC') {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchEvents = useCallback(async () => {
    let query = supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('date', { ascending: false })

    if (orgFilter) query = query.eq('event_type', orgFilter)

    const { data } = await query
    setEvents(data || [])
    setLoading(false)
  }, [supabase, orgFilter])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  return { events, loading, refetch: fetchEvents }
}

// ─── useRegistrations ─────────────────────────────────────────
export function useRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchRegistrations = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from('registrations')
      .select('*, event:events(*)')
      .eq('user_id', user.id)
      .order('registered_at', { ascending: false })

    setRegistrations(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchRegistrations() }, [fetchRegistrations])

  return { registrations, loading, refetch: fetchRegistrations }
}

// ─── useCertificates ──────────────────────────────────────────
export function useCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('certificates')
        .select('*, event:events(*)')
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false })

      setCertificates(data || [])
      setLoading(false)
    }
    fetch()
  }, [supabase])

  return { certificates, loading }
}

// ─── useNotifications ─────────────────────────────────────────
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  const fetchNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    setNotifications(data || [])
    setUnreadCount(data?.filter(n => !n.is_read).length || 0)
  }, [supabase])

  const markAllRead = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
    fetchNotifications()
  }, [supabase, fetchNotifications])

  useEffect(() => {
    fetchNotifications()
    // Real-time subscription - Use unique channel name to avoid React Strict Mode active-subscription collisions
    const channelName = `notifications-${Date.now()}-${Math.random()}`
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, fetchNotifications])

  return { notifications, unreadCount, markAllRead, refetch: fetchNotifications }
}

// ─── useLeaderboard ───────────────────────────────────────────
export function useLeaderboard(org: 'NSS' | 'YRC') {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('org', org)
        .limit(10)

      setLeaderboard(data || [])
      setLoading(false)
    }
    fetch()
  }, [supabase, org])

  return { leaderboard, loading }
}
