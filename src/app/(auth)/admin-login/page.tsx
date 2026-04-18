'use client'
import { useState, Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, ArrowRight, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/index'
import { APP_NAME } from '@/lib/constants'

function AdminLoginForm() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Force a clean state when accessing the Admin login page so cached student sessions don't interfere
  // imported via the top level now
  useEffect(() => {
    supabase.auth.signOut().catch(console.error)
  }, [supabase])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: signInData, error: err } = await supabase.auth.signInWithPassword({ email, password })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    if (signInData.user?.id) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', signInData.user.id).maybeSingle()
      if (!profile || profile.role !== 'admin') {
        await supabase.auth.signOut()
        setError('Access denied. You do not have administrator privileges.')
        setLoading(false)
        return
      }
    }

    toast.success('Admin access granted.')
    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-gray-900 rounded-3xl border border-gray-800 shadow-xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full" />
        
        <Link href="/" className="inline-flex items-center gap-2 mb-8 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white text-gray-900 flex items-center justify-center">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display leading-tight">{APP_NAME}</h1>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Admin Portal</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 mt-8 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 ml-1 uppercase tracking-wide">Admin Email</label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@ssn.edu.in"
              required
              className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-white focus:ring-white/20"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 ml-1 uppercase tracking-wide">Master Password</label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-white focus:ring-white/20"
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <Button type="submit" loading={loading} className="w-full mt-2 bg-white text-gray-900 hover:bg-gray-100">
            Authenticate Access <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-sm h-96 bg-gray-900 rounded-3xl skeleton" />}>
      <AdminLoginForm />
    </Suspense>
  )
}
