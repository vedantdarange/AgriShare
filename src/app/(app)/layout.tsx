'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    Home, ShoppingBasket, ShoppingCart,
    Package, User, LogOut, Leaf, ChevronRight, Store, Search, Heart
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useUserStore } from '@/lib/store/userStore'
import { useCartStore } from '@/lib/store/cartStore'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import LottieLoader from '@/components/LottieLoader'

const NAV_ITEMS = [
    { href: '/app/home', label: 'Home', icon: Home },
    { href: '/app/browse', label: 'Browse', icon: ShoppingBasket },
    { href: '/app/cart', label: 'Cart', icon: ShoppingCart, badge: true },
    { href: '/app/wishlist', label: 'Wishlist', icon: Heart },
    { href: '/app/orders', label: 'Orders', icon: Package },
    { href: '/app/profile', label: 'Profile', icon: User },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const { user, profile, clear, isLoading: authLoading } = useUserStore()
    const toast = useToast()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut()
            clear()
            toast.info({ title: 'Signed out', description: 'Come back soon!' })
            window.location.href = '/'
        } catch (error) {
            console.error('Sign out error:', error)
            clear()
            window.location.href = '/'
        }
    }

    // Show nothing (or a loader) until we know auth state
    if (!mounted || authLoading) {
        return <LottieLoader fullScreen size={160} message="Loading your farm dashboard..." />
    }

    return (
        <div className="flex h-screen bg-stone-950 text-white overflow-hidden">
            {/* ── Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-white/8 bg-stone-950/80 backdrop-blur-xl h-full">
                {/* Logo */}
                <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/8">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-green-600 flex items-center justify-center shadow-lg shadow-lime-500/20">
                        <Leaf className="w-4 h-4 text-stone-900" strokeWidth={2.5} />
                    </div>
                    <span className="font-semibold text-white tracking-tight">FarmerConnect</span>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-0.5">
                    {NAV_ITEMS.map((item) => (
                        <SidebarLink key={item.href} {...item} mounted={mounted} />
                    ))}
                </nav>

                {/* Seller CTA */}
                <div className="px-3 pb-3">
                    <Link
                        href="/app/seller/dashboard"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-lime-400/10 border border-lime-400/20 hover:bg-lime-400/15 transition-colors group"
                    >
                        <Store className="w-4 h-4 text-lime-400" />
                        <span className="text-sm text-lime-300 font-medium">Seller Dashboard</span>
                        <ChevronRight className="w-3.5 h-3.5 text-lime-400/50 ml-auto group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>

                {/* Profile footer */}
                <div className="px-3 pb-4 border-t border-white/8 pt-3">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center text-stone-900 font-bold text-sm shrink-0">
                            {profile?.full_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'F'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{profile?.full_name ?? 'Farmer'}</p>
                            <p className="text-[11px] text-stone-400 truncate">{user?.email}</p>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="text-stone-400 hover:text-red-400 transition-colors p-1"
                            title="Sign out"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopBar />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}

function SidebarLink({ href, label, icon: Icon, badge, mounted }: {
    href: string; label: string; icon: React.ElementType; badge?: boolean; mounted: boolean
}) {
    const pathname = usePathname()
    const isActive = pathname === href || (href !== '/app/home' && pathname.startsWith(href))
    // Use items.length selector — safe, no internal get() calls
    const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0))

    return (
        <Link href={href}>
            <div
                className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors relative select-none',
                    isActive
                        ? 'bg-lime-400/12 text-lime-300'
                        : 'text-stone-400 hover:text-white hover:bg-white/5'
                )}
            >
                {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-lime-400 rounded-full" />
                )}
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-lime-400' : '')} />
                <span>{label}</span>
                {badge && mounted && cartCount > 0 && (
                    <span className="ml-auto min-w-5 h-5 bg-lime-400 text-stone-900 text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {cartCount > 99 ? '99+' : cartCount}
                    </span>
                )}
            </div>
        </Link>
    )
}

function TopBar() {
    const pathname = usePathname()
    const label = NAV_ITEMS.find(n => pathname === n.href || pathname.startsWith(n.href))?.label ?? ''

    return (
        <header className="hidden lg:flex h-14 shrink-0 items-center gap-4 px-6 border-b border-white/8 bg-stone-950/60 backdrop-blur-md">
            <h1 className="text-sm font-medium text-stone-300 capitalize">{label}</h1>
            <div className="ml-auto relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                    type="text"
                    placeholder="Search products, farmers..."
                    className="w-72 bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2 text-sm text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-lime-400/40 transition-all"
                />
            </div>
        </header>
    )
}
