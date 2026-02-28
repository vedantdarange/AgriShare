"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cartStore";
import { useUserStore } from "@/lib/store/userStore";
import { supabase } from "@/lib/supabase/client";
import LottieLoader from "@/components/LottieLoader";

import { useToast } from "@/lib/toast";
import dynamic from "next/dynamic";
import Link from "next/link";

const AddressMap = dynamic(() => import("@/components/AddressMap"), {
    ssr: false,
    loading: () => (
        <div className="h-[250px] w-full rounded-2xl bg-stone-100 animate-pulse flex items-center justify-center border border-stone-200">
            <span className="text-stone-400 font-medium">Loading map...</span>
        </div>
    )
});

// Custom Icons
const Icons = {
    Check: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    MapPin: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    ),
    Home: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Briefcase: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" strokeLinecap="round" strokeLinejoin="round" />
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
    CreditCard: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <path d="M2 10h20" />
        </svg>
    ),
    Wallet: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4" />
            <path d="M20 12v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4h16z" />
            <path d="M16 12h.01" />
        </svg>
    ),
    Banknote: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <circle cx="12" cy="12" r="4" />
            <path d="M6 12h.01M18 12h.01" />
        </svg>
    ),
    Shield: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    ChevronRight: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Loader: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" strokeLinecap="round" />
        </svg>
    ),
    Ticket: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M15 5v14l-4-2-4 2V5l4 2 4-2Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Package: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="22.08" x2="12" y2="12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Calendar: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
        </svg>
    ),
    Clock: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
};

const STEPS = [
    { id: 0, label: "Delivery", description: "Address & mode" },
    { id: 1, label: "Payment", description: "Choose method" },
    { id: 2, label: "Review", description: "Confirm order" },
];

const DELIVERY_MODES = [
    {
        id: "seller_delivers",
        label: "Farmer Delivers",
        description: "Direct to your doorstep",
        icon: Icons.Truck,
        eta: "Scheduled Slots",
        price: 80,
    },
    {
        id: "buyer_pickup",
        label: "Farm Pickup",
        description: "Collect from farmer",
        icon: Icons.Store,
        eta: "Same day",
        price: 0,
    },
];

const PAYMENT_METHODS = [
    {
        id: "upi",
        label: "UPI / QR Code",
        description: "Google Pay, PhonePe, Paytm",
        icon: Icons.Wallet,
        recommended: true,
    },
    {
        id: "card",
        label: "Credit / Debit Card",
        description: "Visa, Mastercard, RuPay",
        icon: Icons.CreditCard,
        recommended: false,
    },
    {
        id: "cod",
        label: "Cash on Delivery",
        description: "Pay when you receive",
        icon: Icons.Banknote,
        recommended: false,
    },
];

const getTomorrowsDate = () => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
};

const getDayAfterDate = () => {
    const d = new Date(); d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
};

const DELIVERY_DATES = [
    { id: getTomorrowsDate(), label: "Tomorrow" },
    { id: getDayAfterDate(), label: "Day After" }
];

const DELIVERY_SLOTS = [
    { id: "09:00-13:00", label: "9:00 AM - 1:00 PM" },
    { id: "14:00-18:00", label: "2:00 PM - 6:00 PM" }
];

export default function CheckoutPage() {
    const router = useRouter();
    const toast = useToast();
    const { items, totalAmount, clearCart } = useCartStore();
    const { user, profile } = useUserStore();

    const [step, setStep] = useState(0);
    const [deliveryMode, setDeliveryMode] = useState("seller_delivers");
    const [paymentMethod, setPaymentMethod] = useState("upi");
    const [isPlacing, setIsPlacing] = useState(false);

    // Address & Date States
    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string>("");
    const [isAddingNewAddress, setIsAddingNewAddress] = useState(true); // Map open by default
    const [hasCheckedAddresses, setHasCheckedAddresses] = useState(false);

    // Delivery Scheduling
    const [deliveryDate, setDeliveryDate] = useState(DELIVERY_DATES[0].id);
    const [deliverySlot, setDeliverySlot] = useState(DELIVERY_SLOTS[0].id);

    // Coupon System
    const [couponInput, setCouponInput] = useState("");
    const [activeCoupon, setActiveCoupon] = useState<{ id: string, code: string, discount_percentage: number } | null>(null);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

    // Inline Address Form
    const [pinLocation, setPinLocation] = useState<[number, number] | null>(null);
    const [address, setAddress] = useState({
        name: profile?.full_name || "", phone: profile?.phone || "",
        street: "", city: profile?.village || profile?.district || "", pincode: "",
    });

    useEffect(() => {
        if (user) fetchSavedAddresses();
    }, [user]);

    const fetchSavedAddresses = async () => {
        if (!user) return;
        const { data } = await supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false });
        if (data && data.length > 0) {
            setSavedAddresses(data);
            setSelectedAddressId(data[0].id);
            // Default to using saved address only if they have one already AND we want to hide map. 
            // In this specific flow, USER requested the MAP auto detection to be prioritized.
            // So we leave `isAddingNewAddress` as true, and let them swap to saved addresses if they want.
        } else {
            setSavedAddresses([]);
        }
        setHasCheckedAddresses(true);
    };

    useEffect(() => {
        if (isAddingNewAddress && !pinLocation && 'geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                setPinLocation([latitude, longitude]);
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    if (data?.address) {
                        setAddress(prev => ({
                            ...prev,
                            street: data.address.road || data.address.suburb || prev.street,
                            city: data.address.city || data.address.town || data.address.village || prev.city,
                            pincode: data.address.postcode || prev.pincode,
                        }));
                    }
                } catch (_err) { }
            }, () => { });
        }
    }, [isAddingNewAddress, pinLocation]);

    const handleApplyCoupon = async () => {
        if (!couponInput) return;
        setIsApplyingCoupon(true);
        const { data, error } = await supabase.from('coupons').select('*').eq('code', couponInput.toUpperCase()).eq('is_active', true).single();
        if (error || !data) {
            toast.error("Invalid or expired coupon code");
            setActiveCoupon(null);
        } else {
            setActiveCoupon(data);
            toast.success(`Coupon applied! ${data.discount_percentage}% off`);
        }
        setIsApplyingCoupon(false);
    };

    const getIconForLabel = (label: string) => {
        if (label === 'Home') return <Icons.Home className="w-5 h-5" />;
        if (label === 'Work' || label === 'Office') return <Icons.Briefcase className="w-5 h-5" />;
        return <Icons.MapPin className="w-5 h-5" />;
    };

    // Calculate Totals
    const subtotal = totalAmount();
    const transport = DELIVERY_MODES.find(m => m.id === deliveryMode)?.price || 0;
    const platformFee = Math.round(subtotal * 0.02);

    // Apply Coupon
    const discountAmount = activeCoupon ? Math.round((subtotal * activeCoupon.discount_percentage) / 100) : 0;
    const total = subtotal + transport + platformFee - discountAmount;

    // Grouping for Review Step (Split Shipment)
    const itemsBySeller = items.reduce((acc, item) => {
        if (!acc[item.seller_id]) acc[item.seller_id] = [];
        acc[item.seller_id].push(item);
        return acc;
    }, {} as Record<string, typeof items>);
    const sellerIds = Object.keys(itemsBySeller);

    const handlePlaceOrder = async () => {
        setIsPlacing(true);

        const orderPromise = (async () => {
            if (!user) throw new Error("Please sign in to place an order.");
            let finalAddressId = selectedAddressId;

            // Save new address if required
            if (isAddingNewAddress || !selectedAddressId) {
                const { data: addrData, error: addrError } = await supabase.from('addresses').insert({
                    user_id: user.id, label: 'Home', full_name: address.name, phone: address.phone,
                    street: address.street, city: address.city, district: address.city,
                    pincode: address.pincode, latitude: pinLocation?.[0] || null, longitude: pinLocation?.[1] || null, is_default: true
                }).select('id').single();

                if (addrError) throw new Error("Failed to save delivery address.");
                finalAddressId = addrData.id;
            }

            const transportPerSeller = Math.round(transport / sellerIds.length);
            let firstOrderId = null;

            // Distribute discount proportionally across sellers
            const discountProportion = activeCoupon ? (activeCoupon.discount_percentage / 100) : 0;

            for (const sellerId of sellerIds) {
                const sellerItems = itemsBySeller[sellerId];
                const sellerSubtotal = sellerItems.reduce((sum, item) => sum + (item.price_per_unit * item.quantity), 0);
                const sellerPlatformFee = Math.round(sellerSubtotal * 0.02);
                const sellerDiscount = Math.round(sellerSubtotal * discountProportion);
                const sellerTotalAmount = sellerSubtotal + transportPerSeller + sellerPlatformFee - sellerDiscount;

                const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

                const { data: order, error: orderError } = await supabase.from('orders').insert({
                    order_number: orderNumber, buyer_id: user.id, seller_id: sellerId,
                    status: 'pending', subtotal: sellerSubtotal,
                    transport_fee: transportPerSeller, platform_fee: sellerPlatformFee,
                    discount_amount: sellerDiscount, total_amount: sellerTotalAmount,
                    delivery_address_id: finalAddressId, delivery_mode: deliveryMode,
                    delivery_date: deliveryDate, delivery_slot: deliverySlot,
                    payment_method: paymentMethod, payment_status: paymentMethod === 'cod' ? 'pending' : 'paid',
                    notes: ""
                }).select('id').single();

                if (orderError) throw new Error("Failed to create order: " + orderError.message);
                if (!firstOrderId) firstOrderId = order.id;

                const orderItemsToInsert = sellerItems.map(item => ({
                    order_id: order.id, product_id: item.product_id, quantity: item.quantity,
                    unit: item.unit, price_per_unit: item.price_per_unit, line_total: item.price_per_unit * item.quantity,
                    product_snapshot: { title: item.title, image: item.image }
                }));

                const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
                if (itemsError) throw new Error("Failed to save order items.");
            }

            clearCart();
            return firstOrderId;
        })();

        toast.promise(orderPromise, {
            loading: 'Placing your secure order...',
            success: () => {
                setTimeout(() => router.push('/app/orders'), 1500);
                return 'Order placed successfully!';
            },
            error: (err) => {
                setIsPlacing(false);
                return `Failed: ${err.message}`;
            }
        });
    };

    const canProceed = () => {
        if (step === 0) {
            if (isAddingNewAddress) return address.name && address.phone && address.street && address.city && address.pincode && pinLocation !== null;
            return !!selectedAddressId;
        }
        return true;
    };

    if (items.length === 0 && !isPlacing && step !== 2) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6">
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6">
                    <Icons.Check className="w-10 h-10 text-stone-300" />
                </div>
                <h1 className="text-2xl font-serif font-bold text-stone-800 mb-2">Cart is empty</h1>
                <p className="text-stone-500 mb-8 max-w-sm">You need items in your cart to checkout.</p>
                <Link href="/app/browse" className="px-6 py-3 bg-lime-400 text-stone-900 font-bold rounded-xl hover:bg-lime-500 transition-colors">
                    Browse Market
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f5f1ea]">
            <div className="max-w-5xl mx-auto px-6 py-12">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                    <h1 className="font-serif text-4xl font-bold text-stone-800 mb-2">Checkout</h1>
                    <p className="text-stone-500">Complete your farm-fresh order</p>
                </motion.div>

                {/* Stepper */}
                <div className="mb-10">
                    <div className="flex items-center">
                        {STEPS.map((s, i) => (
                            <div key={s.id} className="flex items-center flex-1">
                                <motion.button
                                    onClick={() => i < step && setStep(i)}
                                    className={cn("flex items-center gap-3 px-4 py-3 rounded-2xl transition-all", step === i ? "bg-lime-400 text-stone-900 shadow-lg shadow-lime-400/20" : i < step ? "bg-stone-200 text-stone-600 hover:bg-stone-300" : "bg-stone-100 text-stone-400")}
                                >
                                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0", step === i ? "bg-stone-900 text-lime-400" : i < step ? "bg-lime-400 text-stone-900" : "bg-stone-300 text-stone-500")}>
                                        {i < step ? <Icons.Check className="w-4 h-4" /> : i + 1}
                                    </div>
                                    <div className="text-left hidden md:block">
                                        <p className="font-semibold text-sm whitespace-nowrap">{s.label}</p>
                                        <p className="text-[10px] opacity-70 whitespace-nowrap">{s.description}</p>
                                    </div>
                                </motion.button>
                                {i < STEPS.length - 1 && <div className={cn("h-0.5 flex-1 mx-2 rounded-full", i < step ? "bg-lime-400" : "bg-stone-200")} />}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <AnimatePresence mode="wait">
                            {/* Step 1: Delivery */}
                            {step === 0 && (
                                <motion.div key="delivery" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">

                                    {/* Saved Addresses & Address Form */}
                                    <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                                        <div className="flex justify-between items-center mb-6">
                                            <div className="flex items-center gap-2">
                                                <Icons.MapPin className="w-5 h-5 text-lime-600" />
                                                <h3 className="font-serif font-bold text-xl text-stone-800">Delivery Address</h3>
                                            </div>
                                            {!isAddingNewAddress && (
                                                <button onClick={() => setIsAddingNewAddress(true)} className="text-sm font-bold text-lime-600 hover:text-lime-700 bg-lime-50 rounded-lg px-3 py-1">
                                                    + New Address
                                                </button>
                                            )}
                                        </div>

                                        {!isAddingNewAddress ? (
                                            <div className="space-y-6">
                                                <div className="flex justify-between items-center mb-2">
                                                    <p className="text-sm text-stone-600 font-medium">Use current location or drop a pin</p>
                                                    {savedAddresses.length > 0 && (
                                                        <button onClick={() => setIsAddingNewAddress(true)} className="text-sm font-bold text-lime-600 hover:text-lime-700 bg-lime-50 rounded-lg px-3 py-1">
                                                            Use Saved Address
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="mb-6">
                                                    <AddressMap position={pinLocation} onPositionChange={setPinLocation} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="col-span-2"><input required value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:border-lime-400 text-stone-900 placeholder:text-stone-400" placeholder="Full Name" /></div>
                                                    <div className="col-span-1"><input required value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:border-lime-400 text-stone-900 placeholder:text-stone-400" placeholder="Phone Number" /></div>
                                                    <div className="col-span-1"><input required value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:border-lime-400 text-stone-900 placeholder:text-stone-400" placeholder="PIN Code" /></div>
                                                    <div className="col-span-2"><input required value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:border-lime-400 text-stone-900 placeholder:text-stone-400" placeholder="Street Address / Area" /></div>
                                                    <div className="col-span-2"><input required value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:border-lime-400 text-stone-900 placeholder:text-stone-400" placeholder="City / District" /></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center mb-4">
                                                    <p className="text-sm text-stone-600 font-medium">Select a saved address</p>
                                                    <button onClick={() => setIsAddingNewAddress(false)} className="text-sm font-bold text-lime-600 hover:text-lime-700 bg-lime-50 rounded-lg px-3 py-1">
                                                        Use Map Again
                                                    </button>
                                                </div>
                                                {savedAddresses.map(addr => (
                                                    <div
                                                        key={addr.id}
                                                        onClick={() => setSelectedAddressId(addr.id)}
                                                        className={cn("border-2 rounded-2xl p-4 cursor-pointer transition-colors relative flex gap-4", selectedAddressId === addr.id ? "border-lime-400 bg-lime-50/30" : "border-stone-100 hover:border-lime-200")}
                                                    >
                                                        <div className={cn("w-5 h-5 rounded-full border-2 flex shrink-0 items-center justify-center mt-0.5", selectedAddressId === addr.id ? "border-lime-600" : "border-stone-300")}>
                                                            {selectedAddressId === addr.id && <div className="w-2.5 h-2.5 rounded-full bg-lime-600" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex gap-2 items-center mb-1">
                                                                <span className="text-lime-600">{getIconForLabel(addr.label)}</span>
                                                                <span className="font-bold text-stone-800">{addr.label}</span>
                                                            </div>
                                                            <p className="text-sm font-medium text-stone-800">{addr.full_name} • {addr.phone}</p>
                                                            <p className="text-sm text-stone-500 line-clamp-2">{addr.street}, {addr.city} {addr.pincode}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Delivery Mode & Slots */}
                                    <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                                        <h3 className="font-serif font-bold text-xl text-stone-800 mb-6">Delivery Details</h3>
                                        <div className="space-y-4 mb-8">
                                            {DELIVERY_MODES.map((mode) => (
                                                <motion.button
                                                    key={mode.id} onClick={() => setDeliveryMode(mode.id)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                                    className={cn("w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all", deliveryMode === mode.id ? "border-lime-400 bg-lime-400/5" : "border-stone-100 bg-stone-50")}
                                                >
                                                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", deliveryMode === mode.id ? "bg-lime-400 text-white" : "bg-stone-200 text-stone-500")}><mode.icon className="w-6 h-6" /></div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap"><p className="font-bold text-stone-800">{mode.label}</p><span className="text-xs font-bold text-lime-600 bg-lime-400/10 px-2 py-0.5 rounded-full">{mode.price === 0 ? "Free" : `₹${mode.price}`}</span></div>
                                                        <p className="text-sm text-stone-500 mt-1">{mode.description}</p>
                                                    </div>
                                                </motion.button>
                                            ))}
                                        </div>

                                        {deliveryMode === "seller_delivers" && (
                                            <>
                                                <h4 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-2"><Icons.Calendar className="w-4 h-4 text-lime-600" /> Select Date</h4>
                                                <div className="grid grid-cols-2 gap-3 mb-6">
                                                    {DELIVERY_DATES.map(date => (
                                                        <button key={date.id} onClick={() => setDeliveryDate(date.id)} className={cn("py-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer text-center", deliveryDate === date.id ? "border-lime-400 bg-lime-50 text-lime-800" : "border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100")}>{date.label}</button>
                                                    ))}
                                                </div>

                                                <h4 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-2"><Icons.Clock className="w-4 h-4 text-lime-600" /> Select Time Slot</h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {DELIVERY_SLOTS.map(slot => (
                                                        <button key={slot.id} onClick={() => setDeliverySlot(slot.id)} className={cn("py-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer text-center", deliverySlot === slot.id ? "border-lime-400 bg-lime-50 text-lime-800" : "border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100")}>{slot.label}</button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: Payment */}
                            {step === 1 && (
                                <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                                        <h3 className="font-serif font-bold text-xl text-stone-800 mb-6">Payment Method</h3>
                                        <div className="space-y-4">
                                            {PAYMENT_METHODS.map((method) => (
                                                <motion.button key={method.id} onClick={() => setPaymentMethod(method.id)} className={cn("w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left relative", paymentMethod === method.id ? "border-lime-400 bg-lime-400/5" : "border-stone-100 bg-stone-50")}>
                                                    {method.recommended && <span className="absolute -top-3 left-4 bg-lime-400 text-stone-900 text-[10px] uppercase tracking-wide font-bold px-3 py-1 rounded-full shadow-sm">Recommended</span>}
                                                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", paymentMethod === method.id ? "bg-lime-400 text-white" : "bg-stone-200 text-stone-500")}><method.icon className="w-6 h-6" /></div>
                                                    <div className="flex-1"><p className="font-bold text-stone-800">{method.label}</p><p className="text-sm text-stone-500 mt-1">{method.description}</p></div>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Review */}
                            {step === 2 && (
                                <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                                        <h3 className="font-serif font-bold text-xl text-stone-800 mb-6">Order Review (Split Shipments)</h3>

                                        <div className="space-y-6 mb-6">
                                            {sellerIds.map((sellerId, idx) => (
                                                <div key={sellerId} className="border border-stone-100 rounded-2xl overflow-hidden shadow-sm">
                                                    <div className="bg-stone-50 p-4 border-b border-stone-100 flex items-center gap-3">
                                                        <Icons.Package className="w-5 h-5 text-lime-600" />
                                                        <h4 className="font-bold text-stone-800">Package {idx + 1}</h4>
                                                    </div>
                                                    <div className="p-4 space-y-3 bg-white">
                                                        {itemsBySeller[sellerId].map((item, i) => (
                                                            <div key={i} className="flex justify-between items-center py-2">
                                                                <div>
                                                                    <p className="font-medium text-stone-800 text-sm">{item.title}</p>
                                                                    <p className="text-xs text-stone-400">Qty: {item.quantity} {item.unit} • ₹{item.price_per_unit}/unit</p>
                                                                </div>
                                                                <p className="font-bold text-stone-800">₹{(item.quantity * item.price_per_unit).toLocaleString('en-IN')}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                                            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm mb-1"><Icons.Shield className="w-5 h-5" /> AgriDirect Escrow Protection</div>
                                            <p className="text-xs text-emerald-700">Payment is held safely in escrow and only released to the farmer after you confirm delivery.</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Navigation buttons */}
                        <div className="flex gap-4 mt-8">
                            {step > 0 && <motion.button onClick={() => setStep(step - 1)} className="flex-1 py-4 border-2 border-stone-200 text-stone-600 font-semibold rounded-xl hover:border-stone-300 transition-colors">Back</motion.button>}
                            <motion.button onClick={() => step < 2 ? setStep(step + 1) : handlePlaceOrder()} disabled={!canProceed() || isPlacing} className={cn("flex-1 py-4 font-bold rounded-xl flex items-center justify-center gap-2 transition-all", canProceed() ? "bg-lime-400 text-stone-900 shadow-lg shadow-lime-400/20" : "bg-stone-200 text-stone-400")}>
                                {isPlacing ? <><LottieLoader size={20} className="py-0" /> Placing Order...</> : step === 2 ? <>Place Order <Icons.Check className="w-5 h-5" /></> : <>Continue <Icons.ChevronRight className="w-5 h-5" /></>}
                            </motion.button>
                        </div>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm sticky top-6">
                            <h3 className="font-serif font-bold text-lg text-stone-800 mb-6">Order Summary</h3>

                            {/* Promo Code Input */}
                            <div className="mb-6 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Icons.Ticket className="h-5 w-5 text-stone-400" />
                                </div>
                                <input
                                    type="text"
                                    value={couponInput}
                                    onChange={(e) => setCouponInput(e.target.value)}
                                    placeholder="Enter Promo Code"
                                    className="block w-full pl-10 pr-24 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:border-lime-400 focus:outline-none uppercase text-stone-900 placeholder:text-stone-400"
                                />
                                <button
                                    onClick={handleApplyCoupon}
                                    disabled={!couponInput || isApplyingCoupon || activeCoupon?.code === couponInput.toUpperCase()}
                                    className="absolute inset-y-1 right-1 px-4 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                                >
                                    {isApplyingCoupon ? '...' : activeCoupon?.code === couponInput.toUpperCase() ? '✓' : 'Apply'}
                                </button>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-stone-600 text-sm"><span>Items ({items.length})</span><span className="font-medium text-stone-800">₹{subtotal.toLocaleString('en-IN')}</span></div>
                                <div className="flex justify-between text-stone-600 text-sm"><span>Platform fee</span><span className="font-medium text-stone-800">₹{platformFee}</span></div>
                                <div className="flex justify-between text-stone-600 text-sm"><span>Delivery</span><span className="font-medium text-stone-800">{transport === 0 ? "Free" : `₹${transport}`}</span></div>
                                {activeCoupon && (
                                    <div className="flex justify-between text-lime-600 font-medium text-sm">
                                        <span>Discount ({activeCoupon.code})</span>
                                        <span>- ₹{discountAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-stone-200 pt-4">
                                <div className="flex justify-between items-end">
                                    <span className="font-semibold text-stone-800">Total</span>
                                    <span className="font-serif font-bold text-3xl text-lime-600">₹{total.toLocaleString('en-IN')}</span>
                                </div>
                                <p className="text-xs text-stone-400 mt-2">Including all taxes</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}