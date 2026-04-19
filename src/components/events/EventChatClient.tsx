'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ArrowLeft, Users, Verified, Image as ImageIcon, Pin, PinOff, Loader2, Trash2, Reply, Smile, X, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/shared/TopBar'
import { Card } from '@/components/ui/index'
import type { Profile, EventMessage, Event } from '@/types/database'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function EventChatClient({ profile, event, initialMessages }: { profile: Profile; event: Event; initialMessages: EventMessage[] }) {
  const [messages, setMessages] = useState<EventMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  
  // New States
  const [activeTab, setActiveTab] = useState<'general' | 'announcements'>('general')
  const [replyTo, setReplyTo] = useState<EventMessage | null>(null)
  
  // Mentions State
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [participants, setParticipants] = useState<{name: string, id: string}[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    // Fetch participants for mentions
    const fetchParticipants = async () => {
      const { data } = await supabase.from('registrations').select('user:profiles(id, name)').eq('event_id', event.id)
      if (data) {
        const unique = new Map()
        data.forEach((d: any) => { if (d.user) unique.set(d.user.id, d.user) })
        setParticipants(Array.from(unique.values()))
      }
    }
    fetchParticipants()

    // Scroll to bottom immediately on load
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight

    const channel = supabase
      .channel(`event_chat_${event.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_messages', filter: `event_id=eq.${event.id}` }, 
        async (payload) => {
          const { data: userData } = await supabase.from('profiles').select('name, role, org, avatar_url').eq('id', payload.new.user_id).single()
          
          const newMsg: EventMessage = {
            id: payload.new.id,
            event_id: payload.new.event_id,
            user_id: payload.new.user_id,
            content: payload.new.content,
            image_url: payload.new.image_url,
            is_pinned: payload.new.is_pinned,
            channel: payload.new.channel || 'general',
            reply_to_id: payload.new.reply_to_id,
            reactions: payload.new.reactions || {},
            is_deleted: payload.new.is_deleted || false,
            created_at: payload.new.created_at,
            user: userData || { name: 'Unknown User', role: 'student' }
          }
          
          setMessages(prev => {
            // Prevent duplicates from realtime
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          
          setTimeout(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
          }, 100)
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'event_messages', filter: `event_id=eq.${event.id}` },
        (payload) => {
          setMessages(prev => prev.map(m => m.id === payload.new.id ? { 
            ...m, 
            is_pinned: payload.new.is_pinned,
            reactions: payload.new.reactions || {},
            is_deleted: payload.new.is_deleted,
            content: payload.new.content,
            image_url: payload.new.image_url
          } : m))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, event.id])

  const handleMentionInput = (val: string) => {
    setInput(val)
    const match = val.match(/@(\w*)$/)
    if (match) {
      setMentionQuery(match[1])
      setShowMentions(true)
    } else {
      setShowMentions(false)
    }
  }

  const insertMention = (name: string) => {
    const newVal = input.replace(/@\w*$/, `@${name} `)
    setInput(newVal)
    setShowMentions(false)
    inputRef.current?.focus()
  }

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim() || sending) return

    setSending(true)
    const content = input.trim()
    const targetChannel = activeTab
    const replyId = replyTo?.id
    
    setInput('') 
    setReplyTo(null)

    const tempId = crypto.randomUUID ? crypto.randomUUID() : `temp-${Date.now()}`

    // Optimistic Update
    const newMsg: EventMessage = {
      id: tempId,
      event_id: event.id,
      user_id: profile.id,
      content,
      channel: targetChannel,
      reply_to_id: replyId,
      reactions: {},
      is_deleted: false,
      created_at: new Date().toISOString(),
      user: { name: profile.name, role: profile.role, avatar_url: profile.avatar_url, org: profile.org }
    }
    setMessages(prev => [...prev, newMsg])
    
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, 50)

    try {
      const insertPayload: any = {
        event_id: event.id,
        user_id: profile.id,
        content: content,
        channel: targetChannel,
        reply_to_id: replyId
      }
      // If we got a real UUID, force it so realtime deduplicates. 
      // If crypto.randomUUID fails (older browser), we let DB generate ID and just rely on a page refresh for safety, 
      // but modern browsers support it so it's safe.
      if (!tempId.startsWith('temp-')) {
        insertPayload.id = tempId
      }

      const { error } = await supabase.from('event_messages').insert(insertPayload)
      if (error) throw error
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to send message')
      setMessages(prev => prev.filter(m => m.id !== tempId))
    } finally {
      setSending(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const ext = file.name.split('.').pop()
      const filePath = `chat/${event.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
      
      const { error: uploadError } = await supabase.storage.from('event-photos').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('event-photos').getPublicUrl(filePath)

      await supabase.from('event_messages').insert({
        event_id: event.id,
        user_id: profile.id,
        content: 'Shared an image',
        image_url: publicUrl,
        channel: activeTab,
        reply_to_id: replyTo?.id
      })
      setReplyTo(null)
    } catch (err: any) {
      console.error('Upload failed:', err)
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const togglePin = async (msgId: string, currentPinStatus: boolean) => {
    if (profile.role !== 'admin') return
    await supabase.from('event_messages').update({ is_pinned: !currentPinStatus }).eq('id', msgId)
  }

  const deleteMessage = async (msgId: string) => {
    if (profile.role !== 'admin' && profile.id !== messages.find(m => m.id === msgId)?.user_id) return
    await supabase.from('event_messages').update({ is_deleted: true, content: '', image_url: null }).eq('id', msgId)
    toast.success('Message deleted')
  }

  const toggleReaction = async (msg: EventMessage, emoji: string) => {
    const currentReactions = msg.reactions || {}
    let usersReactions = currentReactions[emoji] || []
    
    if (usersReactions.includes(profile.id)) {
      usersReactions = usersReactions.filter(id => id !== profile.id)
    } else {
      usersReactions.push(profile.id)
    }

    const newReactions = { ...currentReactions, [emoji]: usersReactions }
    if (usersReactions.length === 0) delete newReactions[emoji]

    await supabase.from('event_messages').update({ reactions: newReactions }).eq('id', msg.id)
  }

  const visibleMessages = messages.filter(m => (m.channel === activeTab) || (!m.channel && activeTab === 'general'))
  const pinnedMessages = visibleMessages.filter(m => m.is_pinned && !m.is_deleted)
  const filteredParticipants = participants.filter(p => p.name.toLowerCase().includes(mentionQuery.toLowerCase()))

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <TopBar profile={profile} title="Event Comm Hub" />
      <main className="flex-1 flex flex-col p-4 md:p-6 max-h-[calc(100vh-64px)] overflow-hidden relative">
        
        {/* Chat Header */}
        <div className="flex items-center justify-between mb-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-t-2xl shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="font-bold text-lg font-display truncate">{event.title}</h2>
              <div className="flex items-center gap-1 mt-1 text-xs font-semibold bg-gray-100 dark:bg-gray-800 p-1 px-1.5 rounded-lg w-max">
                <button onClick={() => setActiveTab('general')} className={`px-3 py-1 rounded-md transition-colors ${activeTab === 'general' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>General</button>
                <button onClick={() => setActiveTab('announcements')} className={`px-3 py-1 rounded-md flex items-center gap-1 transition-colors ${activeTab === 'announcements' ? 'bg-amber-100 dark:bg-amber-900/60 shadow-sm text-amber-700 dark:text-amber-400' : 'text-gray-500'}`}><Bell className="h-3 w-3" /> Announcements</button>
              </div>
            </div>
          </div>
        </div>

        {/* Pinned Messages Area */}
        {pinnedMessages.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/30 p-3 px-4 z-10 sticky top-0 shadow-sm max-h-32 overflow-y-auto">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-500 mb-2">
              <Pin className="h-3 w-3" /> Pinned Messages
            </div>
            <div className="space-y-2">
              {pinnedMessages.map((msg) => (
                <div key={`pin-${msg.id}`} className="text-xs text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-black/20 p-2 rounded-lg border border-amber-200/50 flex justify-between items-start">
                  <div className="flex-1">
                    <span className="font-semibold text-amber-600 mr-2">{msg.user?.name}:</span>
                    {msg.image_url ? <a href={msg.image_url} target="_blank" className="underline text-blue-500">View Image</a> : msg.content}
                  </div>
                  {profile.role === 'admin' && (
                    <button onClick={() => togglePin(msg.id, true)} className="text-gray-400 hover:text-red-500 ml-2">
                      <PinOff className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message View Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 border-l border-r border-gray-200 dark:border-gray-800 p-4 space-y-6 scroll-smooth"
        >
          {visibleMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Users className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm font-medium">Welcome to the {activeTab === 'announcements' ? 'Announcements Board' : 'General Chat'}.</p>
            </div>
          ) : (
            visibleMessages.map((msg, i) => {
              const isMe = msg.user_id === profile.id
              const isAdmin = msg.user?.role === 'admin'
              const repliedHtml = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null
              
              if (msg.is_deleted) {
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} my-2`}>
                    <div className="italic text-xs text-gray-400 dark:text-gray-600 flex items-center gap-1 border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-xl"><Trash2 className="h-3 w-3" /> [This message was deleted]</div>
                  </div>
                )
              }

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group chat-message-container`}>
                  {/* Sender Name */}
                  {!isMe && (
                    <span className="text-[10px] text-gray-500 font-semibold ml-1 mb-1 flex items-center gap-1">
                      {msg.user?.name} {isAdmin && <Verified className="h-3 w-3 text-blue-500" />}
                    </span>
                  )}

                  {/* Message Bubble + Actions */}
                  <div className={`flex items-start gap-2 max-w-full ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    <div className={`max-w-[85%] md:max-w-md flex flex-col items-${isMe ? 'end' : 'start'} group`}>
                      {repliedHtml && !repliedHtml.is_deleted && (
                        <div className="mb-1 text-[10px] bg-gray-200/50 dark:bg-gray-800/50 p-2 rounded-t-lg border-l-2 border-gray-400 text-gray-500 truncate max-w-full text-left">
                          <span className="font-bold mr-1">{repliedHtml.user?.name}:</span> {repliedHtml.content}
                        </div>
                      )}
                      
                      <div className={`px-4 py-2.5 shadow-sm text-sm leading-relaxed ${
                          isMe 
                          ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm text-left' 
                          : isAdmin 
                            ? 'bg-yellow-100 dark:bg-yellow-900/40 text-gray-900 dark:text-white border border-yellow-200/50 rounded-2xl rounded-tl-sm'
                            : 'bg-white dark:bg-gray-800 text-gray-900 border border-gray-100 dark:border-gray-700 dark:text-gray-100 rounded-2xl rounded-tl-sm'
                      }`}>
                        {msg.image_url && (
                          <div className="mb-2">
                            <img src={msg.image_url} alt="Shared" className="rounded-xl max-h-64 object-cover" loading="lazy" />
                          </div>
                        )}
                        {msg.content !== 'Shared an image' && <p className="whitespace-pre-wrap">{msg.content}</p>}
                      </div>

                      {/* Display Reactions */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                           {Object.entries(msg.reactions).map(([emoji, users]) => (
                             <button key={emoji} onClick={() => toggleReaction(msg, emoji)} className={`text-[10px] px-1.5 flex items-center gap-1 rounded-full border ${users.includes(profile.id) ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/40' : 'bg-gray-100 border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-gray-500'}`}>
                               {emoji} {users.length}
                             </button>
                           ))}
                        </div>
                      )}
                    </div>

                    <div className={`opacity-0 group-hover:opacity-100 flex items-center transition-opacity py-1 ${isMe ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-transparent`}>
                      {isAdmin && profile.role === 'admin' && (
                        <button onClick={() => togglePin(msg.id, !!msg.is_pinned)} className="p-1.5 text-gray-400 hover:text-amber-500" title="Pin message">
                          <Pin className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={() => toggleReaction(msg, '👍')} className="p-1.5 text-gray-400 hover:text-blue-500" title="Thumbs Up">
                        <Smile className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setReplyTo(msg)} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" title="Reply">
                        <Reply className="h-3.5 w-3.5" />
                      </button>
                      {(isMe || profile.role === 'admin') && (
                        <button onClick={() => deleteMessage(msg.id)} className="p-1.5 text-gray-400 hover:text-red-500" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Chat Input Section */}
        {activeTab === 'announcements' && profile.role !== 'admin' ? (
          <div className="bg-gray-100 dark:bg-gray-900 p-4 text-center text-xs font-semibold text-gray-500 rounded-b-2xl border border-t-0 border-gray-200 dark:border-gray-800">
            Only admins can post in Announcements.
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 rounded-b-2xl shadow-sm flex flex-col z-20">
            
            {/* Mentions Overlay */}
            <AnimatePresence>
              {showMentions && filteredParticipants.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-20 left-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl w-64 max-h-48 overflow-y-auto mb-2 z-50">
                  {filteredParticipants.map(p => (
                    <button key={p.id} onClick={() => insertMention(p.name.replace(/\s+/g, ''))} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {p.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reply Preview */}
            <AnimatePresence>
              {replyTo && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-t-xl text-xs -mx-3 -mt-3 mb-2 border-b border-blue-100 dark:border-blue-900 overflow-hidden">
                  <div className="truncate text-blue-700 dark:text-blue-300">
                    <span className="font-bold mr-1">Replying to {replyTo.user?.name}:</span>
                    {replyTo.content === 'Shared an image' ? '[Image]' : replyTo.content}
                  </div>
                  <button onClick={() => setReplyTo(null)} className="text-blue-500 hover:text-blue-700 p-1"><X className="h-3 w-3" /></button>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
              <button 
                type="button" 
                disabled={uploadingImage}
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 flex flex-shrink-0 items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                title="Upload Photo"
              >
                {uploadingImage ? <Loader2 className="h-5 w-5 animate-spin text-blue-500" /> : <ImageIcon className="h-5 w-5" />}
              </button>
              
              <input 
                ref={inputRef}
                value={input}
                onChange={e => handleMentionInput(e.target.value)}
                placeholder={activeTab === 'announcements' ? "Post an announcement..." : "Type your message (@ to mention)..."}
                className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all min-w-0"
              />
              <button 
                type="submit" 
                disabled={(!input.trim() && !uploadingImage) || sending}
                className="w-12 h-12 flex flex-shrink-0 items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl transition-all"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
