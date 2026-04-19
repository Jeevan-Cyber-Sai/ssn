import React from 'react'
import { BookOpen, FileText, HeartPulse, ShieldAlert, Download, Music } from 'lucide-react'
import { Card } from '@/components/ui/index'
import TopBar from '@/components/shared/TopBar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ResourcesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const resources = [
    {
      title: 'Emergency First-Aid Guide',
      description: 'Comprehensive guide covering CPR, treating wounds, burns, and other emergencies. Essential for all YRC volunteers.',
      icon: <HeartPulse className="h-6 w-6 text-red-500" />,
      type: 'PDF',
      url: '#',
      org: ['YRC']
    },
    {
      title: 'Blood Donation Guidelines',
      description: 'Pre and post-donation guidelines, eligibility criteria, and health tips.',
      icon: <HeartPulse className="h-6 w-6 text-red-600" />,
      type: 'Document',
      url: '#',
      org: ['YRC']
    },
    {
      title: 'NSS Song & Pledge',
      description: 'Lyrics and audio for the official NSS song and the volunteer pledge.',
      icon: <Music className="h-6 w-6 text-blue-500" />,
      type: 'Media',
      url: '#',
      org: ['NSS']
    },
    {
      title: 'Village Adoption Operations',
      description: 'Standard operating procedures and guidelines for NSS village adoption camps.',
      icon: <FileText className="h-6 w-6 text-green-500" />,
      type: 'Manual',
      url: '#',
      org: ['NSS']
    },
    {
      title: 'Disaster Management Protocol',
      description: 'Standard operating procedures for flood relief, cyclone recovery, and community evacuation.',
      icon: <ShieldAlert className="h-6 w-6 text-orange-500" />,
      type: 'Manual',
      url: '#',
      org: ['NSS', 'YRC']
    },
    {
      title: 'Volunteer Code of Conduct',
      description: 'Rules, regulations, and expected behavior during camps, drives, and regular activities.',
      icon: <FileText className="h-6 w-6 text-gray-500" />,
      type: 'PDF',
      url: '#',
      org: ['NSS', 'YRC']
    }
  ]
  
  const filteredResources = resources.filter(res => profile?.org && res.org.includes(profile.org))

  return (
    <div className="flex-1 flex flex-col">
      {profile && <TopBar profile={profile as any} title="Resources Hub" />}
      <main className="flex-1 px-4 md:px-6 py-6 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-red-500" /> Training & Resources
          </h1>
          <p className="text-gray-500 mt-1">Official materials, manuals, and protocols for volunteers.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {filteredResources.map((res, i) => (
            <Card key={i} className="p-5 flex items-start gap-4 hover:border-red-200 dark:hover:border-red-900/50 transition-colors group">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors">
                {res.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white">{res.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3 line-clamp-2">{res.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">{res.type}</span>
                  <a href={res.url} className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 group-hover:underline">
                    <Download className="h-3 w-3" /> Download
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
