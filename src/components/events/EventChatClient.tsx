'use client'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send, ArrowLeft, Users, Verified } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/shared/TopBar'
import { Card } from '@/components/ui/index'
import type { Profile, EventMessage, Event } from '@/types/database'
import { useRouter } from 'next/navigation'

export default function EventChatClient({ profile, event, initialMessages }: { profile: Profile; event: Event; initialMessages: EventMessage[] }) {
  const [messages, setMessages] = useState<EventMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const supabase = createClient()
  const scrollRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    // Scroll to bottom immediately on load
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight

    const channel = supabase
      .channel(`event_chat_${event.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_messages', filter: `event_id=eq.${event.id}` }, 
        async (payload) => {
          // the payload doesn't contain the joined 'profiles' data natively, so fetch the sender info manually 
          // or rely on a generic append.
          const { data: userData } = await supabase.from('profiles').select('name, role, org, avatar_url').eq('id', payload.new.user_id).single()
          
          const newMsg: EventMessage = {
            id: payload.new.id,
            event_id: payload.new.event_id,
            user_id: payload.new.user_id,
            content: payload.new.content,
            created_at: payload.new.created_at,
            user: userData || { name: 'Unknown User', role: 'student' }
          }
          
          setMessages(prev => [...prev, newMsg])
          // Scroll dynamically
          setTimeout(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
          }, 100)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, event.id])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending) return

    setSending(true)
    const content = input.trim()
    setInput('') // optimistic clear

    try {
      await supabase.from('event_messages').insert({
        event_id: event.id,
        user_id: profile.id,
        content: content
      })
      // the realtime listener will pick it up and append it!
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <TopBar profile={profile} title="Group Chat" />
      <main className="flex-1 flex flex-col p-4 md:p-6 max-h-[calc(100vh-64px)] overflow-hidden">
        
        {/* Chat Header */}
        <div className="flex items-center gap-3 mb-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-t-2xl shadow-sm z-10">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg font-display truncate">{event.title} - Group</h2>
            <p className="text-xs text-green-500 font-semibold flex items-center gap-1">
              <Users className="h-3 w-3" /> Event Communication Hub
            </p>
          </div>
        </div>

        {/* Message View Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 border-l border-r border-gray-200 dark:border-gray-800 p-4 space-y-6"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Users className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm font-medium">Welcome to the discussion block.</p>
              <p className="text-xs">Say hello to coordinate for this event!</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.user_id === profile.id
              const isAdmin = msg.user?.role === 'admin'
              
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Sender Name */}
                  {!isMe && (
                    <span className="text-[10px] text-gray-500 font-semibold ml-1 mb-1 flex items-center gap-1">
                      {msg.user?.name} {isAdmin && <Verified className="h-3 w-3 text-blue-500" />}
                    </span>
                  )}

                  {/* Message Bubble */}
                  <div className={`max-w-[75%] md:max-w-[60%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      isMe 
                      ? 'bg-blue-600 text-white rounded-tr-sm' 
                      : isAdmin 
                        ? 'bg-yellow-100 dark:bg-yellow-900/40 text-gray-900 dark:text-white border border-yellow-200/50 rounded-tl-sm'
                        : 'bg-white dark:bg-gray-800 text-gray-900 border border-gray-100 dark:border-gray-700 dark:text-gray-100 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSend} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 rounded-b-2xl shadow-sm flex items-center gap-2 z-10">
          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || sending}
            className="w-12 h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl transition-all"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>

      </main>
    </div>
  )
}
