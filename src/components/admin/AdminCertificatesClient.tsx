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
  const [driveLink, setDriveLink] = useState('')
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const selectedEvent = events.find(e => e.id === selectedEventId)
  // Only show students who actually attended or registered for this event
  const eligibleStudents = selectedEvent?.registrations || []

  const handleUpload = async () => {
    if (!selectedEventId || !selectedUserId || !driveLink.trim()) {
      toast.error('Please select an event, a student, and provide a Google Drive link.')
      return
    }
    setUploading(true)
    try {
      const { error: dbError } = await supabase.from('certificates').insert({
        user_id: selectedUserId,
        event_id: selectedEventId,
        title: `Certificate: ${selectedEvent?.title}`,
        storage_path: driveLink, 
      })
      if (dbError) throw dbError

      toast.success('Certificate link attached and sent to student!')
      setSelectedUserId('')
      setDriveLink('')
    } catch (err: any) {
      toast.error(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleBulkGenerate = async () => {
    if (!selectedEventId) return toast.error('Select an event first')
    const attended = eligibleStudents.filter((r: any) => r.status === 'attended')
    if (attended.length === 0) return toast.error('No attendees found for this event.')

    setUploading(true)
    try {
      const inserts = attended.map((reg: any) => ({
        user_id: reg.user_id,
        event_id: selectedEventId,
        title: `Auto-Generated Certificate: ${selectedEvent?.title}`,
        storage_path: `https://dummy-certificate-service.com/gen/${reg.user_id}/${selectedEventId}.pdf` 
      }))
      const { error } = await supabase.from('certificates').insert(inserts)
      if (error) throw error
      toast.success(`Successfully batch-generated certificates for ${attended.length} attendees!`)
    } catch (error: any) {
      toast.error(error.message || 'Bulk generation failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar profile={profile} title={`${profile.org} Certificate Center`} />
      <main className="flex-1 px-4 md:px-6 py-6">
        <h2 className="text-xl font-bold font-display mb-6">Attach Certificates (Google Drive)</h2>
        
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

            {/* Google Drive Link */}
            {selectedUserId && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">3. Provide Google Drive Link</label>
                
                <input 
                  type="url"
                  value={driveLink}
                  onChange={(e) => setDriveLink(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                 />
              </motion.div>
            )}

            {/* Submit */}
            <div className="pt-4 flex justify-between items-center border-t border-gray-100 dark:border-gray-800">
              <Button 
                variant="secondary"
                onClick={handleBulkGenerate} 
                loading={uploading} 
                disabled={!selectedEventId}
              >
                Auto-Generate for All Attended
              </Button>
              <Button 
                variant={profile.org === 'NSS' ? 'nss' : 'yrc'} 
                onClick={handleUpload} 
                loading={uploading} 
                disabled={!selectedEventId || !selectedUserId || !driveLink.trim()}
              >
                Attach Link <Award className="h-4 w-4 ml-2" />
              </Button>
            </div>

          </div>
        </Card>
      </main>
    </div>
  )
}
