"use client";

import { useEffect, useRef, useState } from "react";
import { useScroll, useTransform, motion, useMotionValueEvent, useSpring } from "framer-motion";

const FRAME_COUNT = 120;

// ─── Font Loader ───────────────────────────────────────────────────────────────
function useFonts() {
    useEffect(() => {
        const id = "harvest-hero-fonts";
        if (document.getElementById(id)) return;
        const l = document.createElement("link");
        l.id = id; l.rel = "stylesheet";
        l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Jost:wght@300;400;500;600&family=Caveat:wght@600&display=swap";
        document.head.appendChild(l);
    }, []);
}

// ─── Word-split animated text ──────────────────────────────────────────────────
function AnimatedWords({
    text,
    className,
    style,
    delay = 0,
    visible,
}: {
    text: string;
    className?: string;
    style?: React.CSSProperties;
    delay?: number;
    visible: boolean;
}) {
    const words = text.split(" ");
    return (
        <span className={className} style={style}>
            {words.map((word, i) => (
                <span key={i} className="inline-block overflow-hidden mr-[0.25em]">
                    <motion.span
                        className="inline-block"
                        initial={{ y: "110%", opacity: 0, rotateX: 40 }}
                        animate={visible
                            ? { y: "0%", opacity: 1, rotateX: 0 }
                            : { y: "110%", opacity: 0, rotateX: 40 }
                        }
                        transition={{
                            duration: 0.65,
                            delay: delay + i * 0.07,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                    >
                        {word}
                    </motion.span>
                </span>
            ))}
        </span>
    );
}

// ─── Subtitle fade-up ──────────────────────────────────────────────────────────
function FadeUp({
    children,
    delay = 0,
    visible,
    className,
    style,
}: {
    children: React.ReactNode;
    delay?: number;
    visible: boolean;
    className?: string;
    style?: React.CSSProperties;
}) {
    return (
        <motion.div
            className={className}
            style={style}
            initial={{ y: 24, opacity: 0 }}
            animate={visible ? { y: 0, opacity: 1 } : { y: 24, opacity: 0 }}
            transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}

// ─── Pill / Tag ────────────────────────────────────────────────────────────────
function LivePill({ visible }: { visible: boolean }) {
    return (
        <FadeUp visible={visible} delay={0.1}>
            <div className="inline-flex items-center gap-2 mb-5 rounded-full px-4 py-1.5 border"
                style={{
                    background: "rgba(253,246,232,0.15)",
                    backdropFilter: "blur(12px)",
                    borderColor: "rgba(212,160,67,0.35)",
                }}>
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#4a9e3f" }} />
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#4a9e3f" }} />
                </span>
                <span className="text-[11px] font-semibold tracking-[0.2em] uppercase"
                    style={{ fontFamily: "'Jost', sans-serif", color: "rgba(253,246,232,0.85)" }}>
                    Farm Fresh · Delivered Daily
                </span>
            </div>
        </FadeUp>
    );
}

// ─── Final CTA Button ──────────────────────────────────────────────────────────
function HarvestButton({ visible }: { visible: boolean }) {
    const [hovered, setHovered] = useState(false);

    return (
        <FadeUp visible={visible} delay={0.55} className="flex flex-col items-center gap-4 mt-10">
            {/* Main CTA */}
            <motion.a
                href="/app/browse"
                whileTap={{ scale: 0.96 }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className="pointer-events-auto relative inline-flex items-center gap-3 overflow-hidden rounded-full group"
                style={{
                    padding: "1px",
                    background: "linear-gradient(135deg, #d4a043, #e8681a, #d4a043)",
                    backgroundSize: "200% 200%",
                    backgroundPosition: hovered ? "right center" : "left center",
                    transition: "background-position 0.5s ease",
                    boxShadow: hovered
                        ? "0 0 40px rgba(212,160,67,0.5), 0 10px 40px rgba(26,15,10,0.3)"
                        : "0 4px 20px rgba(212,160,67,0.25)",
                }}
            >
                <span className="relative z-10 flex items-center gap-3 rounded-full px-8 py-4"
                    style={{
                        background: hovered ? "transparent" : "#1a0f0a",
                        transition: "background 0.3s ease",
                    }}>
                    {/* Leaf icon */}
                    <motion.svg
                        viewBox="0 0 20 20" fill="none" className="w-5 h-5 shrink-0"
                        animate={{ rotate: hovered ? 15 : 0, scale: hovered ? 1.15 : 1 }}
                        transition={{ type: "spring", stiffness: 300 }}>
                        <path d="M10 18V10M10 10C8 6 4 5 2 7c3 1 6 2 8 3zM10 10c2-4 6-5 8-3-3 1-6 2-8 3z"
                            stroke={hovered ? "#1a0f0a" : "#d4a043"} strokeWidth="1.5" strokeLinecap="round" />
                    </motion.svg>

                    <span className="text-base font-semibold tracking-wide"
                        style={{
                            fontFamily: "'Jost', sans-serif",
                            color: hovered ? "#1a0f0a" : "#fdf6e8",
                            transition: "color 0.3s ease",
                        }}>
                        Shop Fresh Produce
                    </span>

                    {/* Arrow */}
                    <motion.span
                        className="flex items-center"
                        animate={{ x: hovered ? 4 : 0 }}
                        transition={{ type: "spring", stiffness: 400 }}>
                        <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5"
                            style={{ stroke: hovered ? "#1a0f0a" : "#d4a043", transition: "stroke 0.3s ease" }}>
                            <path d="M4 10h12M11 5l5 5-5 5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </motion.span>
                </span>
            </motion.a>

            {/* Ghost secondary */}
            <motion.a
                href="/app/seller/new-listing"
                className="pointer-events-auto text-sm font-medium tracking-wide flex items-center gap-1.5 group"
                style={{ fontFamily: "'Jost', sans-serif", color: "rgba(253,246,232,0.5)" }}
                whileHover={{ color: "rgba(253,246,232,0.9)" }}>
                Are you a farmer?
                <span className="underline underline-offset-2 group-hover:text-[#d4a043] transition-colors">
                    List your harvest →
                </span>
            </motion.a>
        </FadeUp>
    );
}

// ─── Scroll progress indicator ─────────────────────────────────────────────────
function ScrollHint({ visible }: { visible: boolean }) {
    return (
        <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
            initial={{ opacity: 0, y: 10 }}
            animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: 0.8, duration: 0.6 }}>
            <span className="text-[10px] tracking-[0.3em] uppercase font-medium"
                style={{ fontFamily: "'Jost', sans-serif", color: "rgba(253,246,232,0.45)" }}>
                Scroll to explore
            </span>
            <motion.div className="w-px h-10 rounded-full overflow-hidden" style={{ background: "rgba(253,246,232,0.15)" }}>
                <motion.div
                    className="w-full rounded-full"
                    style={{ background: "#d4a043", height: "40%" }}
                    animate={{ y: ["0%", "200%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
            </motion.div>
        </motion.div>
    );
}

// ─── Loading Screen ────────────────────────────────────────────────────────────
function LoadingScreen({ progress }: { progress: number }) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50"
            style={{ background: "#0e1a0e" }}>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center">
                {/* Logo-ish */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
                        <path d="M16 28V14M16 14C12 8 6 7 3 10c4 1 9 2 13 4zM16 14c4-6 10-7 13-4-4 1-9 2-13 4z"
                            stroke="#d4a043" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", color: "#fdf6e8" }}>
                        Harvest
                    </span>
                </div>

                {/* Progress bar */}
                <div className="w-48 h-px rounded-full overflow-hidden mb-4" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <motion.div className="h-full rounded-full" style={{ background: "#d4a043", width: `${progress}%` }}
                        transition={{ duration: 0.1 }} />
                </div>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "11px", color: "rgba(253,246,232,0.35)", letterSpacing: "0.2em" }}>
                    LOADING HARVEST · {Math.round(progress)}%
                </p>
            </motion.div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function HeroHarvestScroll() {
    useFonts();
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const [loadProgress, setLoadProgress] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    // Text phase state (cleaner than tracking raw progress)
    const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    const currentIndex = useTransform(scrollYProgress, [0, 1], [1, FRAME_COUNT]);

    // ── Phase tracking ──
    useMotionValueEvent(scrollYProgress, "change", (v) => {
        if (v < 0.28) setPhase(0);
        else if (v < 0.58) setPhase(1);
        else if (v < 0.72) setPhase(2);
        else setPhase(3);
    });

    // ── Overlay tint: darkens as we enter the burst phase ──
    const overlayOpacity = useTransform(scrollYProgress, [0, 0.4, 0.7, 1], [0.22, 0.28, 0.48, 0.55]);

    // ── Frame rendering ──
    const renderFrame = (index: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx || !images[index]) return;
        const img = images[index];
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    };

    useMotionValueEvent(currentIndex, "change", (latest) => {
        if (!isLoaded) return;
        const frame = Math.max(0, Math.min(Math.floor(latest) - 1, FRAME_COUNT - 1));
        requestAnimationFrame(() => renderFrame(frame));
    });

    useEffect(() => {
        if (isLoaded) renderFrame(0);
    }, [isLoaded]);

    // ── Image preloading ──
    useEffect(() => {
        let loaded = 0;
        const arr: HTMLImageElement[] = [];
        for (let i = 1; i <= FRAME_COUNT; i++) {
            const img = new Image();
            img.src = `/image sequence/ezgif-frame-${i.toString().padStart(3, "0")}.jpg`;
            img.onload = () => {
                loaded++;
                setLoadProgress(Math.round((loaded / FRAME_COUNT) * 100));
                if (loaded === FRAME_COUNT) setIsLoaded(true);
            };
            arr.push(img);
        }
        setImages(arr);
    }, []);

    // Shared text styles
    const headingBase: React.CSSProperties = {
        fontFamily: "'Playfair Display', serif",
        lineHeight: 1.08,
        letterSpacing: "-0.01em",
        color: "#fdf6e8",
        textShadow: "0 2px 40px rgba(0,0,0,0.3)",
        perspective: "800px",
    };

    const subBase: React.CSSProperties = {
        fontFamily: "'Jost', sans-serif",
        color: "rgba(253,246,232,0.7)",
        textShadow: "0 1px 20px rgba(0,0,0,0.3)",
    };

    return (
        <>
            <style>{`
                @keyframes ping { 75%,100%{transform:scale(2);opacity:0} }
                .animate-ping { animation: ping 1.2s cubic-bezier(0,0,0.2,1) infinite; }
                .harvest-serif { font-family: 'Playfair Display', serif; }
                .harvest-sans { font-family: 'Jost', sans-serif; }
            `}</style>

            <div ref={containerRef} className="relative h-[500vh]">
                <div className="sticky top-0 h-screen w-full overflow-hidden" style={{ background: "#0e1a0e" }}>

                    {/* Canvas */}
                    <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full object-cover" />

                    {/* Loading */}
                    {!isLoaded && <LoadingScreen progress={loadProgress} />}

                    {/* Dark gradient overlay — bottom-heavy so text stays legible */}
                    <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            opacity: overlayOpacity,
                            background: "linear-gradient(to bottom, rgba(14,26,14,0.4) 0%, rgba(14,26,14,0.1) 30%, rgba(14,26,14,0.6) 100%)",
                        }} />

                    {/* Grain texture */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.035]"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                        }} />

                    {/* ══ TEXT OVERLAYS ═════════════════════════════════════════ */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">

                        {/* ── PHASE 0: Opening frame ── */}
                        <div className="absolute text-center px-6 max-w-4xl w-full">
                            <LivePill visible={phase === 0} />

                            <div style={{ perspective: "1000px" }}>
                                <AnimatedWords
                                    text="Fresh From"
                                    visible={phase === 0}
                                    delay={0.2}
                                    className="block text-[clamp(52px,8vw,96px)] font-black"
                                    style={headingBase}
                                />
                                <AnimatedWords
                                    text="the Farm."
                                    visible={phase === 0}
                                    delay={0.35}
                                    className="block text-[clamp(52px,8vw,96px)] font-black italic"
                                    style={{ ...headingBase, color: "#d4a043" }}
                                />
                            </div>

                            <FadeUp visible={phase === 0} delay={0.6}>
                                <p className="mt-5 text-lg md:text-xl max-w-md mx-auto leading-relaxed"
                                    style={subBase}>
                                    Directly from trusted farmers — no middlemen, no compromises.
                                </p>
                            </FadeUp>

                            {/* Decorative rule */}
                            <FadeUp visible={phase === 0} delay={0.75}>
                                <div className="flex items-center justify-center gap-4 mt-7">
                                    <div className="h-px w-16 rounded-full" style={{ background: "rgba(212,160,67,0.4)" }} />
                                    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" style={{ color: "#d4a043" }}>
                                        <path d="M8 14V6M8 6C6 3 3 3 1 4.5c2 .5 5 1 7 1.5zM8 6c2-3 5-3 7-1.5-2 .5-5 1-7 1.5z"
                                            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                    <div className="h-px w-16 rounded-full" style={{ background: "rgba(212,160,67,0.4)" }} />
                                </div>
                            </FadeUp>
                        </div>

                        {/* ── PHASE 1: Mid scroll (basket animation playing) ── */}
                        <div className="absolute text-center px-6 max-w-4xl w-full">
                            <FadeUp visible={phase === 1} delay={0.05}>
                                <p className="text-xs font-semibold tracking-[0.3em] uppercase mb-5"
                                    style={{ fontFamily: "'Jost', sans-serif", color: "#d4a043" }}>
                                    Peak Ripeness · Zero Preservatives
                                </p>
                            </FadeUp>

                            <div style={{ perspective: "1000px" }}>
                                <AnimatedWords
                                    text="Harvested at"
                                    visible={phase === 1}
                                    delay={0.1}
                                    className="block text-[clamp(44px,7.5vw,88px)] font-black"
                                    style={headingBase}
                                />
                                <AnimatedWords
                                    text="Peak Freshness."
                                    visible={phase === 1}
                                    delay={0.22}
                                    className="block text-[clamp(44px,7.5vw,88px)] font-black italic"
                                    style={{ ...headingBase, color: "#4a9e3f" }}
                                />
                            </div>

                            <FadeUp visible={phase === 1} delay={0.55}>
                                <div className="mt-6 flex items-center justify-center gap-6">
                                    {["500+ Farmers", "24h Delivery", "100% Verified"].map((item, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#4a9e3f" }} />
                                            <span className="text-sm font-medium"
                                                style={{ fontFamily: "'Jost', sans-serif", color: "rgba(253,246,232,0.7)" }}>
                                                {item}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </FadeUp>
                        </div>

                        {/* ── PHASE 2: Transition / dramatic hold ── */}
                        <div className="absolute text-center px-6 max-w-4xl w-full">
                            <div style={{ perspective: "1000px" }}>
                                <AnimatedWords
                                    text="Nature's Bounty,"
                                    visible={phase === 2}
                                    delay={0.05}
                                    className="block text-[clamp(40px,7vw,84px)] font-black"
                                    style={headingBase}
                                />
                                <AnimatedWords
                                    text="Delivered."
                                    visible={phase === 2}
                                    delay={0.2}
                                    className="block text-[clamp(40px,7vw,84px)] font-black italic"
                                    style={{ ...headingBase, color: "#e8681a" }}
                                />
                            </div>

                            <FadeUp visible={phase === 2} delay={0.5}>
                                <p className="mt-5 text-base max-w-sm mx-auto"
                                    style={{ ...subBase, color: "rgba(253,246,232,0.6)" }}>
                                    From soil to table — the way food was always meant to be.
                                </p>
                            </FadeUp>
                        </div>

                        {/* ── PHASE 3: Final CTA ── */}
                        <div className="absolute text-center px-6 max-w-3xl w-full">
                            <div style={{ perspective: "1000px" }}>
                                <AnimatedWords
                                    text="Bring Nature"
                                    visible={phase === 3}
                                    delay={0.0}
                                    className="block text-[clamp(44px,7.5vw,88px)] font-black"
                                    style={headingBase}
                                />
                                <AnimatedWords
                                    text="to Your Table."
                                    visible={phase === 3}
                                    delay={0.14}
                                    className="block text-[clamp(44px,7.5vw,88px)] font-black italic"
                                    style={{ ...headingBase, color: "#d4a043" }}
                                />
                            </div>

                            <FadeUp visible={phase === 3} delay={0.38}>
                                <p className="mt-4 text-lg max-w-md mx-auto leading-relaxed"
                                    style={subBase}>
                                    Join 5,000+ families who chose to eat fresh, local, and honest.
                                </p>
                            </FadeUp>

                            <HarvestButton visible={phase === 3} />

                            {/* Scroll-to-browse rating strip */}
                            <FadeUp visible={phase === 3} delay={0.9}>
                                <div className="mt-8 flex items-center justify-center gap-2">
                                    <div className="flex">
                                        {[0, 1, 2, 3, 4].map(i => (
                                            <svg key={i} viewBox="0 0 16 16" className="w-4 h-4 -ml-0.5 first:ml-0"
                                                style={{ fill: "#d4a043" }}>
                                                <path d="M8 1l1.84 3.73L14 5.27l-3 2.93.71 4.13L8 10.18l-3.71 2.15L5 8.2 2 5.27l4.16-.54z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <span className="text-sm font-medium"
                                        style={{ fontFamily: "'Jost', sans-serif", color: "rgba(253,246,232,0.55)" }}>
                                        4.9 · Trusted by 5,000+ families
                                    </span>
                                </div>
                            </FadeUp>
                        </div>
                    </div>

                    {/* Scroll hint — only visible at phase 0 */}
                    <ScrollHint visible={phase === 0} />

                    {/* Corner watermark */}
                    <div className="absolute bottom-6 right-6 z-20 pointer-events-none"
                        style={{
                            fontFamily: "'Caveat', cursive",
                            fontSize: "16px",
                            color: "rgba(253,246,232,0.18)",
                            letterSpacing: "0.05em",
                        }}>
                        farm to table
                    </div>
                </div>
            </div>
        </>
    );
}