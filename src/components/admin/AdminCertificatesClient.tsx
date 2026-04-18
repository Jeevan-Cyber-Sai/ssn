'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Award, Upload, File as FileIcon, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/shared/TopBar'
import { Card } from '@/components/ui/index'
import Button from '@/components/ui/Button'
import type { Profile, Event } from '@/types/database'

export default function AdminCertificatesClient({ profile, events }: { profile: Profile; events: any[] }) {
  const [selectedEventId, setSelectedEventId] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const selectedEvent = events.find(e => e.id === selectedEventId)
  // Only show students who actually attended or registered for this event
  const eligibleStudents = selectedEvent?.registrations || []

  const handleUpload = async () => {
    if (!selectedEventId || !selectedUserId || !file) {
      toast.error('Please select an event, a student, and a PDF certificate.')
      return
    }

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${selectedUserId}_${selectedEventId}_${Math.random()}.${fileExt}`
    const filePath = `${profile.org}/${fileName}`

    try {
      // 1. Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(filePath, file)
      
      if (uploadError) throw uploadError

      // 2. Insert into DB
      const { error: dbError } = await supabase.from('certificates').insert({
        user_id: selectedUserId,
        event_id: selectedEventId,
        title: `Certificate: ${selectedEvent?.title}`,
        storage_path: filePath,
      })

      if (dbError) throw dbError

      toast.success('Certificate uploaded and sent to student!')
      setSelectedUserId('')
      setFile(null)
    } catch (err: any) {
      toast.error(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar profile={profile} title={`${profile.org} Certificate Center`} />
      <main className="flex-1 px-4 md:px-6 py-6">
        <h2 className="text-xl font-bold font-display mb-6">Upload Certificates</h2>
        
        <Card className="max-w-2xl p-6">
          <div className="space-y-5">
            {/* Event Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">1. Select Event</label>
              <select 
                value={selectedEventId} 
                onChange={e => setSelectedEventId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
              >
                <option value="">-- Choose an Event --</option>
                {events.map((ev: any) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>

            {/* Student Selection */}
            {selectedEventId && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">2. Select Student</label>
                <select 
                  value={selectedUserId} 
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                >
                  <option value="">-- Choose a Participant --</option>
                  {eligibleStudents.map((reg: any) => (
                    <option key={reg.user_id} value={reg.user_id}>
                      {reg.profile.name} ({reg.status})
                    </option>
                  ))}
                </select>
              </motion.div>
            )}

            {/* File Upload */}
            {selectedUserId && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">3. Upload PDF</label>
                
                <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <input 
                    type="file" 
                    accept=".pdf,image/*" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  {file ? (
                    <div className="flex flex-col items-center gap-2 text-green-500">
                      <CheckCircle className="h-8 w-8" />
                      <p className="font-semibold text-sm">{file.name}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Upload className="h-8 w-8 mb-1" />
                      <p className="font-medium text-sm">Click or drag certificate here</p>
                      <p className="text-xs">PDF or Image format</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Submit */}
            <div className="pt-4 flex justify-end">
              <Button 
                variant={profile.org === 'NSS' ? 'nss' : 'yrc'} 
                onClick={handleUpload} 
                loading={uploading} 
                disabled={!selectedEventId || !selectedUserId || !file}
              >
                Issue Certificate <Award className="h-4 w-4 ml-2" />
              </Button>
            </div>

          </div>
        </Card>
      </main>
    </div>
  )
}
