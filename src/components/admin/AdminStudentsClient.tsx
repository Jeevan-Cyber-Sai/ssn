'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Search, Users, Shield, ShieldOff, Mail, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/shared/TopBar'
import { Card, Badge } from '@/components/ui/index'
import Button from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import type { Profile } from '@/types/database'

export default function AdminStudentsClient({ profile, students: initial }: { profile: Profile; students: Profile[] }) {
  const [students, setStudents] = useState<Profile[]>(initial)
  const [search, setSearch] = useState('')
  const [promoting, setPromoting] = useState<string | null>(null)
  const supabase = createClient()

  const filtered = students.filter(s => {
    const matchSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

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
    </div>
  )
}
