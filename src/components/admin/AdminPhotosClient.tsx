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
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const handleUpload = async () => {
    if (!selectedEventId || files.length === 0) {
      toast.error('Please select an event and at least one image.')
      return
    }

    setUploading(true)
    let successCount = 0

    for (const file of files) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${selectedEventId}_${Math.random()}_${Date.now()}.${fileExt}`
      const filePath = `${profile.org}/${selectedEventId}/${fileName}`

      try {
        const { error: uploadError } = await supabase.storage
          .from('event-photos')
          .upload(filePath, file)
        
        if (uploadError) throw uploadError

        const { error: dbError } = await supabase.from('event_photos').insert({
          event_id: selectedEventId,
          uploader_id: profile.id,
          storage_path: filePath,
        })

        if (!dbError) successCount++
      } catch (err: any) {
        console.error("Upload Error", err)
      }
    }

    if (successCount === files.length) {
      toast.success(`${successCount} photo(s) uploaded successfully!`)
    } else {
      toast.warning(`${successCount} out of ${files.length} uploaded. Some failed.`)
    }
    
    setFiles([])
    setUploading(false)
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar profile={profile} title={`${profile.org} Photo Gallery Uploads`} />
      <main className="flex-1 px-4 md:px-6 py-6">
        <h2 className="text-xl font-bold font-display mb-6">Upload Event Photos</h2>
        
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

            {/* File Upload */}
            {selectedEventId && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">2. Select Photos</label>
                
                <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <input 
                    type="file" 
                    accept="image/*"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  />
                  {files.length > 0 ? (
                    <div className="flex flex-col items-center gap-2 text-green-500">
                      <CheckCircle className="h-8 w-8" />
                      <p className="font-semibold text-sm">{files.length} Photo(s) Selected</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Upload className="h-8 w-8 mb-1" />
                      <p className="font-medium text-sm">Click or drag images here</p>
                      <p className="text-xs">JPG, PNG, or WEBP</p>
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
                disabled={!selectedEventId || files.length === 0}
              >
                Upload Photos <ImageIcon className="h-4 w-4 ml-2" />
              </Button>
            </div>

          </div>
        </Card>
      </main>
    </div>
  )
}
