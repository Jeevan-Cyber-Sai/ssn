'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { ArrowRight, Heart, Star, ChevronDown } from 'lucide-react'
import Button from '@/components/ui/Button'
import ThemeToggle from '@/components/shared/ThemeToggle'
import { APP_NAME } from '@/lib/constants'


const stagger: { container: Variants; item: Variants } = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.1 } } },
  item: { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-900">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Heart className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm font-display">{APP_NAME}</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/admin-login" className="hidden sm:block px-3 py-1.5 text-xs font-bold text-red-500 uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200">Admin</Link>
          <Link href="/login" className="px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-xl transition-all duration-200">Sign in</Link>
          <Link href="/register" className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 shadow-nss hover:shadow-lg focus-visible:ring-red-500 rounded-xl transition-all duration-200">Join Now <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      </nav>

      <section className="relative pt-32 pb-24 px-6 md:px-10 bg-hero-pattern">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-red-500/10 dark:bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
        <motion.div variants={stagger.container} initial="hidden" animate="show" className="max-w-4xl mx-auto text-center">
          <motion.div variants={stagger.item}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              SSN &amp; SNU Official Platform
            </span>
          </motion.div>
          <motion.h1 variants={stagger.item} className="text-5xl md:text-7xl font-extrabold font-display leading-tight mb-6">
            Serve. Lead.{' '}<span className="gradient-text">Transform.</span>
          </motion.h1>
          <motion.p variants={stagger.item} className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Join NSS or YRC and be part of a community that&apos;s building a better tomorrow — through service, compassion, and action.
          </motion.p>
          <motion.div variants={stagger.item} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register?org=NSS"><Button variant="nss" size="lg">Join NSS <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link href="/register?org=YRC"><Button variant="yrc" size="lg">Join YRC <Heart className="h-4 w-4" /></Button></Link>
          </motion.div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="flex justify-center mt-16">
          <ChevronDown className="h-5 w-5 text-gray-300 dark:text-gray-700 animate-bounce" />
        </motion.div>
      </section>



      <section className="py-20 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-4xl font-extrabold font-display mb-3">Choose Your Path</h2>
            <p className="text-gray-500 dark:text-gray-400">Two organisations. One mission. Endless impact.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-500 to-orange-500 p-8 text-white">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
              <div className="relative">
                <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-bold mb-4">NSS</span>
                <h3 className="text-2xl font-bold font-display mb-3">National Service Scheme</h3>
                <p className="text-white/80 text-sm leading-relaxed mb-6">Community development, rural outreach, literacy drives, environmental campaigns, and social awareness programs.</p>
                <ul className="space-y-2 mb-8">
                  {['Village adoption programs', 'Literacy campaigns', 'Environment drives', 'Social awareness camps'].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-white/90"><Star className="h-3.5 w-3.5 text-yellow-300 flex-shrink-0" />{item}</li>
                  ))}
                </ul>
                <Link href="/register?org=NSS">
                  <button className="bg-white text-red-600 font-bold text-sm px-6 py-3 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2">
                    Join NSS <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-900 to-red-700 p-8 text-white">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
              <div className="relative">
                <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-bold mb-4">YRC</span>
                <h3 className="text-2xl font-bold font-display mb-3">Youth Red Cross</h3>
                <p className="text-white/80 text-sm leading-relaxed mb-6">Humanitarian service, blood donation drives, first aid training, disaster relief, and health awareness campaigns.</p>
                <ul className="space-y-2 mb-8">
                  {['Blood donation drives', 'First aid training', 'Disaster relief ops', 'Health awareness'].map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-white/90"><Heart className="h-3.5 w-3.5 text-red-300 flex-shrink-0" />{item}</li>
                  ))}
                </ul>
                <Link href="/register?org=YRC">
                  <button className="bg-white text-red-800 font-bold text-sm px-6 py-3 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2">
                    Join YRC <Heart className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 md:px-10 bg-gray-50 dark:bg-gray-900/50">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold font-display mb-4">Ready to make a difference?</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Register with your college email and start your journey as a volunteer today.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 shadow-nss hover:shadow-lg rounded-xl transition-all duration-200 w-full sm:w-auto">Get Started <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/login" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 rounded-xl transition-all duration-200 w-full sm:w-auto">Already a member?</Link>
          </div>
        </motion.div>
      </section>

      <footer className="py-8 px-6 border-t border-gray-100 dark:border-gray-900 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} {APP_NAME} · SSN College &amp; SNU · Built for volunteers, by volunteers.</p>
        <div className="mt-4">
          <Link href="/admin-login" className="text-xs font-semibold text-gray-500 hover:text-red-500 transition-colors uppercase tracking-widest">
            Staff / Admin Portal
          </Link>
        </div>
      </footer>
    </div>
  )
}
