'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
    ArrowLeft, ChevronRight, Star, MapPin, Plus, Minus,
    ShoppingCart, MessageSquare, Phone, Leaf, ShieldCheck,
    CalendarDays, Scale, Eye, CheckCircle2, Loader2, Heart, Bookmark
} from 'lucide-react'
import LottieLoader from "@/components/LottieLoader";
import { supabase } from '@/lib/supabase/client'

import { useUserStore } from '@/lib/store/userStore'
import { useCartStore } from '@/lib/store/cartStore'
import { useToast } from '@/lib/toast'
import { ProductReviews } from './ProductReviews'

interface Product {
    id: string
    title: string
    variety: string | null
    description: string | null
    price_per_unit: number
    unit: string
    quantity_available: number
    minimum_order: number
    harvest_date: string | null
    is_organic: boolean
    certification_url: string | null
    images: string[]
    village: string | null
    district: string | null
    views_count: number
    avg_rating: number
    total_reviews: number
    seller_id: string
    seller?: {
        full_name: string | null
        avatar_url: string | null
        phone: string | null
        village: string | null
        district: string | null
        verified_farmer: boolean | null
    }
    category?: { name: string; slug: string } | null
}

const HIGHLIGHTS_BY_ORGANIC = (organic: boolean) => organic
    ? ['Certified Organic Produce', 'No Synthetic Pesticides', 'Sustainable Farming Practices', 'Direct from Farmer']
    : ['Farm Fresh Quality', 'Directly from Farmer', 'Best Market Price', 'Freshly Harvested']

export default function ProductDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useUserStore()
    const { addItem } = useCartStore()
    const toast = useToast()

    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [qty, setQty] = useState(1)
    const [activeImage, setActiveImage] = useState(0)
    const [isAdding, setIsAdding] = useState(false)
    const [messagingLoading, setMessagingLoading] = useState(false)
    const [isProductSaved, setIsProductSaved] = useState(false)
    const [isSellerSaved, setIsSellerSaved] = useState(false)
    const [isSavingProduct, setIsSavingProduct] = useState(false)
    const [isSavingSeller, setIsSavingSeller] = useState(false)

    useEffect(() => {
        const id = params?.id as string
        if (id) fetchProduct(id)
    }, [params?.id])

    async function fetchProduct(id: string) {
        setLoading(true)
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                seller:profiles!products_seller_id_fkey(full_name, avatar_url, phone, village, district, verified_farmer),
                category:categories(name, slug)
            `)
            .eq('id', id)
            .single()

        if (error || !data) {
            toast.error('Product not found')
            router.push('/app/browse')
            return
        }
        setProduct(data as unknown as Product)
        setQty(data.minimum_order ?? 1)

        // Check wishlist states
        if (user) {
            const [savedProductRes, savedSellerRes] = await Promise.all([
                supabase.from('saved_products').select('id').eq('user_id', user.id).eq('product_id', id).maybeSingle(),
                supabase.from('saved_sellers').select('id').eq('user_id', user.id).eq('seller_id', data.seller_id).maybeSingle()
            ])
            setIsProductSaved(!!savedProductRes.data)
            setIsSellerSaved(!!savedSellerRes.data)
        }

        setLoading(false)

        // Increment view count (fire and forget)
        supabase.from('products').update({ views_count: (data.views_count ?? 0) + 1 }).eq('id', id).then(() => { })
    }

    async function handleAddToCart() {
        if (!user) { toast.notSignedIn(() => router.push('/')); return }
        if (!product) return
        setIsAdding(true)
        // Add to Supabase cart_items
        const { error } = await supabase.from('cart_items').upsert({
            user_id: user.id,
            product_id: product.id,
            quantity: qty,
        }, { onConflict: 'user_id,product_id' })
        // Also sync to local Zustand store for instant badge update
        if (!error) {
            addItem({
                id: product.id,
                product_id: product.id,
                seller_id: product.seller_id,
                title: product.title,
                variety: product.variety ?? undefined,
                price_per_unit: product.price_per_unit,
                unit: product.unit,
                quantity: qty,
                image: product.images?.[0],
                seller_name: product.seller?.full_name ?? 'Farmer',
                available_quantity: product.quantity_available,
            })
            toast.addedToCart(
                product.title,
                qty,
                product.unit,
                product.images?.[0],
                () => router.push('/app/cart')
            )
        } else {
            toast.error({ title: 'Could not add to cart', description: error.message })
        }
        setTimeout(() => setIsAdding(false), 1200)
    }

    async function handleMessage() {
        if (!user) { toast.notSignedIn(() => router.push('/')); return }
        if (!product) return
        if (user.id === product.seller_id) { toast.warning({ title: "Cannot message yourself" }); return }
        setMessagingLoading(true)
        try {
            // Check if conversation already exists between this buyer & seller for this product
            const { data: existing } = await supabase
                .from('conversations')
                .select('id')
                .eq('buyer_id', user.id)
                .eq('seller_id', product.seller_id)
                .eq('product_id', product.id)
                .maybeSingle()

            let convId = existing?.id
            if (!convId) {
                const { data: newConv, error } = await supabase
                    .from('conversations')
                    .insert({
                        buyer_id: user.id,
                        seller_id: product.seller_id,
                        product_id: product.id,
                    })
                    .select('id')
                    .single()
                if (error || !newConv) throw error ?? new Error('Failed to create conversation')
                convId = newConv.id
            }
            router.push(`/app/messages?conv=${convId}`)
        } catch (e: unknown) {
            toast.error({ title: 'Could not start chat', description: (e as Error).message })
        } finally {
            setMessagingLoading(false)
        }
    }

    async function toggleSaveProduct() {
        if (!user) { toast.notSignedIn(() => router.push('/')); return }
        if (!product) return
        setIsSavingProduct(true)
        try {
            if (isProductSaved) {
                await supabase.from('saved_products').delete().match({ user_id: user.id, product_id: product.id })
                setIsProductSaved(false)
                toast.success({ title: 'Removed from Wishlist' })
            } else {
                await supabase.from('saved_products').insert({ user_id: user.id, product_id: product.id })
                setIsProductSaved(true)
                toast.success({ title: 'Added to Wishlist' })
            }
        } catch {
            toast.error({ title: 'Failed to update wishlist' })
        } finally {
            setIsSavingProduct(false)
        }
    }

    async function toggleSaveSeller() {
        if (!user) { toast.notSignedIn(() => router.push('/')); return }
        if (!product) return
        setIsSavingSeller(true)
        try {
            if (isSellerSaved) {
                await supabase.from('saved_sellers').delete().match({ user_id: user.id, seller_id: product.seller_id })
                setIsSellerSaved(false)
                toast.success({ title: 'Removed saved seller' })
            } else {
                await supabase.from('saved_sellers').insert({ user_id: user.id, seller_id: product.seller_id })
                setIsSellerSaved(true)
                toast.success({ title: 'Seller saved to favorites' })
            }
        } catch {
            toast.error({ title: 'Failed to update saved sellers' })
        } finally {
            setIsSavingSeller(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f5f1ea] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-lime-500 animate-spin" />
            </div>
        )
    }

    if (!product) return null

    const totalPrice = qty * product.price_per_unit
    const images = product.images?.length ? product.images : ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&q=80']
    const highlights = HIGHLIGHTS_BY_ORGANIC(!!product.is_organic)

    return (
        <div className="min-h-screen bg-[#f5f1ea]">
            {/* Grain overlay */}
            <div className="fixed inset-0 opacity-[0.02] pointer-events-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

            <div className="max-w-6xl mx-auto px-8 py-8">
                {/* Breadcrumb */}
                <motion.nav
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-sm text-stone-500 mb-8"
                >
                    <Link href="/app/browse" className="hover:text-stone-800 flex items-center gap-1 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Browse
                    </Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-stone-400">{product.category?.name ?? 'Product'}</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-stone-800 font-medium">{product.title}</span>
                </motion.nav>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Images */}
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden mb-4 bg-stone-100 border border-stone-200">
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={activeImage}
                                    src={images[activeImage]}
                                    alt={product.title}
                                    initial={{ opacity: 0, scale: 1.1 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="w-full h-full object-cover"
                                    onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80' }}
                                />
                            </AnimatePresence>
                            {product.is_organic && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute top-4 left-4 bg-lime-400 text-stone-900 px-4 py-2 rounded-full flex items-center gap-2 font-bold text-sm shadow-lg"
                                >
                                    <Leaf className="w-4 h-4" /> Certified Organic
                                </motion.div>
                            )}
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs text-stone-600">
                                <Eye className="w-3.5 h-3.5" /> {product.views_count ?? 0} views
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {images.map((img, i) => (
                                <motion.button
                                    key={i}
                                    onClick={() => setActiveImage(i)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`w-24 h-20 rounded-2xl overflow-hidden border-2 transition-all ${activeImage === i ? 'border-lime-400 ring-2 ring-lime-400/20' : 'border-stone-200 opacity-60 hover:opacity-100'}`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover"
                                        onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=60' }} />
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Details */}
                    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                        <div className="flex items-start justify-between gap-4 mb-6">
                            <div>
                                <h1 className="font-serif text-4xl font-bold text-stone-800 mb-2">{product.title}</h1>
                                {product.variety && <p className="text-stone-500 text-lg">{product.variety}</p>}
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={toggleSaveProduct}
                                disabled={isSavingProduct}
                                className="shrink-0 w-12 h-12 rounded-full border border-stone-200 bg-white flex items-center justify-center text-stone-600 hover:border-lime-400 hover:text-lime-600 hover:bg-lime-50 transition-colors shadow-sm disabled:opacity-50"
                            >
                                <Heart className={`w-5 h-5 transition-colors ${isProductSaved ? 'fill-lime-500 text-lime-500' : ''}`} />
                            </motion.button>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <Star key={s} className={`w-5 h-5 ${s <= Math.floor(product.avg_rating) ? 'text-amber-400 fill-amber-400' : 'text-stone-300'}`} />
                                ))}
                            </div>
                            <span className="font-bold text-stone-800">{Number(product.avg_rating).toFixed(1)}</span>
                            <span className="text-stone-400">({product.total_reviews} reviews)</span>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="font-serif text-5xl font-bold text-lime-600">₹{Number(product.price_per_unit).toLocaleString('en-IN')}</span>
                            <span className="text-stone-400 text-lg">per {product.unit}</span>
                        </div>

                        {/* Meta chips */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className="text-xs px-3 py-1 bg-stone-100 text-stone-600 rounded-full flex items-center gap-1.5">
                                <Scale className="w-3 h-3" /> {product.quantity_available} {product.unit} available
                            </span>
                            {product.harvest_date && (
                                <span className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-full flex items-center gap-1.5">
                                    <CalendarDays className="w-3 h-3" /> Harvested {new Date(product.harvest_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </span>
                            )}
                            {(product.district || product.village) && (
                                <span className="text-xs px-3 py-1 bg-stone-100 text-stone-600 rounded-full flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3 text-lime-600" /> {product.village ? `${product.village}, ` : ''}{product.district}
                                </span>
                            )}
                        </div>

                        {/* Highlights */}
                        <div className="mb-8">
                            <ul className="space-y-2">
                                {highlights.map((h, i) => (
                                    <motion.li key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + i * 0.1 }}
                                        className="flex items-center gap-3 text-stone-600"
                                    >
                                        <div className="w-5 h-5 rounded-full bg-lime-400/10 flex items-center justify-center">
                                            <CheckCircle2 className="w-3 h-3 text-lime-600" />
                                        </div>
                                        {h}
                                    </motion.li>
                                ))}
                            </ul>
                        </div>

                        {/* Quantity */}
                        <div className="flex items-center gap-6 mb-8 p-4 bg-white rounded-2xl border border-stone-200">
                            <span className="text-stone-600 font-medium">Quantity</span>
                            <div className="flex items-center gap-4">
                                <motion.button whileTap={{ scale: 0.9 }}
                                    onClick={() => setQty(Math.max(product.minimum_order ?? 1, qty - 1))}
                                    className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors">
                                    <Minus className="w-4 h-4" />
                                </motion.button>
                                <span className="w-12 text-center font-bold text-xl text-stone-800">{qty}</span>
                                <motion.button whileTap={{ scale: 0.9 }}
                                    onClick={() => setQty(Math.min(product.quantity_available, qty + 1))}
                                    className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors">
                                    <Plus className="w-4 h-4" />
                                </motion.button>
                            </div>
                            <div className="ml-auto text-right">
                                <span className="text-stone-400 text-sm">Total</span>
                                <p className="font-bold text-2xl text-stone-800">₹{totalPrice.toLocaleString('en-IN')}</p>
                            </div>
                        </div>

                        {/* CTAs */}
                        <div className="flex gap-4 mb-10">
                            <motion.button
                                onClick={handleAddToCart}
                                disabled={isAdding}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1 flex items-center justify-center gap-2 bg-lime-400 text-stone-900 font-bold py-4 rounded-2xl hover:bg-lime-300 transition-colors shadow-lg shadow-lime-400/20 disabled:opacity-70"
                            >
                                {isAdding ? (
                                    <><LottieLoader size={20} className="py-0" /> Added!</>
                                ) : (
                                    <><ShoppingCart className="w-5 h-5" /> Add to Cart</>
                                )}
                            </motion.button>
                            <Link href="/app/checkout"
                                className="flex-1 flex items-center justify-center gap-2 bg-stone-800 text-white font-bold py-4 rounded-2xl hover:bg-stone-700 transition-colors">
                                Buy Now
                            </Link>
                        </div>

                        {/* Seller Card */}
                        <div className="bg-white border border-stone-200 rounded-3xl p-6 mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center text-stone-900 font-bold text-xl overflow-hidden">
                                        {product.seller?.avatar_url
                                            ? <img src={product.seller.avatar_url} alt="" className="w-full h-full object-cover" />
                                            : (product.seller?.full_name?.[0] ?? 'S')}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-stone-800">{product.seller?.full_name ?? 'Farmer'}</h3>
                                            {product.seller?.verified_farmer && (
                                                <ShieldCheck className="w-4 h-4 text-lime-500" aria-label="Verified Seller" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 text-stone-500 text-sm">
                                            <MapPin className="w-4 h-4 text-lime-600" />
                                            {product.seller?.village ? `${product.seller.village}, ` : ''}{product.seller?.district ?? ''}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <div className="flex items-center gap-1 text-amber-400 mb-1">
                                        <Star className="w-4 h-4 fill-amber-400" />
                                        <span className="font-bold text-stone-800">{Number(product.avg_rating).toFixed(1)}</span>
                                    </div>
                                    <p className="text-xs text-stone-400 mb-2">{product.total_reviews} reviews</p>
                                    <button
                                        onClick={toggleSaveSeller}
                                        disabled={isSavingSeller}
                                        className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${isSellerSaved ? 'border-lime-200 bg-lime-50 text-lime-700' : 'border-stone-200 text-stone-500 hover:border-lime-300 hover:text-lime-600'}`}
                                    >
                                        <Bookmark className={`w-3.5 h-3.5 ${isSellerSaved ? 'fill-lime-600' : ''}`} />
                                        {isSellerSaved ? 'Saved' : 'Save Seller'}
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleMessage}
                                    disabled={messagingLoading}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-stone-200 text-stone-600 hover:border-lime-400 hover:text-lime-700 disabled:opacity-50 transition-colors"
                                >
                                    {messagingLoading
                                        ? <LottieLoader size={16} className="py-0" />
                                        : <MessageSquare className="w-4 h-4" />}
                                    {messagingLoading ? 'Opening…' : 'Message'}
                                </motion.button>
                                {product.seller?.phone && (
                                    <a href={`tel:${product.seller.phone}`}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-stone-200 text-stone-600 hover:border-lime-400 hover:text-lime-700 transition-colors">
                                        <Phone className="w-4 h-4" /> Call
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        {product.description && (
                            <div>
                                <h3 className="font-serif font-bold text-xl text-stone-800 mb-3">About this produce</h3>
                                <p className="text-stone-600 leading-relaxed">{product.description}</p>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Reviews */}
                <ProductReviews
                    productId={product.id}
                    sellerId={product.seller_id}
                    totalReviews={product.total_reviews}
                    avgRating={product.avg_rating}
                    className="mt-20"
                />
            </div>
        </div>
    )
}