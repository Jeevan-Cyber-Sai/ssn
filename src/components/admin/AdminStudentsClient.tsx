'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Search, Users, Shield, ShieldOff, Mail, BookOpen, Download, Megaphone, X, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/shared/TopBar'
import { Card, Badge, Input, Textarea } from '@/components/ui/index'
import Button from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import type { Profile } from '@/types/database'

export default function AdminStudentsClient({ profile, students: initial }: { profile: Profile; students: Profile[] }) {
  const [students, setStudents] = useState<Profile[]>(initial)
  const [search, setSearch] = useState('')
  const [promoting, setPromoting] = useState<string | null>(null)
  const [broadcastModal, setBroadcastModal] = useState(false)
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '' })
  const [broadcasting, setBroadcasting] = useState(false)
  const supabase = createClient()

  const filtered = students.filter(s => {
    const matchSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  const handleBroadcast = async () => {
    if (!broadcastForm.title || !broadcastForm.message) { toast.error('Please fill all fields'); return }
    setBroadcasting(true)
    try {
      const inserts = students.filter(s => s.org === profile.org).map(s => ({
        user_id: s.id,
        title: broadcastForm.title,
        message: broadcastForm.message
      }))
      const { error } = await supabase.from('notifications').insert(inserts)
      if (error) throw error
      toast.success('Announcement broadcasted to all volunteers!')
      setBroadcastModal(false)
      setBroadcastForm({ title: '', message: '' })
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setBroadcasting(false)
    }
  }

  const handleExportCSV = () => {
    const headers = 'Name,Email,Department,Year,Roll Number,Phone,Blood Group,Total Hours,Joined\n'
    const csvData = students.map(s => 
      `"${s.name}","${s.email}","${s.department}",${s.year},"${s.roll_number || ''}","${s.phone || ''}","${s.blood_group || ''}",${s.total_hours},"${formatDate(s.created_at)}"`
    ).join('\n')
    
    const blob = new Blob([headers + csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${profile.org}_Students_Report.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleToggleAdmin = async (student: Profile) => {
    const newRole = student.role === 'admin' ? 'student' : 'admin'
    if (newRole === 'admin' && !confirm(`Make ${student.name} an admin? They will have full access.`)) return
    setPromoting(student.id)
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', student.id)
    if (error) { toast.error(error.message); setPromoting(null); return }
    setStudents(prev => prev.map(s => s.id === student.id ? { ...s, role: newRole } : s))
    toast.success(`${student.name} is now ${newRole === 'admin' ? 'an admin' : 'a student'}`)
    setPromoting(null)
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar profile={profile} title={`${profile.org} Students`} />
      <main className="flex-1 px-4 md:px-6 py-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-display">{profile.org} Volunteers</h2>
            <p className="text-sm text-gray-500">{filtered.length} of {students.length} students</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => setBroadcastModal(true)} className="hidden sm:flex bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-500">
              <Megaphone className="w-4 h-4 mr-2" /> Broadcast
            </Button>
            <Button variant="secondary" onClick={handleExportCSV} className="hidden sm:flex">
              <Download className="w-4 h-4 mr-2" /> Export CSV Report
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or department..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 transition-colors" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: `Total ${profile.org}`, value: students.length, color: 'bg-gray-100 dark:bg-gray-800 text-gray-600' },
            { label: 'Recently Active', value: students.filter(s => s.total_hours > 0).length, color: 'bg-green-100 dark:bg-green-900/30 text-green-600' },
          ].map(({ label, value, color }) => (
            <Card key={label} className="p-4 text-center">
              <p className="text-2xl font-bold font-display">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label} Volunteers</p>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No students found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Department</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Org</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Joined</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Hours</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                  {filtered.map((s, i) => (
                    <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{s.name}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1"><Mail className="h-3 w-3" />{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <p className="text-gray-600 dark:text-gray-400 text-xs">{s.department}</p>
                        <p className="text-gray-400 text-xs">Year {s.year}</p>
                      </td>
                      <td className="px-4 py-3.5"><Badge variant={s.org === 'NSS' ? 'nss' : 'yrc'}>{s.org}</Badge></td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500">{formatDate(s.created_at)}</td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="font-semibold">{s.total_hours}h</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Badge variant={s.role === 'admin' ? 'warning' : 'default'}>{s.role}</Badge>
                          {s.id !== profile.id && (
                            <button onClick={() => handleToggleAdmin(s)} disabled={promoting === s.id}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                                s.role === 'admin'
                                  ? 'hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600'
                              }`}
                              title={s.role === 'admin' ? 'Remove admin' : 'Make admin'}>
                              {s.role === 'admin' ? <ShieldOff className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
      {/* Broadcast Modal */}
      <AnimatePresence>
        {broadcastModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setBroadcastModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-amber-50 dark:bg-amber-900/20">
                <h3 className="text-lg font-bold font-display flex items-center gap-2 text-amber-700 dark:text-amber-500">
                  <Megaphone className="w-5 h-5" /> Broadcast Announcement
                </h3>
                <button onClick={() => setBroadcastModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/50 text-gray-500 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  This will send an instant notification to all <span className="font-bold text-gray-900 dark:text-white">{students.filter(s=>s.org === profile.org).length} volunteers</span> in {profile.org}.
                </p>
                <Input label="Title" value={broadcastForm.title} onChange={e => setBroadcastForm(p => ({ ...p, title: e.target.value }))} placeholder="E.g., Urgent: Camp tomorrow" />
                <Textarea label="Message" value={broadcastForm.message} onChange={e => setBroadcastForm(p => ({ ...p, message: e.target.value }))} placeholder="Please assemble at..." rows={3} />
                <div className="flex gap-3 pt-4">
                  <Button variant="secondary" className="flex-1" onClick={() => setBroadcastModal(false)}>Cancel</Button>
                  <Button variant="nss" className="flex-1" loading={broadcasting} onClick={handleBroadcast}>
                    <Send className="w-4 h-4 mr-2" /> Send to All
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
