"use client";

import { useScroll, motion, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NavbarProps {
    onGetStarted?: () => void;
}

export default function Navbar({ onGetStarted }: NavbarProps) {
    const { scrollY } = useScroll();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [lastScrollY, setLastScrollY] = useState(0);

    useMotionValueEvent(scrollY, "change", (latest) => {
        const currentScrollY = latest;

        if (currentScrollY > 50 && !isScrolled) setIsScrolled(true);
        if (currentScrollY <= 50 && isScrolled) setIsScrolled(false);

        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setIsHidden(true);
        } else {
            setIsHidden(false);
        }
        setLastScrollY(currentScrollY);
    });

    return (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center py-4 pointer-events-none">
            <motion.nav
                className={cn(
                    "pointer-events-auto flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-full border transition-all duration-500",
                    isScrolled
                        ? "bg-white/40 backdrop-blur-xl border-white/30 shadow-lg shadow-black/5"
                        : "bg-transparent border-transparent"
                )}
                initial={{ y: -100, opacity: 0 }}
                animate={{
                    y: isHidden ? -100 : 0,
                    opacity: isHidden ? 0 : 1,
                    width: isScrolled ? "auto" : "95%"
                }}
                transition={{ duration: 0.5, type: "spring", damping: 20, stiffness: 100 }}
                style={{ maxWidth: "1200px" }}
            >
                {/* Logo Section */}
                <div className="flex items-center gap-2 mr-4 md:mr-8">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-lime-300 to-green-500 flex items-center justify-center shadow-inner">
                        <img
                            src="https://cdn.brandfetch.io/sprouts.com/w/400/h/400"
                            alt="Brand Logo"
                            className="h-5 w-5 object-contain mix-blend-multiply opacity-90"
                        />
                    </div>
                    <span className={cn(
                        "text-sm font-bold tracking-tight transition-colors duration-300 hidden md:block",
                        isScrolled ? "text-stone-800" : "text-stone-900"
                    )}>
                        FARMER WEB
                    </span>
                </div>

                {/* Navigation Links */}
                <div className="hidden md:flex items-center justify-center gap-1">
                    {["Our Farmers", "Produce", "Seasonality", "About"].map((item) => (
                        <a
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className={cn(
                                "relative px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-300 hover:bg-stone-900/5",
                                isScrolled ? "text-stone-600 hover:text-stone-900" : "text-stone-700 hover:text-stone-950"
                            )}
                        >
                            {item}
                        </a>
                    ))}
                </div>

                <div className="flex-1 md:hidden" />

                {/* CTA Button */}
                <button
                    onClick={onGetStarted}
                    className={cn(
                        "ml-4 md:ml-8 px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg",
                        isScrolled
                            ? "bg-stone-900 text-stone-50 hover:bg-black ring-1 ring-stone-900/5"
                            : "bg-stone-900/90 text-[#f5f1ea] hover:bg-stone-900 backdrop-blur-sm"
                    )}
                >
                    Get Started
                </button>
            </motion.nav>
        </div>
    );
}