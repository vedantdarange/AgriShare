"use client";

import { useRef, useEffect } from "react";
import { useInView, animate, motion, useScroll, useTransform } from "framer-motion";

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
    const nodeRef = useRef<HTMLSpanElement>(null);
    const isInView = useInView(nodeRef, { once: true, margin: "-100px" });

    useEffect(() => {
        if (isInView) {
            const node = nodeRef.current;
            const controls = animate(0, to, {
                duration: 2.5,
                ease: "easeOut",
                onUpdate(value) {
                    if (node) node.textContent = Math.floor(value).toLocaleString() + suffix;
                },
            });
            return () => controls.stop();
        }
    }, [isInView, to, suffix]);

    return <span ref={nodeRef} className="tabular-nums">0{suffix}</span>;
}

export default function TrustSection() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [-100, 100]);

    return (
        <section ref={containerRef} className="py-32 px-6 bg-stone-100 overflow-hidden relative" id="about">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

                {/* Parallax Image Grid */}
                <div className="relative h-[600px] w-full hidden md:block">
                    <motion.div style={{ y }} className="absolute inset-0 grid grid-cols-2 gap-4">
                        <div className="bg-stone-300 rounded-2xl overflow-hidden h-[80%] mt-auto translate-y-12">
                            <img src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover" alt="Farm" />
                        </div>
                        <div className="bg-stone-300 rounded-2xl overflow-hidden h-[90%]">
                            <img src="https://images.unsplash.com/photo-1605000797499-95a51c5269ae?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover" alt="Farmer" />
                        </div>
                    </motion.div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-heading mb-6">
                        Trusted by the Community.
                    </h2>
                    <p className="text-stone-600 mb-12 text-lg">
                        We connect you directly with the people who grow your food. Minimal travel, maximum flavor, and fair wages for every farmer.
                    </p>

                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <div className="text-4xl font-bold text-[#d97706] mb-2">
                                <Counter to={500} suffix="+" />
                            </div>
                            <div className="text-sm font-medium text-stone-500 uppercase tracking-wide">Partner Farms</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-[#d97706] mb-2">
                                <Counter to={12000} suffix="" />
                            </div>
                            <div className="text-sm font-medium text-stone-500 uppercase tracking-wide">Products Delivered</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-[#d97706] mb-2">
                                <Counter to={100} suffix="%" />
                            </div>
                            <div className="text-sm font-medium text-stone-500 uppercase tracking-wide">Organic Verified</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-[#d97706] mb-2">
                                <Counter to={25} suffix="" />
                            </div>
                            <div className="text-sm font-medium text-stone-500 uppercase tracking-wide">Cities Served</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
