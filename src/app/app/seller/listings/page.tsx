'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
    Plus, Package, Edit3, Trash2, Copy, Eye,
    Leaf, Check, X, AlertCircle, TrendingUp
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/userStore'
import { useToast } from '@/lib/toast'
import LottieLoader from '@/components/LottieLoader'

const TABS = ['active', 'draft', 'sold_out', 'expired'] as const
type TabType = typeof TABS[number]

interface Product {
    id: string
    title: string
    variety: string | null
    price_per_unit: number
    unit: string
    quantity_available: number
    status: string
    is_organic: boolean
    images: string[]
    district: string | null
    views_count: number
    avg_rating: number
    total_reviews: number
    created_at: string
}

interface EditState {
    productId: string
    price: string
    quantity: string
}

export default function SellerListingsPage() {
    const { user, isLoading: authLoading } = useUserStore()
    const toast = useToast()
    const [tab, setTab] = useState<TabType>('active')
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [editState, setEditState] = useState<EditState | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    useEffect(() => {
        if (authLoading) return;
        if (user) fetchProducts()
        else setLoading(false);
    }, [user, authLoading, tab])

    async function fetchProducts() {
        setLoading(true)
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('seller_id', user!.id)
            .eq('status', tab)
            .order('created_at', { ascending: false })

        if (error) toast.error({ title: 'Failed to load listings', description: error.message })
        else setProducts((data as Product[]) ?? [])
        setLoading(false)
    }

    async function handleDelete(id: string) {
        setDeletingId(id)
        const { error } = await supabase.from('products').delete().eq('id', id)
        if (error) { toast.error({ title: 'Failed to delete', description: error.message }); setDeletingId(null); return }
        toast.listingDeleted()
        setDeletingId(null)
        setProducts(prev => prev.filter(p => p.id !== id))
    }

    async function handleStatusChange(id: string, newStatus: string) {
        const { error } = await supabase.from('products').update({ status: newStatus }).eq('id', id)
        if (error) { toast.error({ title: 'Failed to update status' }); return }
        toast.listingStatusChanged(newStatus.replace('_', ' '))
        setProducts(prev => prev.filter(p => p.id !== id))
    }

    async function handleDuplicate(product: Product) {
        const { id, created_at, views_count, avg_rating, total_reviews, ...rest } = product
        const { error } = await supabase.from('products').insert({
            ...rest,
            seller_id: user!.id,
            title: `${product.title} (Copy)`,
            status: 'draft',
        })
        if (error) { toast.error({ title: 'Failed to duplicate' }); return }
        toast.success({ title: 'Copied as draft', description: 'Find it in your Drafts tab' })
        if (tab === 'draft') fetchProducts()
    }

    async function handleInlineEdit(id: string) {
        if (!editState) return
        const { error } = await supabase.from('products').update({
            price_per_unit: parseFloat(editState.price),
            quantity_available: parseFloat(editState.quantity),
        }).eq('id', id)
        if (error) { toast.error({ title: 'Failed to save changes' }); return }
        toast.listingUpdated()
        setEditState(null)
        fetchProducts()
    }

    const tabCounts: Record<TabType, number> = { active: 0, draft: 0, sold_out: 0, expired: 0 }


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
                    <p className="text-stone-500 font-medium mb-4">Please sign in to view your listings</p>
                    <Link href="/" className="px-6 py-2 bg-lime-400 text-stone-900 rounded-xl font-bold">
                        Go Home
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f5f1ea]">
            <div className="max-w-5xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-stone-800">My Listings</h1>
                        <p className="text-stone-500 mt-1">Manage your produce listings</p>
                    </div>
                    <Link
                        href="/app/seller/new-listing"
                        className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl font-medium text-sm hover:bg-lime-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> New Listing
                    </Link>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                    {TABS.map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize whitespace-nowrap transition-colors ${tab === t
                                ? 'bg-stone-900 text-white'
                                : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300'
                                }`}
                        >
                            {t.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                {/* Products */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 animate-pulse">
                                <div className="flex gap-4">
                                    <div className="w-20 h-20 bg-stone-100 rounded-xl" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-stone-100 rounded w-1/2" />
                                        <div className="h-3 bg-stone-100 rounded w-1/4" />
                                        <div className="h-3 bg-stone-100 rounded w-1/3" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-stone-200 py-20 text-center">
                        <Package className="w-12 h-12 text-stone-200 mx-auto mb-3" />
                        <p className="text-stone-500 text-sm font-medium">No {tab.replace('_', ' ')} listings yet</p>
                        {tab === 'active' && (
                            <Link href="/app/seller/new-listing"
                                className="inline-flex items-center gap-1 mt-3 text-sm text-lime-600 hover:underline font-medium">
                                <Plus className="w-4 h-4" /> Create your first listing
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {products.map((product, i) => {
                                const isEditing = editState?.productId === product.id
                                return (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:border-stone-300 hover:shadow-sm transition-all"
                                    >
                                        <div className="flex gap-4 p-5">
                                            {/* Image */}
                                            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-lime-100 to-green-100 overflow-hidden shrink-0">
                                                {product.images?.[0] ? (
                                                    <img src={product.images[0]} alt={product.title}
                                                        className="w-full h-full object-cover"
                                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Leaf className="w-8 h-8 text-lime-300" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className="font-semibold text-stone-800 truncate">{product.title}</h3>
                                                        {product.variety && <p className="text-xs text-stone-400">{product.variety}</p>}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {product.is_organic && (
                                                            <span className="text-[10px] px-2 py-0.5 bg-lime-100 text-lime-700 rounded-full font-medium flex items-center gap-0.5">
                                                                <Leaf className="w-2.5 h-2.5" /> Organic
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Price + Qty — inline editable */}
                                                {isEditing ? (
                                                    <div className="flex gap-2 mt-2">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs text-stone-500">₹</span>
                                                            <input
                                                                type="number"
                                                                value={editState.price}
                                                                onChange={e => setEditState(s => s && ({ ...s, price: e.target.value }))}
                                                                className="w-20 px-2 py-1 text-sm border border-lime-400 rounded-lg focus:outline-none"
                                                                autoFocus
                                                            />
                                                            <span className="text-xs text-stone-400">/{product.unit}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="number"
                                                                value={editState.quantity}
                                                                onChange={e => setEditState(s => s && ({ ...s, quantity: e.target.value }))}
                                                                className="w-20 px-2 py-1 text-sm border border-stone-200 rounded-lg focus:outline-none"
                                                            />
                                                            <span className="text-xs text-stone-400">{product.unit}</span>
                                                        </div>
                                                        <button onClick={() => handleInlineEdit(product.id)}
                                                            className="p-1.5 rounded-lg bg-lime-500 text-white hover:bg-lime-400 transition-colors">
                                                            <Check className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => setEditState(null)}
                                                            className="p-1.5 rounded-lg bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors">
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className="text-base font-bold text-stone-800">
                                                            ₹{Number(product.price_per_unit).toLocaleString('en-IN')}
                                                            <span className="text-xs text-stone-400 font-normal ml-1">/{product.unit}</span>
                                                        </span>
                                                        <span className="text-xs text-stone-500">{product.quantity_available} {product.unit} left</span>
                                                        {product.district && (
                                                            <span className="text-xs text-stone-400">📍 {product.district}</span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Stats row */}
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <span className="text-xs text-stone-400 flex items-center gap-1">
                                                        <Eye className="w-3 h-3" /> {product.views_count} views
                                                    </span>
                                                    {product.avg_rating > 0 && (
                                                        <span className="text-xs text-stone-400 flex items-center gap-1">
                                                            ⭐ {product.avg_rating} ({product.total_reviews})
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-stone-400">
                                                        {new Date(product.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col gap-1.5 shrink-0">
                                                <button
                                                    onClick={() => setEditState({ productId: product.id, price: String(product.price_per_unit), quantity: String(product.quantity_available) })}
                                                    title="Edit price & qty"
                                                    className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDuplicate(product)}
                                                    title="Duplicate"
                                                    className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    disabled={deletingId === product.id}
                                                    title="Delete"
                                                    className="p-2 rounded-lg text-stone-500 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Status change bar */}
                                        {tab === 'active' && (
                                            <div className="border-t border-stone-100 px-5 py-2.5 bg-stone-50 flex gap-3">
                                                <button onClick={() => handleStatusChange(product.id, 'sold_out')}
                                                    className="text-xs text-amber-600 hover:text-amber-700 font-medium">
                                                    Mark Sold Out
                                                </button>
                                                <button onClick={() => handleStatusChange(product.id, 'draft')}
                                                    className="text-xs text-stone-500 hover:text-stone-700 font-medium">
                                                    Move to Draft
                                                </button>
                                            </div>
                                        )}
                                        {tab === 'draft' && (
                                            <div className="border-t border-stone-100 px-5 py-2.5 bg-stone-50 flex gap-3">
                                                <button onClick={() => handleStatusChange(product.id, 'active')}
                                                    className="text-xs text-lime-600 hover:text-lime-700 font-medium">
                                                    Publish Now
                                                </button>
                                            </div>
                                        )}
                                        {tab === 'sold_out' && (
                                            <div className="border-t border-stone-100 px-5 py-2.5 bg-stone-50 flex gap-3">
                                                <button onClick={() => handleStatusChange(product.id, 'active')}
                                                    className="text-xs text-lime-600 hover:text-lime-700 font-medium">
                                                    Reactivate
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    )
}
