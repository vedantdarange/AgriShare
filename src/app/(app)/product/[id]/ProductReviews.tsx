"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useUserStore } from "@/lib/store/userStore";
import { useToast } from "@/lib/toast";

interface Review {
    id: string;
    product_id: string;
    buyer_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    buyer: {
        full_name: string | null;
        avatar_url: string | null;
    } | null;
}

interface ProductReviewsProps {
    productId: string;
    sellerId: string;
    totalReviews: number;
    avgRating: number;
    className?: string;
}

export function ProductReviews({ productId, sellerId, totalReviews, avgRating, className = "" }: ProductReviewsProps) {
    const { user } = useUserStore();
    const toast = useToast();

    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasPurchased, setHasPurchased] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);

    const [isWriting, setIsWriting] = useState(false);
    const [ratingForm, setRatingForm] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [commentForm, setCommentForm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchReviews();
        if (user) {
            checkEligibility();
        }
    }, [productId, user?.id]);

    async function fetchReviews() {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select(`
                    id, rating, comment, created_at, buyer_id, product_id,
                    buyer:profiles!buyer_id (full_name, avatar_url)
                `)
                .eq('product_id', productId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Supabase sometimes returns joins as arrays even for 1:1 relations if not explicitly defined.
            // Map the data to ensure buyer is correctly typed and extracted.
            const formattedData = (data || []).map((review: any) => ({
                ...review,
                buyer: Array.isArray(review.buyer) ? review.buyer[0] : review.buyer
            })) as Review[];

            setReviews(formattedData);

            if (user) {
                setHasReviewed((data || []).some(r => r.buyer_id === user.id));
            }
        } catch (error) {
            console.error("Error fetching reviews:", (error as any)?.message || error);
        } finally {
            setLoading(false);
        }
    }

    async function checkEligibility() {
        if (!user) return;
        try {
            // Check if user has purchased this product
            const { data, error } = await supabase
                .from('order_items')
                .select(`id, orders!inner(buyer_id, status)`)
                .eq('orders.buyer_id', user.id)
                .eq('product_id', productId)
                .in('orders.status', ['delivered', 'confirmed', 'in_transit']) // For testing, allowing these statuses
                .limit(1);

            if (!error && data && data.length > 0) {
                setHasPurchased(true);
            }
        } catch (error) {
            console.error("Error checking eligibility:", error);
        }
    }

    async function handleSubmitReview() {
        if (!user) return toast.notSignedIn();
        if (ratingForm === 0) return toast.warning({ title: "Please select a rating star" });

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('reviews').insert({
                product_id: productId,
                buyer_id: user.id,
                seller_id: sellerId, // Include seller id as required by schema
                rating: ratingForm,
                comment: commentForm.trim() || null
            });

            if (error) throw error;

            toast.success("Review submitted! Thank you for your feedback.");
            setIsWriting(false);
            setHasReviewed(true);

            // Re-fetch to show new review instantly
            fetchReviews();
        } catch (error: any) {
            toast.error({ title: "Could not submit review", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className={`animate-pulse space-y-4 ${className}`}>
                <div className="h-8 w-48 bg-stone-200 rounded-lg"></div>
                <div className="h-32 w-full bg-stone-100 rounded-2xl"></div>
            </div>
        );
    }

    return (
        <section className={className}>
            <div className="flex items-end justify-between mb-8">
                <div>
                    <h2 className="font-serif text-3xl font-bold text-stone-800">Customer Reviews</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="flex">
                            {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} className={`w-5 h-5 ${s <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-stone-300'}`} />
                            ))}
                        </div>
                        <span className="font-bold text-stone-800">{Number(avgRating).toFixed(1)} out of 5</span>
                        <span className="text-stone-400">({totalReviews} ratings)</span>
                    </div>
                </div>

                {!hasReviewed && hasPurchased && !isWriting && (
                    <button
                        onClick={() => setIsWriting(true)}
                        className="px-6 py-2.5 bg-stone-800 text-white font-semibold rounded-xl hover:bg-stone-700 transition"
                    >
                        Write a Review
                    </button>
                )}
            </div>

            {/* Write Review Form */}
            <AnimatePresence>
                {isWriting && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-10 overflow-hidden"
                    >
                        <div className="bg-stone-50 border border-stone-200 rounded-3xl p-6">
                            <h3 className="font-bold text-lg text-stone-800 mb-4">How was the produce?</h3>

                            {/* Star Selector */}
                            <div className="flex gap-1 mb-6">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setRatingForm(s)}
                                        onMouseEnter={() => setHoverRating(s)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="p-1 transition-transform hover:scale-110 focus:outline-none"
                                    >
                                        <Star
                                            className={`w-8 h-8 transition-colors ${s <= (hoverRating || ratingForm)
                                                ? 'text-amber-400 fill-amber-400'
                                                : 'text-stone-300'
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={commentForm}
                                onChange={(e) => setCommentForm(e.target.value)}
                                placeholder="Share your experience with this farmer's produce (optional)"
                                className="w-full bg-white border border-stone-200 rounded-xl p-4 min-h-[120px] focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 mb-4"
                            />

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setIsWriting(false)}
                                    className="px-5 py-2 hover:bg-stone-200 rounded-lg text-stone-600 font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitReview}
                                    disabled={ratingForm === 0 || isSubmitting}
                                    className="px-6 py-2 bg-lime-400 text-stone-900 font-bold rounded-xl hover:bg-lime-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmitting ? "Submitting..." : "Post Review"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reviews List */}
            {reviews.length > 0 ? (
                <div className="space-y-6">
                    {reviews.map((review, i) => (
                        <div key={review.id} className="bg-white border border-stone-100 p-6 rounded-2xl shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-bold overflow-hidden">
                                        {review.buyer?.avatar_url ? (
                                            <img src={review.buyer.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            (review.buyer?.full_name?.[0] || 'U')
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-stone-800">{review.buyer?.full_name || "Anonymous User"}</p>
                                        <p className="text-xs text-stone-400">
                                            {new Date(review.created_at).toLocaleDateString('en-IN', {
                                                month: 'long', day: 'numeric', year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-stone-200'}`} />
                                    ))}
                                </div>
                            </div>

                            {review.comment && (
                                <p className="text-stone-600 leading-relaxed text-sm">
                                    {review.comment}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-stone-50 border border-stone-200 border-dashed rounded-3xl p-10 text-center text-stone-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-3 text-stone-300" />
                    <p className="font-medium">No reviews yet.</p>
                    <p className="text-sm">Be the first to review this product after purchase!</p>
                </div>
            )}
        </section>
    );
}
