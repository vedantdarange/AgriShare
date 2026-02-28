"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import LottieLoader from "@/components/LottieLoader";

const Icons = {
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
    Refresh: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 12c0-3.87 2.1-7.23 5.3-8.87M22 12c0 3.87-2.1 7.23-5.3 8.87" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7.5 3v6h-6M16.5 21v-6h6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
};

const RETURN_TIMELINE = [
    { id: "pending", label: "Request Submitted", description: "Waiting for seller approval" },
    { id: "approved", label: "Approved", description: "Return accepted by seller" },
    { id: "pickup_scheduled", label: "Pickup Scheduled", description: "Agent will collect the items" },
    { id: "refunded", label: "Refund Processed", description: "Refund sent to your payment method" },
];

const REASON_MAP: Record<string, string> = {
    quality_issue: 'Quality Issue / Damaged',
    wrong_item: 'Wrong Item Received',
    less_quantity: 'Missing Items',
    changed_mind: 'Changed Mind',
};

const REFUND_MAP: Record<string, string> = {
    original_payment: 'Original Payment Method',
    wallet: 'Farmer Web Wallet',
};

export default function ReturnDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const router = useRouter();
    const [returnData, setReturnData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchReturn() {
            try {
                const { data, error } = await supabase
                    .from('returns')
                    .select(`
                        *,
                        return_items (
                            id, quantity,
                            order_item:order_items (
                                product_snapshot,
                                product:products (title)
                            )
                        ),
                        return_photos ( id, photo_url )
                    `)
                    .eq('id', unwrappedParams.id)
                    .single();

                if (error) throw error;
                setReturnData(data);
            } catch (error) {
                console.error("Error fetching return:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchReturn();
    }, [unwrappedParams.id]);

    if (isLoading) return <div className="min-h-screen bg-[#f5f1ea] flex items-center justify-center"><LottieLoader /></div>;

    if (!returnData) {
        return (
            <div className="min-h-screen bg-[#f5f1ea] flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <Icons.Refresh className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-bold text-stone-800 mb-2">Return Not Found</h1>
                <p className="text-stone-500 mb-8">This return request doesn't exist or you lack permission to view it.</p>
                <button onClick={() => router.push('/app/orders')} className="px-6 py-3 bg-stone-800 text-white font-bold rounded-xl hover:bg-stone-700 transition">
                    Back to Orders
                </button>
            </div>
        );
    }

    const statusIndex = RETURN_TIMELINE.findIndex(s => s.id === returnData.status);
    // If rejected, the timeline breaks
    const currentStepIndex = returnData.status === 'rejected' ? -1 : (statusIndex >= 0 ? statusIndex : 0);

    return (
        <div className="min-h-screen bg-[#f5f1ea]">
            <div className="max-w-3xl mx-auto px-6 py-8 md:py-12">
                {/* Header Navbar */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-300 transition-colors"
                    >
                        <Icons.ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="font-serif text-2xl font-bold text-stone-800">Return Status</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-stone-500 text-sm">Return ID: {returnData.id.slice(0, 8).toUpperCase()}</p>
                            <span className="w-1 h-1 rounded-full bg-stone-300" />
                            <p className="text-stone-500 text-sm">Order #{returnData.order_id.slice(0, 8).toUpperCase()}</p>
                        </div>
                    </div>
                </div>

                {returnData.status === 'rejected' && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-8 flex items-start gap-3">
                        <Icons.Refresh className="w-5 h-5 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-bold">Return Rejected</p>
                            <p className="text-sm mt-1">The seller has reviewed your request but rejected the return. If you believe this is an error, please contact Support.</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Timeline & Photos */}
                    <div className="space-y-8">
                        {returnData.status !== 'rejected' && (
                            <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                                <h3 className="font-serif font-bold text-xl text-stone-800 mb-8">Tracking</h3>

                                <div className="relative">
                                    <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-stone-100" />
                                    <motion.div
                                        className="absolute left-6 top-6 w-0.5 bg-lime-400 origin-top"
                                        initial={{ scaleY: 0 }}
                                        animate={{ scaleY: currentStepIndex / (RETURN_TIMELINE.length - 1) }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                    />

                                    <div className="space-y-8 relative">
                                        {RETURN_TIMELINE.map((step, index) => {
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
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {returnData.return_photos && returnData.return_photos.length > 0 && (
                            <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                                <h3 className="font-serif font-bold text-xl text-stone-800 mb-4">Proof Attached</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {returnData.return_photos.map((photo: any) => (
                                        <div key={photo.id} className="aspect-square rounded-xl overflow-hidden border border-stone-200">
                                            <img src={photo.photo_url} alt="Return proof" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Details */}
                    <div className="space-y-8">
                        {/* Return Summary */}
                        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                            <h3 className="font-serif font-bold text-xl text-stone-800 mb-6">Return Details</h3>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs uppercase tracking-wider font-bold text-stone-400 mb-1">Reason</p>
                                    <p className="font-bold text-stone-800">{REASON_MAP[returnData.reason]}</p>
                                    {returnData.description && <p className="text-sm text-stone-500 mt-1">"{returnData.description}"</p>}
                                </div>
                                <div className="border-t border-stone-100 pt-4">
                                    <p className="text-xs uppercase tracking-wider font-bold text-stone-400 mb-1">Refund Method</p>
                                    <p className="font-bold text-stone-800">{REFUND_MAP[returnData.refund_method] || returnData.refund_method}</p>
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                            <h3 className="font-serif font-bold text-xl text-stone-800 mb-4">Items Returning</h3>
                            <div className="space-y-4">
                                {returnData.return_items?.map((item: any) => {
                                    const oi = item.order_item;
                                    const title = oi?.product?.title || oi?.product_snapshot?.title || "Product";
                                    return (
                                        <div key={item.id} className="flex justify-between items-start pb-4 border-b border-stone-100 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-bold text-stone-800">{title}</p>
                                                <p className="text-sm font-medium text-stone-600 mt-2 bg-stone-50 inline-block px-2 py-1 rounded-md">
                                                    Qty returning: {item.quantity}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Help block */}
                        <div className="bg-stone-800 rounded-3xl p-6 text-white shadow-lg">
                            <h3 className="font-serif font-bold text-xl mb-2">Need help?</h3>
                            <p className="text-stone-400 text-sm mb-6">If the seller is unresponsive or you need to escalate this return, reach out to us.</p>
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
