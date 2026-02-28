"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { supabase } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store/userStore';
import LottieLoader from "@/components/LottieLoader";

// Custom Icons - No Lucide dependencies for unique styling
const Icons = {
    Search: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
        </svg>
    ),
    Filter: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16M8 12h8M12 20h0" strokeLinecap="round" />
        </svg>
    ),
    Heart: ({ className, filled }: { className?: string; filled?: boolean }) => (
        <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Leaf: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2C7 2 4 6 4 12s4 9 8 9c.5 0 1-.05 1.5-.15" strokeLinecap="round" />
            <path d="M12 2c5 0 8 4 8 10s-4 9-8 9" strokeLinecap="round" />
            <path d="M12 21V11" strokeLinecap="round" />
            <path d="M12 11c-2-1-3-3.5-3-6" strokeLinecap="round" />
            <path d="M12 11c2-1 3-3.5 3-6" strokeLinecap="round" />
        </svg>
    ),
    Star: ({ className, filled }: { className?: string; filled?: boolean }) => (
        <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    MapPin: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    ),
    Package: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m3.3 7 8.7 5 8.7-5M12 22V12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    ChevronDown: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Grid: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
    ),
    List: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    X: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    Sliders: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M8 12h8M10 18h4" strokeLinecap="round" />
        </svg>
    ),
};

// Magnetic Button Component
function MagneticButton({
    children,
    onClick,
    className = "",
    variant = "primary",
}: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: "primary" | "secondary" | "ghost";
}) {
    const ref = useRef<HTMLButtonElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, { stiffness: 400, damping: 25 });
    const springY = useSpring(y, { stiffness: 400, damping: 25 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        x.set((e.clientX - rect.left - rect.width / 2) * 0.15);
        y.set((e.clientY - rect.top - rect.height / 2) * 0.15);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const variants = {
        primary: "bg-lime-400 text-stone-900 hover:bg-lime-300 shadow-[0_0_20px_rgba(163,230,53,0.3)]",
        secondary: "bg-stone-800 text-stone-100 border border-stone-700 hover:border-lime-400/30 hover:bg-stone-700",
        ghost: "bg-transparent text-stone-400 hover:text-stone-100 hover:bg-white/5",
    };

    return (
        <motion.button
            ref={ref}
            style={{ x: springX, y: springY }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            whileTap={{ scale: 0.97 }}
            className={`relative overflow-hidden rounded-xl font-medium text-sm transition-all duration-300 ${variants[variant]} ${className}`}
        >
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                initial={{ x: "-200%" }}
                whileHover={{ x: "200%" }}
                transition={{ duration: 0.8 }}
            />
            <span className="relative z-10">{children}</span>
        </motion.button>
    );
}

interface Product {
    id: string;
    title: string;
    variety: string | null;
    price_per_unit: number;
    unit: string;
    category: string;
    images: string[];
    seller: string;
    district: string | null;
    avg_rating: number;
    total_reviews: number;
    is_organic: boolean;
    quantity_available: number;
    badge: string | null;
}

const CATEGORIES_FILTER = [
    { label: "All", value: "" },
    { label: "Crops & Grains", value: "crops-grains" },
    { label: "Fruits", value: "fruits" },
    { label: "Vegetables", value: "vegetables" },
    { label: "Dairy & Poultry", value: "dairy-poultry" },
    { label: "Seeds", value: "seeds-saplings" },
    { label: "Agri Inputs", value: "agri-inputs" },
];

const SORTS = [
    { label: "Featured", value: "relevance" },
    { label: "Price: Low to High", value: "price_asc" },
    { label: "Price: High to Low", value: "price_desc" },
    { label: "Top Rated", value: "rating" },
    { label: "Newest", value: "newest" },
];

export default function BrowsePage() {
    const { user, isLoading: authLoading } = useUserStore();
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [sort, setSort] = useState("relevance");
    const [organicOnly, setOrganicOnly] = useState(false);
    const [showFilters, setShowFilters] = useState(true);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
    const [savedProducts, setSavedProducts] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (authLoading) return;
        fetchProducts()
    }, [user?.id, authLoading])

    async function fetchProducts() {
        // Safety: ensure loading state is cleared even if fetch hangs
        const timeout = setTimeout(() => {
            setLoading(false)
        }, 10000)

        try {
            setLoading(true)

            const [productsRes, savedRes] = await Promise.all([
                supabase
                    .from('products')
                    .select(`
                        id, title, variety, price_per_unit, unit, is_organic,
                        quantity_available, images, village, district,
                        avg_rating, total_reviews,
                        seller:profiles!products_seller_id_fkey(full_name),
                        category:categories(slug)
                    `)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false }),
                user ? supabase.from('saved_products').select('product_id').eq('user_id', user.id) : Promise.resolve({ data: null })
            ])

            if (productsRes.error) throw productsRes.error;

            if (savedRes.data) {
                setSavedProducts(new Set(savedRes.data.map((s: any) => s.product_id)))
            }

            setProducts((productsRes.data ?? []).map((p: any) => ({
                id: p.id,
                title: p.title,
                variety: p.variety,
                price_per_unit: Number(p.price_per_unit),
                unit: p.unit,
                category: (p.category?.slug ?? ''),
                images: p.images ?? [],
                seller: (p.seller?.full_name ?? 'Farmer'),
                district: p.district,
                avg_rating: Number(p.avg_rating),
                total_reviews: Number(p.total_reviews),
                is_organic: Boolean(p.is_organic),
                quantity_available: Number(p.quantity_available),
                badge: null,
            })))
        } catch (err) {
            console.error("Browse products fetch error:", err);
        } finally {
            clearTimeout(timeout)
            setLoading(false)
        }
    }

    const filtered = products.filter((p) => {
        if (organicOnly && !p.is_organic) return false;
        if (category && p.category !== category) return false;
        if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    }).sort((a, b) => {
        if (sort === "price_asc") return a.price_per_unit - b.price_per_unit;
        if (sort === "price_desc") return b.price_per_unit - a.price_per_unit;
        if (sort === "rating") return b.avg_rating - a.avg_rating;
        return 0;
    });

    async function handleToggleSave(productId: string) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            alert('Please sign in to save products.');
            return;
        }

        const isSaved = savedProducts.has(productId);
        const newSaved = new Set(savedProducts);

        if (isSaved) {
            newSaved.delete(productId);
            setSavedProducts(newSaved);
            await supabase.from('saved_products').delete().match({ user_id: user.id, product_id: productId });
        } else {
            newSaved.add(productId);
            setSavedProducts(newSaved);
            await supabase.from('saved_products').insert({ user_id: user.id, product_id: productId });
        }
    }

    const [isSavingSearch, setIsSavingSearch] = useState(false);
    async function handleSaveSearch() {
        if (!user) {
            alert('Please sign in to save searches.');
            return;
        }
        if (!search.trim()) {
            alert('Please enter a search term first.');
            return;
        }

        setIsSavingSearch(true);
        try {
            await supabase.from('saved_searches').insert({
                user_id: user.id,
                query: search.trim(),
                filters: { category, organicOnly }
            });
            alert('Search saved successfully! You can view it in your profile.');
        } catch (error) {
            console.error('Error saving search:', error);
            alert('Failed to save search.');
        } finally {
            setIsSavingSearch(false);
        }
    }

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#f5f1ea] flex items-center justify-center">
                <LottieLoader />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f5f1ea]">
            {/* Subtle texture overlay */}
            <div className="fixed inset-0 opacity-[0.02] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />

            <div className="relative flex h-full">
                {/* Sidebar Filters */}
                <AnimatePresence initial={false}>
                    {showFilters && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0, x: -20 }}
                            animate={{ width: 280, opacity: 1, x: 0 }}
                            exit={{ width: 0, opacity: 0, x: -20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="shrink-0 border-r border-stone-200 overflow-hidden bg-[#f5f1ea]/80 backdrop-blur-xl"
                        >
                            <div className="w-72 p-6 space-y-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-serif font-bold text-stone-800 text-lg">Filters</h3>
                                    <MagneticButton
                                        onClick={() => { setCategory(""); setOrganicOnly(false); setSearch(""); }}
                                        variant="ghost"
                                        className="px-3 py-1.5 text-xs"
                                    >
                                        Reset
                                    </MagneticButton>
                                </div>

                                {/* Search in sidebar */}
                                <div>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                            <input
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                placeholder="Search produce..."
                                                className="w-full bg-white/50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-lime-400/50 focus:bg-white transition-all"
                                            />
                                        </div>
                                        <button
                                            onClick={handleSaveSearch}
                                            title="Save this search"
                                            disabled={isSavingSearch || !search.trim()}
                                            className="px-3 rounded-xl bg-lime-50 text-lime-700 border border-lime-200 hover:bg-lime-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                                        >
                                            <Icons.Heart className="w-5 h-5 fill-lime-600" />
                                        </button>
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">Category</p>
                                    <div className="space-y-1">
                                        {CATEGORIES_FILTER.map((cat) => (
                                            <motion.button
                                                key={cat.value}
                                                onClick={() => setCategory(cat.value)}
                                                whileHover={{ x: 4 }}
                                                className={cn(
                                                    "w-full flex items-center justify-between text-left px-4 py-3 rounded-xl text-sm transition-all duration-300",
                                                    category === cat.value
                                                        ? "bg-lime-400/10 text-lime-700 border border-lime-400/20 font-medium"
                                                        : "text-stone-600 hover:text-stone-900 hover:bg-white/50"
                                                )}
                                            >
                                                <span>{cat.label}</span>
                                                <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                                                    {products.filter(p => !cat.value || p.category === cat.value).length}
                                                </span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Organic */}
                                <div>
                                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">Certification</p>
                                    <motion.button
                                        onClick={() => setOrganicOnly((v) => !v)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-4 rounded-xl text-sm transition-all border",
                                            organicOnly
                                                ? "bg-lime-400/10 text-lime-700 border-lime-400/20"
                                                : "bg-white/30 text-stone-600 border-stone-200 hover:border-lime-400/30"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                            organicOnly ? "bg-lime-400 text-white" : "bg-stone-100 text-stone-500"
                                        )}>
                                            <Icons.Leaf className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium">Organic Only</p>
                                            <p className="text-xs text-stone-400">Certified produce</p>
                                        </div>
                                    </motion.button>
                                </div>

                                {/* Price Range - Visual only for now */}
                                <div>
                                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">Price Range</p>
                                    <div className="px-2">
                                        <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                                            <div className="h-full w-2/3 bg-lime-400 rounded-full" />
                                        </div>
                                        <div className="flex justify-between mt-2 text-xs text-stone-500">
                                            <span>₹0</span>
                                            <span>₹1000+</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Toolbar */}
                    <div className="sticky top-0 z-30 flex items-center gap-3 px-6 py-3.5 border-b border-stone-200 bg-[#f5f1ea]/95 backdrop-blur-xl">
                        <MagneticButton
                            onClick={() => setShowFilters((v) => !v)}
                            variant="secondary"
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border",
                                showFilters ? "border-lime-400/30 text-lime-700 bg-lime-400/5" : "border-stone-200 text-stone-600"
                            )}
                        >
                            <Icons.Sliders className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Filters</span>
                        </MagneticButton>

                        {/* View Toggle */}
                        <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={cn(
                                    "p-2 rounded-md transition-all",
                                    viewMode === "grid" ? "bg-white text-stone-800 shadow-sm" : "text-stone-400 hover:text-stone-600"
                                )}
                            >
                                <Icons.Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={cn(
                                    "p-2 rounded-md transition-all",
                                    viewMode === "list" ? "bg-white text-stone-800 shadow-sm" : "text-stone-400 hover:text-stone-600"
                                )}
                            >
                                <Icons.List className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1" />

                        <span className="text-sm text-stone-500 hidden sm:block">
                            {loading ? 'Loading…' : <>Showing <span className="font-semibold text-stone-800">{filtered.length}</span> products</>}
                        </span>

                        {/* Sort Dropdown */}
                        <div className="relative group">
                            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-700 hover:border-lime-400/30 transition-colors">
                                <span className="text-stone-400">Sort:</span>
                                {SORTS.find(s => s.value === sort)?.label}
                                <Icons.ChevronDown className="w-4 h-4 text-stone-400" />
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-stone-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                {SORTS.map((s) => (
                                    <button
                                        key={s.value}
                                        onClick={() => setSort(s.value)}
                                        className={cn(
                                            "w-full text-left px-4 py-3 text-sm first:rounded-t-xl last:rounded-b-xl transition-colors",
                                            sort === s.value ? "bg-lime-400/5 text-lime-700" : "text-stone-600 hover:bg-stone-50"
                                        )}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Product Grid/List */}
                    <div className="flex-1 overflow-y-auto p-8">
                        {loading ? (
                            <div className="flex items-center justify-center min-h-[40vh]">
                                <LottieLoader />
                            </div>
                        ) : filtered.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center justify-center h-96 text-stone-400"
                            >
                                <div className="w-24 h-24 rounded-3xl bg-stone-100 flex items-center justify-center mb-6">
                                    <Icons.Package className="w-12 h-12 text-stone-300" />
                                </div>
                                <p className="text-xl font-serif text-stone-600 mb-2">No products found</p>
                                <p className="text-sm">Try adjusting your filters or search</p>
                            </motion.div>
                        ) : (
                            <div className={cn(
                                "gap-6",
                                viewMode === "grid"
                                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                                    : "flex flex-col"
                            )}>
                                {filtered.map((product, i) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        index={i}
                                        viewMode={viewMode}
                                        isHovered={hoveredProduct === product.id}
                                        onHover={() => setHoveredProduct(product.id)}
                                        onLeave={() => setHoveredProduct(null)}
                                        isSaved={savedProducts.has(product.id)}
                                        onToggleSave={() => handleToggleSave(product.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProductCard({
    product,
    index,
    viewMode,
    isHovered,
    onHover,
    onLeave,
    isSaved,
    onToggleSave
}: {
    product: Product;
    index: number;
    viewMode: "grid" | "list";
    isHovered: boolean;
    onHover: () => void;
    onLeave: () => void;
    isSaved: boolean;
    onToggleSave: () => void;
}) {
    const img = product.images?.[0] ?? 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80'
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            className={cn(
                "group",
                viewMode === "list" && "flex gap-6 bg-white border border-stone-200 rounded-2xl p-4 hover:border-lime-400/30 transition-all"
            )}
        >
            <Link href={`/app/product/${product.id}`} className={cn("block", viewMode === "list" && "contents")}>
                <div className={cn(
                    "relative overflow-hidden rounded-2xl bg-stone-100",
                    viewMode === "grid" ? "aspect-[4/3] mb-4" : "w-48 h-32 shrink-0"
                )}>
                    <motion.img
                        src={img}
                        alt={product.title}
                        className="w-full h-full object-cover"
                        animate={{ scale: isHovered ? 1.08 : 1 }}
                        transition={{ duration: 0.6 }}
                        onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=60' }}
                    />

                    {/* No badge from DB right now, show Organic tag */}
                    {product.is_organic && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute top-3 right-3 w-8 h-8 bg-lime-400 rounded-full flex items-center justify-center shadow-lg"
                        >
                            <Icons.Leaf className="w-4 h-4 text-white" />
                        </motion.div>
                    )}

                    {/* Hover overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isHovered ? 1 : 0 }}
                        className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent pointer-events-none"
                    />

                    {/* Wishlist Button */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggleSave();
                        }}
                        className={cn(
                            "absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white shadow-md z-10",
                            isSaved ? "text-lime-500" : "text-stone-400 hover:text-lime-500",
                            !isSaved && !isHovered && viewMode === 'grid' && "opacity-0 scale-90",
                            (isSaved || isHovered || viewMode === 'list') && "opacity-100 scale-100"
                        )}
                    >
                        <Icons.Heart className="w-4 h-4" filled={isSaved} />
                    </button>
                </div>

                <div className={cn(viewMode === "list" && "flex-1 flex flex-col justify-center")}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-serif font-bold text-stone-800 text-base leading-tight group-hover:text-lime-700 transition-colors">
                            {product.title}
                        </h3>
                    </div>

                    <p className="text-stone-500 text-xs mb-3">{product.variety}</p>

                    <div className="flex items-end justify-between">
                        <div>
                            <span className="text-2xl font-bold text-stone-900">₹{Number(product.price_per_unit).toLocaleString('en-IN')}</span>
                            <span className="text-stone-400 text-sm">/{product.unit}</span>
                        </div>

                        <div className="flex items-center gap-1 text-sm text-stone-500">
                            <Icons.Star filled className="w-4 h-4 text-amber-400" />
                            <span className="font-medium text-stone-700">{Number(product.avg_rating).toFixed(1)}</span>
                            <span className="text-stone-400">({product.total_reviews})</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-3 text-stone-500 text-xs">
                        <Icons.MapPin className="w-3.5 h-3.5 text-lime-600" />
                        <span>{product.seller}, {product.district}</span>
                    </div>

                    {viewMode === "list" && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="mt-4 self-start bg-lime-400 text-stone-900 font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-lime-300 transition-colors"
                        >
                            Add to Cart
                        </motion.button>
                    )}
                </div>
            </Link>
        </motion.div>
    );
}