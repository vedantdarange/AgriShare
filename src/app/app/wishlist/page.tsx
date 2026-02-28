'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Heart, Bookmark, Package, MapPin, Star, ArrowRight, Store, ChevronRight, Loader2, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/userStore'
import { useToast } from '@/lib/toast'
import LottieLoader from "@/components/LottieLoader";


interface SavedProduct {
    id: string
    product: {
        id: string
        title: string
        price_per_unit: number
        unit: string
        images: string[]
        is_organic: boolean
        avg_rating: number
        total_reviews: number
        seller: {
            full_name: string
            district: string
        }
    }
}

interface SavedSeller {
    id: string
    seller: {
        id: string
        full_name: string
        avatar_url: string
        village: string
        district: string
        products: { count: number }[]
    }
}

export default function WishlistPage() {
    const { user, isLoading: authLoading } = useUserStore()
    const toast = useToast()
    const [activeTab, setActiveTab] = useState<'products' | 'sellers'>('products')
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState<SavedProduct[]>([])
    const [sellers, setSellers] = useState<SavedSeller[]>([])

    useEffect(() => {
        if (authLoading) return;
        if (user) fetchSavedItems()
        else setLoading(false);
    }, [user, authLoading, activeTab])

    async function fetchSavedItems() {
        if (!user) return
        const timeout = setTimeout(() => {
            setLoading(false)
        }, 10000)

        setLoading(true)

        try {
            if (activeTab === 'products') {
                const { data } = await supabase
                    .from('saved_products')
                    .select(`
                        id,
                        product:products(
                            id, title, price_per_unit, unit, images, is_organic, avg_rating, total_reviews,
                            seller:profiles!products_seller_id_fkey(full_name, district)
                        )
                    `)
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })

                // Format the data properly as the nested joins might return arrays
                const formatted = (data || []).map(item => {
                    const productObj = Array.isArray(item.product) ? item.product[0] : item.product;
                    const sellerObj = Array.isArray(productObj?.seller) ? productObj.seller[0] : productObj?.seller;
                    return {
                        id: item.id,
                        product: {
                            ...productObj,
                            seller: sellerObj || { full_name: 'Unknown', district: 'Unknown' }
                        }
                    }
                })
                setProducts(formatted as any);
            } else {
                // Fetch saved sellers, plus a count of their active products
                const { data } = await supabase
                    .from('saved_sellers')
                    .select(`
                        id,
                        seller:profiles!saved_sellers_seller_id_fkey(
                            id, full_name, avatar_url, village, district,
                            products(count)
                        )
                    `)
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })

                const formatted = (data || []).map(item => {
                    const sellerObj = Array.isArray(item.seller) ? item.seller[0] : item.seller;
                    return { id: item.id, seller: sellerObj }
                })
                setSellers(formatted as any);
            }
        } catch (e: any) {
            console.error("Wishlist fetch error:", e)
            toast.error({ title: 'Failed to load wishlist' })
        } finally {
            clearTimeout(timeout)
            setLoading(false)
        }
    }

    async function handleRemoveProduct(savedId: string, e: React.MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        setProducts(p => p.filter(x => x.id !== savedId))
        await supabase.from('saved_products').delete().eq('id', savedId)
        toast.success({ title: 'Removed from Wishlist' })
    }

    async function handleRemoveSeller(savedId: string, e: React.MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        setSellers(s => s.filter(x => x.id !== savedId))
        await supabase.from('saved_sellers').delete().eq('id', savedId)
        toast.success({ title: 'Removed from Saved Sellers' })
    }

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#f5f1ea] flex items-center justify-center">
                <LottieLoader />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#f5f1ea] flex flex-col items-center justify-center p-8 text-center">
                <Heart className="w-16 h-16 text-stone-300 mb-6" />
                <h1 className="text-2xl font-bold text-stone-800 mb-2">Sign in to view Wishlist</h1>
                <p className="text-stone-500 mb-8 max-w-sm">Save your favorite produce and farmers to quickly find them later.</p>
                <Link href="/" className="px-6 py-3 bg-stone-800 text-white font-bold rounded-xl hover:bg-stone-700 transition">
                    Sign In
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f5f1ea]">
            <div className="max-w-5xl mx-auto px-6 py-12">
                <div className="mb-10">
                    <h1 className="font-serif text-4xl font-bold text-stone-800">Your Lists</h1>
                    <p className="text-stone-500 mt-2">Manage your saved produce and favorite farmers.</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 ${activeTab === 'products' ? 'bg-lime-400 text-stone-900 border-2 border-transparent' : 'bg-white border-2 border-stone-200 text-stone-500 hover:border-lime-300'}`}
                    >
                        <Heart className={`w-5 h-5 ${activeTab === 'products' ? 'fill-stone-900' : ''}`} />
                        Saved Produce
                    </button>
                    <button
                        onClick={() => setActiveTab('sellers')}
                        className={`px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 ${activeTab === 'sellers' ? 'bg-stone-800 text-white border-2 border-transparent' : 'bg-white border-2 border-stone-200 text-stone-500 hover:border-stone-400'}`}
                    >
                        <Bookmark className={`w-5 h-5 ${activeTab === 'sellers' ? 'fill-white' : ''}`} />
                        Saved Farmers
                    </button>
                </div>

                {/* Content */}
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200 shadow-sm min-h-[500px]">
                    {loading ? (
                        <div className="h-[400px] flex flex-col items-center justify-center text-stone-400">
                            <LottieLoader size={32} />
                            <p>Loading your saved items...</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {activeTab === 'products' ? (
                                <motion.div
                                    key="products"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    {products.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-center">
                                            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-6">
                                                <Heart className="w-8 h-8 text-stone-300" />
                                            </div>
                                            <h3 className="text-xl font-bold text-stone-700 mb-2">Your wishlist is empty</h3>
                                            <p className="text-stone-500 max-w-sm mb-8">Save items you like to keep track of them here for later.</p>
                                            <Link href="/app/browse" className="px-6 py-3 bg-lime-400 text-stone-900 font-bold rounded-xl hover:bg-lime-300 transition-colors">
                                                Browse Produce
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {products.map(({ id, product }) => (
                                                <Link key={id} href={`/app/product/${product.id}`} className="group relative block rounded-2xl border border-stone-200 overflow-hidden hover:border-lime-400 transition-colors bg-stone-50">
                                                    <div className="aspect-[4/3] relative bg-stone-200">
                                                        <img src={product.images?.[0] || 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400'} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                        <button
                                                            onClick={(e) => handleRemoveProduct(id, e)}
                                                            className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-white shadow-sm transition-colors"
                                                            title="Remove from Wishlist"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="p-4 bg-white">
                                                        <h4 className="font-bold text-stone-800 truncate mb-1">{product.title}</h4>
                                                        <div className="flex items-end justify-between mb-3">
                                                            <div className="text-lime-600 font-bold">₹{product.price_per_unit}<span className="text-stone-400 text-xs font-normal">/{product.unit}</span></div>
                                                            <div className="flex items-center gap-1 text-xs text-stone-500">
                                                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                                {Number(product.avg_rating).toFixed(1)}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-stone-500 border-t border-stone-100 pt-3">
                                                            <MapPin className="w-3.5 h-3.5 text-stone-400" />
                                                            <span className="truncate">{product.seller?.full_name}, {product.seller?.district}</span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="sellers"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    {sellers.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-center">
                                            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-6">
                                                <Store className="w-8 h-8 text-stone-300" />
                                            </div>
                                            <h3 className="text-xl font-bold text-stone-700 mb-2">No saved farmers</h3>
                                            <p className="text-stone-500 max-w-sm mb-8">Save trusted farmers to easily find their produce again.</p>
                                            <Link href="/app/browse" className="px-6 py-3 bg-stone-800 text-white font-bold rounded-xl hover:bg-stone-700 transition-colors">
                                                Explore Farmers
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {sellers.map(({ id, seller }) => {
                                                const productCount = seller.products?.[0]?.count || 0;
                                                return (
                                                    <div key={id} className="flex gap-4 p-4 rounded-2xl border border-stone-200 hover:border-stone-300 transition-colors bg-stone-50">
                                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lime-200 to-emerald-300 flex items-center justify-center text-stone-700 font-bold text-xl overflow-hidden shrink-0">
                                                            {seller.avatar_url ? <img src={seller.avatar_url} alt="" className="w-full h-full object-cover" /> : seller.full_name?.[0]}
                                                        </div>
                                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                            <h4 className="font-bold text-stone-800 truncate text-lg leading-tight">{seller.full_name}</h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs text-stone-500 flex items-center gap-1 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                                                                    <MapPin className="w-3 h-3 text-lime-600" /> {seller.village ? `${seller.village}, ` : ''}{seller.district}
                                                                </span>
                                                                <span className="text-xs text-stone-500 flex items-center gap-1 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                                                                    <Package className="w-3 h-3 text-stone-400" /> {productCount} Listings
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => handleRemoveSeller(id, e)}
                                                            className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-400 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm self-center"
                                                            title="Remove saved seller"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    )
}
