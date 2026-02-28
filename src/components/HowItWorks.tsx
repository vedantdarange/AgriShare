"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, AnimatePresence, useSpring, useTransform, useMotionValue } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
    Sprout,
    Network,
    Truck,
    UtensilsCrossed,
    ArrowRight,
    CheckCircle2,
    MapPin,
    Clock,
    Users,
    Star,
    ChevronRight,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────
   Data
───────────────────────────────────────────── */
const STEPS = [
    {
        number: "01",
        tag: "The Source",
        title: "Farmers grow it with love.",
        description:
            "Every morning before sunrise, our 200+ partner farmers handpick the freshest produce straight from their fields. No warehouses, no cold-chain delays — just nature at its peak.",
        image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1400&auto=format&fit=crop",
        accent: "#84cc16",
        accentDark: "#4d7c0f",
        Icon: Sprout,
        stat: { icon: Sprout, value: "200+", label: "Partner Farms" },
        bullets: ["Hand-selected at peak ripeness", "Zero pesticides", "Certified organic practices"],
    },
    {
        number: "02",
        tag: "The Connection",
        title: "We match you with the right farm.",
        description:
            "Our platform intelligently pairs you with farms in your region based on what's growing right now. Hyper-local, seasonally driven, and fully transparent about the source.",
        image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=1400&auto=format&fit=crop",
        accent: "#f59e0b",
        accentDark: "#92400e",
        Icon: Network,
        stat: { icon: MapPin, value: "< 50km", label: "Average Distance" },
        bullets: ["Seasonal produce calendar", "Direct farmer profiles", "Real-time availability"],
    },
    {
        number: "03",
        tag: "The Journey",
        title: "Harvested & delivered same day.",
        description:
            "Your box is packed within hours of harvest. Our drivers pick up directly from the farm and deliver to your door — all within a single morning. No detours, no delays.",
        image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=1400&auto=format&fit=crop",
        accent: "#06b6d4",
        accentDark: "#164e63",
        Icon: Truck,
        stat: { icon: Clock, value: "4–6 hrs", label: "Harvest to Door" },
        bullets: ["Live GPS tracking", "Eco-friendly packaging", "Zero-emission final mile"],
    },
    {
        number: "04",
        tag: "The Plate",
        title: "You taste the difference.",
        description:
            "From soil to soul. Cook with ingredients that actually taste like something. Your family deserves the best the earth has to offer — real food with real flavour.",
        image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1400&auto=format&fit=crop",
        accent: "#ec4899",
        accentDark: "#9d174d",
        Icon: UtensilsCrossed,
        stat: { icon: Users, value: "5,000+", label: "Happy Families" },
        bullets: ["Recipe cards included", "Nutritional transparency", "30-day freshness guarantee"],
    },
];

/* ─────────────────────────────────────────────
   Tilt Card — 3D hover tilt
───────────────────────────────────────────── */
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 25 });
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 25 });

    const handleMouse = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const { left, top, width, height } = ref.current.getBoundingClientRect();
        x.set((e.clientX - left) / width - 0.5);
        y.set((e.clientY - top) / height - 0.5);
    };

    return (
        <motion.div
            ref={ref}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 800 }}
            onMouseMove={handleMouse}
            onMouseLeave={() => { x.set(0); y.set(0); }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/* ─────────────────────────────────────────────
   Animated Bullet
───────────────────────────────────────────── */
function AnimatedBullet({ text, accent, delay }: { text: string; accent: string; delay: number }) {
    const ref = useRef<HTMLLIElement>(null);
    const inView = useInView(ref, { once: true, margin: "-20% 0px" });
    return (
        <motion.li
            ref={ref}
            className="flex items-center gap-2.5 text-sm text-stone-500"
            initial={{ opacity: 0, x: -16 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.45, delay }}
        >
            <CheckCircle2
                size={15}
                strokeWidth={2.5}
                style={{ color: accent, flexShrink: 0 }}
            />
            {text}
        </motion.li>
    );
}

/* ─────────────────────────────────────────────
   Step Card
───────────────────────────────────────────── */
function StepCard({ step, index }: { step: typeof STEPS[0]; index: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { margin: "-35% 0px -35% 0px" });
    const StatIcon = step.stat.icon;

    return (
        <div
            ref={ref}
            className="min-h-screen flex items-center py-24 px-6 lg:pl-16 lg:pr-4 data-step"
            data-index={index}
        >
            <div className="max-w-lg w-full">
                {/* Top row: tag + icon */}
                <motion.div
                    className="flex items-center gap-3 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                >
                    <TiltCard>
                        <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                            style={{ background: `${step.accent}18`, border: `1.5px solid ${step.accent}30` }}
                        >
                            <step.Icon size={22} strokeWidth={1.8} style={{ color: step.accent }} />
                        </div>
                    </TiltCard>
                    <span
                        className="text-[11px] font-bold tracking-[0.25em] uppercase px-3 py-1.5 rounded-full"
                        style={{ color: step.accent, background: `${step.accent}12`, border: `1px solid ${step.accent}20` }}
                    >
                        {step.tag}
                    </span>
                </motion.div>

                {/* Giant number */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={inView ? { opacity: 0.08, x: 0 } : { opacity: 0, x: -30 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-[9rem] font-black leading-none select-none -mb-8 font-mono"
                    style={{ color: step.accentDark }}
                >
                    {step.number}
                </motion.div>

                {/* Title */}
                <motion.h3
                    className="text-4xl lg:text-5xl font-bold text-stone-900 font-serif leading-tight mb-4 relative z-10"
                    initial={{ opacity: 0, y: 24 }}
                    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                    {step.title}
                </motion.h3>

                {/* Description */}
                <motion.p
                    className="text-base text-stone-500 leading-relaxed mb-6"
                    initial={{ opacity: 0, y: 16 }}
                    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                    transition={{ duration: 0.55, delay: 0.2 }}
                >
                    {step.description}
                </motion.p>

                {/* Bullets */}
                <ul className="space-y-2.5 mb-8">
                    {step.bullets.map((b, i) => (
                        <AnimatedBullet key={b} text={b} accent={step.accent} delay={0.25 + i * 0.08} />
                    ))}
                </ul>

                {/* Stat chip */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5, delay: 0.35, type: "spring" }}
                >
                    <TiltCard>
                        <div
                            className="inline-flex items-center gap-4 px-5 py-4 rounded-2xl border bg-white/60 backdrop-blur-sm shadow-sm"
                            style={{ borderColor: `${step.accent}25` }}
                        >
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: `${step.accent}18` }}
                            >
                                <StatIcon size={18} strokeWidth={2} style={{ color: step.accent }} />
                            </div>
                            <div>
                                <p className="text-xl font-black text-stone-900 leading-none">{step.stat.value}</p>
                                <p className="text-xs text-stone-400 mt-0.5">{step.stat.label}</p>
                            </div>
                        </div>
                    </TiltCard>
                </motion.div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Vertical Progress Rail (desktop left edge)
───────────────────────────────────────────── */
function SideRail({ activeStep }: { activeStep: number }) {
    return (
        <div className="hidden lg:flex flex-col items-center gap-0 fixed left-8 top-1/2 -translate-y-1/2 z-30">
            {STEPS.map((step, i) => {
                const isActive = activeStep === i;
                const isPast = activeStep > i;
                return (
                    <div key={i} className="flex flex-col items-center">
                        <motion.div
                            className="relative w-3 h-3 rounded-full border-2 cursor-pointer"
                            animate={{
                                scale: isActive ? 1.4 : 1,
                                borderColor: isActive || isPast ? step.accent : "#d6d3d1",
                                backgroundColor: isPast ? step.accent : isActive ? step.accent : "transparent",
                            }}
                            transition={{ duration: 0.3 }}
                            onClick={() => document.querySelectorAll(".data-step")[i]?.scrollIntoView({ behavior: "smooth" })}
                            whileHover={{ scale: 1.6 }}
                        >
                            {isActive && (
                                <motion.div
                                    className="absolute inset-[-4px] rounded-full border"
                                    style={{ borderColor: step.accent + "50" }}
                                    animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            )}
                        </motion.div>
                        {i < STEPS.length - 1 && (
                            <div className="relative w-0.5 h-10 bg-stone-200 overflow-hidden my-1">
                                <motion.div
                                    className="absolute top-0 left-0 right-0 rounded-full"
                                    style={{ backgroundColor: step.accent }}
                                    animate={{ height: isPast ? "100%" : "0%" }}
                                    transition={{ duration: 0.4 }}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ─────────────────────────────────────────────
   Image Panel (sticky left)
───────────────────────────────────────────── */
function ImagePanel({ activeStep }: { activeStep: number }) {
    const step = STEPS[activeStep];
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const ctx = gsap.context(() => {
            gsap.fromTo(
                containerRef.current,
                { yPercent: 0 },
                {
                    yPercent: -4,
                    ease: "none",
                    scrollTrigger: {
                        trigger: "#how-it-works",
                        start: "top top",
                        end: "bottom bottom",
                        scrub: true,
                    },
                }
            );
        });
        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-2xl">
            {/* Images — crossfade */}
            <AnimatePresence mode="sync">
                <motion.div
                    key={activeStep}
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${step.image}')` }}
                    initial={{ opacity: 0, scale: 1.07 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                />
            </AnimatePresence>

            {/* Overlay gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-stone-900/10 to-transparent" />
            <div
                className="absolute inset-0 opacity-20 mix-blend-overlay transition-all duration-700"
                style={{ background: `linear-gradient(135deg, ${step.accent}60, transparent)` }}
            />

            {/* Top badge */}
            <div className="absolute top-5 left-5">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeStep}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.4 }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md text-white text-xs font-semibold"
                        style={{
                            background: `${step.accent}25`,
                            border: `1px solid ${step.accent}40`,
                        }}
                    >
                        <step.Icon size={14} strokeWidth={2} />
                        {step.tag}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Step counter circle */}
            <div className="absolute top-5 right-5">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeStep}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ duration: 0.4, type: "spring" }}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black backdrop-blur-md"
                        style={{ background: step.accent, color: "#1c1917" }}
                    >
                        {step.number.replace("0", "")}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom info bar */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
                {/* Progress dots */}
                <div className="flex gap-1.5 mb-4">
                    {STEPS.map((s, i) => (
                        <motion.div
                            key={i}
                            className="h-[3px] rounded-full transition-all duration-500"
                            animate={{
                                width: activeStep === i ? 28 : 7,
                                backgroundColor: activeStep === i ? s.accent : "rgba(255,255,255,0.3)",
                            }}
                        />
                    ))}
                </div>

                {/* Caption */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeStep}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.4 }}
                    >
                        <p className="text-white/50 text-[11px] uppercase tracking-widest mb-1 font-medium">
                            Step {step.number}
                        </p>
                        <p className="text-white text-lg font-bold font-serif leading-snug">
                            {step.title}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Grain texture */}
            <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                }}
            />
        </div>
    );
}

/* ─────────────────────────────────────────────
   Connecting line animation (mobile)
───────────────────────────────────────────── */
function MobileConnector({ accent }: { accent: string }) {
    return (
        <div className="flex justify-center py-2 lg:hidden">
            <motion.div
                className="w-px h-10 rounded-full"
                style={{ background: `linear-gradient(to bottom, ${accent}60, transparent)` }}
                initial={{ scaleY: 0, originY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
            />
        </div>
    );
}

/* ─────────────────────────────────────────────
   Horizontal step tabs (sticky top bar)
───────────────────────────────────────────── */
function StickyNav({ activeStep }: { activeStep: number }) {
    return (
        <div className="sticky top-0 z-20 bg-[#f5f1ea]/80 backdrop-blur-md border-b border-stone-200/60">
            <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
                <p className="text-[11px] font-bold tracking-[0.25em] text-stone-400 uppercase hidden sm:block">
                    How It Works
                </p>
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                    {STEPS.map((step, i) => (
                        <motion.button
                            key={i}
                            onClick={() => document.querySelectorAll(".data-step")[i]?.scrollIntoView({ behavior: "smooth" })}
                            className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors duration-200"
                            style={{ color: activeStep === i ? "#1c1917" : "#a8a29e" }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.96 }}
                        >
                            {activeStep === i && (
                                <motion.div
                                    layoutId="navPill"
                                    className="absolute inset-0 rounded-full"
                                    style={{ backgroundColor: STEPS[i].accent }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <step.Icon
                                size={11}
                                strokeWidth={2.5}
                                className="relative z-10"
                                style={{ color: activeStep === i ? "#1c1917" : step.accent }}
                            />
                            <span className="relative z-10">{step.tag}</span>
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function HowItWorks() {
    const [activeStep, setActiveStep] = useState(0);

    // IntersectionObserver – track active step
    useEffect(() => {
        const stepEls = document.querySelectorAll(".data-step");
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveStep(Number((entry.target as HTMLElement).dataset.index));
                    }
                });
            },
            { threshold: 0.4 }
        );
        stepEls.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <>
            <SideRail activeStep={activeStep} />

            <section id="how-it-works" className="relative bg-[#f5f1ea]">
                {/* ── Sticky Nav ── */}
                <StickyNav activeStep={activeStep} />

                {/* ── Hero headline ── */}
                <div className="max-w-6xl mx-auto pt-20 pb-16 px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.3em] uppercase text-lime-700 mb-5 px-4 py-2 rounded-full border border-lime-200 bg-lime-50/80">
                            <Star size={11} strokeWidth={2.5} className="text-lime-500" />
                            Our Process
                        </span>

                        <h2 className="text-5xl md:text-7xl font-bold text-stone-900 font-serif leading-[1.05] mt-2">
                            From{" "}
                            <span className="italic font-light text-stone-500">seed</span>{" "}
                            to{" "}
                            <span className="relative inline-block">
                                your table
                                <motion.span
                                    className="absolute -bottom-1 left-0 right-0 h-[6px] bg-lime-300/60 -z-10 rounded-sm"
                                    initial={{ scaleX: 0 }}
                                    whileInView={{ scaleX: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    style={{ originX: 0 }}
                                />
                            </span>
                        </h2>

                        <p className="mt-5 text-base text-stone-400 max-w-lg mx-auto leading-relaxed">
                            A transparent, four-step journey that connects the field to your kitchen — in just a few hours.
                        </p>

                        {/* Scroll hint */}
                        <motion.div
                            className="flex items-center justify-center gap-2 mt-8 text-stone-400 text-xs"
                            animate={{ y: [0, 5, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <span>Scroll to explore</span>
                            <ChevronRight size={13} className="rotate-90" />
                        </motion.div>
                    </motion.div>
                </div>

                {/* ── Two-column layout ── */}
                <div className="relative max-w-6xl mx-auto flex gap-16 px-0">
                    {/* Sticky LEFT image panel */}
                    <div className="hidden lg:block sticky top-[72px] self-start w-[45%] shrink-0 h-[82vh]">
                        <ImagePanel activeStep={activeStep} />
                    </div>

                    {/* RIGHT scrolling steps */}
                    <div className="flex-1">
                        {STEPS.map((step, index) => (
                            <div key={step.number}>
                                <StepCard step={step} index={index} />
                                {index < STEPS.length - 1 && <MobileConnector accent={step.accent} />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Mobile thumbnail strip ── */}
                <div className="lg:hidden flex gap-3 overflow-x-auto px-6 pb-10 pt-2 scrollbar-none">
                    {STEPS.map((step, i) => (
                        <motion.div
                            key={i}
                            onClick={() => {
                                setActiveStep(i);
                                document.querySelectorAll(".data-step")[i]?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="flex-shrink-0 w-64 h-40 rounded-2xl overflow-hidden relative cursor-pointer border-2 transition-all duration-300"
                            style={{ borderColor: activeStep === i ? step.accent : "transparent" }}
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${step.image}')` }} />
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 to-transparent" />
                            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-xs font-semibold">
                                <step.Icon size={12} strokeWidth={2} />
                                {step.tag}
                            </div>
                            <div
                                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
                                style={{ background: step.accent, color: "#1c1917" }}
                            >
                                {i + 1}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ── Bottom CTA ── */}
                <div className="border-t border-stone-200/80 bg-white/40 backdrop-blur-sm py-20">
                    <motion.div
                        className="max-w-2xl mx-auto px-6 text-center"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="flex items-center justify-center gap-3 mb-4">
                            {STEPS.map((step, i) => (
                                <motion.div
                                    key={i}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ background: `${step.accent}20`, border: `1px solid ${step.accent}30` }}
                                    whileHover={{ scale: 1.15, rotate: 5 }}
                                >
                                    <step.Icon size={15} strokeWidth={2} style={{ color: step.accent }} />
                                </motion.div>
                            ))}
                        </div>

                        <h3 className="text-3xl font-bold text-stone-900 font-serif mb-3">
                            Ready to taste the difference?
                        </h3>
                        <p className="text-stone-400 text-sm mb-8">
                            Join 5,000+ families getting the freshest produce delivered to their door every week.
                        </p>

                        <motion.button
                            className="group inline-flex items-center gap-2 px-8 py-4 bg-stone-900 text-white rounded-full font-bold text-sm hover:bg-stone-800 transition-all shadow-lg hover:shadow-stone-900/20"
                            whileHover={{ scale: 1.04, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            Get Started — It&apos;s Free
                            <motion.span className="group-hover:translate-x-1 transition-transform duration-200">
                                <ArrowRight size={16} strokeWidth={2.5} />
                            </motion.span>
                        </motion.button>
                    </motion.div>
                </div>
            </section>
        </>
    );
}
