"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useUserStore } from "@/lib/store/userStore";
import { supabase } from "@/lib/supabase/client";
import LottieLoader from "@/components/LottieLoader";


// Custom Icons
const Icons = {
    Package: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m3.3 7 8.7 5 8.7-5M12 22V12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Clock: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" strokeLinecap="round" />
        </svg>
    ),
    CheckCircle: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" />
            <path d="m9 11 3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Truck: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 17h4V5H2v12h3M10 17v-4H6v4m0 0a2 2 0 1 0 4 0m6 0a2 2 0 1 0 4 0v-4h-4m4 0V5h6l4 8h-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    XCircle: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6M9 9l6 6" strokeLinecap="round" />
        </svg>
    ),
    ChevronRight: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    ArrowRight: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Loader: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" strokeLinecap="round" />
        </svg>
    ),
};

const STATUS_CONFIG: Record<string, any> = {
    pending: {
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        icon: Icons.Clock,
        label: "Pending",
        description: "Order received"
    },
    confirmed: {
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: Icons.CheckCircle,
        label: "Confirmed",
        description: "Being prepared"
    },
    in_transit: {
        color: "text-purple-600",
        bg: "bg-purple-50",
        border: "border-purple-200",
        icon: Icons.Truck,
        label: "In Transit",
        description: "On the way"
    },
    delivered: {
        color: "text-green-600",
        bg: "bg-green-50",
        border: "border-green-200",
        icon: Icons.CheckCircle,
        label: "Delivered",
        description: "Completed"
    },
    cancelled: {
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
        icon: Icons.XCircle,
        label: "Cancelled",
        description: "Order cancelled"
    },
};

export default function OrdersPage() {
    const { user, profile, isLoading: authLoading } = useUserStore();
    const [filter, setFilter] = useState<string | null>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [dataLoading, setDataLoading] = useState(false);

    useEffect(() => {
        // Wait for auth to initialize
        if (authLoading) return;

        // If no user after initialization, don't fetch
        if (!user) return;

        async function fetchOrders() {
            const timeout = setTimeout(() => {
                setDataLoading(false);
            }, 10000);

            setDataLoading(true);
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select(`
                        id, total_amount, status, created_at,
                        seller:profiles!seller_id ( full_name, district ),
                        order_items (
                            id, quantity, price_per_unit, unit, line_total, product_snapshot,
                            product:products ( title, unit )
                        )
                    `)
                    .eq('buyer_id', user!.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setOrders(data || []);
            } catch (error) {
                console.error("Error fetching orders:", (error as any)?.message || error);
            } finally {
                clearTimeout(timeout);
                setDataLoading(false);
            }
        }

        fetchOrders();
    }, [user?.id, authLoading]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#f5f1ea] flex items-center justify-center">
                <LottieLoader />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center bg-[#f5f1ea]">
                <div className="text-center">
                    <p className="text-stone-500 font-medium mb-4">Please sign in to view your orders</p>
                    <Link href="/" className="px-6 py-2 bg-lime-400 text-stone-900 rounded-xl font-bold">
                        Go Home
                    </Link>
                </div>
            </div>
        )
    }

    if (dataLoading && orders.length === 0) {
        return (
            <div className="min-h-screen bg-[#f5f1ea] flex items-center justify-center">
                <LottieLoader />
            </div>
        )
    }

    const filteredOrders = filter
        ? orders.filter(o => o.status === filter)
        : orders;

    if (orders.length === 0) {
        return (
            <div className="min-h-screen bg-[#f5f1ea] flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div className="w-24 h-24 rounded-3xl bg-stone-100 border border-stone-200 flex items-center justify-center mb-6 mx-auto">
                        <Icons.Package className="w-12 h-12 text-stone-300" />
                    </div>
                    <h2 className="font-serif text-3xl font-bold text-stone-800 mb-3">No orders yet</h2>
                    <p className="text-stone-500 mb-8">Start exploring fresh produce from local farmers</p>
                    <Link
                        href="/app/browse"
                        className="inline-flex items-center gap-2 bg-lime-400 text-stone-900 font-bold px-8 py-4 rounded-2xl hover:bg-lime-300 transition-colors"
                    >
                        Browse Produce
                        <Icons.ArrowRight className="w-5 h-5" />
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f1ea]">
            <div className="max-w-4xl mx-auto px-6 py-12 md:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <h1 className="font-serif text-4xl font-bold text-stone-800 mb-2">Your Orders</h1>
                    <p className="text-stone-500">Track and manage your farm-fresh deliveries</p>
                </motion.div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
                    <button
                        onClick={() => setFilter(null)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filter === null
                            ? "bg-stone-800 text-white"
                            : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200 border-transparent hover:border-stone-200"
                            }`}
                    >
                        All Orders
                    </button>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${filter === key
                                ? `${cfg.bg} ${cfg.color} border ${cfg.border}`
                                : "bg-white text-stone-600 border border-transparent hover:border-stone-200 hover:bg-stone-100"
                                }`}
                        >
                            <cfg.icon className="w-4 h-4" />
                            {cfg.label}
                        </button>
                    ))}
                </div>

                {/* Orders List */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filteredOrders.length === 0 && filter && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
                                <p className="text-stone-500">No {STATUS_CONFIG[filter].label.toLowerCase()} orders found.</p>
                            </motion.div>
                        )}
                        {filteredOrders.map((order, i) => {
                            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['pending'];
                            const Icon = cfg.icon;

                            // Extract seller details (single seller per order now)
                            const sellerData = order.seller;
                            let sellerText = sellerData?.full_name || "Unknown Seller";
                            let districtText = sellerData?.district || "";

                            const shortId = order.id.slice(0, 8).toUpperCase();

                            return (
                                <motion.div
                                    key={order.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Link href={`/app/orders/${order.id}`}>
                                        <div className="bg-white border border-stone-200 rounded-3xl p-6 hover:border-lime-400/50 hover:shadow-lg transition-all group cursor-pointer relative overflow-hidden">

                                            {/* Top Line */}
                                            <div className="flex items-start justify-between mb-4 relative z-10">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-serif font-bold text-lg text-stone-800">#{shortId}</h3>
                                                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                                            <Icon className="w-3.5 h-3.5" />
                                                            {cfg.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-stone-500 text-sm">{sellerText} {districtText ? `• ${districtText}` : ''}</p>
                                                    <p className="text-stone-400 text-xs mt-1">
                                                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-serif font-bold text-2xl text-lime-600">₹{order.total_amount.toLocaleString()}</p>
                                                    <div className="mt-2 flex justify-end">
                                                        <motion.div
                                                            className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-lime-400 transition-colors"
                                                            whileHover={{ x: 4 }}
                                                        >
                                                            <Icons.ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900" />
                                                        </motion.div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Items */}
                                            <div className="flex flex-wrap gap-2 pt-4 border-t border-stone-100 relative z-10">
                                                {order.order_items?.map((item: any) => (
                                                    <motion.span
                                                        key={item.id}
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: 0.1 }}
                                                        className="text-xs bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-lg text-stone-600 font-medium"
                                                    >
                                                        {item.quantity}{item.product?.unit} {item.product?.title || "Product"}
                                                    </motion.span>
                                                ))}
                                            </div>

                                            {/* Progress bar for in-transit */}
                                            {(order.status === 'in_transit' || order.status === 'confirmed') && (
                                                <div className="mt-5 relative z-10">
                                                    <div className="flex justify-between text-[10px] uppercase font-bold text-stone-400 mb-1.5 px-1">
                                                        <span className={order.status !== 'pending' ? 'text-lime-600' : ''}>Confirmed</span>
                                                        <span className={order.status === 'in_transit' || order.status === 'delivered' ? 'text-lime-600' : ''}>Shipped</span>
                                                        <span>Delivered</span>
                                                    </div>
                                                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className="h-full bg-gradient-to-r from-lime-400 to-emerald-500 rounded-full"
                                                            initial={{ width: "0%" }}
                                                            animate={{ width: order.status === 'confirmed' ? "33%" : order.status === 'in_transit' ? "66%" : "100%" }}
                                                            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}