"use client";

import { motion } from "framer-motion";

interface CTASectionProps {
    onStartOrder?: () => void;
}

export default function CTASection({ onStartOrder }: CTASectionProps) {
    return (
        <section className="relative py-32 px-6 overflow-hidden min-h-[600px] flex items-center justify-center">
            {/* Background Image with subtle zoom */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    initial={{ scale: 1.1 }}
                    whileInView={{ scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2500&auto=format&fit=crop')`,
                    }}
                />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-stone-900/50" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <span className="inline-block px-4 py-1.5 mb-6 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white/90 text-xs font-bold tracking-[0.2em] uppercase">
                        Join the Movement
                    </span>

                    <h2 className="text-5xl md:text-7xl font-bold text-white font-serif mb-8 leading-tight">
                        Eat fresh. <br />
                        <span className="text-lime-400">Live better.</span>
                    </h2>

                    <p className="text-lg md:text-xl text-stone-200 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
                        Connect directly with local farmers and get the season's best harvest delivered to your doorstep. No middlemen, just pure freshness.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={onStartOrder}
                            className="group relative px-8 py-4 bg-lime-400 hover:bg-lime-500 text-stone-900 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(163,230,53,0.3)]"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Start Your Order
                                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </span>
                        </button>

                        <button className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full font-bold text-lg transition-all border border-white/10 hover:border-white/30">
                            Our Farmers
                        </button>
                    </div>

                    <div className="mt-12 flex items-center justify-center gap-8 opacity-80">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-stone-800 bg-stone-700 overflow-hidden">
                                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                        <div className="text-left text-sm text-stone-300">
                            <div className="font-bold text-white">5,000+</div>
                            <div>Happy Families</div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
