'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Heart, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/index'
import { APP_NAME } from '@/lib/constants'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isAdminMode, setIsAdminMode] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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

    if (isAdminMode && signInData.user?.id) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', signInData.user.id).maybeSingle()
      if (!profile || profile.role !== 'admin') {
        await supabase.auth.signOut()
        setError('Access denied. You do not have administrator privileges.')
        setLoading(false)
        return
      }
      toast.success('Admin portal access granted')
      router.push('/admin')
      router.refresh()
      return
    }

    toast.success('Welcome back!')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-card p-8">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Heart className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm font-display">{APP_NAME}</span>
        </Link>

        <h1 className="text-2xl font-extrabold font-display mb-1 text-gray-900 dark:text-white">
          {isAdminMode ? 'Admin Portal' : 'Welcome back'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          {isAdminMode ? 'Sign in with your administrator credentials' : 'Sign in to your volunteer account'}
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {isAdminMode ? 'Administrator Email' : 'Email'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={isAdminMode ? "admin@ssn.edu.in" : "you@ssn.edu.in"}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 transition-colors"
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="shake p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400"
            >
              {error}
            </motion.div>
          )}

          <Button type="submit" variant={isAdminMode ? "primary" : "nss"} size="lg" loading={loading} className="w-full mt-2">
            {isAdminMode ? 'Log in to Dashboard' : 'Sign in'} <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="mt-6 space-y-3">
          {!isAdminMode && (
            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
              New volunteer?{' '}
              <Link href="/register" className="text-red-500 hover:text-red-600 font-semibold">
                Register here
              </Link>
            </p>
          )}
          
          <div className="flex items-center justify-center pt-3 border-t border-gray-100 dark:border-gray-800">
            <button 
              onClick={() => { setIsAdminMode(!isAdminMode); setError(''); setEmail(''); setPassword(''); }}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium transition-colors"
            >
              {isAdminMode ? 'Return to Student Login' : 'Staff / Admin Portal'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
