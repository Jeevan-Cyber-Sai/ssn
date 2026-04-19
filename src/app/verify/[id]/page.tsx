import { ShieldCheck, AlertTriangle, Calendar, User, FileText, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { APP_NAME } from '@/lib/constants'

// This page is completely public, we use service role to read certificate info safely
export default async function VerifyCertificatePage({ params }: { params: { id: string } }) {
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: cert, error } = await supabaseAdmin
    .from('certificates')
    .select('*, event:events(*), profile:profiles(*)')
    .eq('id', params.id).single()

  const isValid = !error && cert

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <nav className="border-b border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-900 p-4 flex items-center justify-between">
        <Link href="/" className="font-bold font-display text-lg tracking-tight">
          {APP_NAME} Verification
        </Link>
        <Link href="/" className="text-sm font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Go back
        </Link>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {isValid ? (
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
              <div className="bg-emerald-500 p-8 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
                <ShieldCheck className="w-16 h-16 mx-auto mb-4 relative z-10" />
                <h1 className="text-3xl font-extrabold font-display relative z-10">Verified Authentic</h1>
                <p className="text-emerald-50 mt-1 relative z-10">This is a valid official certificate.</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-1 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Awarded To</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-400" />
                    {cert.profile?.name || 'Unknown User'}
                  </p>
                  <p className="text-sm text-gray-400 pl-7">{cert.profile?.department} - Year {cert.profile?.year}</p>
                </div>

                <div className="space-y-1 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Certificate Details</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white flex items-start gap-2">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                    {cert.title}
                  </p>
                  {cert.event && (
                    <p className="text-sm text-gray-400 pl-7">For participating in: {cert.event.title}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    Issue Date: <span className="font-semibold text-gray-900 dark:text-gray-300">{new Date(cert.issued_at).toLocaleDateString()}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-3 break-all pt-4 border-t border-gray-50 dark:border-gray-800/50">
                    CID: {cert.id}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-10 text-center border border-gray-100 dark:border-gray-800">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white mb-2">Invalid Certificate</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                We could not find a certificate matching this verification ID. It may be forged or entered incorrectly.
              </p>
              <Link href="/">
                <button className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold hover:bg-gray-200 transition-colors">
                  Return Home
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
