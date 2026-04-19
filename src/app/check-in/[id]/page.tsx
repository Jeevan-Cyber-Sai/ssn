import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { processEventCheckIn } from './actions'
import Button from '@/components/ui/Button'

export default async function CheckInPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // If not logged in, pass the returnTo url so they can log in and come back to check in
    redirect(`/login?returnTo=/check-in/${params.id}`)
  }

  const { success, message } = await processEventCheckIn(params.id, user.id)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 text-center border border-gray-100 dark:border-gray-800">
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 ${success ? 'bg-emerald-100 text-emerald-500' : 'bg-red-100 text-red-500'}`}>
          {success ? <CheckCircle className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
        </div>
        
        <h1 className="text-2xl font-bold font-display mb-2 text-gray-900 dark:text-white">
          {success ? 'Check-in Complete!' : 'Check-in Failed'}
        </h1>
        
        <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          {message}
        </p>

        <Link href="/dashboard">
          <Button variant="nss" className="w-full group">
            Go to Dashboard <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
