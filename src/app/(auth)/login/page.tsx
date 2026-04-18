'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/index'
import { APP_NAME } from '@/lib/constants'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/dashboard'
  
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.signInWithPassword({ email, password })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    toast.success('Welcome back!')
    router.push(returnTo)
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-card p-8">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Heart className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm font-display">{APP_NAME}</span>
        </Link>

        <div>
          <h1 className="text-2xl font-bold font-display mb-2">Welcome back</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Sign in to your volunteer account
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@ssn.edu.in"
                required
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5 ml-1">
                <Link href="#" className="text-xs font-semibold text-red-500 hover:text-red-600">
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <Button type="submit" loading={loading} className="w-full mt-2" variant="nss">
              Sign in <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <Link href="/register" className="text-red-500 hover:text-red-600 font-semibold transition-colors">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-sm h-[400px] bg-white dark:bg-gray-900 rounded-3xl skeleton" />}>
      <LoginForm />
    </Suspense>
  )
}
