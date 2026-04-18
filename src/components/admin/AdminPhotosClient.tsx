'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Image as ImageIcon, Upload, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/shared/TopBar'
import { Card } from '@/components/ui/index'
import Button from '@/components/ui/Button'
import type { Profile } from '@/types/database'

export default function AdminPhotosClient({ profile, events }: { profile: Profile; events: any[] }) {
  const [selectedEventId, setSelectedEventId] = useState('')
  const [driveLink, setDriveLink] = useState('')
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const handleUpload = async () => {
    if (!selectedEventId || !driveLink.trim()) {
      toast.error('Please select an event and provide a Google Drive link.')
      return
    }

    setUploading(true)

    try {
      const { error: dbError } = await supabase.from('event_photos').insert({
        event_id: selectedEventId,
        uploader_id: profile.id,
        storage_path: driveLink, // Storing the Google Drive link
      })

      if (dbError) throw dbError
      
      toast.success(`Event photo gallery link successfully attached!`)
      setDriveLink('')
    } catch (err: any) {
      console.error("Upload Error", err)
      toast.error('Failed to attach link.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar profile={profile} title={`${profile.org} Photo Gallery Uploads`} />
      <main className="flex-1 px-4 md:px-6 py-6">
        <h2 className="text-xl font-bold font-display mb-6">Attach Event Photos (Google Drive)</h2>
        
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

            {/* Google Drive Link */}
            {selectedEventId && (
               <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">2. Provide Google Drive Link</label>
                 <input 
                    type="url"
                    value={driveLink}
                    onChange={(e) => setDriveLink(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                 />
               </motion.div>
            )}

            {/* Submit */}
            <div className="pt-4 flex justify-end">
              <Button 
                variant={profile.org === 'NSS' ? 'nss' : 'yrc'} 
                onClick={handleUpload} 
                loading={uploading} 
                disabled={!selectedEventId || !driveLink.trim()}
              >
                Attach Link <ImageIcon className="h-4 w-4 ml-2" />
              </Button>
            </div>

          </div>
        </Card>
      </main>
    </div>
  )
}
