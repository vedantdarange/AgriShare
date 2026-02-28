'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    RefreshCcw, PhoneCall, ChevronDown, ChevronUp,
    Clock, CheckCircle2, Truck, Banknote, XCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/userStore'
import { useToast } from '@/lib/toast'

interface SellerReturn {
    id: string
    order_id: string
    user_id: string
    status: string
    reason: string
    description: string
    refund_method: string
    created_at: string
    buyer_name?: string
    buyer_phone?: string
    order_number?: string
    items: { title: string; quantity: number }[]
    photos: { id: string; photo_url: string }[]
}

const RETURN_STATUS_FLOW = [
    { key: 'pending', label: 'Pending', icon: Clock, color: 'text-amber-500' },
    { key: 'approved', label: 'Approved', icon: CheckCircle2, color: 'text-blue-500' },
    { key: 'pickup_scheduled', label: 'Pickup', icon: Truck, color: 'text-purple-500' },
    { key: 'refunded', label: 'Refunded', icon: Banknote, color: 'text-lime-500' },
]

const NEXT_RETURN_STATUS: Record<string, string> = {
    pending: 'approved',
    approved: 'pickup_scheduled',
    pickup_scheduled: 'refunded',
}

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-blue-100 text-blue-700 border-blue-200',
    pickup_scheduled: 'bg-purple-100 text-purple-700 border-purple-200',
    refunded: 'bg-lime-100 text-lime-700 border-lime-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
}

const REASON_MAP: Record<string, string> = {
    quality_issue: 'Quality Issue',
    wrong_item: 'Wrong Item',
    less_quantity: 'Less Quantity',
    changed_mind: 'Changed Mind',
}

export default function SellerReturnsPage() {
    const { user } = useUserStore()
    const toast = useToast()
    const [returns, setReturns] = useState<SellerReturn[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [filterStatus, setFilterStatus] = useState<string>('all')

    useEffect(() => {
        if (user) fetchReturns()
    }, [user])

    async function fetchReturns() {
        setLoading(true)
        const { data: returnsData, error } = await supabase
            .from('returns')
            .select(`
                *,
                order:orders(order_number),
                buyer:profiles!user_id(full_name, phone),
                return_items(quantity, order_item:order_items(product_snapshot, product:products(title))),
                return_photos(id, photo_url)
            `)
            .eq('seller_id', user!.id)
            .order('created_at', { ascending: false })

        if (error) {
            toast.error({ title: 'Failed to load return requests', description: error.message })
            setLoading(false)
            return
        }

        const formatted = (returnsData ?? []).map((r: any) => ({
            id: r.id,
            order_id: r.order_id,
            user_id: r.user_id,
            status: r.status,
            reason: r.reason,
            description: r.description,
            refund_method: r.refund_method,
            created_at: r.created_at,
            order_number: r.order?.order_number || 'Unknown',
            buyer_name: r.buyer?.full_name || 'Buyer',
            buyer_phone: r.buyer?.phone,
            items: (r.return_items ?? []).map((item: any) => ({
                title: item.order_item?.product?.title || item.order_item?.product_snapshot?.title || 'Product',
                quantity: item.quantity
            })),
            photos: r.return_photos ?? []
        }))

        setReturns(formatted)
        setLoading(false)
    }

    async function handleStatusUpdate(returnId: string, currentStatus: string) {
        const next = NEXT_RETURN_STATUS[currentStatus]
        if (!next) return
        setUpdatingId(returnId)
        const { error } = await supabase.from('returns').update({ status: next }).eq('id', returnId)
        if (error) {
            toast.error({ title: 'Update failed', description: error.message })
        } else {
            toast.success({ title: `Return ${next.replace('_', ' ')}` })
            setReturns(prev => prev.map(r => r.id === returnId ? { ...r, status: next } : r))
        }
        setUpdatingId(null)
    }

    async function handleReject(returnId: string) {
        if (!confirm("Are you sure you want to reject this return request?")) return;
        setUpdatingId(returnId)
        const { error } = await supabase.from('returns').update({ status: 'rejected' }).eq('id', returnId)
        if (error) {
            toast.error({ title: 'Failed to reject return' })
        } else {
            toast.info({ title: 'Return Rejected', description: 'Buyer has been notified' })
            setReturns(prev => prev.map(r => r.id === returnId ? { ...r, status: 'rejected' } : r))
        }
        setUpdatingId(null)
    }

    const filtered = filterStatus === 'all' ? returns : returns.filter(r => r.status === filterStatus)

    return (
        <div className="min-h-screen bg-[#f5f1ea]">
            <div className="max-w-4xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="mb-6 flex items-center gap-3">
                    <div className="w-12 h-12 bg-lime-100 text-lime-600 rounded-2xl flex items-center justify-center">
                        <RefreshCcw className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-stone-800">Return Requests</h1>
                        <p className="text-stone-500 mt-1">Manage and approve buyer returns</p>
                    </div>
                </div>

                {/* Filter pills */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                    {['all', 'pending', 'approved', 'pickup_scheduled', 'refunded', 'rejected'].map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-colors ${filterStatus === s
                                ? 'bg-stone-900 text-white'
                                : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300'
                                }`}
                        >
                            {s === 'all' ? 'All Returns' : s.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2].map(i => <div key={i} className="bg-white rounded-2xl border border-stone-200 p-6 h-28 animate-pulse" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-stone-200 py-20 text-center">
                        <RefreshCcw className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                        <p className="text-stone-500 text-sm">No return requests found.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((ret, i) => {
                            const isExpanded = expandedId === ret.id
                            const statusIdx = RETURN_STATUS_FLOW.findIndex(s => s.key === ret.status)
                            const canProgress = !!NEXT_RETURN_STATUS[ret.status]

                            return (
                                <motion.div
                                    key={ret.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:border-stone-300 hover:shadow-sm transition-all"
                                >
                                    {/* Header row */}
                                    <div className="flex items-center gap-4 p-5 cursor-pointer"
                                        onClick={() => setExpandedId(isExpanded ? null : ret.id)}>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <p className="font-bold text-stone-800 text-sm">Order {ret.order_number}</p>
                                                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium capitalize ${STATUS_COLORS[ret.status] ?? 'bg-stone-100 text-stone-600 border-stone-200'}`}>
                                                    {ret.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-stone-500 mt-0.5">
                                                {ret.buyer_name} · {new Date(ret.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-bold text-stone-800">{REASON_MAP[ret.reason] || ret.reason}</p>
                                            <p className="text-xs text-stone-400">{ret.items.length} item{ret.items.length !== 1 ? 's' : ''}</p>
                                        </div>
                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-stone-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />}
                                    </div>

                                    {/* Expanded detail */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="border-t border-stone-100 p-5 space-y-6">

                                                    {/* Status timeline (if not rejected) */}
                                                    {ret.status !== 'rejected' && (
                                                        <div className="flex items-center gap-1">
                                                            {RETURN_STATUS_FLOW.map((s, idx) => (
                                                                <div key={s.key} className="flex items-center gap-1 flex-1 last:flex-none">
                                                                    <div className={`flex flex-col items-center ${idx <= statusIdx ? s.color : 'text-stone-300'}`}>
                                                                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${idx <= statusIdx ? 'border-current bg-current/10' : 'border-stone-200'}`}>
                                                                            <s.icon className="w-3.5 h-3.5" />
                                                                        </div>
                                                                        <span className="text-[9px] mt-1 font-medium text-center">{s.label}</span>
                                                                    </div>
                                                                    {idx < RETURN_STATUS_FLOW.length - 1 && (
                                                                        <div className={`flex-1 h-0.5 mx-1 mb-4 ${idx < statusIdx ? 'bg-lime-400' : 'bg-stone-200'}`} />
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Return Details */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Reason</p>
                                                            <p className="text-sm text-stone-800 font-medium bg-stone-50 p-3 rounded-lg border border-stone-100">
                                                                {REASON_MAP[ret.reason] || ret.reason}
                                                            </p>
                                                            {ret.description && (
                                                                <p className="text-sm text-stone-600 mt-2 italic bg-stone-50 p-3 rounded-lg border border-stone-100">
                                                                    "{ret.description}"
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Items to Return</p>
                                                            <div className="space-y-1.5 bg-stone-50 p-3 rounded-lg border border-stone-100">
                                                                {ret.items.map((item, idx) => (
                                                                    <div key={idx} className="flex items-center justify-between">
                                                                        <span className="text-sm text-stone-700">{item.title}</span>
                                                                        <span className="text-sm font-semibold text-stone-600">Qty: {item.quantity}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Photos */}
                                                    {ret.photos.length > 0 && (
                                                        <div>
                                                            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Attached Proof</p>
                                                            <div className="flex gap-2 overflow-x-auto pb-2">
                                                                {ret.photos.map(photo => (
                                                                    <a href={photo.photo_url} target="_blank" rel="noreferrer" key={photo.id} className="w-20 h-20 rounded-lg border border-stone-200 overflow-hidden shrink-0 hover:border-lime-500 transition-colors">
                                                                        <img src={photo.photo_url} alt="Proof" className="w-full h-full object-cover" />
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Buyer contact */}
                                                    {ret.buyer_phone && (
                                                        <div className="flex items-center gap-2">
                                                            <a href={`tel:${ret.buyer_phone}`}
                                                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm transition-colors">
                                                                <PhoneCall className="w-4 h-4" />
                                                                Call Buyer ({ret.buyer_phone})
                                                            </a>
                                                        </div>
                                                    )}

                                                    {/* Action buttons */}
                                                    <div className="flex gap-3 pt-2">
                                                        {canProgress && (
                                                            <button
                                                                onClick={() => handleStatusUpdate(ret.id, ret.status)}
                                                                disabled={updatingId === ret.id}
                                                                className="flex-1 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-lime-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                                            >
                                                                {updatingId === ret.id ? 'Updating…' : `Mark as ${NEXT_RETURN_STATUS[ret.status]?.replace('_', ' ')}`}
                                                            </button>
                                                        )}
                                                        {ret.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleReject(ret.id)}
                                                                disabled={updatingId === ret.id}
                                                                className="px-6 py-2.5 border border-red-200 text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors flex items-center gap-1.5"
                                                            >
                                                                <XCircle className="w-4 h-4" /> Reject Return
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
