'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
    ChevronRight, ChevronLeft, Check, Leaf,
    Tag, Scale, Calendar, Image, Upload, AlertCircle,
    Wheat, Apple, Carrot, Milk, Sprout, FlaskConical, MapPin
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/userStore'
import { useToast } from '@/lib/toast'

const CATEGORIES = [
    { id: 'crops', label: 'Food Grains', Icon: Wheat, slug: 'crops-grains', color: 'text-amber-500' },
    { id: 'fruits', label: 'Fruits', Icon: Apple, slug: 'fruits', color: 'text-red-500' },
    { id: 'vegetables', label: 'Vegetables', Icon: Carrot, slug: 'vegetables', color: 'text-green-600' },
    { id: 'dairy', label: 'Dairy & Poultry', Icon: Milk, slug: 'dairy-poultry', color: 'text-blue-500' },
    { id: 'seeds', label: 'Seeds & Saplings', Icon: Sprout, slug: 'seeds-saplings', color: 'text-emerald-600' },
    { id: 'inputs', label: 'Agri Inputs', Icon: FlaskConical, slug: 'agri-inputs', color: 'text-violet-500' },
]

const UNITS = ['kg', 'quintal', 'ton', 'dozen', 'litre', 'piece']

interface FormData {
    category_slug: string
    title: string
    variety: string
    description: string
    price_per_unit: string
    unit: string
    quantity_available: string
    minimum_order: string
    harvest_date: string
    is_organic: boolean
    certification_url: string
    images: string[]
    village: string
    district: string
    pincode: string
}

const INITIAL: FormData = {
    category_slug: '',
    title: '',
    variety: '',
    description: '',
    price_per_unit: '',
    unit: 'kg',
    quantity_available: '',
    minimum_order: '1',
    harvest_date: '',
    is_organic: false,
    certification_url: '',
    images: [''],
    village: '',
    district: '',
    pincode: '',
}

const STEPS = [
    { id: 1, label: 'Category & Details', icon: Tag },
    { id: 2, label: 'Pricing & Quantity', icon: Scale },
    { id: 3, label: 'Photos & Certifications', icon: Image },
    { id: 4, label: 'Review & Publish', icon: Check },
]

export default function NewListingPage() {
    const { user, profile } = useUserStore()
    const router = useRouter()
    const toast = useToast()
    const [step, setStep] = useState(1)
    const [form, setForm] = useState<FormData>(INITIAL)
    const [publishing, setPublishing] = useState(false)

    function update(key: keyof FormData, value: string | boolean | string[]) {
        setForm(prev => ({ ...prev, [key]: value }))
    }

    function updateImage(idx: number, val: string) {
        const imgs = [...form.images]
        imgs[idx] = val
        if (val && idx === imgs.length - 1 && imgs.length < 5) imgs.push('')
        update('images', imgs)
    }

    async function handlePublish() {
        if (publishing) return
        setPublishing(true)

        const publishPromise = (async () => {
            // Reliably get current user from Supabase auth
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser) {
                setPublishing(false)
                throw new Error('You must be signed in to publish')
            }

            // Get category ID from slug
            const { data: catData, error: catError } = await supabase
                .from('categories')
                .select('id')
                .eq('slug', form.category_slug)
                .single()

            if (catError && catError.code !== 'PGRST116') {
                console.warn('Category lookup failed, continuing without category:', catError.message)
            }

            const payload = {
                seller_id: authUser.id,
                category_id: catData?.id ?? null,
                title: form.title,
                variety: form.variety || null,
                description: form.description || null,
                price_per_unit: parseFloat(form.price_per_unit),
                unit: form.unit,
                quantity_available: parseFloat(form.quantity_available),
                minimum_order: parseFloat(form.minimum_order) || 1,
                harvest_date: form.harvest_date || null,
                is_organic: form.is_organic,
                certification_url: form.certification_url || null,
                images: form.images.filter(Boolean),
                village: form.village || profile?.village || null,
                district: form.district || profile?.district || null,
                pincode: form.pincode || profile?.pincode || null,
                status: 'active',
            }

            const { error, data } = await supabase.from('products').insert(payload).select()
            if (error) {
                console.error('Supabase Insert Error:', error)
                throw error
            }

            return data
        })()

        toast.promise(publishPromise, {
            loading: 'Publishing your listing...',
            success: () => {
                setPublishing(false)
                router.push('/app/seller/listings')
                return 'Listing published successfully!'
            },
            error: (err) => {
                setPublishing(false)
                return `Could not publish: ${err.message}`
            }
        })
    }

    function canProceed(): boolean {
        if (step === 1) return !!form.category_slug && !!form.title
        if (step === 2) return !!form.price_per_unit && !!form.quantity_available
        return true
    }

    return (
        <div className="min-h-screen bg-[#f5f1ea]">
            <div className="max-w-2xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-serif font-bold text-stone-800">List Your Produce</h1>
                    <p className="text-stone-500 mt-1">Reach thousands of buyers across Maharashtra</p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-8">
                    {STEPS.map((s, i) => (
                        <div key={s.id} className="flex items-center gap-2">
                            <div className={`flex items-center gap-2 ${step === s.id ? 'text-stone-800' : step > s.id ? 'text-lime-600' : 'text-stone-400'}`}>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                    ${step > s.id ? 'bg-lime-400 text-stone-900' : step === s.id ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-400'}`}>
                                    {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
                                </div>
                                <span className="text-xs font-medium hidden sm:block">{s.label}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`flex-1 h-0.5 w-8 ${step > s.id ? 'bg-lime-400' : 'bg-stone-200'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step content */}
                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="p-6"
                        >
                            {/* Step 1: Category & Details */}
                            {step === 1 && (
                                <div className="space-y-5">
                                    <div>
                                        <label className="text-sm font-semibold text-stone-700 block mb-3">
                                            Category <span className="text-red-500">*</span>
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {CATEGORIES.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => update('category_slug', cat.slug)}
                                                    className={`p-3 rounded-xl border-2 text-center transition-all hover:border-lime-400 ${form.category_slug === cat.slug
                                                        ? 'border-lime-400 bg-lime-50'
                                                        : 'border-stone-200 bg-stone-50'
                                                        }`}
                                                >
                                                    <cat.Icon className={`w-7 h-7 mx-auto mb-1 ${cat.color}`} />
                                                    <span className="text-xs font-medium text-stone-700">{cat.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-stone-700 block mb-1.5">
                                            Product Title <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Fresh Alphonso Mangoes"
                                            value={form.title}
                                            onChange={e => update('title', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-stone-700 block mb-1.5">Variety (optional)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Alphonso, Kesar, Basmati..."
                                            value={form.variety}
                                            onChange={e => update('variety', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-stone-700 block mb-1.5">Description (optional)</label>
                                        <textarea
                                            rows={3}
                                            placeholder="Tell buyers about your produce — freshness, growing method, farm story..."
                                            value={form.description}
                                            onChange={e => update('description', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-colors resize-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-sm font-semibold text-stone-700 block mb-1.5">Village</label>
                                            <input type="text" placeholder="Nashik" value={form.village} onChange={e => update('village', e.target.value)}
                                                className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-lime-400 text-sm transition-colors" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-stone-700 block mb-1.5">District</label>
                                            <input type="text" placeholder="Nashik" value={form.district} onChange={e => update('district', e.target.value)}
                                                className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-lime-400 text-sm transition-colors" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-stone-700 block mb-1.5">Pincode</label>
                                            <input type="text" placeholder="422001" value={form.pincode} onChange={e => update('pincode', e.target.value)}
                                                className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-lime-400 text-sm transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Pricing & Quantity */}
                            {step === 2 && (
                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-semibold text-stone-700 block mb-1.5">
                                                Price per unit (₹) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                min="0"
                                                step="0.5"
                                                value={form.price_per_unit}
                                                onChange={e => update('price_per_unit', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-stone-700 block mb-1.5">Unit</label>
                                            <select
                                                value={form.unit}
                                                onChange={e => update('unit', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-colors"
                                            >
                                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Market suggestion badge */}
                                    <div className="bg-lime-50 border border-lime-200 rounded-xl p-3 flex items-start gap-2.5">
                                        <AlertCircle className="w-4 h-4 text-lime-600 mt-0.5 shrink-0" />
                                        <p className="text-xs text-lime-700">
                                            <strong>Mandi suggestion:</strong> Tomatoes in Nashik mandi are trading at ₹18–22/kg today. Price competitively to sell faster.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-semibold text-stone-700 block mb-1.5">
                                                Quantity Available <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="50"
                                                min="0"
                                                value={form.quantity_available}
                                                onChange={e => update('quantity_available', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-stone-700 block mb-1.5">Minimum Order</label>
                                            <input
                                                type="number"
                                                placeholder="1"
                                                min="1"
                                                value={form.minimum_order}
                                                onChange={e => update('minimum_order', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-stone-700 block mb-1.5">
                                            <Calendar className="w-3.5 h-3.5 inline mr-1" />
                                            Harvest Date (optional)
                                        </label>
                                        <input
                                            type="date"
                                            value={form.harvest_date}
                                            onChange={e => update('harvest_date', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-colors"
                                        />
                                    </div>

                                    {/* Price preview */}
                                    {form.price_per_unit && form.quantity_available && (
                                        <div className="bg-stone-900 rounded-xl p-4 text-white">
                                            <p className="text-xs text-stone-400 mb-1">Listing Preview</p>
                                            <p className="text-xl font-bold text-lime-400">
                                                ₹{parseFloat(form.price_per_unit).toLocaleString('en-IN')}
                                                <span className="text-sm text-stone-400 font-normal ml-1">/{form.unit}</span>
                                            </p>
                                            <p className="text-sm text-stone-300 mt-0.5">
                                                {form.quantity_available} {form.unit} available
                                                · Total value ₹{(parseFloat(form.price_per_unit) * parseFloat(form.quantity_available)).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 3: Photos & Organic */}
                            {step === 3 && (
                                <div className="space-y-5">
                                    <div>
                                        <label className="text-sm font-semibold text-stone-700 block mb-2">
                                            <Upload className="w-3.5 h-3.5 inline mr-1" />
                                            Product Image URLs (up to 5)
                                        </label>
                                        <p className="text-xs text-stone-400 mb-3">Paste direct image links (Unsplash, Cloudinary, etc.)</p>
                                        <div className="space-y-2">
                                            {form.images.map((img, idx) => (
                                                <div key={idx} className="flex gap-2 items-center">
                                                    <input
                                                        type="url"
                                                        placeholder={`Image URL ${idx + 1}`}
                                                        value={img}
                                                        onChange={e => updateImage(idx, e.target.value)}
                                                        className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 text-sm focus:outline-none focus:border-lime-400 transition-colors"
                                                    />
                                                    {img && (
                                                        <img src={img} alt="" className="w-10 h-10 rounded-lg object-cover border border-stone-200"
                                                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="border-t border-stone-100 pt-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-stone-700 flex items-center gap-1.5">
                                                    <Leaf className="w-4 h-4 text-green-500" />
                                                    Organic Certified
                                                </p>
                                                <p className="text-xs text-stone-400 mt-0.5">Certified organic produce gets 2× more views</p>
                                            </div>
                                            <button
                                                onClick={() => update('is_organic', !form.is_organic)}
                                                className={`relative w-12 h-6 rounded-full transition-colors ${form.is_organic ? 'bg-lime-400' : 'bg-stone-200'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.is_organic ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    {form.is_organic && (
                                        <div>
                                            <label className="text-sm font-semibold text-stone-700 block mb-1.5">
                                                Certification Document URL (optional)
                                            </label>
                                            <input
                                                type="url"
                                                placeholder="https://..."
                                                value={form.certification_url}
                                                onChange={e => update('certification_url', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-colors"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 4: Preview & Publish */}
                            {step === 4 && (
                                <div className="space-y-5">
                                    <div className="bg-stone-50 rounded-xl border border-stone-200 overflow-hidden">
                                        {/* Product image */}
                                        {form.images[0] ? (
                                            <img src={form.images[0]} alt={form.title}
                                                className="w-full h-48 object-cover"
                                                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                        ) : (
                                            <div className="w-full h-32 bg-gradient-to-br from-lime-100 to-green-100 flex items-center justify-center">
                                                <Leaf className="w-12 h-12 text-lime-300" />
                                            </div>
                                        )}
                                        <div className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-bold text-stone-800">{form.title || 'Untitled Listing'}</h3>
                                                    {form.variety && <p className="text-sm text-stone-500">{form.variety}</p>}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-bold text-stone-800">₹{form.price_per_unit || '—'}</p>
                                                    <p className="text-xs text-stone-400">per {form.unit}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                <span className="text-xs px-2 py-0.5 bg-stone-200 text-stone-600 rounded-full">
                                                    {form.quantity_available} {form.unit} available
                                                </span>
                                                {form.is_organic && (
                                                    <span className="text-xs px-2 py-0.5 bg-lime-100 text-lime-700 rounded-full flex items-center gap-1">
                                                        <Leaf className="w-3 h-3" /> Organic
                                                    </span>
                                                )}
                                                {form.harvest_date && (
                                                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                                                        Harvested {new Date(form.harvest_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                )}
                                                {form.district && (
                                                    <span className="text-xs px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full flex items-center gap-1">
                                                        <MapPin className="w-2.5 h-2.5" /> {form.district}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                        <p className="text-xs text-amber-700">
                                            <strong>Heads up:</strong> Your listing will be visible to all buyers immediately after publishing. Make sure all details are correct!
                                        </p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Footer nav */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-stone-100 bg-stone-50">
                        <button
                            onClick={() => setStep(s => s - 1)}
                            disabled={step === 1}
                            className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>

                        {step < 4 ? (
                            <button
                                onClick={() => setStep(s => s + 1)}
                                disabled={!canProceed()}
                                className="flex items-center gap-1.5 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Continue <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handlePublish}
                                disabled={publishing}
                                className="flex items-center gap-1.5 px-6 py-2.5 bg-lime-500 text-white rounded-xl text-sm font-bold hover:bg-lime-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {publishing ? 'Publishing…' : <><Wheat className="w-4 h-4" /> Publish Listing</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
