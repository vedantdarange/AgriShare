'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Home, ShoppingBasket, ShoppingCart,
    Package, User, LogOut, Leaf, ChevronRight, Store, Search,
    MessageSquare, LayoutDashboard, PlusSquare, List, ClipboardList, Heart, RefreshCcw
} from 'lucide-react'
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
    { href: '/app/orders', label: 'Orders', icon: Package },
    { href: '/app/messages', label: 'Messages', icon: MessageSquare },
    { href: '/app/profile/saved', label: 'Saved Items', icon: Heart },
    { href: '/app/profile', label: 'Profile', icon: User },
]

const SELLER_NAV_ITEMS = [
    { href: '/app/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/app/seller/new-listing', label: 'New Listing', icon: PlusSquare },
    { href: '/app/seller/listings', label: 'My Listings', icon: List },
    { href: '/app/seller/orders', label: 'Seller Orders', icon: ClipboardList },
    { href: '/app/seller/returns', label: 'Returns', icon: RefreshCcw },
]

const COLLAPSED_W = 64   // px — icon-only rail
const EXPANDED_W = 240  // px — full sidebar

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const { user, profile, clear, isLoading: authLoading } = useUserStore()
    const toast = useToast()
    const [mounted, setMounted] = useState(false)
    const [expanded, setExpanded] = useState(false)

    // Hover-edge trigger: a 16px invisible strip on the far-left edge of the viewport
    const edgeRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut()
            clear()
            toast.info({ title: 'Signed out', description: 'Come back soon!' })
            // Hard refresh to root clear all server-side Supabase cookies and middle-ware caches
            window.location.href = '/'
        } catch (error) {
            console.error('Sign out error:', error)
            // Fallback: clear state and force redirect even if RPC fails
            clear()
            window.location.href = '/'
        }
    }

    if (!mounted || authLoading) {
        return <LottieLoader fullScreen size={160} message="Loading your farm dashboard..." />
    }

    if (!user) return null;

    return (
        <div className="flex h-screen bg-stone-950 text-white overflow-hidden">
            {/* Invisible 16px edge trigger strip */}
            <div
                ref={edgeRef}
                className="fixed left-0 top-0 h-full z-50 hidden lg:block"
                style={{ width: COLLAPSED_W }}
                onMouseEnter={() => setExpanded(true)}
            />

            {/* Sidebar */}
            <motion.aside
                className="hidden lg:flex flex-col shrink-0 border-r border-white/8 bg-stone-950/90 backdrop-blur-xl h-full overflow-hidden relative z-40"
                animate={{ width: expanded ? EXPANDED_W : COLLAPSED_W }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                onMouseLeave={() => setExpanded(false)}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-4 py-5 border-b border-white/8 shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-green-600 flex items-center justify-center shadow-lg shadow-lime-500/20 shrink-0">
                        <Leaf className="w-4 h-4 text-stone-900" strokeWidth={2.5} />
                    </div>
                    <AnimatePresence>
                        {expanded && (
                            <motion.span
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={{ duration: 0.15 }}
                                className="font-semibold text-white tracking-tight whitespace-nowrap overflow-hidden"
                            >
                                FarmerConnect
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-2 py-4 space-y-0.5">
                    {NAV_ITEMS.map((item) => (
                        <SidebarLink key={item.href} {...item} expanded={expanded} mounted={mounted} />
                    ))}
                </nav>

                {/* Seller section */}
                <div className="px-2 pb-3 border-t border-white/8 pt-3">
                    <AnimatePresence>
                        {expanded && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-[10px] font-bold uppercase tracking-widest text-stone-500 px-3 pb-2"
                            >
                                Sell
                            </motion.p>
                        )}
                    </AnimatePresence>
                    {SELLER_NAV_ITEMS.map((item) => (
                        <SidebarLink key={item.href} {...item} expanded={expanded} mounted={mounted} />
                    ))}
                </div>


                {/* User footer */}
                <div className="px-2 pb-4 border-t border-white/8 pt-3 shrink-0">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-xl overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center text-stone-900 font-bold text-sm shrink-0">
                            {profile?.full_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'F'}
                        </div>
                        <AnimatePresence>
                            {expanded && (
                                <motion.div
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -8 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex-1 min-w-0"
                                >
                                    <p className="text-sm font-medium truncate">{profile?.full_name ?? 'Farmer'}</p>
                                    <p className="text-[11px] text-stone-400 truncate">{user?.email}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {expanded && (
                            <button
                                onClick={handleSignOut}
                                className="text-stone-400 hover:text-red-400 transition-colors p-1 shrink-0"
                                title="Sign out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Expand hint chevron when collapsed */}
                {!expanded && (
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronRight className="w-3 h-3 text-white/15" />
                    </div>
                )}
            </motion.aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopBar />
                <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
        </div>
    )
}

function SidebarLink({ href, label, icon: Icon, badge, expanded, mounted }: {
    href: string; label: string; icon: React.ElementType; badge?: boolean; expanded: boolean; mounted: boolean
}) {
    const pathname = usePathname()
    const isActive = pathname === href || (href !== '/app/home' && pathname.startsWith(href))
    const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0))

    return (
        <Link href={href} title={!expanded ? label : undefined}>
            <div className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative select-none cursor-pointer overflow-hidden',
                isActive ? 'bg-lime-400/12 text-lime-300' : 'text-stone-400 hover:text-white hover:bg-white/5'
            )}>
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-lime-400 rounded-full" />}
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-lime-400' : '')} />
                <AnimatePresence>
                    {expanded && (
                        <motion.span
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ duration: 0.12 }}
                            className="whitespace-nowrap"
                        >
                            {label}
                        </motion.span>
                    )}
                </AnimatePresence>
                {badge && mounted && cartCount > 0 && expanded && (
                    <span className="ml-auto min-w-5 h-5 bg-lime-400 text-stone-900 text-[10px] font-bold rounded-full flex items-center justify-center px-1 shrink-0">
                        {cartCount > 99 ? '99+' : cartCount}
                    </span>
                )}
                {badge && mounted && cartCount > 0 && !expanded && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-lime-400 rounded-full" />
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
