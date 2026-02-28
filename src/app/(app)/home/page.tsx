"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

// Custom Icons - No external dependencies
const Icons = {
    MapPin: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    ),
    ArrowRight: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    TrendingUp: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 6l-9.5 9.5-5-5L1 18" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 6h6v6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Wheat: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 22h20M6 22v-8l4-8M12 22V8l4 6M18 22v-4l-2-4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM16 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
        </svg>
    ),
    Apple: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 2c1 .5 2 2 2 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Carrot: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2.27 21.7s9.87-3.5 12.73-6.36a4.5 4.5 0 0 0-6.36-6.37C5.77 11.84 2.27 21.7 2.27 21.7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.64 14l-2.05-2.04M15.34 15l-2.46-2.46M11 18l-1.87-1.87" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16.71 4.3a2.5 2.5 0 0 1 3.54 3.54l-3.38 3.39-3.53-3.54 3.37-3.39z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Milk: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 2v4M16 2v4M7 10h10M12 10v10M7 18h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Sprout: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 20h10M10 20c0-3 1-5 2-8 1 3 2 5 2 8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 12c-2 0-4-1-4-4 0-2 2-3 4-3M16 12c2 0 4-1 4-4 0-2-2-3-4-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Flask: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Star: ({ className, filled }: { className?: string; filled?: boolean }) => (
        <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Leaf: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2C7 2 4 6 4 12s4 9 8 9c.5 0 1-.05 1.5-.15M12 2c5 0 8 4 8 10s-4 9-8 9" strokeLinecap="round" />
            <path d="M12 21V11M12 11c-2-1-3-3.5-3-6M12 11c2-1 3-3.5 3-6" strokeLinecap="round" />
        </svg>
    ),
};

const CATEGORIES = [
    { name: "Crops & Grains", slug: "crops-grains", icon: Icons.Wheat, color: "from-amber-500/20 to-yellow-500/10", iconColor: "text-amber-600", border: "border-amber-200" },
    { name: "Fruits", slug: "fruits", icon: Icons.Apple, color: "from-red-500/20 to-pink-500/10", iconColor: "text-red-600", border: "border-red-200" },
    { name: "Vegetables", slug: "vegetables", icon: Icons.Carrot, color: "from-green-500/20 to-emerald-500/10", iconColor: "text-green-600", border: "border-green-200" },
    { name: "Dairy & Poultry", slug: "dairy-poultry", icon: Icons.Milk, color: "from-blue-500/20 to-sky-500/10", iconColor: "text-blue-600", border: "border-blue-200" },
    { name: "Seeds & Saplings", slug: "seeds-saplings", icon: Icons.Sprout, color: "from-emerald-500/20 to-teal-500/10", iconColor: "text-emerald-600", border: "border-emerald-200" },
    { name: "Agri Inputs", slug: "agri-inputs", icon: Icons.Flask, color: "from-violet-500/20 to-purple-500/10", iconColor: "text-violet-600", border: "border-violet-200" },
];

const MANDI_PRICES = [
    { crop: "Onion", price: "₹28/kg", change: "+2.5%", up: true, location: "Nashik" },
    { crop: "Tomato", price: "₹42/kg", change: "-1.8%", up: false, location: "Bangalore" },
    { crop: "Wheat", price: "₹2,250/q", change: "+0.8%", up: true, location: "Amritsar" },
    { crop: "Rice", price: "₹3,100/q", change: "+1.2%", up: true, location: "Karnal" },
    { crop: "Potato", price: "₹18/kg", change: "-3.1%", up: false, location: "Agra" },
    { crop: "Soybean", price: "₹4,800/q", change: "+0.5%", up: true, location: "Indore" },
];

const FEATURED_PRODUCTS = [
    {
        id: "1",
        title: "Fresh Alphonso Mangoes",
        variety: "Ratnagiri Premium",
        price: 280,
        unit: "kg",
        image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80",
        seller: "Ramesh Patil",
        district: "Ratnagiri",
        rating: 4.9,
        reviews: 142,
        organic: true,
        tag: "Harvested Today",
    },
    {
        id: "2",
        title: "Heritage Basmati Rice",
        variety: "Pusa 1121",
        price: 95,
        unit: "kg",
        image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
        seller: "Sukhwant Singh",
        district: "Amritsar",
        rating: 4.8,
        reviews: 89,
        organic: false,
        tag: "Aged 2 Years",
    },
    {
        id: "3",
        title: "Premium A2 Buffalo Milk",
        variety: "Murrah Breed",
        price: 65,
        unit: "litre",
        image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80",
        seller: "Kavita Devi",
        district: "Anand",
        rating: 4.7,
        reviews: 234,
        organic: true,
        tag: "Farm Fresh",
    },
];

export default function HomePage() {
    const [greeting, setGreeting] = useState("Good day");
    const [userName, setUserName] = useState("Friend");

    useEffect(() => {
        const hour = new Date().getHours();
        setGreeting(hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening");
    }, []);

    return (
        <div className="min-h-screen bg-[#f5f1ea]">
            {/* Grain texture overlay */}
            <div className="fixed inset-0 opacity-[0.02] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-stone-100 via-[#f5f1ea] to-stone-200 border-b border-stone-200">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-30">
                    <div className="absolute top-10 right-10 w-64 h-64 bg-lime-400/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-10 right-40 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-6xl mx-auto px-8 py-16 lg:py-24">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                    >
                        {/* Location badge */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-stone-200 rounded-full px-4 py-2 mb-6"
                        >
                            <Icons.MapPin className="w-4 h-4 text-lime-600" />
                            <span className="text-sm font-medium text-stone-600">Maharashtra, India</span>
                        </motion.div>

                        <h1 className="font-serif text-5xl lg:text-7xl font-bold text-stone-800 mb-4 leading-tight">
                            {greeting},{" "}
                            <span className="text-lime-600">{userName}</span>
                        </h1>

                        <p className="text-xl text-stone-500 mb-10 max-w-xl leading-relaxed">
                            Discover farm-fresh produce delivered directly from verified local farmers to your doorstep.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <Link href="/app/browse">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center gap-2 bg-lime-400 text-stone-900 font-bold px-8 py-4 rounded-2xl hover:bg-lime-300 transition-colors shadow-lg shadow-lime-400/20"
                                >
                                    Browse Produce
                                    <Icons.ArrowRight className="w-5 h-5" />
                                </motion.button>
                            </Link>
                            <Link href="/app/seller/new-listing">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center gap-2 bg-white border-2 border-stone-200 text-stone-700 font-semibold px-8 py-4 rounded-2xl hover:border-lime-400/30 hover:bg-stone-50 transition-all"
                                >
                                    Sell Your Crop
                                </motion.button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-8 py-12 space-y-16">
                {/* Mandi Prices Ticker */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-lime-400/10 flex items-center justify-center">
                                <Icons.TrendingUp className="w-5 h-5 text-lime-600" />
                            </div>
                            <div>
                                <h2 className="font-serif font-bold text-2xl text-stone-800">Live Mandi Rates</h2>
                                <p className="text-sm text-stone-500">Real-time prices from wholesale markets</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-lime-700 bg-lime-400/10 px-3 py-1 rounded-full border border-lime-400/20">
                            LIVE
                        </span>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        {MANDI_PRICES.map((item, i) => (
                            <motion.div
                                key={item.crop}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ y: -4, scale: 1.02 }}
                                className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
                            >
                                <p className="text-stone-400 text-xs font-medium uppercase tracking-wider mb-1">{item.crop}</p>
                                <p className="font-serif font-bold text-xl text-stone-800 mb-2">{item.price}</p>
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs font-bold ${item.up ? "text-green-600" : "text-red-500"}`}>
                                        {item.change}
                                    </span>
                                    <span className="text-[10px] text-stone-400">{item.location}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Categories */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="font-serif font-bold text-2xl text-stone-800">Browse by Category</h2>
                        <Link href="/app/browse" className="flex items-center gap-1 text-lime-600 font-semibold hover:text-lime-700 transition-colors">
                            See all <Icons.ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {CATEGORIES.map((cat, i) => (
                            <motion.div
                                key={cat.slug}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ y: -8, scale: 1.02 }}
                            >
                                <Link href={`/app/browse?category=${cat.slug}`}>
                                    <div className={`bg-gradient-to-br ${cat.color} border ${cat.border} rounded-3xl p-6 text-center cursor-pointer hover:shadow-xl transition-all duration-300 h-full flex flex-col items-center justify-center`}>
                                        <div className={`${cat.iconColor} mb-4`}>
                                            <cat.icon className="w-10 h-10" />
                                        </div>
                                        <p className="font-semibold text-stone-700 text-sm leading-tight">{cat.name}</p>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Featured Products */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="font-serif font-bold text-2xl text-stone-800">Trending Near You</h2>
                            <p className="text-stone-500 text-sm mt-1">Fresh arrivals from local farmers</p>
                        </div>
                        <Link href="/app/browse" className="flex items-center gap-1 text-lime-600 font-semibold hover:text-lime-700 transition-colors">
                            View all <Icons.ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {FEATURED_PRODUCTS.map((product, i) => (
                            <ProductCard key={product.id} product={product} index={i} />
                        ))}
                    </div>
                </section>

                {/* Trust Banner */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-stone-900 rounded-3xl p-8 lg:p-12 text-center relative overflow-hidden"
                >
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-1/4 w-64 h-64 bg-lime-400 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-amber-400 rounded-full blur-3xl" />
                    </div>

                    <div className="relative z-10">
                        <h2 className="font-serif text-3xl lg:text-4xl font-bold text-white mb-4">
                            From Farm to Table in 24 Hours
                        </h2>
                        <p className="text-stone-400 max-w-2xl mx-auto mb-8">
                            Join thousands of families who trust FarmFresh for their daily produce.
                            Direct from farmers, no middlemen, guaranteed freshness.
                        </p>
                        <div className="flex flex-wrap justify-center gap-8 text-center">
                            <div>
                                <p className="text-3xl font-bold text-lime-400">5,000+</p>
                                <p className="text-stone-400 text-sm">Happy Families</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-lime-400">500+</p>
                                <p className="text-stone-400 text-sm">Verified Farmers</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-lime-400">24h</p>
                                <p className="text-stone-400 text-sm">Farm to Door</p>
                            </div>
                        </div>
                    </div>
                </motion.section>
            </div>
        </div>
    );
}

function ProductCard({ product, index }: { product: typeof FEATURED_PRODUCTS[0]; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -8 }}
        >
            <Link href={`/app/product/${product.id}`}>
                <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden group cursor-pointer hover:shadow-xl hover:border-lime-400/20 transition-all duration-300">
                    <div className="relative h-56 overflow-hidden">
                        <motion.img
                            src={product.image}
                            alt={product.title}
                            className="w-full h-full object-cover"
                            whileHover={{ scale: 1.08 }}
                            transition={{ duration: 0.6 }}
                        />

                        {/* Tag */}
                        <div className="absolute top-4 left-4">
                            <span className="bg-white/90 backdrop-blur-sm text-stone-800 text-xs font-bold px-3 py-1.5 rounded-full border border-stone-200 shadow-sm">
                                {product.tag}
                            </span>
                        </div>

                        {product.organic && (
                            <div className="absolute top-4 right-4 w-10 h-10 bg-lime-400 rounded-full flex items-center justify-center shadow-lg">
                                <Icons.Leaf className="w-5 h-5 text-white" />
                            </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="p-6">
                        <h3 className="font-serif font-bold text-lg text-stone-800 mb-1 group-hover:text-lime-700 transition-colors">
                            {product.title}
                        </h3>
                        <p className="text-stone-500 text-sm mb-4">{product.variety}</p>

                        <div className="flex items-end justify-between mb-4">
                            <div>
                                <span className="text-2xl font-bold text-stone-900">₹{product.price}</span>
                                <span className="text-stone-400 text-sm">/{product.unit}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                                <Icons.Star filled className="w-4 h-4 text-amber-400" />
                                <span className="font-medium text-stone-700">{product.rating}</span>
                                <span className="text-stone-400">({product.reviews})</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-stone-500 text-sm pt-4 border-t border-stone-100">
                            <Icons.MapPin className="w-4 h-4 text-lime-600" />
                            <span>{product.seller}, {product.district}</span>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}