"use client";

import {
    motion,
    AnimatePresence,
    useMotionValue,
    useSpring,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import LottieLoader from "@/components/LottieLoader";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/* ─────────────────────────────────────────────
   Password strength helper
───────────────────────────────────────────── */
function getStrength(password: string): { score: number; label: string; color: string } {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = [
        { label: "", color: "bg-transparent" },
        { label: "Weak", color: "bg-red-400" },
        { label: "Fair", color: "bg-amber-400" },
        { label: "Good", color: "bg-lime-400" },
        { label: "Strong", color: "bg-green-500" },
    ];
    return { score, ...levels[score] };
}

/* ─────────────────────────────────────────────
   Floating Label Input
───────────────────────────────────────────── */
function FloatingInput({
    id,
    label,
    type = "text",
    value,
    onChange,
    error,
    rightIcon,
}: {
    id: string;
    label: string;
    type?: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    rightIcon?: React.ReactNode;
}) {
    const [focused, setFocused] = useState(false);
    const isFloating = focused || value.length > 0;

    return (
        <div className="relative">
            <motion.div
                animate={error ? { x: [0, -8, 8, -6, 6, -2, 2, 0] } : { x: 0 }}
                transition={{ duration: 0.45 }}
            >
                <div
                    className={`relative border rounded-xl transition-all duration-300 ${error
                        ? "border-red-400 bg-red-50/5"
                        : focused
                            ? "border-lime-400 bg-white/5 shadow-[0_0_0_3px_rgba(163,230,53,0.15)]"
                            : "border-white/20 bg-white/5"
                        }`}
                >
                    <label
                        htmlFor={id}
                        className={`absolute left-4 pointer-events-none transition-all duration-200 ${isFloating
                            ? "top-2 text-xs font-semibold " + (error ? "text-red-400" : "text-lime-400")
                            : "top-1/2 -translate-y-1/2 text-sm text-stone-400"
                            }`}
                    >
                        {label}
                    </label>
                    <input
                        id={id}
                        type={type}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        className="w-full bg-transparent px-4 pt-6 pb-2 text-white text-sm outline-none rounded-xl"
                        autoComplete="off"
                    />
                    {rightIcon && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">{rightIcon}</div>
                    )}
                </div>
            </motion.div>
            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-xs text-red-400 mt-1 ml-1"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Magnetic Button
───────────────────────────────────────────── */
function MagneticButton({
    children,
    onClick,
    className = "",
}: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}) {
    const ref = useRef<HTMLButtonElement>(null);
    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const sx = useSpring(mx, { stiffness: 300, damping: 20 });
    const sy = useSpring(my, { stiffness: 300, damping: 20 });
    const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

    const handleMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        mx.set((e.clientX - r.left - r.width / 2) * 0.25);
        my.set((e.clientY - r.top - r.height / 2) * 0.25);
    };

    const handleLeave = () => { mx.set(0); my.set(0); };

    const handleClick = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const id = Date.now();
        setRipples((prev) => [...prev, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
        setTimeout(() => setRipples((prev) => prev.filter((p) => p.id !== id)), 700);
        onClick?.();
    };

    return (
        <motion.button
            ref={ref}
            style={{ x: sx, y: sy }}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            onClick={handleClick}
            whileTap={{ scale: 0.97 }}
            className={`relative overflow-hidden ${className}`}
        >
            {ripples.map((r) => (
                <motion.span
                    key={r.id}
                    className="absolute rounded-full bg-white/20 pointer-events-none"
                    style={{ left: r.x, top: r.y }}
                    initial={{ width: 0, height: 0, x: "-50%", y: "-50%", opacity: 0.5 }}
                    animate={{ width: 300, height: 300, opacity: 0 }}
                    transition={{ duration: 0.7 }}
                />
            ))}
            {children}
        </motion.button>
    );
}

/* Slideshow images */
const SLIDES = [
    {
        url: "https://images.unsplash.com/photo-1518843875459-f738682238a6?q=80&w=1400&auto=format&fit=crop",
        caption: "Harvested this morning",
    },
    {
        url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=1400&auto=format&fit=crop",
        caption: "Straight from the field",
    },
    {
        url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1400&auto=format&fit=crop",
        caption: "Golden hour at the farm",
    },
    {
        url: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1400&auto=format&fit=crop",
        caption: "100% organic, 100% local",
    },
];

/* ─────────────────────────────────────────────
   Left Panel — cinematic visual with slideshow
───────────────────────────────────────────── */
function LeftPanel() {
    const [slide, setSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setSlide((s) => (s + 1) % SLIDES.length);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative hidden lg:flex flex-col justify-end p-12 overflow-hidden w-full h-full">
            {/* Slideshow images — crossfade */}
            <AnimatePresence mode="sync">
                <motion.div
                    key={slide}
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${SLIDES[slide].url}')` }}
                    initial={{ opacity: 0, scale: 1.06 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/50 to-transparent" />

            {/* Floating accent circles */}
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full border border-lime-400/20"
                    style={{
                        width: 120 + i * 100,
                        height: 120 + i * 100,
                        top: `${15 + i * 12}%`,
                        right: `${-10 + i * 5}%`,
                    }}
                    animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                    transition={{ duration: 30 + i * 10, repeat: Infinity, ease: "linear" }}
                />
            ))}

            {/* Floating leaves */}
            {["🌿", "🍃", "🌱"].map((leaf, i) => (
                <motion.span
                    key={leaf}
                    className="absolute text-2xl select-none"
                    style={{ left: `${20 + i * 25}%`, top: `${20 + i * 15}%` }}
                    animate={{ y: [0, -15, 0], rotate: [0, 10, -5, 0] }}
                    transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 }}
                >
                    {leaf}
                </motion.span>
            ))}

            {/* Text */}
            <div className="relative z-10">
                <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-lime-400 text-xs font-bold tracking-[0.3em] uppercase mb-3"
                >
                    Farm to Table
                </motion.p>
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="text-4xl font-bold text-white font-serif leading-snug mb-4"
                >
                    The freshest harvest, <br />
                    <span className="text-lime-400">at your door.</span>
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="text-stone-400 text-sm leading-relaxed max-w-xs"
                >
                    Join 5,000+ families eating local, seasonal, and organic produce sourced directly from trusted farmers.
                </motion.p>

                {/* Social proof avatars */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                    className="flex items-center gap-3 mt-6"
                >
                    <div className="flex -space-x-3">
                        {[11, 12, 13, 14].map((n) => (
                            <img
                                key={n}
                                src={`https://i.pravatar.cc/48?img=${n}`}
                                className="w-9 h-9 rounded-full border-2 border-stone-800 object-cover"
                                alt=""
                            />
                        ))}
                    </div>
                    <p className="text-stone-400 text-xs">
                        <span className="text-white font-bold">5,000+</span> happy families
                    </p>
                </motion.div>

                {/* Slide caption + dot indicators */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.3 }}
                    className="mt-5"
                >
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={slide}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.35 }}
                            className="text-stone-400 text-xs italic mb-3"
                        >
                            {SLIDES[slide].caption}
                        </motion.p>
                    </AnimatePresence>
                    <div className="flex gap-2">
                        {SLIDES.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setSlide(i)}
                                className="relative h-1 rounded-full overflow-hidden bg-white/20 transition-all duration-300"
                                style={{ width: i === slide ? 28 : 8 }}
                            >
                                {i === slide && (
                                    <motion.div
                                        className="absolute inset-0 bg-lime-400 origin-left"
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ duration: 4, ease: "linear" }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Main AuthModal
───────────────────────────────────────────── */
export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [mode, setMode] = useState<"login" | "signup">("login");

    // Login state
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});
    const [loginLoading, setLoginLoading] = useState(false);

    // Signup state
    const [signupName, setSignupName] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [signupErrors, setSignupErrors] = useState<{ name?: string; email?: string; password?: string }>({});
    const [signupLoading, setSignupLoading] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const strength = getStrength(mode === "login" ? loginPassword : signupPassword);

    const panelRef = useRef<HTMLDivElement>(null);
    const leftRef = useRef<HTMLDivElement>(null);
    const rightRef = useRef<HTMLDivElement>(null);

    // GSAP entrance timeline
    useEffect(() => {
        if (!isOpen || !panelRef.current) return;
        const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
        tl.fromTo(panelRef.current, { opacity: 0, scale: 0.93, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 0.6 });
        tl.fromTo(leftRef.current, { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 }, "-=0.3");
        tl.fromTo(rightRef.current, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 }, "-=0.5");
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    const isEmailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

    const router = useRouter();

    const handleLogin = async () => {
        const errs: typeof loginErrors = {};
        if (!isEmailValid(loginEmail)) errs.email = "Enter a valid email address";
        if (loginPassword.length < 6) errs.password = "Password must be at least 6 characters";
        setLoginErrors(errs);
        if (Object.keys(errs).length) return;

        setLoginLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: loginPassword,
        });
        setLoginLoading(false);

        if (error) {
            if (error.message.toLowerCase().includes('invalid')) {
                setLoginErrors({ password: "Incorrect email or password" });
            } else {
                toast.error(error.message);
            }
            return;
        }

        toast.success("Welcome back! 🌱");
        onClose();
        // CRITICAL: router.refresh() forces Next.js to re-read the Supabase
        // session cookie before navigation, preventing the auth loop.
        router.refresh();
        router.push("/app/home");
    };

    const handleSignup = async () => {
        const errs: typeof signupErrors = {};
        if (!signupName.trim()) errs.name = "Name is required";
        if (!isEmailValid(signupEmail)) errs.email = "Enter a valid email address";
        if (signupPassword.length < 8) errs.password = "Min 8 characters required";
        setSignupErrors(errs);
        if (Object.keys(errs).length) return;

        setSignupLoading(true);
        const { error } = await supabase.auth.signUp({
            email: signupEmail,
            password: signupPassword,
            options: {
                data: { full_name: signupName },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        setSignupLoading(false);

        if (error) {
            toast.error(error.message);
            return;
        }

        toast.success("Check your email to confirm your account! 📬");
        onClose();
    };

    const eyeIcon = (
        <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="text-stone-400 hover:text-white transition-colors"
        >
            {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
            ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            )}
        </button>
    );

    const emailValidIcon = (email: string) =>
        email.length > 3 ? (
            <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`text-sm font-bold ${isEmailValid(email) ? "text-lime-400" : "text-red-400"}`}
            >
                {isEmailValid(email) ? "✓" : "✗"}
            </motion.span>
        ) : null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Panel */}
                    <div
                        ref={panelRef}
                        className="relative z-10 flex w-full max-w-4xl min-h-[580px] rounded-3xl overflow-hidden bg-stone-900 shadow-2xl border border-white/10"
                        style={{ opacity: 0 }}
                    >
                        {/* Left visual panel */}
                        <div ref={leftRef} className="w-[55%] shrink-0" style={{ opacity: 0 }}>
                            <LeftPanel />
                        </div>

                        {/* Right form panel */}
                        <div
                            ref={rightRef}
                            className="flex-1 flex flex-col justify-center p-8 lg:p-12"
                            style={{ opacity: 0 }}
                        >
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white transition-all"
                            >
                                ✕
                            </button>

                            {/* Mode toggle */}
                            <div className="flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/10 mb-8 self-start">
                                {(["login", "signup"] as const).map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setMode(m)}
                                        className="relative px-5 py-2 rounded-full text-sm font-medium capitalize transition-colors"
                                        style={{ color: mode === m ? "#1c1917" : "#a8a29e" }}
                                    >
                                        {mode === m && (
                                            <motion.div
                                                layoutId="pill"
                                                className="absolute inset-0 bg-lime-400 rounded-full"
                                                style={{ zIndex: -1 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                        {m === "login" ? "Log In" : "Sign Up"}
                                    </button>
                                ))}
                            </div>

                            <AnimatePresence mode="wait">
                                {mode === "login" ? (
                                    <motion.div
                                        key="login"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.25 }}
                                        className="space-y-4"
                                    >
                                        <div className="mb-6">
                                            <h3 className="text-2xl font-bold text-white mb-1">Welcome back</h3>
                                            <p className="text-stone-400 text-sm">Log in to access your fresh deliveries.</p>
                                        </div>

                                        <FloatingInput
                                            id="login-email"
                                            label="Email address"
                                            value={loginEmail}
                                            onChange={(v) => { setLoginEmail(v); setLoginErrors((e) => ({ ...e, email: undefined })); }}
                                            error={loginErrors.email}
                                            rightIcon={emailValidIcon(loginEmail)}
                                        />
                                        <FloatingInput
                                            id="login-password"
                                            label="Password"
                                            type={showPassword ? "text" : "password"}
                                            value={loginPassword}
                                            onChange={(v) => { setLoginPassword(v); setLoginErrors((e) => ({ ...e, password: undefined })); }}
                                            error={loginErrors.password}
                                            rightIcon={eyeIcon}
                                        />

                                        {loginPassword && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="space-y-1"
                                            >
                                                <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                                                    <motion.div
                                                        className={`h-full rounded-full ${strength.color}`}
                                                        animate={{ width: `${(strength.score / 4) * 100}%` }}
                                                        transition={{ duration: 0.4 }}
                                                    />
                                                </div>
                                                {strength.label && (
                                                    <p className="text-xs text-stone-400">
                                                        Strength: <span className="font-semibold text-white">{strength.label}</span>
                                                    </p>
                                                )}
                                            </motion.div>
                                        )}

                                        <MagneticButton
                                            onClick={handleLogin}
                                            className="w-full mt-2 py-4 rounded-xl bg-lime-400 hover:bg-lime-300 text-stone-900 font-bold text-sm tracking-wide transition-colors"
                                        >
                                            {loginLoading ? (
                                                <LottieLoader size={28} className="py-0" />
                                            ) : (
                                                "Log In →"
                                            )}
                                        </MagneticButton>

                                        <div className="relative flex items-center gap-3 my-2">
                                            <div className="flex-1 h-px bg-white/10" />
                                            <span className="text-stone-500 text-xs">or continue with</span>
                                            <div className="flex-1 h-px bg-white/10" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { name: "Google", icon: "G" },
                                                { name: "Apple", icon: "🍎" },
                                            ].map((p, i) => (
                                                <motion.button
                                                    key={p.name}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.1 + i * 0.05 }}
                                                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white text-sm font-medium"
                                                >
                                                    <span className="font-bold">{p.icon}</span> {p.name}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="signup"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.25 }}
                                        className="space-y-4"
                                    >
                                        <div className="mb-6">
                                            <h3 className="text-2xl font-bold text-white mb-1">Create account</h3>
                                            <p className="text-stone-400 text-sm">Start your farm-to-table journey today.</p>
                                        </div>

                                        <FloatingInput
                                            id="signup-name"
                                            label="Full name"
                                            value={signupName}
                                            onChange={(v) => { setSignupName(v); setSignupErrors((e) => ({ ...e, name: undefined })); }}
                                            error={signupErrors.name}
                                        />
                                        <FloatingInput
                                            id="signup-email"
                                            label="Email address"
                                            value={signupEmail}
                                            onChange={(v) => { setSignupEmail(v); setSignupErrors((e) => ({ ...e, email: undefined })); }}
                                            error={signupErrors.email}
                                            rightIcon={emailValidIcon(signupEmail)}
                                        />
                                        <FloatingInput
                                            id="signup-password"
                                            label="Password"
                                            type={showPassword ? "text" : "password"}
                                            value={signupPassword}
                                            onChange={(v) => { setSignupPassword(v); setSignupErrors((e) => ({ ...e, password: undefined })); }}
                                            error={signupErrors.password}
                                            rightIcon={eyeIcon}
                                        />

                                        {signupPassword && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="space-y-1"
                                            >
                                                <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                                                    <motion.div
                                                        className={`h-full rounded-full ${strength.color}`}
                                                        animate={{ width: `${(strength.score / 4) * 100}%` }}
                                                        transition={{ duration: 0.4 }}
                                                    />
                                                </div>
                                                {strength.label && (
                                                    <p className="text-xs text-stone-400">
                                                        Strength: <span className="font-semibold text-white">{strength.label}</span>
                                                    </p>
                                                )}
                                            </motion.div>
                                        )}

                                        <MagneticButton
                                            onClick={handleSignup}
                                            className="w-full mt-2 py-4 rounded-xl bg-lime-400 hover:bg-lime-300 text-stone-900 font-bold text-sm tracking-wide transition-colors"
                                        >
                                            {signupLoading ? (
                                                <LottieLoader size={28} className="py-0" />
                                            ) : (
                                                "Create Account →"
                                            )}
                                        </MagneticButton>

                                        <p className="text-center text-xs text-stone-500">
                                            By signing up, you agree to our{" "}
                                            <span className="text-lime-400 hover:underline cursor-pointer">Terms</span> &{" "}
                                            <span className="text-lime-400 hover:underline cursor-pointer">Privacy Policy</span>.
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
