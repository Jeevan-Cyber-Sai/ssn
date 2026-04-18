'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, X, Save, CalendarDays, MapPin, Users, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/shared/TopBar'
import { Card, Badge, Skeleton } from '@/components/ui/index'
import { Input, Select, Textarea } from '@/components/ui/index'
import Button from '@/components/ui/Button'
import { formatDateTime, isEventPast } from '@/lib/utils'
import type { Profile, Event } from '@/types/database'

const emptyForm = {
  title: '', description: '', event_type: 'NSS' as 'NSS' | 'YRC',
  date: '', end_date: '', location: '', seats: '50', hours: '2',
}

export default function AdminEventsClient({ profile, initialEvents }: { profile: Profile; initialEvents: Event[] }) {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editTarget, setEditTarget] = useState<Event | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const supabase = createClient()

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const openCreate = () => { setForm({ ...emptyForm, event_type: profile.org }); setEditTarget(null); setModal('create') }
  const openEdit = (ev: Event) => {
    setEditTarget(ev)
    setForm({
      title: ev.title, description: ev.description || '',
      event_type: ev.event_type, date: ev.date.slice(0, 16),
      end_date: ev.end_date?.slice(0, 16) || '', location: ev.location || '',
      seats: String(ev.seats), hours: String(ev.hours),
    })
    setModal('edit')
  }

  const handleSave = async () => {
    if (!form.title || !form.date) { toast.error('Title and date are required'); return }
    setSaving(true)

    const payload = {
      title: form.title, description: form.description || null,
      event_type: profile.org, // strictly locking to admin org
      date: form.date,
      end_date: form.end_date || null, location: form.location || null,
      seats: parseInt(form.seats) || 50, hours: parseFloat(form.hours) || 0,
    }

    if (modal === 'create') {
      const { data, error } = await supabase.from('events').insert({ ...payload, created_by: profile.id }).select().single()
      if (error) { toast.error(error.message); setSaving(false); return }
      setEvents(prev => [data as Event, ...prev])
      toast.success('Event created!')
    } else if (editTarget) {
      const { data, error } = await supabase.from('events').update(payload).eq('id', editTarget.id).select().single()
      if (error) { toast.error(error.message); setSaving(false); return }
      setEvents(prev => prev.map(e => e.id === editTarget.id ? data as Event : e))
      toast.success('Event updated!')
    }

    setModal(null)
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event? This cannot be undone.')) return
    setDeleting(id)
    const { error } = await supabase.from('events').update({ is_active: false }).eq('id', id)
    if (error) { toast.error(error.message); setDeleting(null); return }
    setEvents(prev => prev.filter(e => e.id !== id))
    toast.success('Event removed')
    setDeleting(null)
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar profile={profile} title={`Manage ${profile.org} Events`} />
      <main className="flex-1 px-4 md:px-6 py-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-display">{profile.org} Events</h2>
            <p className="text-sm text-gray-500">{events.length} total active events</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant={profile.org.toLowerCase() as any} size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Create Event
            </Button>
          </div>
        </div>

        {/* Events table */}
        <Card className="overflow-hidden">
          {events.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No events found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Event</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Org</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Seats</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                  {events.map(ev => (
                    <tr key={ev.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-900 dark:text-white">{ev.title}</p>
                        {ev.location && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{ev.location}</p>}
                      </td>
                      <td className="px-4 py-3.5"><Badge variant={ev.event_type === 'NSS' ? 'nss' : 'yrc'}>{ev.event_type}</Badge></td>
                      <td className="px-4 py-3.5">
                        <p className="text-gray-700 dark:text-gray-300">{formatDateTime(ev.date)}</p>
                        {isEventPast(ev.date) && <p className="text-xs text-gray-400">Past</p>}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium">{ev.seats_filled}/{ev.seats}</p>
                        <div className="w-16 h-1 bg-gray-100 dark:bg-gray-800 rounded-full mt-1">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, (ev.seats_filled/ev.seats)*100)}%` }} />
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => window.location.href = `/admin/events/${ev.id}/chat`}
                            title="Group Discussion"
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 hover:text-blue-600 transition-colors">
                            <Users className="h-4 w-4" />
                          </button>
                          <button onClick={() => openEdit(ev)}
                            title="Edit Event"
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(ev.id)} disabled={deleting === ev.id}
                            title="Delete Event"
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>

              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
                <h3 className="text-lg font-bold font-display">{modal === 'create' ? 'Create Event' : 'Edit Event'}</h3>
                <button onClick={() => setModal(null)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <Input label="Event Title *" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Tree Plantation Drive" />
                <Textarea label="Description" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Event details..." rows={3} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Start Date & Time *" type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)} />
                  <Input label="End Date & Time" type="datetime-local" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
                </div>
                <Input label="Location" value={form.location} onChange={e => set('location', e.target.value)} placeholder="Main Auditorium, SSN" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Max No. of Students *" type="number" value={form.seats} onChange={e => set('seats', e.target.value)} min="1" />
                  <Input label="Volunteer Hours" type="number" step="0.5" value={form.hours} onChange={e => set('hours', e.target.value)} min="0" />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" className="flex-1" onClick={() => setModal(null)}>Cancel</Button>
                  <Button variant="nss" className="flex-1" loading={saving} onClick={handleSave}>
                    <Save className="h-4 w-4" /> {modal === 'create' ? 'Create Event' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
