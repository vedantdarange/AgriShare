"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { useUserStore } from "@/lib/store/userStore";
import LottieLoader from "@/components/LottieLoader";
import Image from "next/image";

const Icons = {
    ChevronLeft: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Upload: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    X: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Check: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Loader: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" strokeLinecap="round" />
        </svg>
    ),
};

const RETURN_REASONS = [
    { id: 'quality_issue', label: 'Quality Issue / Damaged', desc: 'Produce is not fresh or is damaged' },
    { id: 'wrong_item', label: 'Wrong Item', desc: 'Received a different product than ordered' },
    { id: 'less_quantity', label: 'Less Quantity', desc: 'Missing items or underweight' },
    { id: 'changed_mind', label: 'Changed Mind', desc: 'No longer need the product' },
];

const REFUND_METHODS = [
    { id: 'original_payment', label: 'Original Payment Method', desc: '5-7 business days' },
    { id: 'wallet', label: 'Farmer Web Wallet', desc: 'Instant refund (Coming soon)', disabled: true },
];

export default function ReturnRequestPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const router = useRouter();
    const { user } = useUserStore();

    const [order, setOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Form State
    const [selectedItems, setSelectedItems] = useState<{ id: string, quantity: number }[]>([]);
    const [reason, setReason] = useState<string>("");
    const [description, setDescription] = useState("");
    const [photos, setPhotos] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
    const [refundMethod, setRefundMethod] = useState("original_payment");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function fetchOrder() {
            if (!user) return;
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    seller:profiles!seller_id ( full_name ),
                    order_items ( id, quantity, price_per_unit, unit, product_snapshot, product:products(title) )
                `)
                .eq('id', unwrappedParams.id)
                .single();

            if (data) {
                setOrder(data);
            }
            setIsLoading(false);
        }
        fetchOrder();
    }, [unwrappedParams.id, user]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setPhotos(prev => [...prev, ...newFiles]);
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setPhotoPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
        setPhotoPreviews(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const toggleItem = (itemId: string, maxQty: number) => {
        setSelectedItems(prev => {
            const exists = prev.find(p => p.id === itemId);
            if (exists) return prev.filter(p => p.id !== itemId);
            return [...prev, { id: itemId, quantity: maxQty }]; // Default to returning all qty
        });
    };

    const updateItemQuantity = (itemId: string, qty: number, maxQty: number) => {
        if (qty < 1 || qty > maxQty) return;
        setSelectedItems(prev => prev.map(p => p.id === itemId ? { ...p, quantity: qty } : p));
    };

    const handleSubmit = async () => {
        if (!user || selectedItems.length === 0 || !reason || isSubmitting) return;

        setIsSubmitting(true);
        try {
            // 1. Create Return Record
            const { data: retData, error: retError } = await supabase
                .from('returns')
                .insert({
                    order_id: order.id,
                    user_id: user.id,
                    seller_id: order.seller_id,
                    reason,
                    description,
                    refund_method: refundMethod,
                    status: 'pending'
                })
                .select()
                .single();

            if (retError) throw retError;

            // 2. Insert Return Items
            const returnItemsPayload = selectedItems.map(item => ({
                return_id: retData.id,
                order_item_id: item.id,
                quantity: item.quantity
            }));

            const { error: itemsError } = await supabase.from('return_items').insert(returnItemsPayload);
            if (itemsError) throw itemsError;

            // 3. Upload Photos & Insert Photo Records (if any)
            if (photos.length > 0) {
                for (let i = 0; i < photos.length; i++) {
                    const file = photos[i];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${retData.id}-${i}-${Date.now()}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('return_proofs')
                        .upload(fileName, file);

                    if (!uploadError) {
                        const { data: publicUrl } = supabase.storage.from('return_proofs').getPublicUrl(fileName);
                        await supabase.from('return_photos').insert({
                            return_id: retData.id,
                            photo_url: publicUrl.publicUrl
                        });
                    }
                }
            }

            alert("Return request submitted successfully!");
            router.push(`/app/returns/${retData.id}`);
        } catch (error: any) {
            console.error("Return Submission Error:", error);
            alert("Failed to submit return. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="min-h-screen bg-[#f5f1ea] flex items-center justify-center"><LottieLoader /></div>;
    if (!order) return <div className="p-8 text-center text-stone-500">Order not found.</div>;

    const isSubmitReady = selectedItems.length > 0 && reason !== "";

    return (
        <div className="min-h-screen bg-[#f5f1ea] pb-24">
            <div className="max-w-2xl mx-auto px-6 py-8 md:py-12">
                {/* Header Navbar */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-300 transition-colors"
                    >
                        <Icons.ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-serif text-2xl font-bold text-stone-800">Request Return</h1>
                        <p className="text-stone-500 text-sm">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Section 1: Select Items */}
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
                        <h2 className="text-lg font-bold text-stone-800 mb-4">1. Select Items to Return</h2>
                        <div className="space-y-4">
                            {order.order_items.map((item: any) => {
                                const isSelected = selectedItems.find(p => p.id === item.id);
                                const productTitle = item.product?.title || item.product_snapshot?.title || "Product";

                                return (
                                    <div key={item.id} className={`p-4 rounded-2xl border transition-colors ${isSelected ? 'border-lime-500 bg-lime-50/30' : 'border-stone-200 hover:border-stone-300'}`}>
                                        <div className="flex items-start gap-4">
                                            <button
                                                onClick={() => toggleItem(item.id, item.quantity)}
                                                className={`mt-1 w-6 h-6 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-lime-500 border-lime-500 text-white' : 'border-stone-300'}`}
                                            >
                                                {isSelected && <Icons.Check className="w-4 h-4" />}
                                            </button>
                                            <div className="flex-1">
                                                <p className="font-bold text-stone-800">{productTitle}</p>
                                                <p className="text-sm text-stone-500 mb-3">₹{item.price_per_unit} / {item.unit}</p>

                                                <AnimatePresence>
                                                    {isSelected && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="flex items-center gap-4 pt-3 border-t border-stone-100"
                                                        >
                                                            <span className="text-sm font-medium text-stone-600">Return Qty:</span>
                                                            <div className="flex items-center gap-3 bg-stone-100 rounded-full p-1">
                                                                <button
                                                                    onClick={() => updateItemQuantity(item.id, isSelected.quantity - 1, item.quantity)}
                                                                    className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-lg font-bold text-stone-600"
                                                                >-</button>
                                                                <span className="w-4 text-center font-bold">{isSelected.quantity}</span>
                                                                <button
                                                                    onClick={() => updateItemQuantity(item.id, isSelected.quantity + 1, item.quantity)}
                                                                    className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-lg font-bold text-stone-600"
                                                                >+</button>
                                                            </div>
                                                            <span className="text-xs text-stone-400">Total bought: {item.quantity}</span>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 2: Reason */}
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
                        <h2 className="text-lg font-bold text-stone-800 mb-4">2. Why are you returning?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                            {RETURN_REASONS.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => setReason(r.id)}
                                    className={`p-4 rounded-2xl border text-left transition-colors ${reason === r.id ? 'border-lime-500 bg-lime-50' : 'border-stone-200 hover:border-stone-300'}`}
                                >
                                    <p className="font-bold text-stone-800 mb-1">{r.label}</p>
                                    <p className="text-xs text-stone-500">{r.desc}</p>
                                </button>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-stone-700">Additional Details (Optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Tell us more about the issue..."
                                className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 min-h-[100px] outline-none focus:border-lime-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Section 3: Photos */}
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
                        <h2 className="text-lg font-bold text-stone-800 mb-2">3. Upload Proof</h2>
                        <p className="text-sm text-stone-500 mb-4">Please upload clear photos of the issue to help us process your return faster.</p>

                        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                            {photoPreviews.map((url, i) => (
                                <div key={i} className="aspect-square relative rounded-2xl overflow-hidden border border-stone-200">
                                    <img src={url} alt="Proof" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removePhoto(i)}
                                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-stone-900/60 backdrop-blur-sm flex items-center justify-center text-white p-1 hover:bg-stone-900 transition-colors"
                                    >
                                        <Icons.X />
                                    </button>
                                </div>
                            ))}
                            <label className="aspect-square rounded-2xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-500 hover:border-lime-500 hover:text-lime-600 transition-colors cursor-pointer bg-stone-50">
                                <Icons.Upload className="w-6 h-6 mb-2" />
                                <span className="text-xs font-semibold">Add Photo</span>
                                <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
                            </label>
                        </div>
                    </div>

                    {/* Section 4: Refund Method */}
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
                        <h2 className="text-lg font-bold text-stone-800 mb-4">4. Refund Method</h2>
                        <div className="space-y-3">
                            {REFUND_METHODS.map(r => (
                                <button
                                    key={r.id}
                                    disabled={r.disabled}
                                    onClick={() => setRefundMethod(r.id)}
                                    className={`w-full p-4 rounded-2xl border text-left flex items-start gap-4 transition-colors ${refundMethod === r.id ? 'border-lime-500 bg-lime-50' : r.disabled ? 'border-stone-100 bg-stone-50 opacity-50 cursor-not-allowed' : 'border-stone-200 hover:border-stone-300'}`}
                                >
                                    <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${refundMethod === r.id ? 'border-lime-500' : 'border-stone-300'}`}>
                                        {refundMethod === r.id && <div className="w-2.5 h-2.5 rounded-full bg-lime-500" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-stone-800 mb-1">{r.label}</p>
                                        <p className="text-xs text-stone-500">{r.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit Bar */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-stone-200 z-40">
                        <div className="max-w-2xl mx-auto flex items-center gap-4">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-stone-500">Selected Items</p>
                                <p className="font-bold text-stone-800">{selectedItems.length} items</p>
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={!isSubmitReady || isSubmitting}
                                className={`px-8 py-4 rounded-2xl font-bold text-lg min-w-[200px] flex items-center justify-center transition-all ${isSubmitReady && !isSubmitting ? 'bg-lime-500 hover:bg-lime-600 text-white shadow-xl shadow-lime-500/20' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}
                            >
                                {isSubmitting ? <Icons.Loader className="w-6 h-6 animate-spin" /> : "Submit Return"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
