'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
    Package, PhoneCall, ChevronDown, ChevronUp,
    Clock, CheckCircle2, Truck, MapPin, XCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/userStore'
import { useToast } from '@/lib/toast'
import LottieLoader from '@/components/LottieLoader'

interface SellerOrder {
    id: string
    order_number: string
    status: string
    subtotal: number
    total_amount: number
    transport_fee: number
    platform_fee: number
    delivery_mode: string
    payment_method: string
    payment_status: string
    created_at: string
    buyer_id: string
    buyer_name?: string
    buyer_phone?: string
    items: { title: string; quantity: number; unit: string; price_per_unit: number; line_total: number }[]
}

const STATUS_FLOW = [
    { key: 'pending', label: 'Pending', icon: Clock, color: 'text-amber-500' },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2, color: 'text-blue-500' },
    { key: 'preparing', label: 'Preparing', icon: Package, color: 'text-purple-500' },
    { key: 'shipped', label: 'Shipped', icon: Truck, color: 'text-indigo-500' },
    { key: 'delivered', label: 'Delivered', icon: MapPin, color: 'text-lime-500' },
]

const NEXT_STATUS: Record<string, string> = {
    pending: 'confirmed',
    confirmed: 'preparing',
    preparing: 'shipped',
    shipped: 'delivered',
}

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
    preparing: 'bg-purple-100 text-purple-700 border-purple-200',
    shipped: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    out_for_delivery: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    delivered: 'bg-lime-100 text-lime-700 border-lime-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
}

export default function SellerOrdersPage() {
    const { user, isLoading: authLoading } = useUserStore()
    const toast = useToast()
    const [orders, setOrders] = useState<SellerOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [filterStatus, setFilterStatus] = useState<string>('all')

    useEffect(() => {
        if (authLoading) return;
        if (user) fetchOrders()
        else setLoading(false);
    }, [user, authLoading])

    async function fetchOrders() {
        setLoading(true)
        const { data: ordersData, error } = await supabase
            .from('orders')
            .select('*')
            .eq('seller_id', user!.id)
            .order('created_at', { ascending: false })

        if (error) { toast.error({ title: 'Failed to load orders', description: error.message }); setLoading(false); return }

        // Fetch buyer profiles + order items in parallel
        const enriched = await Promise.all((ordersData ?? []).map(async (o) => {
            const [buyerRes, itemsRes] = await Promise.all([
                supabase.from('profiles').select('full_name, phone').eq('id', o.buyer_id).single(),
                supabase.from('order_items').select('product_snapshot, quantity, unit, price_per_unit, line_total').eq('order_id', o.id),
            ])
            return {
                ...o,
                buyer_name: buyerRes.data?.full_name ?? 'Buyer',
                buyer_phone: buyerRes.data?.phone ?? null,
                items: (itemsRes.data ?? []).map((item) => ({
                    title: (item.product_snapshot as { title?: string })?.title ?? 'Product',
                    quantity: Number(item.quantity),
                    unit: item.unit,
                    price_per_unit: Number(item.price_per_unit),
                    line_total: Number(item.line_total),
                })),
            } as SellerOrder
        }))

        setOrders(enriched)
        setLoading(false)
    }

    async function handleStatusUpdate(orderId: string, currentStatus: string) {
        const next = NEXT_STATUS[currentStatus]
        if (!next) return
        setUpdatingId(orderId)
        const { error } = await supabase.from('orders').update({ status: next }).eq('id', orderId)
        if (error) { toast.error({ title: 'Update failed', description: error.message }); setUpdatingId(null); return }
        toast.orderStatusUpdated(next)
        setUpdatingId(null)
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: next } : o))
    }

    async function handleCancel(orderId: string) {
        const { error } = await supabase.from('orders').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', orderId)
        if (error) { toast.error({ title: 'Failed to cancel order' }); return }
        toast.info({ title: 'Order cancelled', description: 'Buyer has been notified' })
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o))
    }

    const filtered = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus)

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#f5f1ea] flex items-center justify-center">
                <LottieLoader />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#f5f1ea] flex items-center justify-center p-8 text-center">
                <div className="text-center">
                    <p className="text-stone-500 font-medium mb-4">Please sign in to view your orders</p>
                    <Link href="/" className="px-6 py-2 bg-lime-400 text-stone-900 rounded-xl font-bold">
                        Go Home
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f5f1ea]">
            <div className="max-w-4xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-serif font-bold text-stone-800">Incoming Orders</h1>
                    <p className="text-stone-500 mt-1">Manage and fulfill your buyer orders</p>
                </div>

                {/* Filter pills */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                    {['all', 'pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'].map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-colors ${filterStatus === s
                                ? 'bg-stone-900 text-white'
                                : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300'
                                }`}
                        >
                            {s === 'all' ? 'All Orders' : s.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2].map(i => <div key={i} className="bg-white rounded-2xl border border-stone-200 p-6 h-28 animate-pulse" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-stone-200 py-20 text-center">
                        <Package className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                        <p className="text-stone-500 text-sm">No orders yet. List some produce to start selling!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((order, i) => {
                            const isExpanded = expandedId === order.id
                            const statusIdx = STATUS_FLOW.findIndex(s => s.key === order.status)
                            const canProgress = !!NEXT_STATUS[order.status]

                            return (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:border-stone-300 hover:shadow-sm transition-all"
                                >
                                    {/* Header row */}
                                    <div className="flex items-center gap-4 p-5 cursor-pointer"
                                        onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <p className="font-bold text-stone-800 text-sm">{order.order_number}</p>
                                                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium capitalize ${STATUS_COLORS[order.status] ?? 'bg-stone-100 text-stone-600 border-stone-200'}`}>
                                                    {order.status.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-stone-500 mt-0.5">
                                                {order.buyer_name} · {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-bold text-stone-800">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
                                            <p className="text-xs text-stone-400">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
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
                                                <div className="border-t border-stone-100 p-5 space-y-4">
                                                    {/* Status timeline */}
                                                    <div className="flex items-center gap-1">
                                                        {STATUS_FLOW.map((s, idx) => (
                                                            <div key={s.key} className="flex items-center gap-1 flex-1 last:flex-none">
                                                                <div className={`flex flex-col items-center ${idx <= statusIdx ? s.color : 'text-stone-300'}`}>
                                                                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${idx <= statusIdx ? 'border-current bg-current/10' : 'border-stone-200'}`}>
                                                                        <s.icon className="w-3.5 h-3.5" />
                                                                    </div>
                                                                    <span className="text-[9px] mt-1 font-medium text-center">{s.label}</span>
                                                                </div>
                                                                {idx < STATUS_FLOW.length - 1 && (
                                                                    <div className={`flex-1 h-0.5 mx-1 mb-4 ${idx < statusIdx ? 'bg-lime-400' : 'bg-stone-200'}`} />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Items */}
                                                    <div>
                                                        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Items</p>
                                                        <div className="space-y-1.5">
                                                            {order.items.map((item, idx) => (
                                                                <div key={idx} className="flex items-center justify-between">
                                                                    <span className="text-sm text-stone-700">{item.title}</span>
                                                                    <span className="text-sm text-stone-500">{item.quantity} {item.unit} × ₹{item.price_per_unit}</span>
                                                                    <span className="text-sm font-semibold text-stone-800">₹{item.line_total.toLocaleString('en-IN')}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="mt-3 pt-3 border-t border-stone-100 flex justify-between text-sm">
                                                            <span className="text-stone-500">Total (incl. fees)</span>
                                                            <span className="font-bold text-stone-800">₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
                                                        </div>
                                                    </div>

                                                    {/* Buyer contact */}
                                                    {order.buyer_phone && (
                                                        <div className="flex items-center gap-2">
                                                            <a href={`tel:${order.buyer_phone}`}
                                                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm transition-colors">
                                                                <PhoneCall className="w-4 h-4" />
                                                                Call Buyer ({order.buyer_phone})
                                                            </a>
                                                        </div>
                                                    )}

                                                    {/* Action buttons */}
                                                    <div className="flex gap-3">
                                                        {canProgress && (
                                                            <button
                                                                onClick={() => handleStatusUpdate(order.id, order.status)}
                                                                disabled={updatingId === order.id}
                                                                className="flex-1 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-lime-600 disabled:opacity-50 transition-colors"
                                                            >
                                                                {updatingId === order.id ? 'Updating…' : `Mark as ${NEXT_STATUS[order.status]?.replace('_', ' ')}`}
                                                            </button>
                                                        )}
                                                        {['pending', 'confirmed'].includes(order.status) && (
                                                            <button
                                                                onClick={() => handleCancel(order.id)}
                                                                className="px-4 py-2.5 border border-red-200 text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors flex items-center gap-1.5"
                                                            >
                                                                <XCircle className="w-4 h-4" /> Cancel
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
