"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useCartStore } from "@/lib/store/cartStore";
import { useToast } from "@/lib/toast";

// Custom Icons
const Icons = {
    Cart: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    ArrowRight: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Minus: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" strokeLinecap="round" />
        </svg>
    ),
    Plus: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5v14" strokeLinecap="round" />
        </svg>
    ),
    Trash: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Leaf: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2C7 2 4 6 4 12s4 9 8 9c.5 0 1-.05 1.5-.15M12 2c5 0 8 4 8 10s-4 9-8 9" strokeLinecap="round" />
            <path d="M12 21V11M12 11c-2-1-3-3.5-3-6M12 11c2-1 3-3.5 3-6" strokeLinecap="round" />
        </svg>
    ),
    Shield: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Truck: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 17h4V5H2v12h3M10 17v-4H6v4m0 0a2 2 0 104 0m6 0a2 2 0 104 0v-4h-4m4 0V5h6l4 8h-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
};

// Magnetic Button
function MagneticButton({
    children,
    onClick,
    className = "",
    variant = "primary",
}: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: "primary" | "secondary" | "outline";
}) {
    const ref = useRef<HTMLButtonElement>(null);

    const variants = {
        primary: "bg-lime-400 text-stone-900 hover:bg-lime-300 shadow-lg shadow-lime-400/20",
        secondary: "bg-stone-800 text-stone-100 hover:bg-stone-700",
        outline: "border-2 border-stone-200 text-stone-600 hover:border-lime-400 hover:text-lime-700",
    };

    return (
        <motion.button
            ref={ref}
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative overflow-hidden rounded-xl font-semibold transition-all duration-300 ${variants[variant]} ${className}`}
        >
            {children}
        </motion.button>
    );
}

export default function CartPage() {
    const { items, updateQty: storeUpdateQty, removeItem: fromStore, addItem } = useCartStore();
    const toast = useToast();
    const [removingId, setRemovingId] = useState<string | null>(null);

    const updateQty = (id: string, qty: number) => {
        if (qty < 1) return;
        const item = items.find(i => i.id === id);
        if (!item) return;
        storeUpdateQty(item.product_id, qty);
        // Subtle quantity toast
        toast.quantityUpdated(qty);
    };

    const removeItem = (id: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;

        setRemovingId(id);
        setTimeout(() => {
            fromStore(item.product_id);
            setRemovingId(null);

            // Show removal toast with Undo
            toast.removedFromCart(item.title, () => {
                addItem(item);
                toast.success({ title: "Item restored", description: `${item.title} is back in your cart` });
            });
        }, 300);
    };

    const totalAmount = () => items.reduce((sum, item) => sum + item.price_per_unit * item.quantity, 0);
    const platformFee = items.length > 0 ? 15 : 0;
    const transportFee = 80;
    const grandTotal = totalAmount() + platformFee + transportFee;

    // Group by seller
    const grouped = items.reduce((acc, item) => {
        if (!acc[item.seller_id]) acc[item.seller_id] = [];
        acc[item.seller_id].push(item);
        return acc;
    }, {} as Record<string, typeof items>);

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-[#f5f1ea] flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div className="w-32 h-32 rounded-3xl bg-stone-100 border border-stone-200 flex items-center justify-center mb-8 mx-auto">
                        <Icons.Cart className="w-16 h-16 text-stone-300" />
                    </div>
                    <h2 className="font-serif text-3xl font-bold text-stone-800 mb-3">Your cart is empty</h2>
                    <p className="text-stone-500 mb-8 max-w-md mx-auto">Discover fresh, organic produce directly from verified farmers in your region.</p>
                    <Link href="/app/browse">
                        <MagneticButton
                            className="px-8 py-4 text-base inline-flex items-center gap-2"
                        >
                            Browse Produce
                            <Icons.ArrowRight className="w-5 h-5" />
                        </MagneticButton>
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f1ea]">
            <div className="max-w-6xl mx-auto px-8 py-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <h1 className="font-serif text-4xl font-bold text-stone-800 mb-2">Your Cart</h1>
                    <p className="text-stone-500">{items.length} items from {Object.keys(grouped).length} farmers</p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Cart Items - Left Side */}
                    <div className="lg:col-span-8 space-y-6">
                        {Object.entries(grouped).map(([sellerId, sellerItems], groupIndex) => (
                            <motion.div
                                key={sellerId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: groupIndex * 0.1 }}
                                className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm"
                            >
                                {/* Seller Header */}
                                <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-3 bg-stone-50/50">
                                    <div className="w-10 h-10 rounded-full bg-lime-400/10 flex items-center justify-center text-lime-700 font-bold text-sm">
                                        {sellerItems[0].seller_name[0]}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-stone-800 text-sm">{sellerItems[0].seller_name}</p>
                                        <p className="text-xs text-stone-400">Direct from farm</p>
                                    </div>
                                    <div className="ml-auto flex items-center gap-1 text-xs text-lime-600 bg-lime-400/10 px-3 py-1 rounded-full">
                                        <Icons.Leaf className="w-3 h-3" />
                                        Verified
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="divide-y divide-stone-100">
                                    <AnimatePresence mode="popLayout">
                                        {sellerItems.map((item) => (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: removingId === item.id ? 0 : 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0, x: -100 }}
                                                transition={{ duration: 0.3 }}
                                                className="p-6 flex items-center gap-6"
                                            >
                                                {/* Image */}
                                                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-stone-100 shrink-0">
                                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-serif font-bold text-stone-800 text-lg mb-1">{item.title}</h3>
                                                    <p className="text-stone-500 text-sm mb-3">{item.variety}</p>
                                                    <p className="text-lime-700 font-bold text-xl">₹{item.price_per_unit}<span className="text-stone-400 text-sm font-normal">/{item.unit}</span></p>
                                                </div>

                                                {/* Quantity Controls */}
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2 bg-stone-100 rounded-xl p-1">
                                                        <motion.button
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => updateQty(item.id, item.quantity - 1)}
                                                            className="w-8 h-8 rounded-lg bg-white text-stone-600 flex items-center justify-center shadow-sm hover:text-lime-700 transition-colors"
                                                        >
                                                            <Icons.Minus className="w-4 h-4" />
                                                        </motion.button>
                                                        <span className="w-8 text-center font-semibold text-stone-800">{item.quantity}</span>
                                                        <motion.button
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => updateQty(item.id, item.quantity + 1)}
                                                            disabled={item.quantity >= item.available_quantity}
                                                            className="w-8 h-8 rounded-lg bg-white text-stone-600 flex items-center justify-center shadow-sm hover:text-lime-700 transition-colors disabled:opacity-50"
                                                        >
                                                            <Icons.Plus className="w-4 h-4" />
                                                        </motion.button>
                                                    </div>

                                                    {/* Total & Remove */}
                                                    <div className="text-right min-w-[100px]">
                                                        <p className="font-bold text-stone-800 text-lg">₹{(item.price_per_unit * item.quantity).toLocaleString()}</p>
                                                        <motion.button
                                                            whileHover={{ scale: 1.1, color: "#ef4444" }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => removeItem(item.id)}
                                                            className="text-stone-400 text-xs flex items-center gap-1 mt-1 ml-auto hover:text-red-500 transition-colors"
                                                        >
                                                            <Icons.Trash className="w-3.5 h-3.5" />
                                                            Remove
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Order Summary - Right Side */}
                    <div className="lg:col-span-4">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm sticky top-6"
                        >
                            <h3 className="font-serif font-bold text-xl text-stone-800 mb-6">Order Summary</h3>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-stone-600">
                                    <span>Subtotal ({items.length} items)</span>
                                    <span className="font-medium text-stone-800">₹{totalAmount().toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-stone-600">
                                    <span className="flex items-center gap-1.5">
                                        <Icons.Truck className="w-4 h-4 text-stone-400" />
                                        Transport
                                    </span>
                                    <span className="font-medium text-stone-800">₹{transportFee}</span>
                                </div>
                                <div className="flex justify-between text-stone-600">
                                    <span>Platform fee</span>
                                    <span className="font-medium text-stone-800">₹{platformFee}</span>
                                </div>
                            </div>

                            <div className="border-t border-stone-200 pt-4 mb-6">
                                <div className="flex justify-between items-end">
                                    <span className="font-semibold text-stone-800">Total</span>
                                    <span className="font-serif font-bold text-3xl text-lime-600">₹{grandTotal.toLocaleString()}</span>
                                </div>
                                <p className="text-xs text-stone-400 mt-1">Including all taxes</p>
                            </div>

                            {/* Savings badge */}
                            <div className="bg-lime-400/10 border border-lime-400/20 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-2 text-lime-700">
                                    <Icons.Leaf className="w-5 h-5" />
                                    <span className="font-semibold text-sm">You're saving 15% vs retail</span>
                                </div>
                                <p className="text-xs text-lime-600/70 mt-1">By buying directly from farmers</p>
                            </div>

                            {/* Trust badge */}
                            <div className="flex items-center gap-2 text-stone-500 text-xs mb-6">
                                <Icons.Shield className="w-4 h-4" />
                                <span>Secure checkout • Farmer protection</span>
                            </div>

                            <MagneticButton
                                className="w-full py-4 text-base flex items-center justify-center gap-2"
                            >
                                <Link href="/app/checkout" className="contents">
                                    Proceed to Checkout
                                    <Icons.ArrowRight className="w-5 h-5" />
                                </Link>
                            </MagneticButton>

                            <p className="text-center text-xs text-stone-400 mt-4">
                                Free cancellation within 24 hours
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}