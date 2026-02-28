'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '@/lib/store/userStore'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/lib/toast'
import { useRouter } from 'next/navigation'

// Custom SVG icons — matching the warm parchment pages
const Icons = {
    Edit: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Check: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    X: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
    ),
    Mail: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" strokeLinecap="round" />
        </svg>
    ),
    Phone: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.07 2h3a2 2 0 0 1 2 1.72A12.84 12.84 0 0 0 9.07 7a2 2 0 0 1-.45 2.11L7.45 10.3a16 16 0 0 0 6.29 6.29l1.17-1.17a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 3.28.7A2 2 0 0 1 22 16.92z" strokeLinecap="round" />
        </svg>
    ),
    MapPin: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" strokeLinecap="round" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    ),
    Store: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 9l2 10h14l2-10M3 9l6-6h6l6 6M3 9h18" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 21V13h6v8" strokeLinecap="round" />
        </svg>
    ),
    Shield: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Bell: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    LogOut: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    ChevronRight: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Leaf: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2C7 2 4 6 4 12s4 9 8 9c.5 0 1-.05 1.5-.15" strokeLinecap="round" />
            <path d="M12 2c5 0 8 4 8 10s-4 9-8 9" strokeLinecap="round" />
            <path d="M12 21V11M12 11c-2-1-3-3.5-3-6M12 11c2-1 3-3.5 3-6" strokeLinecap="round" />
        </svg>
    ),
}

export default function ProfilePage() {
    const { user, profile, clear } = useUserStore()
    const router = useRouter()
    const toast = useToast()

    const [editing, setEditing] = useState(false)
    const [name, setName] = useState(profile?.full_name ?? '')
    const [phone, setPhone] = useState(profile?.phone ?? '')
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        setSaving(true)
        const { error } = await supabase
            .from('profiles')
            .update({ full_name: name, phone })
            .eq('id', user?.id ?? '')
        setSaving(false)
        if (error) { toast.error({ title: 'Failed to save profile', description: error.message }); return }
        toast.profileSaved()
        setEditing(false)
    }

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut()
            clear()
            toast.info({ title: 'Signed out', description: 'See you next time!' })
            window.location.href = '/'
        } catch (error) {
            console.error('Sign out error:', error)
            clear()
            window.location.href = '/'
        }
    }

    const MENU_ITEMS = [
        { icon: Icons.MapPin, label: 'Saved Addresses', href: '/app/profile/addresses' },
        { icon: Icons.Store, label: 'Seller Dashboard', href: '/app/seller/dashboard' },
        { icon: Icons.Shield, label: 'Verification', href: '/app/profile/verification' },
        { icon: Icons.Bell, label: 'Notifications', href: '/app/profile/notifications' },
    ]

    const initials = (editing ? name : profile?.full_name ?? user?.email ?? 'F')[0]?.toUpperCase()

    return (
        <div className="min-h-screen bg-[#f5f1ea] relative">
            {/* Grain overlay */}
            <div className="fixed inset-0 opacity-[0.02] pointer-events-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
            />

            <div className="relative max-w-2xl mx-auto px-8 py-10">
                {/* Page header */}
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="font-serif text-3xl font-bold text-stone-800">My Profile</h1>
                    <p className="text-stone-500 text-sm mt-1">Manage your account and preferences</p>
                </motion.div>

                {/* Avatar + Info Card */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-stone-200 rounded-3xl p-7 mb-5 shadow-sm"
                >
                    <div className="flex items-start gap-5">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center text-stone-900 font-bold text-2xl shrink-0 shadow-md shadow-lime-200">
                            {initials}
                        </div>

                        <div className="flex-1 min-w-0">
                            {editing ? (
                                <div className="space-y-3">
                                    <input
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Full Name"
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 text-sm focus:outline-none focus:border-lime-400/60 focus:bg-white transition-colors"
                                    />
                                    <input
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        placeholder="Phone Number"
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 text-sm focus:outline-none focus:border-lime-400/60 focus:bg-white transition-colors"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex items-center gap-1.5 bg-lime-400 text-stone-900 font-semibold px-4 py-2 rounded-xl text-sm disabled:opacity-60 hover:bg-lime-300 transition-colors shadow-sm"
                                        >
                                            <Icons.Check className="w-4 h-4" />
                                            {saving ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            onClick={() => setEditing(false)}
                                            className="px-4 py-2 rounded-xl text-sm text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-stone-800 text-lg">{profile?.full_name ?? 'Farmer'}</p>
                                            {profile?.role && (
                                                <span className="text-xs bg-lime-400/15 text-lime-700 border border-lime-400/25 px-2.5 py-0.5 rounded-full inline-block mt-1">
                                                    {profile.role === 'seller' ? '🌾 Farmer/Seller'
                                                        : profile.role === 'buyer' ? '🛒 Buyer'
                                                            : profile.role === 'both' ? '🌾 Farmer + Buyer'
                                                                : '⚙️ Admin'}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setEditing(true)}
                                            className="text-stone-400 hover:text-lime-600 transition-colors p-2 hover:bg-lime-50 rounded-xl"
                                        >
                                            <Icons.Edit className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="mt-3 space-y-1.5">
                                        <div className="flex items-center gap-2 text-stone-500 text-sm">
                                            <Icons.Mail className="w-3.5 h-3.5 text-stone-400" />
                                            {user?.email}
                                        </div>
                                        {profile?.phone && (
                                            <div className="flex items-center gap-2 text-stone-500 text-sm">
                                                <Icons.Phone className="w-3.5 h-3.5 text-stone-400" />
                                                {profile.phone}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-5">
                    {[
                        { label: 'Orders Placed', value: '3', accent: 'text-lime-600' },
                        { label: 'Products Listed', value: '0', accent: 'text-stone-700' },
                        { label: 'Total Saved', value: '₹480', accent: 'text-emerald-600' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08 + i * 0.07 }}
                            className="bg-white border border-stone-200 rounded-2xl p-4 text-center shadow-sm"
                        >
                            <p className={`text-2xl font-bold font-serif ${stat.accent}`}>{stat.value}</p>
                            <p className="text-stone-400 text-xs mt-0.5">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Menu Links */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white border border-stone-200 rounded-3xl overflow-hidden mb-5 shadow-sm"
                >
                    {MENU_ITEMS.map((item, i) => {
                        const Icon = item.icon
                        return (
                            <div key={item.href}>
                                {i > 0 && <div className="border-t border-stone-100 mx-5" />}
                                <a
                                    href={item.href}
                                    className="flex items-center gap-3.5 px-6 py-4 hover:bg-stone-50 transition-colors group"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-stone-100 group-hover:bg-lime-50 flex items-center justify-center transition-colors shrink-0">
                                        <Icon className="w-4.5 h-4.5 text-stone-500 group-hover:text-lime-600 transition-colors" />
                                    </div>
                                    <span className="text-stone-700 text-sm font-medium group-hover:text-stone-900 transition-colors flex-1">
                                        {item.label}
                                    </span>
                                    <Icons.ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5 transition-all" />
                                </a>
                            </div>
                        )
                    })}
                </motion.div>

                {/* Organic badge / verified hint */}
                {profile?.verified_farmer && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center gap-3 bg-lime-50 border border-lime-200 rounded-2xl px-5 py-4 mb-5"
                    >
                        <div className="w-9 h-9 rounded-xl bg-lime-400 flex items-center justify-center shrink-0">
                            <Icons.Leaf className="w-4.5 h-4.5 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-lime-800">Verified Farmer</p>
                            <p className="text-xs text-lime-600 mb-2">Your produce listings carry the verified badge</p>
                            <a
                                href="/app/seller/farm"
                                className="inline-flex items-center gap-1.5 bg-lime-800 text-lime-50 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-lime-900 transition-colors"
                            >
                                <Icons.Store className="w-3.5 h-3.5" />
                                Edit Farm Details
                            </a>
                        </div>
                    </motion.div>
                )}

                {/* Sign Out */}
                <motion.button
                    onClick={handleSignOut}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-600 font-medium py-3.5 rounded-2xl hover:bg-red-100 transition-colors text-sm"
                >
                    <Icons.LogOut className="w-4 h-4" />
                    Sign Out
                </motion.button>
            </div>
        </div>
    )
}
