'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { User, Mail, BookOpen, Phone, Hash, CalendarDays, Clock, CheckCircle, Edit2, Save, X, Award, Shield, Zap, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/shared/TopBar'
import { Card, Badge, StatCard } from '@/components/ui/index'
import Button from '@/components/ui/Button'
import { formatDate, orgGradient, cn } from '@/lib/utils'
import type { Profile, Registration } from '@/types/database'

export default function ProfileClient({ profile: initial, registrations }: { profile: Profile; registrations: Registration[] }) {
  const [profile, setProfile] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: profile.name, phone: profile.phone || '', blood_group: profile.blood_group || '' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const idCardRef = useRef<HTMLDivElement>(null)

  const attended = registrations.filter(r => r.status === 'attended')
  const grad = orgGradient(profile.org)

  const handleSave = async () => {
    setSaving(true)
    const { data, error } = await supabase.from('profiles').update({ name: form.name, phone: form.phone || null, blood_group: form.blood_group || null }).eq('id', profile.id).select().single()
    if (error) { toast.error(error.message); setSaving(false); return }
    setProfile(data as Profile)
    setEditing(false)
    setSaving(false)
    toast.success('Profile updated')
  }

  // Gamification logic
  const getBadges = () => {
    const badges = []
    if (profile.total_hours >= 10) badges.push({ title: 'Bronze Contributor', icon: Award, color: 'text-amber-600 bg-amber-100', desc: '10+ Hours Volunteered' })
    if (profile.total_hours >= 50) badges.push({ title: 'Silver Sentinel', icon: Shield, color: 'text-gray-400 bg-gray-100', desc: '50+ Hours Volunteered' })
    if (profile.total_hours >= 100) badges.push({ title: 'Gold Champion', icon: Zap, color: 'text-yellow-500 bg-yellow-100', desc: '100+ Hours Volunteered' })
    return badges
  }

  const badges = getBadges()

  return (
    <div className="flex-1 flex flex-col">
      <TopBar profile={profile} title="My Profile" />
      <main className="flex-1 px-4 md:px-6 py-6 space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Info & Editing */}
          <div className="lg:col-span-2 space-y-6">
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

                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  {[
                    { icon: Mail, label: 'Email', value: profile.email },
                    { icon: BookOpen, label: 'Department', value: profile.department },
                    { icon: Hash, label: 'Roll Number', value: profile.roll_number || 'Not set' },
                    { icon: User, label: 'Year', value: `Year ${profile.year}` },
                    { icon: Phone, label: 'Phone', value: editing ? null : (profile.phone || 'Not set'), field: 'phone' },
                    { icon: Zap, label: 'Blood Group', value: editing ? null : (profile.blood_group || 'Not set'), field: 'blood_group' },
                  ].map(({ icon: Icon, label, value, field }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 flex-shrink-0">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-400">{label}</p>
                        {editing && field ? (
                          <input
                            value={(form as any)[field]}
                            onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                            placeholder={`Enter ${label}`}
                            className="text-sm font-medium bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-red-500 text-gray-900 dark:text-white w-full py-0.5"
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

            {/* Achievements & Badges */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h3 className="font-bold font-display mb-3">Achievements</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {badges.length > 0 ? badges.map((badge, i) => (
                  <Card key={i} className="p-4 flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${badge.color}`}>
                      <badge.icon className="h-6 w-6" />
                    </div>
                    <h4 className="font-bold text-sm">{badge.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{badge.desc}</p>
                  </Card>
                )) : (
                  <div className="col-span-3 p-6 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                    <p className="text-gray-500 text-sm">Attend your first 10 hours of events to unlock your first badge!</p>
                  </div>
                )}
              </div>
            </motion.div>
            
            {/* Timeline */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h3 className="font-bold font-display mb-3">Volunteer Timeline</h3>
              <Card className="p-6">
                {attended.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No events attended yet.</p>
                ) : (
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-gray-700 before:to-transparent">
                    {attended.sort((a,b) => new Date((b as any).event?.date).getTime() - new Date((a as any).event?.date).getTime()).map(reg => (
                       <div key={reg.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-gray-900 bg-emerald-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-1">
                               <div className="font-bold text-gray-900 dark:text-white text-sm">{(reg as any).event?.title}</div>
                               <div className="text-xs font-bold text-emerald-500">+{(reg as any).event?.hours}h</div>
                            </div>
                            <div className="text-xs text-gray-500">
                               {formatDate((reg as any).event?.date)} · {(reg as any).event?.location}
                            </div>
                          </div>
                       </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>

          </div>

          {/* Right Column: ID Card & Stats */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 gap-4">
              <StatCard label="Events Attended" value={attended.length} icon={<CheckCircle className="h-4 w-4" />} color="nss" />
              <StatCard label="Total Registered" value={registrations.length} icon={<CalendarDays className="h-4 w-4" />} />
              <StatCard label="Volunteer Hours" value={`${profile.total_hours}h`} icon={<Clock className="h-4 w-4" />} color="nss" />
            </motion.div>

            {/* Digital ID Card */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex justify-between items-end mb-3">
                <h3 className="font-bold font-display">Digital ID Box</h3>
                <button onClick={() => window.print()} className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1">
                  <Download className="h-3 w-3" /> Save
                </button>
              </div>
              
              <div ref={idCardRef} className="relative overflow-hidden rounded-2xl shadow-xl border border-white/20 aspect-[6/10] max-w-sm mx-auto bg-white dark:bg-gray-900 print:shadow-none print:border-gray-200">
                {/* ID Header Pattern */}
                <div className={cn("h-32 absolute top-0 w-full bg-gradient-to-br", grad)}>
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                </div>
                
                <div className="relative pt-16 px-6 pb-6 flex flex-col items-center h-full">
                  <div className={cn('w-24 h-24 rounded-full border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-800 shadow-md flex items-center justify-center z-10 overflow-hidden mb-4')}>
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className={cn("text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br", grad)}>
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <h2 className="text-xl font-bold font-display text-gray-900 dark:text-white mb-1 uppercase tracking-wider">{profile.name}</h2>
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-6">{profile.department}</p>
                  
                  <div className="w-full space-y-3 mt-auto">
                     <div className="flex justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-800">
                       <span className="text-gray-500">ID Number</span>
                       <span className="font-bold font-mono">{profile.id.substring(0,8).toUpperCase()}</span>
                     </div>
                     <div className="flex justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-800">
                       <span className="text-gray-500">Blood Group</span>
                       <span className="font-bold text-red-500">{profile.blood_group || 'N/A'}</span>
                     </div>
                     <div className="flex justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-800">
                       <span className="text-gray-500">Organization</span>
                       <span className="font-bold">{profile.org}</span>
                     </div>
                  </div>

                  {/* Mock QR Box at bottom */}
                  <div className="mt-6 p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=volunteer:${profile.id}`} alt="QR" className="w-16 h-16 opacity-80" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </main>
    </div>
  )
}
