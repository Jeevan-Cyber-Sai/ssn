'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Award, Download, Eye, X, Calendar, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/shared/TopBar'
import { Card, Badge, EmptyState } from '@/components/ui/index'
import Button from '@/components/ui/Button'
import { formatDate, orgGradient, cn } from '@/lib/utils'
import type { Profile, Certificate } from '@/types/database'

export default function CertificatesClient({ profile, certificates }: { profile: Profile; certificates: Certificate[] }) {
  const [preview, setPreview] = useState<Certificate | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const supabase = createClient()
  const grad = orgGradient(profile.org)

  const handleDownload = async (cert: Certificate) => {
    setDownloading(cert.id)
    try {
      const { data, error } = await supabase.storage.from('certificates').download(cert.storage_path)
      if (error) throw error
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${cert.title.replace(/\s+/g, '_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Certificate downloaded!')
    } catch {
      toast.error('Failed to download certificate')
    }
    setDownloading(null)
  }

  const getPreviewUrl = async (cert: Certificate) => {
    const { data } = await supabase.storage.from('certificates').createSignedUrl(cert.storage_path, 60)
    return data?.signedUrl || null
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar profile={profile} title="Certificates" />
      <main className="flex-1 px-4 md:px-6 py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className={cn('relative overflow-hidden rounded-2xl bg-gradient-to-r p-6 text-white', grad)}>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10">
              <Award className="h-24 w-24" />
            </div>
            <div className="relative">
              <h2 className="text-xl font-bold font-display mb-1">My Certificates</h2>
              <p className="text-white/70 text-sm">{certificates.length} certificate{certificates.length !== 1 ? 's' : ''} earned</p>
            </div>
          </div>
        </motion.div>

        {certificates.length === 0 ? (
          <EmptyState
            icon={<Award className="h-7 w-7" />}
            title="No certificates yet"
            description="Attend events to earn certificates. They'll appear here once issued by your coordinator."
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {certificates.map((cert, i) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Card hover className="p-5 group">
                  {/* Certificate visual */}
                  <div className={cn('relative h-32 rounded-xl bg-gradient-to-br mb-4 flex items-center justify-center overflow-hidden', grad)}>
                    <div className="absolute inset-0 opacity-10">
                      {[...Array(6)].map((_, j) => (
                        <div key={j} className="absolute w-16 h-16 border-2 border-white rounded-full"
                          style={{ top: `${(j % 3) * 40 - 10}%`, left: `${Math.floor(j / 3) * 60 - 10}%`, opacity: 0.3 }} />
                      ))}
                    </div>
                    <div className="relative text-center">
                      <Award className="h-10 w-10 text-white/80 mx-auto mb-1" />
                      <p className="text-white/90 text-xs font-semibold">Certificate of Participation</p>
                    </div>
                  </div>

                  <h3 className="font-bold font-display text-gray-900 dark:text-white text-sm leading-tight mb-2">{cert.title}</h3>

                  {(cert as any).event && (
                    <p className="text-xs text-gray-500 mb-1">{(cert as any).event.title}</p>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                    <Calendar className="h-3 w-3" />
                    Issued {formatDate(cert.issued_at)}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => setPreview(cert)}
                    >
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </Button>
                    <Button
                      variant={profile.org === 'NSS' ? 'nss' : 'yrc'}
                      size="sm"
                      className="flex-1"
                      loading={downloading === cert.id}
                      onClick={() => handleDownload(cert)}
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* Preview Modal */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setPreview(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className={cn('relative h-48 bg-gradient-to-br flex flex-col items-center justify-center', grad)}>
                <div className="absolute inset-0 opacity-10">
                  {[...Array(8)].map((_, j) => (
                    <div key={j} className="absolute w-24 h-24 border-2 border-white rounded-full"
                      style={{ top: `${(j % 4) * 30 - 5}%`, left: `${Math.floor(j / 4) * 100 - 10}%`, opacity: 0.2 }} />
                  ))}
                </div>
                <button onClick={() => setPreview(null)}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors">
                  <X className="h-4 w-4" />
                </button>
                <Award className="h-14 w-14 text-white/80 mb-2 relative z-10" />
                <p className="text-white/80 text-xs font-semibold relative z-10">Certificate of Participation</p>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-bold font-display text-gray-900 dark:text-white mb-1">{preview.title}</h3>
                {(preview as any).event && (
                  <p className="text-sm text-gray-500 mb-1">{(preview as any).event.title}</p>
                )}
                <p className="text-sm text-gray-400 mb-6">Issued on {formatDate(preview.issued_at)}</p>

                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1" onClick={() => setPreview(null)}>Close</Button>
                  <Button
                    variant={profile.org === 'NSS' ? 'nss' : 'yrc'}
                    className="flex-1"
                    loading={downloading === preview.id}
                    onClick={() => handleDownload(preview)}
                  >
                    <Download className="h-4 w-4" /> Download PDF
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
