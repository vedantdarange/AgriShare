"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    ChevronLeft: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Check: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    MapPin: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    ),
    Truck: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 17h4V5H2v12h3M10 17v-4H6v4m0 0a2 2 0 104 0m6 0a2 2 0 104 0v-4h-4m4 0V5h6l4 8h-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Store: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 9l2 10h14l2-10M3 9l6-6h6l6 6M3 9h18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Receipt: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 2v20l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2V2L18 4l-2-2-2 2-2-2-2 2-2-2-2 2z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 14H8M16 10H8" strokeLinecap="round" />
        </svg>
    ),
    Loader: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" strokeLinecap="round" />
        </svg>
    ),
};

const TIMELINE_STEPS = [
    { id: "pending", label: "Order Placed", description: "We have received your order" },
    { id: "confirmed", label: "Confirmed", description: "Farmer has accepted" },
    { id: "in_transit", label: "In Transit", description: "Out for delivery" },
    { id: "delivered", label: "Delivered", description: "Order completed" },
];

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchOrderDetails() {
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select(`
                        *,
                        seller:profiles!seller_id ( full_name, district, phone ),
                        delivery_address:addresses!delivery_address_id ( street, village, district, state, pincode, latitude, longitude ),
                        returns ( id, status ),
                        order_items (
                            id, quantity, price_per_unit, unit, line_total, product_snapshot,
                            product:products ( title, unit, price_per_unit )
                        )
                    `)
                    .eq('id', unwrappedParams.id)
                    .single();

                if (error) throw error;
                if (!data) throw new Error("Order not found");

                setOrder(data);
            } catch (err: any) {
                console.error("Error fetching order:", err);
                setError(err.message || "Failed to load order details");
            } finally {
                setIsLoading(false);
            }
        }

        fetchOrderDetails();
    }, [unwrappedParams.id]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f5f1ea] flex flex-col items-center justify-center">
                <LottieLoader />
                <p className="text-stone-500 font-medium">Loading order details...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-[#f5f1ea] flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <Icons.Package className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-bold text-stone-800 mb-2">Order Not Found</h1>
                <p className="text-stone-500 mb-8">{error || "The order you are looking for does not exist or you don't have access."}</p>
                <button
                    onClick={() => router.push('/app/orders')}
                    className="px-6 py-3 bg-stone-800 text-white font-bold rounded-xl hover:bg-stone-700 transition"
                >
                    Back to Orders
                </button>
            </div>
        );
    }

    // Determine current timeline step index
    const statusIndex = TIMELINE_STEPS.findIndex(s => s.id === order.status);
    const currentStepIndex = order.status === 'cancelled' ? -1 : (statusIndex >= 0 ? statusIndex : 0);

    const subtotal = order.subtotal || order.order_items?.reduce((acc: number, item: any) => acc + (item.quantity * item.price_per_unit), 0) || 0;
    const transport = order.transport_fee || 0;
    const platformFee = order.platform_fee || Math.round(subtotal * 0.02);

    return (
        <div className="min-h-screen bg-[#f5f1ea]">
            <div className="max-w-3xl mx-auto px-6 py-8 md:py-12">
                {/* Header Navbar */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.push('/app/orders')}
                        className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-300 transition-colors"
                    >
                        <Icons.ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-serif text-2xl font-bold text-stone-800">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
                        <p className="text-stone-500 text-sm">
                            Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'long', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            })}
                        </p>
                    </div>
                </div>

                {/* Cancelled Alert */}
                {order.status === 'cancelled' && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-8 flex items-start gap-3">
                        <Icons.Package className="w-5 h-5 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-bold">Order Cancelled</p>
                            <p className="text-sm mt-1">This order was cancelled and will not be delivered. Any payments made will be refunded within 5-7 business days.</p>
                        </div>
                    </div>
                )}

                {/* Timeline Tracking */}
                {order.status !== 'cancelled' && (
                    <div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm mb-8">
                        <h3 className="font-serif font-bold text-xl text-stone-800 mb-8">Tracking</h3>

                        <div className="relative">
                            {/* Connecting Line background */}
                            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-stone-100" />
                            {/* Connecting Line foreground (progress) */}
                            <motion.div
                                className="absolute left-6 top-6 w-0.5 bg-lime-400 origin-top"
                                initial={{ scaleY: 0 }}
                                animate={{ scaleY: currentStepIndex / (TIMELINE_STEPS.length - 1) }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />

                            <div className="space-y-8 relative">
                                {TIMELINE_STEPS.map((step, index) => {
                                    const isCompleted = index <= currentStepIndex;
                                    const isCurrent = index === currentStepIndex;

                                    return (
                                        <div key={step.id} className="flex gap-4 md:gap-6 relative">
                                            <div className="relative z-10 shrink-0">
                                                <motion.div
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ delay: index * 0.2 }}
                                                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${isCompleted
                                                        ? "bg-lime-400 border-lime-400 text-white"
                                                        : "bg-white border-stone-200 text-stone-300"
                                                        } ${isCurrent ? "shadow-lg shadow-lime-400/30" : ""}`}
                                                >
                                                    {isCompleted ? <Icons.Check className="w-5 h-5" /> : <div className="w-2.5 h-2.5 rounded-full bg-stone-200" />}
                                                </motion.div>
                                            </div>
                                            <div className="pt-2.5 flex-1 pb-4">
                                                <h4 className={`font-bold ${isCompleted ? 'text-stone-800' : 'text-stone-400'}`}>
                                                    {step.label}
                                                </h4>
                                                <p className={`text-sm mt-1 ${isCompleted ? 'text-stone-500' : 'text-stone-400'}`}>
                                                    {step.description}
                                                </p>
                                                {/* Mock timestamps for completed steps */}
                                                {isCompleted && (
                                                    <p className="text-xs text-stone-400 mt-2">
                                                        {index === 0 && new Date(order.created_at).toLocaleString('en-IN')}
                                                        {index > 0 && "Pending update"}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Items & Receipt */}
                    <div className="space-y-8">
                        {/* Items */}
                        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                            <h3 className="font-serif font-bold text-xl text-stone-800 mb-6 flex items-center gap-2">
                                <Icons.Package className="w-5 h-5 text-lime-600" />
                                Order Items
                            </h3>
                            <div className="space-y-4">
                                {order.order_items?.map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-start pb-4 border-b border-stone-100 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-bold text-stone-800">{item.product_snapshot?.title || item.product?.title || "Unknown Product"}</p>
                                            <p className="text-xs text-stone-500 mt-1">Sold by: {order.seller?.full_name || "Unknown Seller"}</p>
                                            <p className="text-sm font-medium text-stone-600 mt-2 bg-stone-50 inline-block px-2 py-1 rounded-md">
                                                Qty: {item.quantity} {item.unit || item.product?.unit}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-stone-800">
                                                ₹{(item.line_total || (item.quantity * item.price_per_unit)).toLocaleString('en-IN')}
                                            </p>
                                            <p className="text-xs text-stone-400 mt-1">₹{item.price_per_unit}/{item.unit || item.product?.unit}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                            <h3 className="font-serif font-bold text-xl text-stone-800 mb-6 flex items-center gap-2">
                                <Icons.Receipt className="w-5 h-5 text-lime-600" />
                                Payment Summary
                            </h3>
                            <div className="space-y-3 text-sm mb-6">
                                <div className="flex justify-between text-stone-600">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-stone-600">
                                    <span>Delivery Fee</span>
                                    <span>{transport === 0 ? "Free" : `₹${transport}`}</span>
                                </div>
                                <div className="flex justify-between text-stone-600">
                                    <span>Platform Fee</span>
                                    <span>₹{platformFee}</span>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-stone-200 flex justify-between items-end">
                                <div>
                                    <p className="font-semibold text-stone-800">Total Paid</p>
                                    <p className="text-xs text-stone-500 uppercase font-bold tracking-wider mt-1">
                                        Via {order.payment_method === 'upi' ? 'UPI' : order.payment_method === 'cod' ? 'Cash on Delivery' : 'Card'}
                                    </p>
                                </div>
                                <span className="font-serif font-bold text-3xl text-lime-600">₹{order.total_amount.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Details */}
                    <div className="space-y-8">
                        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                            <h3 className="font-serif font-bold text-xl text-stone-800 mb-6 flex items-center gap-2">
                                <Icons.MapPin className="w-5 h-5 text-lime-600" />
                                Delivery Details
                            </h3>

                            <div className="mb-6">
                                <p className="text-xs uppercase tracking-wider font-bold text-stone-400 mb-2">Mode</p>
                                <div className="flex items-center gap-3 bg-stone-50 px-4 py-3 rounded-xl border border-stone-100">
                                    {order.delivery_mode === 'buyer_pickup' ? (
                                        <Icons.Store className="w-5 h-5 text-stone-600" />
                                    ) : (
                                        <Icons.Truck className="w-5 h-5 text-stone-600" />
                                    )}
                                    <span className="font-bold text-stone-700 capitalize">
                                        {order.delivery_mode === 'buyer_pickup' ? "Farm Pickup" : "Doorstep Delivery"}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-wider font-bold text-stone-400 mb-2">Address</p>
                                <p className="text-sm text-stone-600 leading-relaxed bg-stone-50 px-4 py-3 rounded-xl border border-stone-100 break-words">
                                    {order.delivery_address?.street ? `${order.delivery_address.street}, ${order.delivery_address.village || order.delivery_address.district}, ${order.delivery_address.state} ${order.delivery_address.pincode}` : (order.delivery_address || "No address provided for pickup.")}
                                    {order.delivery_address?.latitude && order.delivery_address?.longitude && (
                                        <span className="block mt-2 text-xs text-lime-600 font-semibold">
                                            GPS Coords pinned for accuracy.
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Support Block */}
                        <div className="bg-stone-800 rounded-3xl p-6 text-white shadow-lg">
                            <h3 className="font-serif font-bold text-xl mb-2">Need help?</h3>
                            <p className="text-stone-400 text-sm mb-6">Have an issue with this order? Contact our support team immediately.</p>

                            {order.status === 'delivered' && (!order.returns || order.returns.length === 0) && (
                                <button
                                    onClick={() => router.push(`/app/orders/${order.id}/return`)}
                                    className="w-full bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors mb-3"
                                >
                                    Request Return / Refund
                                </button>
                            )}

                            {order.returns && order.returns.length > 0 && (
                                <button
                                    onClick={() => router.push(`/app/returns/${order.returns[0].id}`)}
                                    className="w-full bg-lime-500 text-stone-900 font-bold py-3 rounded-xl hover:bg-lime-600 transition-colors mb-3"
                                >
                                    View Return Status
                                </button>
                            )}

                            <button className="w-full bg-white text-stone-900 font-bold py-3 rounded-xl hover:bg-stone-200 transition-colors">
                                Contact Support
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
