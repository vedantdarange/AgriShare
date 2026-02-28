'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    MessageSquare, Send, ArrowLeft, Leaf, Package,
    Check, CheckCheck, Image as ImageIcon, Smile,
    MoreVertical, Search, Sprout, X, Trash2
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/userStore'
import { useToast } from '@/lib/toast'
import Link from 'next/link'
import LottieLoader from '@/components/LottieLoader'

// ─── Interfaces ────────────────────────────────────────────────────────────────
interface Message {
    id: string
    conversation_id: string
    sender_id: string
    content: string
    message_type: 'text' | 'image' | 'offer' | 'product_card'
    created_at: string
    read_at?: string
    delivered_at?: string
    edited_at?: string
    is_deleted?: boolean
    metadata?: { image_url?: string; offer_id?: string; product_id?: string }
    reactions?: MessageReaction[]
}

interface MessageReaction { id: string; user_id: string; reaction: string }

interface Conversation {
    id: string
    buyer_id: string
    seller_id: string
    product_id: string | null
    last_message_at: string
    other_name: string
    other_avatar: string
    product_title: string | null
    unread_count: number
    last_message: string | null
    status: 'active' | 'archived' | 'blocked'
    labels?: string[]
}

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🙏', '👎']

// ─── Font Injector ──────────────────────────────────────────────────────────────
function useFonts() {
    useEffect(() => {
        const id = 'terroir-fonts'
        if (document.getElementById(id)) return
        const link = document.createElement('link')
        link.id = id
        link.rel = 'stylesheet'
        link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap'
        document.head.appendChild(link)
    }, [])
}

// ─── Avatar Component ───────────────────────────────────────────────────────────
function Avatar({ name, size = 'md' }: { name?: string | null; size?: 'sm' | 'md' | 'lg' }) {
    const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'
    const sizeClasses = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }
    const colors = ['from-emerald-700 to-teal-600', 'from-amber-700 to-orange-600', 'from-stone-600 to-stone-500', 'from-lime-700 to-green-600']
    const colorIdx = name ? name.charCodeAt(0) % colors.length : 0

    return (
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center text-amber-50 font-semibold shrink-0`}
            style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {initials}
        </div>
    )
}

// ─── Time Formatter ─────────────────────────────────────────────────────────────
function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
function formatConvTime(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 86400000) return formatTime(iso)
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

// ─── Typing Indicator ───────────────────────────────────────────────────────────
function TypingBubble() {
    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="flex justify-start">
            <div className="flex items-center gap-1.5 px-4 py-3 bg-[#f0ebe1] rounded-2xl rounded-bl-sm border border-[#e2d9c8]">
                {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-[#8a7559]"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
                ))}
            </div>
        </motion.div>
    )
}

// ─── Empty States ───────────────────────────────────────────────────────────────
function EmptyMessages() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
                <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 rounded-full bg-[#e8f4e8] opacity-60 animate-pulse" />
                    <div className="absolute inset-3 rounded-full bg-[#d4ead4] flex items-center justify-center">
                        <Sprout className="w-7 h-7 text-[#3d6b3d]" />
                    </div>
                </div>
            </motion.div>
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    className="text-2xl font-semibold text-[#2c2416] mb-2">Select a conversation</h3>
                <p className="text-sm text-[#8a7559] max-w-xs leading-relaxed">
                    Connect with farmers and buyers to discuss harvests, negotiate prices, and build lasting relationships.
                </p>
            </motion.div>
        </div>
    )
}

// ─── Main Inner Component ───────────────────────────────────────────────────────
function MessagesPageInner() {
    const { user, profile, isLoading: authLoading } = useUserStore()
    const toast = useToast()
    const searchParams = useSearchParams()
    useFonts()

    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeConv, setActiveConv] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const [showMobileList, setShowMobileList] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({})
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
    const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageId: string } | null>(null)
    const [hoveredMsg, setHoveredMsg] = useState<string | null>(null)

    // ── Initial fetch ──
    useEffect(() => {
        if (authLoading) return
        if (!user) { setIsLoading(false); return }

        async function fetchInitialData() {
            try {
                const { data, error } = await supabase
                    .from('conversations')
                    .select(`*, buyer:profiles!buyer_id(full_name,avatar_url), seller:profiles!seller_id(full_name,avatar_url), product:products(title)`)
                    .or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`)
                    .order('last_message_at', { ascending: false })
                if (error) throw error
                const enriched: Conversation[] = (data || []).map(conv => {
                    const isBuyer = conv.buyer_id === user!.id
                    return {
                        ...conv,
                        other_name: isBuyer ? conv.seller?.full_name : conv.buyer?.full_name,
                        other_avatar: isBuyer ? conv.seller?.avatar_url : conv.buyer?.avatar_url,
                        product_title: conv.product?.title || null,
                        unread_count: 0
                    }
                })
                setConversations(enriched)
            } catch (err: any) {
                toast.error({ title: 'Failed to load conversations', description: (err as Error).message })
            } finally {
                setIsLoading(false)
            }
        }
        fetchInitialData()
    }, [user?.id, authLoading])

    useEffect(() => {
        const convParam = searchParams.get('conv')
        if (convParam && conversations.length > 0) {
            const found = conversations.find(c => c.id === convParam)
            if (found) { setActiveConv(found); setShowMobileList(false) }
        }
    }, [searchParams, conversations])

    useEffect(() => {
        if (activeConv) {
            fetchMessages(activeConv.id)
            subscribeToMessages(activeConv.id)
            markAsRead(activeConv.id)
        }
        return () => { channelRef.current?.unsubscribe() }
    }, [activeConv?.id])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, typingUsers])

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
        }
    }, [newMessage])

    async function fetchMessages(convId: string) {
        const { data, error } = await supabase
            .from('messages')
            .select(`*, reactions:message_reactions(id,user_id,reaction)`)
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true })
        if (!error) setMessages((data as Message[]) || [])
    }

    function subscribeToMessages(convId: string) {
        channelRef.current?.unsubscribe()
        channelRef.current = supabase
            .channel(`chat:${convId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convId}` }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setMessages(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new as Message])
                } else if (payload.eventType === 'UPDATE') {
                    setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m))
                }
            })
            .on('broadcast', { event: 'typing' }, (payload) => {
                if (payload.payload.user_id !== user!.id) {
                    setTypingUsers(prev => ({ ...prev, [payload.payload.user_id]: true }))
                    setTimeout(() => setTypingUsers(prev => { const n = { ...prev }; delete n[payload.payload.user_id]; return n }), 3000)
                }
            })
            .subscribe()
    }

    async function markAsRead(convId: string) {
        if (!user) return
        const column = activeConv?.buyer_id === user.id ? 'buyer_last_read_at' : 'seller_last_read_at'
        await Promise.all([
            supabase.from('conversations').update({ [column]: new Date().toISOString() }).eq('id', convId),
            supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('conversation_id', convId).neq('sender_id', user.id).is('read_at', null)
        ])
    }

    const handleTyping = () => {
        if (!activeConv || !user) return
        channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { user_id: user.id } })
    }

    async function sendMessage(type: 'text' | 'image' = 'text', imageUrl?: string) {
        if ((!newMessage.trim() && type === 'text') || !activeConv || !user) return
        setIsSending(true)
        const msgData: any = {
            conversation_id: activeConv.id,
            sender_id: user.id,
            content: type === 'image' ? '📷 Image' : newMessage.trim(),
            message_type: type,
            delivered_at: new Date().toISOString(),
        }
        if (type === 'image' && imageUrl) msgData.metadata = { image_url: imageUrl }
        const { error } = await supabase.from('messages').insert(msgData)
        if (error) {
            toast.error({ title: 'Send failed', description: error.message })
        } else {
            setNewMessage("")
            await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', activeConv.id)
        }
        setIsSending(false)
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !activeConv || !user) return
        setIsSending(true)
        const filePath = `chat/${activeConv.id}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage.from('chat-images').upload(filePath, file)
        if (uploadError) { toast.error({ title: 'Upload failed', description: uploadError.message }); setIsSending(false); return }
        const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(filePath)
        await sendMessage('image', publicUrl)
    }

    const addReaction = async (messageId: string, reaction: string) => {
        const { error } = await supabase.from('message_reactions').insert({ message_id: messageId, user_id: user!.id, reaction })
        if (!error) { setShowEmojiPicker(null); fetchMessages(activeConv!.id) }
    }

    const deleteMessage = async (messageId: string) => {
        await supabase.from('messages').update({ is_deleted: true, content: 'This message was deleted' }).eq('id', messageId).eq('sender_id', user!.id)
        setContextMenu(null)
    }

    const filteredConversations = conversations.filter(c =>
        c.other_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.product_title?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // ── Auth states ──
    if (authLoading) {
        return (
            <div className="h-screen flex items-center justify-center" style={{ background: '#f5f0e8' }}>
                <LottieLoader />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="h-screen flex items-center justify-center p-8" style={{ background: '#f5f0e8', fontFamily: "'DM Sans', sans-serif" }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <div className="w-16 h-16 rounded-full bg-[#e8f0e8] flex items-center justify-center mx-auto mb-4">
                        <Leaf className="w-7 h-7 text-[#3d6b3d]" />
                    </div>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-2xl font-semibold text-[#2c2416] mb-2">Sign in to continue</p>
                    <p className="text-sm text-[#8a7559] mb-6">View your messages with farmers and buyers</p>
                    <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-[#f5f0e8]"
                        style={{ background: '#2c4a2c' }}>
                        <ArrowLeft className="w-4 h-4" /> Go Home
                    </Link>
                </motion.div>
            </div>
        )
    }

    // ── Main Layout ──
    return (
        <>
            {/* Global styles */}
            <style>{`
                .terroir-scrollbar::-webkit-scrollbar { width: 4px; }
                .terroir-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .terroir-scrollbar::-webkit-scrollbar-thumb { background: #d4c9b0; border-radius: 99px; }
                .terroir-scrollbar::-webkit-scrollbar-thumb:hover { background: #b8a98a; }
                .msg-input::placeholder { color: #b8a98a; }
                .msg-input:focus { outline: none; }
                .grain-overlay { background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E"); }
                @keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }
            `}</style>

            <div className="h-screen flex overflow-hidden" style={{ background: '#f5f0e8', fontFamily: "'DM Sans', sans-serif" }}
                onClick={() => { setContextMenu(null); setShowEmojiPicker(null) }}>

                {/* ═══ SIDEBAR ═══════════════════════════════════════════════════ */}
                <motion.div
                    initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                    className={`relative w-full max-w-[320px] flex flex-col shrink-0 border-r border-[#e0d5c0] ${!showMobileList ? 'hidden md:flex' : 'flex'}`}
                    style={{ background: '#1e2d1e' }}>

                    {/* Grain texture overlay */}
                    <div className="grain-overlay absolute inset-0 pointer-events-none opacity-30" />

                    {/* Header */}
                    <div className="relative z-10 px-5 pt-8 pb-5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(212,180,130,0.15)' }}>
                                <Sprout className="w-4 h-4 text-[#d4b482]" />
                            </div>
                            <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }}
                                className="text-xl font-semibold tracking-wide text-[#f0e8d5]">
                                Messages
                            </h1>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7a8f6a]" />
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search conversations..."
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs text-[#d4c9a8] placeholder-[#5a6b4a] border border-[#2e4a2e] focus:outline-none focus:border-[#4a7a4a] transition-colors"
                                style={{ background: 'rgba(255,255,255,0.05)' }}
                            />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="mx-5 mb-3 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,180,130,0.2), transparent)' }} />

                    {/* Conversation List */}
                    <div className="relative z-10 flex-1 overflow-y-auto terroir-scrollbar px-3 pb-4 space-y-1">
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex gap-3 p-3 rounded-xl" style={{ animation: `shimmer 1.5s ${i * 0.2}s infinite` }}>
                                    <div className="w-10 h-10 rounded-full bg-[#2a3d2a]" />
                                    <div className="flex-1 space-y-2 pt-1">
                                        <div className="h-3 bg-[#2a3d2a] rounded w-2/3" />
                                        <div className="h-2.5 bg-[#243424] rounded w-full" />
                                    </div>
                                </div>
                            ))
                        ) : filteredConversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <MessageSquare className="w-8 h-8 text-[#3a5a3a] mb-3" />
                                <p className="text-xs text-[#5a7a5a]">{searchQuery ? 'No matches found' : 'No conversations yet'}</p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {filteredConversations.map((conv, idx) => (
                                    <motion.button
                                        key={conv.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        onClick={() => { setActiveConv(conv); setShowMobileList(false) }}
                                        className={`w-full flex gap-3 p-3 rounded-xl text-left transition-all duration-200 group relative ${activeConv?.id === conv.id
                                            ? 'bg-[#2d4d2d]'
                                            : 'hover:bg-[#243424]'
                                            }`}
                                    >
                                        {/* Active indicator */}
                                        {activeConv?.id === conv.id && (
                                            <motion.div layoutId="activeIndicator"
                                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                                                style={{ background: '#8fbc6a' }} />
                                        )}

                                        <Avatar name={conv.other_name} size="md" />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-1">
                                                <p className="text-sm font-medium text-[#e8dfc8] truncate leading-tight">{conv.other_name}</p>
                                                <span className="text-[10px] text-[#5a7a5a] shrink-0 mt-0.5">
                                                    {conv.last_message_at ? formatConvTime(conv.last_message_at) : ''}
                                                </span>
                                            </div>
                                            {conv.product_title && (
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <Package className="w-2.5 h-2.5 text-[#8fbc6a] shrink-0" />
                                                    <p className="text-[10px] text-[#8fbc6a] truncate">{conv.product_title}</p>
                                                </div>
                                            )}
                                            <p className="text-xs text-[#5a7a5a] truncate mt-0.5 leading-tight">
                                                {conv.last_message || 'Start a conversation'}
                                            </p>
                                        </div>
                                    </motion.button>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>

                    {/* Bottom profile strip */}
                    <div className="relative z-10 px-4 py-3 border-t border-[#2a3d2a] flex items-center gap-2.5">
                        <Avatar name={profile?.full_name} size="sm" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[#d4c9a8] truncate">{profile?.full_name}</p>
                            <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#8fbc6a]" />
                                <span className="text-[10px] text-[#5a7a5a]">Active</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ═══ CHAT AREA ══════════════════════════════════════════════════ */}
                <div className={`flex-1 flex flex-col ${showMobileList ? 'hidden md:flex' : 'flex'}`} style={{ background: '#faf7f0' }}>

                    {!activeConv ? (
                        <EmptyMessages />
                    ) : (
                        <>
                            {/* Chat Header */}
                            <motion.div
                                initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                className="px-6 py-4 border-b border-[#e8e0d0] flex items-center gap-4 shrink-0"
                                style={{ background: 'rgba(255,253,248,0.95)', backdropFilter: 'blur(12px)' }}>
                                <button onClick={() => setShowMobileList(true)} className="md:hidden p-1.5 hover:bg-[#f0ebe1] rounded-lg transition-colors">
                                    <ArrowLeft className="w-4 h-4 text-[#5a4a35]" />
                                </button>
                                <Avatar name={activeConv.other_name} size="md" />
                                <div className="flex-1">
                                    <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }}
                                        className="text-lg font-semibold text-[#2c2416] leading-tight">
                                        {activeConv.other_name}
                                    </h2>
                                    {activeConv.product_title && (
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#8fbc6a]" />
                                            <span className="text-xs text-[#6a8a5a]">{activeConv.product_title}</span>
                                        </div>
                                    )}
                                </div>
                                <button className="p-2 hover:bg-[#f0ebe1] rounded-xl transition-colors">
                                    <MoreVertical className="w-4 h-4 text-[#8a7559]" />
                                </button>
                            </motion.div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto terroir-scrollbar px-6 py-6 space-y-2">
                                {/* Date separator helper */}
                                {messages.length > 0 && (
                                    <div className="flex items-center gap-3 my-4">
                                        <div className="flex-1 h-px bg-[#e8e0d0]" />
                                        <span className="text-[10px] text-[#a89880] px-2 py-1 rounded-full bg-[#f0ebe1]">
                                            {new Date(messages[0].created_at).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                                        </span>
                                        <div className="flex-1 h-px bg-[#e8e0d0]" />
                                    </div>
                                )}

                                <AnimatePresence initial={false}>
                                    {messages.map((msg, idx) => {
                                        const isMe = msg.sender_id === user.id
                                        const showAvatar = !isMe && (idx === 0 || messages[idx - 1]?.sender_id !== msg.sender_id)
                                        const isGrouped = idx > 0 && messages[idx - 1]?.sender_id === msg.sender_id
                                        const isDeleted = msg.is_deleted

                                        return (
                                            <motion.div
                                                key={msg.id}
                                                layout
                                                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isGrouped ? 'mt-0.5' : 'mt-3'} group relative`}
                                                onMouseEnter={() => setHoveredMsg(msg.id)}
                                                onMouseLeave={() => { setHoveredMsg(null) }}
                                                onContextMenu={e => { e.preventDefault(); if (isMe && !isDeleted) setContextMenu({ x: e.clientX, y: e.clientY, messageId: msg.id }) }}
                                            >
                                                {/* Other user avatar space */}
                                                {!isMe && (
                                                    <div className="w-8 mr-2 shrink-0 self-end">
                                                        {showAvatar && <Avatar name={activeConv.other_name} size="sm" />}
                                                    </div>
                                                )}

                                                <div className={`relative flex flex-col gap-1 max-w-[68%]`}>
                                                    {/* Sender name for first in group */}
                                                    {!isMe && showAvatar && (
                                                        <p className="text-[10px] text-[#8a7559] ml-1 font-medium">{activeConv.other_name}</p>
                                                    )}

                                                    <div className={`relative px-4 py-2.5 text-sm leading-relaxed shadow-sm
                                                        ${isMe
                                                            ? 'text-[#f5f0e8] rounded-2xl rounded-br-sm'
                                                            : 'text-[#2c2416] bg-white border border-[#e8e0d0] rounded-2xl rounded-bl-sm'
                                                        }
                                                        ${isDeleted ? 'opacity-50 italic' : ''}
                                                    `}
                                                        style={isMe ? { background: 'linear-gradient(135deg, #2c4a2c 0%, #3d6040 100%)' } : {}}>

                                                        {/* Image */}
                                                        {msg.message_type === 'image' && msg.metadata?.image_url && (
                                                            <img src={msg.metadata.image_url} className="max-w-full rounded-lg mb-2 max-h-48 object-cover" alt="Shared image" />
                                                        )}

                                                        <p>{msg.content}</p>

                                                        {/* Time + read status */}
                                                        <div className={`flex items-center gap-1 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                            <span className={`text-[10px] ${isMe ? 'text-[#a8c8a8]' : 'text-[#b8a98a]'}`}>
                                                                {formatTime(msg.created_at)}
                                                            </span>
                                                            {isMe && (
                                                                msg.read_at
                                                                    ? <CheckCheck className="w-3 h-3 text-[#8fbc6a]" />
                                                                    : <Check className="w-3 h-3 text-[#6a8a6a]" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Reactions */}
                                                    {msg.reactions && msg.reactions.length > 0 && (
                                                        <div className={`flex gap-0.5 flex-wrap ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                            {msg.reactions.map(r => (
                                                                <span key={r.id} className="text-xs bg-white px-1.5 py-0.5 rounded-full border border-[#e8e0d0] shadow-sm">{r.reaction}</span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Reaction trigger button */}
                                                    <AnimatePresence>
                                                        {hoveredMsg === msg.id && !isDeleted && (
                                                            <motion.button
                                                                initial={{ opacity: 0, scale: 0.8 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                exit={{ opacity: 0, scale: 0.8 }}
                                                                onClick={e => { e.stopPropagation(); setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id) }}
                                                                className={`absolute ${isMe ? '-left-9' : '-right-9'} top-1/2 -translate-y-1/2 w-7 h-7 bg-white border border-[#e8e0d0] shadow-md rounded-full flex items-center justify-center hover:bg-[#f5f0e8] transition-colors`}
                                                            >
                                                                <Smile className="w-3.5 h-3.5 text-[#8a7559]" />
                                                            </motion.button>
                                                        )}
                                                    </AnimatePresence>

                                                    {/* Emoji Picker */}
                                                    <AnimatePresence>
                                                        {showEmojiPicker === msg.id && (
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.85, y: 5 }}
                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 0.85, y: 5 }}
                                                                className={`absolute ${isMe ? 'right-0' : 'left-0'} -bottom-12 z-20 flex gap-1 bg-white border border-[#e8e0d0] rounded-2xl px-2 py-1.5 shadow-xl`}
                                                                onClick={e => e.stopPropagation()}
                                                            >
                                                                {REACTIONS.map(r => (
                                                                    <button key={r} onClick={() => addReaction(msg.id, r)}
                                                                        className="w-7 h-7 flex items-center justify-center rounded-xl hover:bg-[#f0ebe1] transition-colors text-base hover:scale-125 transform duration-150">
                                                                        {r}
                                                                    </button>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </AnimatePresence>

                                {/* Typing indicator */}
                                <AnimatePresence>
                                    {Object.keys(typingUsers).length > 0 && <TypingBubble />}
                                </AnimatePresence>
                                <div ref={bottomRef} />
                            </div>

                            {/* ── Input Area ── */}
                            <motion.div
                                initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                className="px-5 py-4 border-t border-[#e8e0d0] shrink-0"
                                style={{ background: 'rgba(255,253,248,0.98)', backdropFilter: 'blur(12px)' }}>
                                <div className="flex items-end gap-3 max-w-4xl mx-auto">
                                    {/* Image upload */}
                                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                                    <button onClick={() => fileInputRef.current?.click()}
                                        className="p-2.5 rounded-xl border border-[#e0d5c0] text-[#8a7559] hover:bg-[#f0ebe1] hover:text-[#5a4a35] hover:border-[#c8b898] transition-all duration-200 shrink-0">
                                        <ImageIcon className="w-4 h-4" />
                                    </button>

                                    {/* Message input */}
                                    <div className="flex-1 relative">
                                        <textarea
                                            ref={textareaRef}
                                            rows={1}
                                            value={newMessage}
                                            onChange={e => { setNewMessage(e.target.value); handleTyping() }}
                                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                                            placeholder="Write a message…"
                                            className="msg-input w-full px-4 py-2.5 rounded-2xl border border-[#e0d5c0] bg-[#faf7f0] text-sm text-[#2c2416] resize-none transition-all duration-200 focus:border-[#8fbc6a] focus:bg-white focus:shadow-sm"
                                            style={{ minHeight: '42px', maxHeight: '120px', fontFamily: "'DM Sans', sans-serif" }}
                                        />
                                    </div>

                                    {/* Send button */}
                                    <motion.button
                                        onClick={() => sendMessage()}
                                        disabled={!newMessage.trim() || isSending}
                                        whileTap={{ scale: 0.93 }}
                                        className="p-2.5 rounded-xl text-[#f5f0e8] transition-all duration-200 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                                        style={{
                                            background: newMessage.trim() && !isSending
                                                ? 'linear-gradient(135deg, #2c4a2c 0%, #3d6040 100%)'
                                                : '#c8c0b0'
                                        }}
                                    >
                                        {isSending
                                            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            : <Send className="w-4 h-4" />
                                        }
                                    </motion.button>
                                </div>

                                {/* Hint */}
                                <p className="text-[10px] text-[#b8a98a] text-center mt-2">
                                    Press <kbd className="px-1 py-0.5 rounded bg-[#f0ebe1] border border-[#e0d5c0] text-[9px]">Enter</kbd> to send · <kbd className="px-1 py-0.5 rounded bg-[#f0ebe1] border border-[#e0d5c0] text-[9px]">Shift+Enter</kbd> for new line
                                </p>
                            </motion.div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Context Menu ── */}
            <AnimatePresence>
                {contextMenu && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            style={{ top: contextMenu.y, left: contextMenu.x, fontFamily: "'DM Sans', sans-serif" }}
                            className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-[#e8e0d0] py-1.5 min-w-[140px] overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <button onClick={() => deleteMessage(contextMenu.messageId)}
                                className="w-full px-4 py-2.5 text-left text-sm text-[#c0392b] hover:bg-red-50 transition-colors flex items-center gap-2.5">
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete message
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}

// ─── Page Export ────────────────────────────────────────────────────────────────
export default function MessagesPage() {
    return (
        <Suspense fallback={
            <div className="h-screen flex items-center justify-center" style={{ background: '#f5f0e8' }}>
                <LottieLoader />
            </div>
        }>
            <MessagesPageInner />
        </Suspense>
    )
}