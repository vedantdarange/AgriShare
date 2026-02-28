'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/lib/store/userStore'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/lib/toast'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamically import the map to avoid SSR issues
const AddressMap = dynamic(() => import('@/components/AddressMap'), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-stone-100 rounded-2xl animate-pulse flex items-center justify-center text-stone-400">Loading Map...</div>
})

const Icons = {
    MapPin: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" strokeLinecap="round" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    ),
    Home: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Briefcase: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    MoreHorizontal: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
        </svg>
    ),
    Plus: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5v14" strokeLinecap="round" />
        </svg>
    ),
    Trash: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    ChevronLeft: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

type Address = {
    id: string
    label: string
    full_name: string
    phone: string
    street: string
    city: string
    pincode: string
    latitude: number | null
    longitude: number | null
    is_default: boolean
}

export default function ProfileAddressesPage() {
    const { user } = useUserStore()
    const toast = useToast()
    const [addresses, setAddresses] = useState<Address[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAddingMode, setIsAddingMode] = useState(false)

    // Form state
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [street, setStreet] = useState('')
    const [city, setCity] = useState('')
    const [pincode, setPincode] = useState('')
    const [pinLocation, setPinLocation] = useState<[number, number] | null>(null)
    const [category, setCategory] = useState<'Home' | 'Work' | 'Other'>('Home')
    const [customLabel, setCustomLabel] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Auto-fetch location if adding mode
    const [isFetchingLocation, setIsFetchingLocation] = useState(false)

    useEffect(() => {
        if (user) fetchAddresses()
    }, [user])

    const fetchAddresses = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false })

        if (error) {
            toast.error({ title: 'Error fetching addresses', description: error.message })
        } else {
            setAddresses(data || [])
        }
        setIsLoading(false)
    }

    const resetForm = () => {
        setName('')
        setPhone('')
        setStreet('')
        setCity('')
        setPincode('')
        setCategory('Home')
        setCustomLabel('')
        setPinLocation(null)
        setIsAddingMode(false)
    }

    const getLocation = () => {
        setIsFetchingLocation(true)
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude
                    const lng = position.coords.longitude
                    setPinLocation([lat, lng])

                    // Reverse geocoding matching checkout
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
                        const data = await res.json()
                        if (data && data.address) {
                            if (!city) setCity(data.address.city || data.address.town || data.address.state_district || '')
                            if (!pincode) setPincode(data.address.postcode || '')
                            if (!street) {
                                const st = [data.address.road, data.address.suburb, data.address.neighbourhood].filter(Boolean).join(', ')
                                setStreet(st)
                            }
                        }
                    } catch (error) {
                        console.error('Reverse geocoding failed', error)
                    }
                    setIsFetchingLocation(false)
                },
                (error) => {
                    console.error('Geolocation error:', error)
                    toast.error({ title: 'Location Error', description: 'Could not fetch your location.' })
                    setIsFetchingLocation(false)
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            )
        } else {
            setIsFetchingLocation(false)
        }
    }

    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        const finalLabel = category === 'Other' ? customLabel.trim() : category
        if (!finalLabel) {
            toast.error({ title: 'Label required', description: 'Please enter a name for this address.' })
            return
        }

        setIsSubmitting(true)

        const { error } = await supabase.from('addresses').insert({
            user_id: user.id,
            label: finalLabel,
            full_name: name,
            phone,
            street,
            city,
            district: city, // reusing city for district for simplicity
            state: '',
            pincode,
            latitude: pinLocation?.[0] || null,
            longitude: pinLocation?.[1] || null,
            is_default: addresses.length === 0 // Make default if it's the first one
        })

        setIsSubmitting(false)

        if (error) {
            toast.error({ title: 'Error saving address', description: error.message })
        } else {
            toast.success({ title: 'Address Saved', description: 'Your new address has been added.' })
            resetForm()
            fetchAddresses()
        }
    }

    const handleDeleteAddress = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm('Delete this address?')) return

        const { error } = await supabase.from('addresses').delete().eq('id', id)
        if (error) {
            toast.error({ title: 'Error deleting', description: error.message })
        } else {
            toast.success({ title: 'Address Deleted', description: 'Address removed successfully.' })
            setAddresses(prev => prev.filter(a => a.id !== id))
        }
    }

    const getIconForLabel = (label: string) => {
        if (label === 'Home') return <Icons.Home className="w-5 h-5" />
        if (label === 'Work' || label === 'Office') return <Icons.Briefcase className="w-5 h-5" />
        return <Icons.MapPin className="w-5 h-5" />
    }

    return (
        <div className="min-h-screen bg-[#f5f1ea] relative">
            <div className="relative max-w-2xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/profile" className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-50 transition-colors">
                        <Icons.ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="font-serif text-2xl font-bold text-stone-800">Saved Addresses</h1>
                        <p className="text-stone-500 text-sm">Manage where your farm fresh produce is delivered.</p>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {isAddingMode ? (
                        <motion.div
                            key="add-form"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm"
                        >
                            <h2 className="text-lg font-bold text-stone-800 mb-5">Add New Address</h2>

                            <form onSubmit={handleSaveAddress} className="space-y-4">
                                {/* Categories */}
                                <div className="flex gap-3 mb-6">
                                    {['Home', 'Work', 'Other'].map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setCategory(cat as any)}
                                            className={`flex flex-1 items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-colors
                                                ${category === cat
                                                    ? 'bg-lime-50 border-lime-400 text-lime-800'
                                                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'}`}
                                        >
                                            {cat === 'Home' && <Icons.Home className="w-4 h-4" />}
                                            {cat === 'Work' && <Icons.Briefcase className="w-4 h-4" />}
                                            {cat === 'Other' && <Icons.MoreHorizontal className="w-4 h-4" />}
                                            {cat}
                                        </button>
                                    ))}
                                </div>

                                {category === 'Other' && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <input
                                            required
                                            value={customLabel}
                                            onChange={e => setCustomLabel(e.target.value)}
                                            placeholder="E.g., Mom's House, Farmhouse"
                                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:border-lime-400 transition-colors"
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        required placeholder="Full Name" value={name} onChange={e => setName(e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:border-lime-400 transition-colors"
                                    />
                                    <input
                                        required placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:border-lime-400 transition-colors"
                                    />
                                </div>

                                <div className="pt-2">
                                    <div className="flex justify-between items-end mb-2">
                                        <label className="text-sm font-semibold text-stone-700">Pin Location</label>
                                        <button
                                            type="button"
                                            onClick={getLocation}
                                            disabled={isFetchingLocation}
                                            className="text-xs text-lime-600 font-medium hover:text-lime-700 disabled:opacity-50"
                                        >
                                            {isFetchingLocation ? 'Locating...' : 'Use Current Location'}
                                        </button>
                                    </div>
                                    <AddressMap position={pinLocation} onPositionChange={setPinLocation} />
                                </div>

                                <div className="pt-2">
                                    <input
                                        required placeholder="Street Address / Area" value={street} onChange={e => setStreet(e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:border-lime-400 transition-colors"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        required placeholder="City/District" value={city} onChange={e => setCity(e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:border-lime-400 transition-colors"
                                    />
                                    <input
                                        required placeholder="Pincode" value={pincode} onChange={e => setPincode(e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:border-lime-400 transition-colors"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 py-3.5 rounded-xl font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 py-3.5 rounded-xl font-semibold text-stone-900 bg-lime-400 hover:bg-lime-500 transition-colors disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Saving...' : 'Save Address'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="address-list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            {!isLoading && addresses.length === 0 && (
                                <div className="bg-white border text-center border-stone-200 border-dashed rounded-3xl p-10 flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-2xl border bg-stone-50 border-stone-200 flex items-center justify-center text-stone-300 mb-4">
                                        <Icons.MapPin className="w-8 h-8" />
                                    </div>
                                    <p className="text-stone-800 font-semibold mb-1">No Addresses Saved</p>
                                    <p className="text-stone-500 text-sm mb-6 max-w-[250px]">Add your delivery addresses here for a quicker checkout experience.</p>
                                </div>
                            )}

                            {isLoading ? (
                                <div className="space-y-4">
                                    {[1, 2].map(i => (
                                        <div key={i} className="animate-pulse bg-stone-200/50 rounded-2xl h-32 w-full" />
                                    ))}
                                </div>
                            ) : (
                                addresses.map(address => (
                                    <div key={address.id} className="bg-white border border-stone-200 rounded-2xl p-5 hover:border-lime-300 transition-colors group relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="text-lime-600 p-1.5 bg-lime-50 rounded-lg">
                                                    {getIconForLabel(address.label)}
                                                </div>
                                                <h3 className="font-bold text-stone-800">{address.label}</h3>
                                                {address.is_default && (
                                                    <span className="text-[10px] font-bold tracking-wider uppercase bg-stone-100 text-stone-500 px-2 py-0.5 rounded-md">Default</span>
                                                )}
                                            </div>

                                            <button
                                                className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                onClick={(e) => handleDeleteAddress(address.id, e)}
                                            >
                                                <Icons.Trash className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="pl-10 space-y-1">
                                            <p className="text-sm font-medium text-stone-800">{address.full_name} • {address.phone}</p>
                                            <p className="text-sm text-stone-500 leading-relaxed max-w-[85%]">
                                                {address.street}, {address.city}, {address.pincode}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}

                            <button
                                onClick={() => setIsAddingMode(true)}
                                className="w-full border-2 border-dashed border-stone-300 hover:border-lime-400 hover:bg-lime-50/50 text-stone-600 hover:text-lime-700 bg-transparent flex items-center justify-center gap-2 font-semibold py-4 rounded-2xl transition-all"
                            >
                                <Icons.Plus className="w-5 h-5" />
                                Add New Address
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
