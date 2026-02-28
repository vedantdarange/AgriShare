"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Custom hook for mouse parallax
function useMouseParallax(intensity: number = 20) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, { stiffness: 150, damping: 15 });
    const springY = useSpring(y, { stiffness: 150, damping: 15 });

    const rotateX = useTransform(springY, [-0.5, 0.5], [intensity, -intensity]);
    const rotateY = useTransform(springX, [-0.5, 0.5], [-intensity, intensity]);

    return { x, y, springX, springY, rotateX, rotateY };
}

// Animated counter component
function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    let start = 0;
                    const duration = 2000;
                    const increment = end / (duration / 16);

                    const timer = setInterval(() => {
                        start += increment;
                        if (start >= end) {
                            setCount(end);
                            clearInterval(timer);
                        } else {
                            setCount(Math.floor(start));
                        }
                    }, 16);

                    observer.disconnect();
                }
            },
            { threshold: 0.5 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [end]);

    return <span ref={ref}>{count}{suffix}</span>;
}

// Pre-computed stable positions — no Math.random() in render (hydration safe)
const FLOAT_PARTICLES = [
    { x0: "21.5%", x1: "35.2%", dur: 9.4, delay: 0.0 },
    { x0: "45.8%", x1: "62.1%", dur: 10.8, delay: 1.5 },
    { x0: "63.1%", x1: "48.7%", dur: 8.6, delay: 3.0 },
    { x0: "8.4%", x1: "22.9%", dur: 11.2, delay: 4.5 },
    { x0: "82.7%", x1: "71.3%", dur: 9.9, delay: 6.0 },
    { x0: "37.2%", x1: "55.6%", dur: 10.1, delay: 7.5 },
];

// Floating particles component
function FloatingParticles() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {FLOAT_PARTICLES.map((p, i) => (
                <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-lime-400/30 rounded-full"
                    initial={{ x: p.x0, y: "100%", scale: 0 }}
                    animate={{ y: "-20%", scale: [0, 1, 1, 0], x: p.x1 }}
                    transition={{
                        duration: p.dur,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "linear"
                    }}
                />
            ))}
        </div>
    );
}

// Magnetic button component
function MagneticButton({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, { stiffness: 300, damping: 20 });
    const springY = useSpring(y, { stiffness: 300, damping: 20 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set((e.clientX - centerX) * 0.3);
        y.set((e.clientY - centerY) * 0.3);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            style={{ x: springX, y: springY }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="inline-block"
        >
            {children}
        </motion.div>
    );
}

// Main Feature Card Component with 3D tilt
function FeatureCard({
    children,
    className,
    delay = 0,
    tiltIntensity = 10
}: {
    children: React.ReactNode;
    className: string;
    delay?: number;
    tiltIntensity?: number;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const { x, y, rotateX, rotateY } = useMouseParallax(tiltIntensity);
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set((e.clientX - centerX) / (rect.width / 2));
        y.set((e.clientY - centerY) / (rect.height / 2));
    };

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 50, rotateX: 15 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
                duration: 0.8,
                delay,
                type: "spring",
                stiffness: 100
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                x.set(0);
                y.set(0);
            }}
            style={{
                rotateX: isHovered ? rotateX : 0,
                rotateY: isHovered ? rotateY : 0,
                transformStyle: "preserve-3d",
                perspective: 1000
            }}
            className={`${className} transition-shadow duration-500 ${isHovered ? 'shadow-2xl' : 'shadow-lg'}`}
        >
            {children}

            {/* Shine effect overlay */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 pointer-events-none"
                initial={{ x: "-100%", opacity: 0 }}
                animate={{
                    x: isHovered ? "100%" : "-100%",
                    opacity: isHovered ? 1 : 0
                }}
                transition={{ duration: 0.6 }}
            />
        </motion.div>
    );
}

export default function Features() {
    const sectionRef = useRef<HTMLElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // GSAP ScrollTrigger for title animation
        if (titleRef.current) {
            gsap.fromTo(
                titleRef.current.querySelectorAll(".char"),
                {
                    y: 100,
                    opacity: 0,
                    rotateX: -90
                },
                {
                    y: 0,
                    opacity: 1,
                    rotateX: 0,
                    duration: 1.2,
                    stagger: 0.03,
                    ease: "power4.out",
                    scrollTrigger: {
                        trigger: titleRef.current,
                        start: "top 80%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        }
    }, []);

    // Split text into characters for animation
    const splitText = (text: string) => {
        return text.split("").map((char, i) => (
            <span key={i} className="char inline-block" style={{ display: char === " " ? "inline" : "inline-block" }}>
                {char === " " ? "\u00A0" : char}
            </span>
        ));
    };

    return (
        <section ref={sectionRef} className="py-24 px-6 bg-[#f5f1ea] overflow-hidden" id="features">
            <div className="max-w-7xl mx-auto">
                {/* Animated Header */}
                <div ref={titleRef} className="text-center mb-20 perspective-1000">
                    <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="text-amber-600 font-medium tracking-widest text-sm uppercase block mb-4"
                    >
                        Our Promise
                    </motion.span>
                    <h2 className="text-4xl md:text-6xl font-bold text-stone-900 font-serif overflow-hidden">
                        {splitText("The Organic Difference")}
                    </h2>

                    {/* Animated underline */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="h-1 w-32 bg-gradient-to-r from-lime-400 to-amber-400 mx-auto mt-6 rounded-full"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">

                    {/* Card 1: Large Feature with Video-like hover effect */}
                    <FeatureCard className="md:col-span-2 relative group overflow-hidden rounded-3xl bg-stone-900" tiltIntensity={5}>
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500 z-10" />

                        {/* Parallax Image Container */}
                        <motion.div
                            className="absolute inset-0"
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.8 }}
                        >
                            <img
                                src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1200&auto=format&fit=crop"
                                alt="Fresh Produce"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        </motion.div>

                        {/* Animated grain overlay */}
                        <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none z-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')] animate-pulse" />

                        <div className="absolute bottom-0 left-0 p-8 z-20 text-white w-full">
                            <motion.div
                                className="w-16 h-16 bg-lime-400 mb-4 rounded-full flex items-center justify-center text-stone-900 shadow-lg"
                                whileHover={{ rotate: 360, scale: 1.1 }}
                                transition={{ duration: 0.6 }}
                            >
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </motion.div>

                            <motion.h3
                                className="text-3xl font-bold mb-2"
                                initial={{ x: -20, opacity: 0 }}
                                whileInView={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                Harvested This Morning
                            </motion.h3>

                            <p className="text-stone-200/90 max-w-sm mb-4">From the soil to your kitchen in under 24 hours. Peak freshness guaranteed.</p>

                            {/* Animated stats */}
                            <div className="flex gap-6 mt-4">
                                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20">
                                    <div className="text-2xl font-bold text-lime-400">
                                        <Counter end={24} suffix="h" />
                                    </div>
                                    <div className="text-xs text-stone-300">Max Delivery</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20">
                                    <div className="text-2xl font-bold text-lime-400">
                                        <Counter end={100} suffix="%" />
                                    </div>
                                    <div className="text-xs text-stone-300">Freshness</div>
                                </div>
                            </div>
                        </div>

                        {/* Corner accent */}
                        <motion.div
                            className="absolute top-4 right-4 w-20 h-20 border-t-2 border-r-2 border-lime-400/50 rounded-tr-3xl"
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                        />
                    </FeatureCard>

                    {/* Card 2: Interactive 3D Card with Floating Elements */}
                    <FeatureCard className="relative group overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50" delay={0.1} tiltIntensity={15}>
                        <FloatingParticles />

                        {/* Animated background pattern */}
                        <div className="absolute inset-0 opacity-5">
                            <div className="absolute inset-0" style={{
                                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(251,146,60,0.3) 1px, transparent 0)`,
                                backgroundSize: '24px 24px'
                            }} />
                        </div>

                        {/* Floating icon */}
                        <motion.div
                            className="absolute top-8 right-8 opacity-10"
                            animate={{
                                y: [0, -10, 0],
                                rotate: [0, 5, 0]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <svg className="w-32 h-32 text-amber-900" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
                            </svg>
                        </motion.div>

                        <div className="p-8 h-full flex flex-col justify-between relative z-10">
                            <div>
                                <motion.div
                                    className="w-14 h-14 bg-gradient-to-br from-amber-200 to-amber-300 mb-4 rounded-2xl flex items-center justify-center text-amber-900 shadow-lg"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </motion.div>

                                <h3 className="text-2xl font-bold text-stone-900 mb-2">100% Direct Trade</h3>
                                <p className="text-stone-600 leading-relaxed">No middlemen. Farmers set the price and keep the profit. Every purchase supports local agriculture directly.</p>
                            </div>

                            <MagneticButton>
                                <motion.div
                                    className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-amber-700 mt-4 cursor-pointer group/btn"
                                    whileHover={{ x: 5 }}
                                >
                                    <span className="relative">
                                        Learn More
                                        <motion.span
                                            className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-700 group-hover/btn:w-full transition-all duration-300"
                                        />
                                    </span>
                                    <motion.span
                                        animate={{ x: [0, 5, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                        →
                                    </motion.span>
                                </motion.div>
                            </MagneticButton>
                        </div>

                        {/* Bottom gradient line */}
                        <motion.div
                            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400"
                            initial={{ width: "0%" }}
                            whileInView={{ width: "100%" }}
                            transition={{ duration: 1.5, delay: 0.3 }}
                        />
                    </FeatureCard>

                    {/* Card 3: Glassmorphism with Hover Reveal */}
                    <FeatureCard className="relative group overflow-hidden rounded-3xl" delay={0.2} tiltIntensity={12}>
                        {/* Background image with blur */}
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="absolute inset-0 bg-stone-100 group-hover:bg-stone-900/80 transition-colors duration-500" />

                        <div className="p-8 h-full flex flex-col relative z-10 group-hover:text-white transition-colors duration-500">
                            <motion.div
                                className="w-14 h-14 bg-stone-200 group-hover:bg-lime-400 mb-4 rounded-2xl flex items-center justify-center text-stone-700 group-hover:text-stone-900 shadow-lg transition-colors duration-500"
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.6 }}
                            >
                                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </motion.div>

                            <h3 className="text-2xl font-bold mb-2 group-hover:text-lime-400 transition-colors">Local First</h3>
                            <p className="text-stone-600 group-hover:text-stone-300 transition-colors">Supporting farms within 100 miles of your table.</p>

                            {/* Reveal on hover */}
                            <motion.div
                                className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                initial={{ y: 20 }}
                                whileInView={{ y: 0 }}
                            >
                                <div className="flex items-center gap-2 text-sm text-lime-400">
                                    <span className="w-2 h-2 bg-lime-400 rounded-full animate-pulse" />
                                    <span>12 Active Farms Nearby</span>
                                </div>
                            </motion.div>
                        </div>
                    </FeatureCard>

                    {/* Card 4: Wide Feature with Seasonal Indicator */}
                    <FeatureCard className="md:col-span-2 relative group overflow-hidden rounded-3xl bg-stone-900" delay={0.3} tiltIntensity={5}>
                        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors duration-500 z-10" />

                        {/* Animated gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10" />

                        <motion.div
                            className="absolute inset-0"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.8 }}
                        >
                            <img
                                src="https://images.unsplash.com/photo-1615484477778-ca3b77940c25?q=80&w=1200&auto=format&fit=crop"
                                alt="Seasonal Produce"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        </motion.div>

                        <div className="absolute bottom-0 left-0 p-8 z-20 text-white flex items-end justify-between w-full">
                            <div>
                                <motion.div
                                    className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-400 mb-4 rounded-2xl flex items-center justify-center text-stone-900 shadow-lg"
                                    animate={{
                                        rotate: [0, 10, -10, 0],
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                >
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </motion.div>

                                <h3 className="text-3xl font-bold mb-2">Strictly Seasonal</h3>
                                <p className="text-stone-200/90 max-w-sm">We only sell what's growing right now. No cold storage, no preservatives.</p>
                            </div>

                            <div className="hidden md:block">
                                <motion.div
                                    className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <span className="text-xs font-bold uppercase tracking-wider text-orange-300 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                                        Currently In Season
                                    </span>
                                    <div className="text-lg mt-2 font-medium flex gap-3">
                                        {["Strawberries", "Kale", "Peas"].map((item, i) => (
                                            <motion.span
                                                key={item}
                                                initial={{ opacity: 0, y: 10 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.5 + (i * 0.1) }}
                                                className="bg-white/10 px-3 py-1 rounded-full text-sm"
                                            >
                                                {item}
                                            </motion.span>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        {/* Seasonal progress ring */}
                        <div className="absolute top-8 right-8 z-20">
                            <svg className="w-16 h-16 transform -rotate-90">
                                <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    className="text-white/20"
                                />
                                <motion.circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    className="text-orange-400"
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    whileInView={{ pathLength: 0.75 }}
                                    transition={{ duration: 2, ease: "easeOut" }}
                                    style={{
                                        strokeDasharray: "175",
                                    }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                                75%
                            </div>
                        </div>
                    </FeatureCard>

                </div>
            </div>
        </section>
    );
}