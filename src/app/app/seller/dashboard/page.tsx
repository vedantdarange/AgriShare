'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    TrendingUp, Package, Clock, Star, Plus,
    ArrowUp, ArrowDown, Eye, ShoppingBag, ChevronRight,
    BarChart3, IndianRupee, PieChart, RefreshCcw
} from 'lucide-react'
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, ArcElement, Tooltip, Legend, Filler,
    type ChartOptions
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/userStore'
import { useToast } from '@/lib/toast'
import LottieLoader from '@/components/LottieLoader'


ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, ArcElement, Tooltip, Legend, Filler
)

interface DashboardStats {
    activeListings: number
    totalRevenue: number
    pendingOrders: number
    avgRating: number
    totalSales: number
}

interface RecentOrder {
    id: string
    order_number: string
    status: string
    total_amount: number
    created_at: string
    buyer_name: string
    items_count: number
}

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-purple-100 text-purple-700',
    shipped: 'bg-indigo-100 text-indigo-700',
    out_for_delivery: 'bg-cyan-100 text-cyan-700',
    delivered: 'bg-lime-100 text-lime-700',
    cancelled: 'bg-red-100 text-red-700',
}

// Demo earnings data (will be replaced with real data when orders exist)
const MONTHS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb']
const EARNINGS_DEMO = [12400, 18700, 14200, 22100, 19800, 28500]

const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: '#1c1917',
            titleColor: '#a8a29e',
            bodyColor: '#fff',
            padding: 12,
            callbacks: {
                label: (ctx) => ` ₹${Number(ctx.raw).toLocaleString('en-IN')}`,
            },
        },
    },
    scales: {
        x: {
            grid: { display: false },
            ticks: { color: '#a8a29e', font: { size: 11 } },
            border: { display: false },
        },
        y: {
            grid: { color: '#f5f5f4', lineWidth: 1 },
            ticks: {
                color: '#a8a29e',
                font: { size: 11 },
                callback: (v) => `₹${Number(v) >= 1000 ? (Number(v) / 1000).toFixed(0) + 'k' : v}`,
            },
            border: { display: false },
        },
    },
}

const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                color: '#57534e',
                font: { size: 11 },
                padding: 16,
                boxWidth: 10,
                boxHeight: 10,
                borderRadius: 3,
            },
        },
        tooltip: {
            backgroundColor: '#1c1917',
            titleColor: '#a8a29e',
            bodyColor: '#fff',
            padding: 10,
        },
    },
}

export default function SellerDashboardPage() {
    const { user, profile, isLoading: authLoading } = useUserStore()
    const toast = useToast()
    const [stats, setStats] = useState<DashboardStats>({
        activeListings: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        avgRating: 0,
        totalSales: 0,
    })
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [categoryBreakdown, setCategoryBreakdown] = useState<{ labels: string[]; data: number[] }>({
        labels: [], data: []
    })

    useEffect(() => {
        if (authLoading) return;
        if (user) fetchDashboardData()
        else setLoading(false)
    }, [user, authLoading])

    async function fetchDashboardData() {
        if (!user) { setLoading(false); return }
        const timeout = setTimeout(() => {
            setLoading(false)
        }, 10000)

        setLoading(true)
        try {

            const [listingsRes, ordersRes] = await Promise.all([
                supabase
                    .from('products')
                    .select('id, status, avg_rating, total_reviews, category:categories(name)')
                    .eq('seller_id', user.id),
                supabase
                    .from('orders')
                    .select('id, order_number, status, total_amount, created_at, buyer_id')
                    .eq('seller_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(5),
            ])

            if (listingsRes.data) {
                const active = listingsRes.data.filter(p => p.status === 'active').length
                const avgR = listingsRes.data.length > 0
                    ? listingsRes.data.reduce((a, p) => a + (Number(p.avg_rating) || 0), 0) / listingsRes.data.length
                    : 0

                // Build category breakdown for doughnut chart
                const catCounts: Record<string, number> = {}
                listingsRes.data.forEach(p => {
                    const catName = (p.category as { name?: string } | null)?.name ?? 'Other'
                    catCounts[catName] = (catCounts[catName] ?? 0) + 1
                })
                setCategoryBreakdown({
                    labels: Object.keys(catCounts),
                    data: Object.values(catCounts),
                })

                setStats(prev => ({
                    ...prev,
                    activeListings: active,
                    avgRating: Math.round(avgR * 10) / 10,
                }))
            }

            if (ordersRes.data) {
                const pending = ordersRes.data.filter(o => o.status === 'pending').length
                const revenue = ordersRes.data
                    .filter(o => o.status === 'delivered')
                    .reduce((sum, o) => sum + Number(o.total_amount), 0)

                setStats(prev => ({
                    ...prev,
                    pendingOrders: pending,
                    totalRevenue: revenue,
                    totalSales: ordersRes.data!.filter(o => o.status === 'delivered').length,
                }))

                setRecentOrders(ordersRes.data.map(o => ({
                    id: o.id,
                    order_number: o.order_number,
                    status: o.status,
                    total_amount: Number(o.total_amount),
                    created_at: o.created_at,
                    buyer_name: 'Buyer',
                    items_count: 1,
                })))
            }
        } catch {
            toast.error({ title: 'Failed to load dashboard', description: 'Please refresh the page' })
        } finally {
            setLoading(false)
        }
    }

    const STAT_CARDS = [
        {
            label: 'Active Listings',
            value: stats.activeListings,
            icon: Package,
            color: 'from-lime-400 to-green-500',
            change: 'Manage your produce',
            up: true,
        },
        {
            label: 'Total Revenue',
            value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`,
            icon: IndianRupee,
            color: 'from-emerald-400 to-teal-500',
            change: 'From delivered orders',
            up: true,
        },
        {
            label: 'Pending Orders',
            value: stats.pendingOrders,
            icon: Clock,
            color: 'from-amber-400 to-orange-500',
            change: stats.pendingOrders > 0 ? 'Needs attention' : 'All clear!',
            up: stats.pendingOrders === 0,
        },
        {
            label: 'Avg. Rating',
            value: stats.avgRating || '—',
            icon: Star,
            color: 'from-purple-400 to-pink-500',
            change: 'Based on reviews',
            up: true,
        },
    ]

    const lineData = {
        labels: MONTHS,
        datasets: [{
            label: 'Earnings (₹)',
            data: EARNINGS_DEMO,
            borderColor: '#84cc16',
            backgroundColor: 'rgba(132,204,22,0.08)',
            borderWidth: 2.5,
            pointBackgroundColor: '#84cc16',
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.4,
            fill: true,
        }],
    }

    const doughnutData = {
        labels: categoryBreakdown.labels.length > 0
            ? categoryBreakdown.labels
            : ['Crops & Grains', 'Fruits', 'Vegetables', 'Dairy'],
        datasets: [{
            data: categoryBreakdown.data.length > 0
                ? categoryBreakdown.data
                : [35, 25, 30, 10],
            backgroundColor: ['#84cc16', '#22c55e', '#10b981', '#6ee7b7', '#a3e635'],
            borderWidth: 0,
            hoverOffset: 6,
        }],
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
            <div className="min-h-screen bg-[#f5f1ea] flex items-center justify-center p-8 text-center">
                <div className="text-center">
                    <p className="text-stone-500 font-medium mb-4">Please sign in to view your dashboard</p>
                    <Link href="/" className="px-6 py-2 bg-lime-400 text-stone-900 rounded-xl font-bold">
                        Go Home
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f5f1ea]">
            {/* Noise texture */}
            <div className="fixed inset-0 opacity-[0.015] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
                }} />

            <div className="max-w-6xl mx-auto px-6 py-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-8"
                >
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-stone-800">
                            Seller Dashboard
                        </h1>
                        <p className="text-stone-500 mt-1">
                            Welcome back, {profile?.full_name ?? 'Farmer'}
                        </p>
                    </div>
                    <Link
                        href="/app/seller/new-listing"
                        className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl font-medium text-sm hover:bg-lime-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Listing
                    </Link>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {STAT_CARDS.map((card, i) => (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="bg-white rounded-2xl border border-stone-200 p-5 hover:border-lime-400/40 hover:shadow-md transition-all"
                        >
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4`}>
                                <card.icon className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-2xl font-bold text-stone-800 mb-1">
                                {loading ? <span className="animate-pulse">—</span> : card.value}
                            </p>
                            <p className="text-xs text-stone-500 mb-2">{card.label}</p>
                            <p className={`text-[11px] flex items-center gap-1 font-medium ${card.up ? 'text-lime-600' : 'text-amber-600'}`}>
                                {card.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                {card.change}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-6 mb-6">
                    {/* Chart.js Line Chart - Monthly Earnings */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="font-semibold text-stone-800 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-lime-600" />
                                    Monthly Earnings
                                </h2>
                                <p className="text-xs text-stone-400 mt-0.5">Last 6 months (demo data)</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-stone-800">₹28,500</p>
                                <p className="text-xs text-lime-600 flex items-center gap-1 justify-end">
                                    <TrendingUp className="w-3 h-3" /> +44% vs last month
                                </p>
                            </div>
                        </div>
                        <div className="h-48">
                            <Line data={lineData} options={lineOptions} />
                        </div>
                    </motion.div>

                    {/* Chart.js Doughnut Chart - Category Breakdown */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="bg-white rounded-2xl border border-stone-200 p-6"
                    >
                        <h2 className="font-semibold text-stone-800 flex items-center gap-2 mb-1">
                            <PieChart className="w-4 h-4 text-lime-600" />
                            By Category
                        </h2>
                        <p className="text-xs text-stone-400 mb-4">
                            {categoryBreakdown.labels.length > 0 ? 'Your listings' : 'Demo data'}
                        </p>
                        <div className="h-44">
                            <Doughnut data={doughnutData} options={doughnutOptions} />
                        </div>
                    </motion.div>
                </div>

                {/* Quick Actions */}
                <div className="grid lg:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-2xl border border-stone-200 p-6"
                    >
                        <h2 className="font-semibold text-stone-800 mb-4">Quick Actions</h2>
                        <div className="space-y-2.5">
                            {[
                                { label: 'List New Produce', href: '/app/seller/new-listing', icon: Plus, color: 'bg-lime-500' },
                                { label: 'Manage Listings', href: '/app/seller/listings', icon: Package, color: 'bg-stone-800' },
                                { label: 'View Orders', href: '/app/seller/orders', icon: ShoppingBag, color: 'bg-amber-500' },
                                { label: 'Manage Returns', href: '/app/seller/returns', icon: RefreshCcw, color: 'bg-red-500' },
                                { label: 'Browse Market', href: '/app/browse', icon: Eye, color: 'bg-blue-500' },
                            ].map(a => (
                                <Link
                                    key={a.label}
                                    href={a.href}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-100 hover:border-stone-200 transition-all group"
                                >
                                    <div className={`w-8 h-8 ${a.color} rounded-lg flex items-center justify-center`}>
                                        <a.icon className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-sm font-medium text-stone-700 flex-1">{a.label}</span>
                                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            ))}
                        </div>
                    </motion.div>

                    {/* Recent Orders */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                            <h2 className="font-semibold text-stone-800">Recent Orders</h2>
                            <Link href="/app/seller/orders" className="text-xs text-lime-600 hover:underline font-medium">
                                View all →
                            </Link>
                        </div>

                        {loading ? (
                            <div className="py-12 text-center text-stone-400 text-sm">Loading orders…</div>
                        ) : recentOrders.length === 0 ? (
                            <div className="py-12 text-center">
                                <ShoppingBag className="w-10 h-10 text-stone-200 mx-auto mb-3" />
                                <p className="text-stone-400 text-sm">No orders yet. Start listing your produce!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-stone-50">
                                {recentOrders.map(o => (
                                    <div key={o.id} className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50 transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-stone-700">{o.order_number}</p>
                                            <p className="text-xs text-stone-400">
                                                {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </p>
                                        </div>
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[o.status] ?? 'bg-stone-100 text-stone-600'}`}>
                                            {o.status.replace(/_/g, ' ')}
                                        </span>
                                        <p className="text-sm font-bold text-stone-800 w-20 text-right">
                                            ₹{o.total_amount.toLocaleString('en-IN')}
                                        </p>
                                        <Link
                                            href="/app/seller/orders"
                                            className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
