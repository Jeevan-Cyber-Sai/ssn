'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { User, Mail, BookOpen, Phone, Hash, CalendarDays, Clock, CheckCircle, Edit2, Save, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/shared/TopBar'
import { Card, Badge, StatCard } from '@/components/ui/index'
import Button from '@/components/ui/Button'
import { formatDate, orgGradient, cn } from '@/lib/utils'
import type { Profile, Registration } from '@/types/database'

export default function ProfileClient({ profile: initial, registrations }: { profile: Profile; registrations: Registration[] }) {
  const [profile, setProfile] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: profile.name, phone: profile.phone || '' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const attended = registrations.filter(r => r.status === 'attended').length
  const grad = orgGradient(profile.org)

  const handleSave = async () => {
    setSaving(true)
    const { data, error } = await supabase.from('profiles').update({ name: form.name, phone: form.phone || null }).eq('id', profile.id).select().single()
    if (error) { toast.error(error.message); setSaving(false); return }
    setProfile(data as Profile)
    setEditing(false)
    setSaving(false)
    toast.success('Profile updated')
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar profile={profile} title="My Profile" />
      <main className="flex-1 px-4 md:px-6 py-6 space-y-6">
        {/* Profile header card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn('w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white text-2xl font-bold font-display flex-shrink-0', grad)}>
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  {editing ? (
                    <input
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      className="text-xl font-bold font-display bg-transparent border-b-2 border-red-500 focus:outline-none text-gray-900 dark:text-white pb-0.5 w-full"
                    />
                  ) : (
                    <h2 className="text-xl font-bold font-display text-gray-900 dark:text-white">{profile.name}</h2>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={profile.org === 'NSS' ? 'nss' : 'yrc'}>{profile.org} Volunteer</Badge>
                    <Badge variant={profile.role === 'admin' ? 'warning' : 'default'}>{profile.role}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X className="h-3.5 w-3.5" /></Button>
                    <Button variant="nss" size="sm" loading={saving} onClick={handleSave}><Save className="h-3.5 w-3.5" /> Save</Button>
                  </>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => setEditing(true)}><Edit2 className="h-3.5 w-3.5" /> Edit</Button>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {[
                { icon: Mail, label: 'Email', value: profile.email },
                { icon: BookOpen, label: 'Department', value: profile.department },
                { icon: Hash, label: 'Roll Number', value: profile.roll_number || 'Not set' },
                { icon: User, label: 'Year', value: `Year ${profile.year}` },
                { icon: Phone, label: 'Phone', value: editing ? null : (profile.phone || 'Not set') },
                { icon: CalendarDays, label: 'Joined', value: formatDate(profile.created_at) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 flex-shrink-0">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    {label === 'Phone' && editing ? (
                      <input
                        value={form.phone}
                        onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+91 98765 43210"
                        className="text-sm font-medium bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-red-500 text-gray-900 dark:text-white w-full"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Events Attended" value={attended} icon={<CheckCircle className="h-4 w-4" />} color="nss" />
          <StatCard label="Total Registered" value={registrations.length} icon={<CalendarDays className="h-4 w-4" />} />
          <StatCard label="Volunteer Hours" value={`${profile.total_hours}h`} icon={<Clock className="h-4 w-4" />} color="nss" />
        </motion.div>

        {/* Registrations list */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="font-bold font-display mb-3">All Registrations</h3>
          {registrations.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-gray-400">No registrations yet. <a href="/events" className="text-red-500 font-semibold">Browse events →</a></p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {registrations.map(reg => (
                  <div key={reg.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{(reg as any).event?.title || 'Event'}</p>
                      <p className="text-xs text-gray-400">{(reg as any).event?.date ? formatDate((reg as any).event.date) : 'N/A'} · {(reg as any).event?.location || ''}</p>
                    </div>
                    <Badge variant={reg.status === 'attended' ? 'success' : 'default'}>
                      {reg.status === 'attended' ? '✓ Attended' : 'Registered'}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  )
}
