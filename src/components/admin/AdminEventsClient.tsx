'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, X, Save, CalendarDays, MapPin, Users, Clock, QrCode, Copy, Image as ImageIcon, Camera, Loader2, CheckCircle, RefreshCcw, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/shared/TopBar'
import { Card, Badge, Skeleton } from '@/components/ui/index'
import { Input, Select, Textarea } from '@/components/ui/index'
import Button from '@/components/ui/Button'
import { formatDateTime, isEventPast, cn } from '@/lib/utils'
import type { Profile, Event, Registration } from '@/types/database'

const emptyForm = {
  title: '', description: '', event_type: 'NSS' as 'NSS' | 'YRC',
  date: '', end_date: '', location: '', seats: '50', hours: '2',
  image_url: '', tags: ''
}

export default function AdminEventsClient({ profile, initialEvents }: { profile: Profile; initialEvents: Event[] }) {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editTarget, setEditTarget] = useState<Event | null>(null)
  
  // Modals
  const [qrTarget, setQrTarget] = useState<Event | null>(null)
  const [kioskMode, setKioskMode] = useState(false)
  
  // Roster & Waitlist state
  const [rosterTarget, setRosterTarget] = useState<Event | null>(null)
  const [roster, setRoster] = useState<any[]>([])
  const [loadingRoster, setLoadingRoster] = useState(false)

  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
      image_url: ev.image_url || '', tags: (ev.tags || []).join(', ')
    })
    setModal('edit')
  }

  const cloneEvent = (ev: Event) => {
    setEditTarget(null)
    setForm({
      title: ev.title + ' (Copy)', description: ev.description || '',
      event_type: ev.event_type, date: ev.date.slice(0, 16),
      end_date: ev.end_date?.slice(0, 16) || '', location: ev.location || '',
      seats: String(ev.seats), hours: String(ev.hours),
      image_url: ev.image_url || '', tags: (ev.tags || []).join(', ')
    })
    setModal('create')
    toast.success('Event settings cloned. Ready to publish!')
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const ext = file.name.split('.').pop()
      const filePath = `events/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('event-photos').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('event-photos').getPublicUrl(filePath)
      setForm(prev => ({ ...prev, image_url: publicUrl }))
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message)
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    if (!form.title || !form.date) { toast.error('Title and date are required'); return }
    setSaving(true)

    const payload = {
      title: form.title, description: form.description || null,
      event_type: profile.org,
      date: form.date,
      end_date: form.end_date || null, location: form.location || null,
      seats: parseInt(form.seats) || 50, hours: parseFloat(form.hours) || 0,
      image_url: form.image_url || null,
      tags: form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : []
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

  const fetchRoster = async (ev: Event) => {
    setRosterTarget(ev)
    setLoadingRoster(true)
    const { data, error } = await supabase.from('registrations')
      .select('*, profile:profiles(name, department, roll_number)')
      .eq('event_id', ev.id)
      .order('registered_at', { ascending: true })
    if (!error && data) setRoster(data)
    setLoadingRoster(false)
  }

  const toggleAttendance = async (regId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'attended' ? 'registered' : 'attended'
    await supabase.from('registrations').update({ status: newStatus }).eq('id', regId)
    setRoster(prev => prev.map(r => r.id === regId ? { ...r, status: newStatus } : r))
  }

  const overrideWaitlist = async (regId: string) => {
    await supabase.from('registrations').update({ status: 'registered' }).eq('id', regId)
    setRoster(prev => prev.map(r => r.id === regId ? { ...r, status: 'registered' } : r))
    toast.success('Student moved to Registered')
  }

  return (
    <div className="flex-1 flex flex-col relative h-screen">
      <TopBar profile={profile} title={`Manage ${profile.org} Events`} />
      <main className="flex-1 px-4 md:px-6 py-6 space-y-6 overflow-auto">

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
                        <div className="flex items-center gap-2">
                           {ev.image_url && <img src={ev.image_url} alt="Cover" className="w-8 h-8 rounded-md object-cover flex-shrink-0" />}
                           <div>
                             <p className="font-semibold text-gray-900 dark:text-white flex items-center justify-between">{ev.title}</p>
                             {ev.location && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{ev.location}</p>}
                           </div>
                        </div>
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
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => fetchRoster(ev)}
                            title="Manual Roster & Attendance"
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button onClick={() => { setQrTarget(ev); setKioskMode(false) }}
                            title="Check-In QR"
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-500 hover:text-emerald-600 transition-colors">
                            <QrCode className="h-4 w-4" />
                          </button>
                          <button onClick={() => router.push(`/admin/events/${ev.id}/chat`)}
                            title="Group Discussion"
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 hover:text-blue-600 transition-colors">
                            <Users className="h-4 w-4" />
                          </button>
                          <button onClick={() => cloneEvent(ev)}
                            title="Clone Event"
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-500 transition-colors">
                            <Copy className="h-3.5 w-3.5" />
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

      {/* Roster Modal */}
      <AnimatePresence>
        {rosterTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
             onClick={() => setRosterTarget(null)}>
             <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25 }}
               className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
               onClick={e => e.stopPropagation()}>
               <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-10 flex-shrink-0">
                 <div>
                   <h3 className="text-lg font-bold font-display text-gray-900 dark:text-white">Event Roster</h3>
                   <p className="text-sm text-gray-500">{rosterTarget.title}</p>
                 </div>
                 <button onClick={() => setRosterTarget(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                   <X className="h-5 w-5" />
                 </button>
               </div>

               <div className="flex-1 overflow-y-auto p-0">
                 {loadingRoster ? (
                   <div className="p-12 text-center text-gray-500"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                 ) : roster.length === 0 ? (
                   <div className="p-12 text-center text-gray-500">No registrations yet.</div>
                 ) : (
                   <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 uppercase sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left">Student</th>
                          <th className="px-6 py-3 text-left">Status</th>
                          <th className="px-6 py-3 text-right">Attendance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {roster.map(r => (
                          <tr key={r.id}>
                            <td className="px-6 py-3">
                              <p className="font-semibold">{r.profile.name}</p>
                              <p className="text-xs text-gray-500">{r.profile.department} · {r.profile.roll_number}</p>
                            </td>
                            <td className="px-6 py-3">
                              <Badge variant={r.status === 'attended' ? 'success' : r.status === 'waitlisted' ? 'warning' : 'default'}>{r.status}</Badge>
                            </td>
                            <td className="px-6 py-3 text-right">
                              {r.status === 'waitlisted' ? (
                                <button onClick={() => overrideWaitlist(r.id)} className="text-xs px-3 py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-md font-bold transition-colors">
                                  Allow Entry
                                </button>
                              ) : (
                                <button onClick={() => toggleAttendance(r.id, r.status)} className={cn("text-xs px-3 py-1.5 rounded-md font-bold transition-colors", r.status === 'attended' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700")}>
                                  {r.status === 'attended' ? 'Revoke' : 'Mark Attended'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                 )}
               </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}>

              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
                <h3 className="text-lg font-bold font-display">{modal === 'create' ? 'Create Event' : 'Edit Event'}</h3>
                <button onClick={() => setModal(null)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto">
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                
                {/* Image Upload Area */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 cursor-pointer overflow-hidden relative group hover:bg-gray-100 dark:hover:bg-gray-900"
                >
                  {uploadingImage ? (
                    <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                  ) : form.image_url ? (
                    <>
                      <img src={form.image_url} alt="Cover" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <p className="text-white text-sm font-semibold flex items-center gap-2"><Edit2 className="h-4 w-4" /> Change Image</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-gray-500">Upload Event Flyer / Thumbnail</p>
                    </div>
                  )}
                </div>

                <Input label="Event Title *" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Tree Plantation Drive" />
                <Textarea label="Description" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Event details..." rows={3} />
                <Input label="Tags (comma separated)" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="Seminar, Urgent, Food" />
                
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

      {/* QR Code Modals (Standard & Kiosk) */}
      <AnimatePresence>
        {qrTarget && !kioskMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
             onClick={() => setQrTarget(null)}>
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
               className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center relative"
               onClick={e => e.stopPropagation()}>
               <button onClick={() => setQrTarget(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white">
                 <X className="h-5 w-5" />
               </button>
               <h3 className="text-xl font-bold font-display mb-1">Scan to Check-In</h3>
               <p className="text-sm text-gray-500 mb-6 truncate">{qrTarget.title}</p>
               
               <div className="bg-white p-4 rounded-2xl mx-auto inline-block border border-gray-100 shadow-sm mb-6 relative group">
                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/check-in/${qrTarget.id}` : '')}`} 
                      alt="Event Check-in QR" className="w-48 h-48 group-hover:blur-sm transition-all"
                      crossOrigin="anonymous" />
                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setKioskMode(true)} className="bg-black/80 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2">
                       Enter Kiosk Mode <ArrowRight className="h-3 w-3" />
                    </button>
                 </div>
               </div>
               
               <p className="text-xs text-gray-500 dark:text-gray-400">
                 Ask students to scan this code with their phone camera to log attendance.
               </p>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {qrTarget && kioskMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center p-8"
             >
             <button onClick={() => setKioskMode(false)} className="absolute top-8 right-8 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors text-white">
               <X className="h-6 w-6" />
             </button>
             
             <div className="text-center max-w-2xl">
               <Badge className="mb-4 bg-white/20 text-white border-none text-lg py-1.5 px-4 animate-pulse">Live Attendee Scanner Mode</Badge>
               <h1 className="text-5xl md:text-7xl font-extrabold font-display mb-2 break-words leading-tight">{qrTarget.title}</h1>
               <p className="text-xl text-gray-400 mb-12">Scan the QR code below using your phone camera to instantly check in.</p>
               
               <div className="bg-white p-8 rounded-[3rem] mx-auto inline-block shadow-[0_0_100px_rgba(255,255,255,0.2)]">
                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/check-in/${qrTarget.id}` : '')}`} 
                      alt="Event Check-in QR" className="w-[30vh] h-[30vh] md:w-[40vh] md:h-[40vh]"
                      crossOrigin="anonymous" />
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
