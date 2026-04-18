'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ArrowRight, ArrowLeft, Check, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/index'
import { DEPARTMENTS, YEARS, APP_NAME, ALLOWED_DOMAINS, NSS_DESCRIPTION, YRC_DESCRIPTION } from '@/lib/constants'
import { registerAdminBypassProfile } from './actions'

function RegisterForm() {
  const searchParams = useSearchParams()
  const preselectedOrg = searchParams.get('org') as 'NSS' | 'YRC' | null
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    department: '', year: '1', rollNumber: '', phone: '',
    org: preselectedOrg || '' as 'NSS' | 'YRC' | '',
  })

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const validateStep1 = () => {
    if (!form.name.trim()) return 'Full name is required'
    if (!form.email) return 'Email is required'
    const domain = form.email.split('@')[1]
    if (!ALLOWED_DOMAINS.includes(domain)) return `Only ${ALLOWED_DOMAINS.join(', ')} emails are allowed`
    if (form.password.length < 8) return 'Password must be at least 8 characters'
    if (form.password !== form.confirmPassword) return 'Passwords do not match'
    if (!form.department) return 'Department is required'
    return null
  }

  const validateStep2 = () => {
    if (!form.org) return 'Please select an organisation'
    return null
  }

  const handleNext = () => {
    setError('')
    if (step === 1) {
      const err = validateStep1()
      if (err) { setError(err); return }
    }
    if (step === 2) {
      const err = validateStep2()
      if (err) { setError(err); return }
    }
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    if (!confirmed) { setError('Please confirm your organisation selection'); return }
    setLoading(true)
    setError('')
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('YOUR_PROJECT_ID')) {
      setError('System Error: Database connection is not configured. Please add your actual Supabase URL and Keys to the .env.local file.')
      setLoading(false)
      return
    }

    try {
      await registerAdminBypassProfile({
        name: form.name.trim(),
        email: form.email,
        department: form.department,
        year: parseInt(form.year),
        roll_number: form.rollNumber || null,
        phone: form.phone || null,
        org: form.org,
        org_locked: true,
        role: 'student',
      }, form.password)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
      return
    }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password
    })

    if (signInErr) {
      setError('Account created securely, but automatic sign-in failed. Please log in manually.')
      setLoading(false)
      return
    }

    toast.success(`Welcome to ${form.org}! Your account has been created.`)
    router.push('/dashboard')
  }

  const steps = ['Your Details', 'Choose Organisation', 'Confirm']

  return (
    <div className="w-full max-w-lg">
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-card p-8">
        <Link href="/" className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Heart className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm font-display">{APP_NAME}</span>
        </Link>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((label, i) => {
            const n = i + 1
            const done = step > n
            const active = step === n
            return (
              <div key={n} className="flex items-center gap-2 flex-1">
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${done ? 'bg-emerald-500 text-white' : active ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}>
                  {done ? <Check className="h-3.5 w-3.5" /> : n}
                </div>
                {!active && !done && <span className="text-xs text-gray-400 hidden sm:block">{label}</span>}
                {(active || done) && <span className={`text-xs font-semibold hidden sm:block ${active ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{label}</span>}
                {i < steps.length - 1 && <div className={`flex-1 h-px ${done ? 'bg-emerald-300' : 'bg-gray-100 dark:bg-gray-800'}`} />}
              </div>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Details */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="text-xl font-bold font-display">Your Details</h2>
              <Input label="Full Name" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Arjun Sharma" required />
              <Input label="College Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@ssn.edu.in" required />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Password" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 8 chars" required />
                <Input label="Confirm Password" type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="Repeat password" required />
              </div>
              <Select label="Department" value={form.department} onChange={e => set('department', e.target.value)} required>
                <option value="">Select department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Year" value={form.year} onChange={e => set('year', e.target.value)}>
                  {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
                </Select>
                <Input label="Roll Number (optional)" value={form.rollNumber} onChange={e => set('rollNumber', e.target.value)} placeholder="21CS001" />
              </div>
              <Input label="Phone (optional)" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
            </motion.div>
          )}

          {/* Step 2: Org selection */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="text-xl font-bold font-display">Choose Your Organisation</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">This decision is permanent. Choose wisely.</p>
              <div className="space-y-3">
                {(['NSS', 'YRC'] as const).map(org => (
                  <button key={org} type="button" onClick={() => set('org', org)}
                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${form.org === org
                        ? org === 'NSS' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-red-800 bg-red-900/10 dark:bg-red-900/20'
                        : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                      }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className={`px-2.5 py-1 rounded-lg text-xs font-bold text-white ${org === 'NSS' ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-red-900 to-red-700'}`}>
                        {org}
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${form.org === org ? 'border-red-500 bg-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}>
                        {form.org === org && <Check className="h-3 w-3 text-white" />}
                      </div>
                    </div>
                    <h3 className="font-bold font-display mb-1">
                      {org === 'NSS' ? 'National Service Scheme' : 'Youth Red Cross'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      {org === 'NSS' ? NSS_DESCRIPTION : YRC_DESCRIPTION}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="text-xl font-bold font-display">Confirm Your Registration</h2>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-semibold">{form.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-semibold">{form.email}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Department</span><span className="font-semibold text-right max-w-[60%]">{form.department}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Year</span><span className="font-semibold">Year {form.year}</span></div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Organisation</span>
                  <span className={`font-bold ${form.org === 'NSS' ? 'text-red-500' : 'text-red-800'}`}>{form.org}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">This cannot be changed</p>
                    <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                      Once you join <strong>{form.org}</strong>, your organisation cannot be changed under any circumstances. This is a permanent decision.
                    </p>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-red-500 cursor-pointer" />
                <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  I understand that my organisation selection (<strong>{form.org}</strong>) is permanent and cannot be changed after registration.
                </span>
              </label>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            {error}
          </motion.div>
        )}

        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <Button variant="secondary" onClick={() => setStep(s => s - 1)} className="flex-1">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          )}
          {step < 3 ? (
            <Button variant="nss" onClick={handleNext} className="flex-1">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="nss" onClick={handleSubmit} loading={loading} className="flex-1">
              Create Account <Check className="h-4 w-4" />
            </Button>
          )}
        </div>

        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-6">
          Already registered?{' '}
          <Link href="/login" className="text-red-500 hover:text-red-600 font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-lg h-96 bg-white dark:bg-gray-900 rounded-3xl skeleton" />}>
      <RegisterForm />
    </Suspense>
  )
}
