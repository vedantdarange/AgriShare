'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Store, Search, Trash2, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/userStore'
import { useToast } from '@/lib/toast'

type Tab = 'products' | 'sellers' | 'searches'

export default function SavedItemsHub() {
    const { user } = useUserStore()
    const toast = useToast()
    const [activeTab, setActiveTab] = useState<Tab>('products')
    const [loading, setLoading] = useState(true)

    // Data states
    const [savedProducts, setSavedProducts] = useState<any[]>([])
    const [savedSellers, setSavedSellers] = useState<any[]>([])
    const [savedSearches, setSavedSearches] = useState<any[]>([])

    useEffect(() => {
        if (user) {
            fetchAll()
        }
    }, [user])

    const fetchAll = async () => {
        setLoading(true)
        try {
            const [productsRes, sellersRes, searchesRes] = await Promise.all([
                supabase.from('saved_products').select('*, product:products(*)').eq('user_id', user!.id).order('created_at', { ascending: false }),
                supabase.from('saved_sellers').select('*, seller:profiles(*)').eq('user_id', user!.id).order('created_at', { ascending: false }),
                supabase.from('saved_searches').select('*').eq('user_id', user!.id).order('created_at', { ascending: false })
            ])

            if (productsRes.data) setSavedProducts(productsRes.data)
            if (sellersRes.data) setSavedSellers(sellersRes.data)
            if (searchesRes.data) setSavedSearches(searchesRes.data)
        } catch (error) {
            console.error('Fetch error:', error)
            toast.error({ title: 'Failed to load saved items' })
        } finally {
            setLoading(false)
        }
    }

    const removeProduct = async (id: string, productId: string) => {
        setSavedProducts(prev => prev.filter(p => p.id !== id))
        await supabase.from('saved_products').delete().match({ user_id: user!.id, product_id: productId })
        toast.success({ title: 'Removed from wishlist' })
    }

    const removeSeller = async (id: string, sellerId: string) => {
        setSavedSellers(prev => prev.filter(s => s.id !== id))
        await supabase.from('saved_sellers').delete().match({ user_id: user!.id, seller_id: sellerId })
        toast.info({ title: 'Seller removed from favorites' })
    }

    const removeSearch = async (id: string) => {
        setSavedSearches(prev => prev.filter(s => s.id !== id))
        await supabase.from('saved_searches').delete().eq('id', id)
        toast.info({ title: 'Saved search removed' })
    }

    const tabs: { id: Tab; label: string; icon: any; count: number }[] = [
        { id: 'products', label: 'Wishlist', icon: Heart, count: savedProducts.length },
        { id: 'sellers', label: 'Favorite Sellers', icon: Store, count: savedSellers.length },
        { id: 'searches', label: 'Saved Searches', icon: Search, count: savedSearches.length }
    ]

    return (
        <div className="min-h-screen bg-[#f5f1ea] pb-24">
            <div className="max-w-4xl mx-auto px-6 py-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-serif font-bold text-stone-800">Saved Items</h1>
                    <p className="text-stone-500 mt-1">Manage your favorite products, sellers, and search alerts</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-white rounded-2xl p-1.5 border border-stone-200 shadow-sm mb-6 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-stone-900 text-white shadow-md'
                                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="bg-white rounded-3xl border border-stone-200 p-6 min-h-[400px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-full min-h-[300px]">
                            <Loader2 className="w-8 h-8 text-lime-600 animate-spin" />
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* PRODUCTS TAB */}
                                {activeTab === 'products' && (
                                    savedProducts.length === 0 ? (
                                        <EmptyState icon={Heart} title="Your wishlist is empty" message="Save products you want to buy later by tapping the heart icon on any listing." />
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                            {savedProducts.map((item) => (
                                                <div key={item.id} className="group relative border border-stone-100 rounded-2xl overflow-hidden hover:border-lime-200 hover:shadow-md transition-all">
                                                    <div className="aspect-square bg-stone-100 relative">
                                                        {item.product?.images?.[0] ? (
                                                            <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-stone-300"><Heart /></div>
                                                        )}
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); removeProduct(item.id, item.product_id); }}
                                                            className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                                                        >
                                                            <Heart className="w-4 h-4 fill-current" />
                                                        </button>
                                                    </div>
                                                    <Link href={`/app/product/${item.product_id}`} className="block p-4">
                                                        <h3 className="font-medium text-stone-800 truncate">{item.product?.title || 'Unknown Product'}</h3>
                                                        <p className="font-bold text-lime-700 mt-1">₹{item.product?.price} <span className="text-xs text-stone-400 font-normal">/ {item.product?.unit}</span></p>
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                )}

                                {/* SELLERS TAB */}
                                {activeTab === 'sellers' && (
                                    savedSellers.length === 0 ? (
                                        <EmptyState icon={Store} title="No saved sellers yet" message="Save your favorite farmers to quickly find their fresh produce again." />
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {savedSellers.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border border-stone-100 hover:border-lime-200 transition-colors bg-stone-50">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-gradient-to-br from-lime-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                            {item.seller?.full_name?.[0]?.toUpperCase() || 'S'}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-stone-800">{item.seller?.full_name || 'Farmer'}</h3>
                                                            {item.seller?.district && <p className="text-xs text-stone-500">{item.seller.district}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button className="p-2 text-stone-400 hover:text-stone-700 bg-white rounded-xl shadow-sm border border-stone-100 transition-colors">
                                                            <ArrowRight className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => removeSeller(item.id, item.seller_id)}
                                                            className="p-2 text-red-400 hover:text-red-600 bg-white rounded-xl shadow-sm border border-stone-100 hover:bg-red-50 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                )}

                                {/* SEARCHES TAB */}
                                {activeTab === 'searches' && (
                                    savedSearches.length === 0 ? (
                                        <EmptyState icon={Search} title="No saved searches" message="Save searches like 'Tomatoes under ₹40' to easily check market prices." />
                                    ) : (
                                        <div className="space-y-3">
                                            {savedSearches.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border border-stone-100 hover:border-lime-200 transition-colors group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-stone-100 text-stone-500 rounded-xl flex items-center justify-center group-hover:bg-lime-100 group-hover:text-lime-600 transition-colors">
                                                            <Search className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-medium text-stone-800">"{item.query}"</h3>
                                                            <p className="text-xs text-stone-400">Added {new Date(item.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Link href={`/app/browse?q=${encodeURIComponent(item.query)}`} className="text-sm font-medium text-lime-600 hover:text-lime-700 bg-lime-50 px-4 py-2 rounded-xl transition-colors">
                                                            Search Now
                                                        </Link>
                                                        <button
                                                            onClick={() => removeSearch(item.id)}
                                                            className="p-2 text-stone-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    )
}

function EmptyState({ icon: Icon, title, message }: { icon: any, title: string, message: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]">
            <div className="w-16 h-16 bg-stone-50 text-stone-300 rounded-2xl flex items-center justify-center mb-4">
                <Icon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-stone-800 mb-2">{title}</h3>
            <p className="text-stone-500 text-sm max-w-[280px] leading-relaxed">{message}</p>
        </div>
    )
}
