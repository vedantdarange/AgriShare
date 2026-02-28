"use client";

import { useEffect, useRef, useState } from "react";
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
    useMotionValue,
    useMotionValueEvent,
    AnimatePresence,
} from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─── BUILDING SVGs ────────────────────────────────────────────────────────────

const FarmBuildingSVG = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x - 13}, ${y - 14})`}>
        {/* Crop rows */}
        <rect x="0" y="18" width="26" height="7" rx="1" fill="#86efac" />
        {[2, 5, 8, 11, 14, 17, 20, 23].map((cx) => (
            <line key={cx} x1={cx} y1="18" x2={cx} y2="25" stroke="#4ade80" strokeWidth="0.5" />
        ))}
        {/* Farmhouse */}
        <rect x="7" y="7" width="12" height="11" fill="#fef9c3" stroke="#ca8a04" strokeWidth="0.6" />
        {/* Gambrel roof */}
        <polygon points="5,7 10,3 13,1 16,3 21,7" fill="#b45309" stroke="#92400e" strokeWidth="0.5" />
        {/* Chimney */}
        <rect x="16" y="1" width="2.5" height="4" fill="#57534e" stroke="#44403c" strokeWidth="0.3" />
        <rect x="15.5" y="0.5" width="3.5" height="1" fill="#78716c" />
        {/* Smoke */}
        <path d="M17.2 0.5 Q18 -1.5 16.5 -3 Q15 -4.5 16.5 -6" fill="none" stroke="#e5e7eb" strokeWidth="0.6" strokeLinecap="round" opacity="0.7" />
        {/* Door */}
        <rect x="11" y="13" width="4" height="5" rx="0.5" fill="#92400e" />
        <circle cx="14.5" cy="15.5" r="0.4" fill="#fbbf24" />
        {/* Windows */}
        <rect x="8" y="9" width="3" height="2.5" rx="0.3" fill="#bae6fd" stroke="#7dd3fc" strokeWidth="0.3" />
        <line x1="9.5" y1="9" x2="9.5" y2="11.5" stroke="#7dd3fc" strokeWidth="0.2" />
        <rect x="15" y="9" width="3" height="2.5" rx="0.3" fill="#bae6fd" stroke="#7dd3fc" strokeWidth="0.3" />
        <line x1="16.5" y1="9" x2="16.5" y2="11.5" stroke="#7dd3fc" strokeWidth="0.2" />
        {/* Grain silo */}
        <rect x="21" y="5" width="3.5" height="13" rx="0.3" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="0.4" />
        <ellipse cx="22.75" cy="5" rx="1.75" ry="1" fill="#d1d5db" />
        {/* Pine tree */}
        <rect x="1" y="12" width="1" height="6" fill="#78350f" />
        <polygon points="1.5,3 -1,12 4,12" fill="#15803d" />
        <polygon points="1.5,6 -0.5,12 3.5,12" fill="#166534" />
        {/* Fence posts */}
        {[0, 3, 6].map((fx) => (
            <rect key={fx} x={fx} y="23" width="0.7" height="3" fill="#d97706" />
        ))}
        <line x1="0.35" y1="24" x2="6.35" y2="24" stroke="#d97706" strokeWidth="0.4" />
        <line x1="0.35" y1="25.5" x2="6.35" y2="25.5" stroke="#d97706" strokeWidth="0.4" />
    </g>
);

const BarnBuildingSVG = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x - 11}, ${y - 13})`}>
        {/* Ground */}
        <rect x="0" y="19" width="22" height="2.5" rx="0.5" fill="#86efac" />
        {/* Main barn body */}
        <rect x="2" y="9" width="18" height="10" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="0.6" />
        {/* Gambrel roof */}
        <polygon points="0,9 5,4.5 11,2 17,4.5 22,9" fill="#7f1d1d" stroke="#450a0a" strokeWidth="0.5" />
        <polygon points="4,9 7,5.5 11,3.5 15,5.5 18,9" fill="#991b1b" />
        {/* Loft window */}
        <path d="M9 3.5 L11 2 L13 3.5 L13 6 L9 6 Z" fill="#1c1917" />
        {/* Barn doors with X brace */}
        <rect x="5" y="13" width="5" height="6" fill="#9f1239" stroke="#7f1d1d" strokeWidth="0.4" />
        <rect x="11" y="13" width="5" height="6" fill="#9f1239" stroke="#7f1d1d" strokeWidth="0.4" />
        <line x1="5" y1="13" x2="10" y2="19" stroke="#7f1d1d" strokeWidth="0.8" />
        <line x1="10" y1="13" x2="5" y2="19" stroke="#7f1d1d" strokeWidth="0.8" />
        <line x1="11" y1="13" x2="16" y2="19" stroke="#7f1d1d" strokeWidth="0.8" />
        <line x1="16" y1="13" x2="11" y2="19" stroke="#7f1d1d" strokeWidth="0.8" />
        {/* Side window */}
        <rect x="3" y="11" width="2" height="1.5" rx="0.2" fill="#fde68a" stroke="#f59e0b" strokeWidth="0.2" />
        <rect x="17" y="11" width="2" height="1.5" rx="0.2" fill="#fde68a" stroke="#f59e0b" strokeWidth="0.2" />
        {/* Hay bales stacked */}
        <rect x="18" y="16" width="4" height="3" rx="0.5" fill="#fbbf24" stroke="#d97706" strokeWidth="0.3" />
        <rect x="18" y="13" width="4" height="3" rx="0.5" fill="#fcd34d" stroke="#d97706" strokeWidth="0.3" />
        {/* Binding lines on hay */}
        <line x1="20" y1="16" x2="20" y2="19" stroke="#d97706" strokeWidth="0.3" />
        <line x1="20" y1="13" x2="20" y2="16" stroke="#d97706" strokeWidth="0.3" />
        {/* Weathervane */}
        <line x1="11" y1="2" x2="11" y2="-1" stroke="#9ca3af" strokeWidth="0.4" />
        <line x1="9" y1="-0.5" x2="13" y2="-0.5" stroke="#9ca3af" strokeWidth="0.4" />
        <polygon points="13,-0.5 11.5,-1.5 11.5,0.5" fill="#6b7280" />
    </g>
);

const WarehouseBuildingSVG = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x - 14}, ${y - 11})`}>
        {/* Ground/road apron */}
        <rect x="0" y="17" width="28" height="2" rx="0.5" fill="#e5e7eb" />
        {/* Building shadow */}
        <rect x="1" y="5" width="26" height="13" rx="0.5" fill="#1f2937" opacity="0.08" transform="translate(1,1)" />
        {/* Main structure */}
        <rect x="0" y="4" width="26" height="13" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="0.6" />
        {/* Barrel-vault roof */}
        <path d="M 0 4 Q 13 -1.5 26 4" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="0.6" />
        {/* Roof ridge */}
        <line x1="13" y1="0" x2="13" y2="4" stroke="#9ca3af" strokeWidth="0.4" />
        {/* Three roller shutters */}
        {[1, 9.5, 18].map((dx) => (
            <g key={dx}>
                <rect x={dx} y="10" width="6" height="7" rx="0.3" fill="#9ca3af" stroke="#6b7280" strokeWidth="0.4" />
                {[10.5, 11.5, 12.5, 13.5, 14.5, 15.5, 16.5].map((dy) => (
                    <line key={dy} x1={dx} y1={dy} x2={dx + 6} y2={dy} stroke="#6b7280" strokeWidth="0.2" />
                ))}
                {/* Handle */}
                <line x1={dx + 2} y1="17" x2={dx + 4} y2="17" stroke="#374151" strokeWidth="0.5" />
            </g>
        ))}
        {/* High windows */}
        {[1, 9.5, 18].map((dx) => (
            <rect key={dx} x={dx} y="5" width="6" height="3.5" rx="0.3" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="0.3" />
        ))}
        {/* Loading dock platform */}
        <rect x="8" y="15.5" width="10" height="1.5" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="0.3" />
        {/* Forklift-ish shape */}
        <rect x="23" y="13" width="3" height="4" rx="0.3" fill="#fbbf24" />
        <line x1="22" y1="14" x2="22" y2="17" stroke="#9ca3af" strokeWidth="0.6" />
        {/* Chimney / ventilation */}
        <rect x="6" y="0" width="1.5" height="3" fill="#6b7280" />
        <rect x="18.5" y="0" width="1.5" height="3" fill="#6b7280" />
    </g>
);

const MarketBuildingSVG = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x - 11}, ${y - 14})`}>
        {/* Ground */}
        <rect x="0" y="20" width="22" height="2.5" rx="0.5" fill="#d1fae5" />
        {/* Paviment tiles */}
        {[0, 4, 8, 12, 16, 20].map((tx) => (
            <line key={tx} x1={tx} y1="20" x2={tx} y2="22.5" stroke="#a7f3d0" strokeWidth="0.3" />
        ))}
        {/* Shop body */}
        <rect x="1" y="9" width="20" height="11" fill="#fffbeb" stroke="#f59e0b" strokeWidth="0.6" />
        {/* Sign board */}
        <rect x="0" y="3" width="22" height="6" rx="0.5" fill="#15803d" stroke="#14532d" strokeWidth="0.5" />
        <text x="11" y="7.2" textAnchor="middle" fontSize="2.8" fill="white" fontWeight="bold" fontFamily="serif">FRESH MARKET</text>
        {/* Striped awning */}
        <path d="M 1 9 Q 3.5 12 5.5 9 Q 8 12 10 9 Q 12.5 12 14.5 9 Q 17 12 19 9 Q 20.5 11 21 9"
            fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        {/* Large display window */}
        <rect x="2" y="11" width="18" height="5.5" rx="0.3" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="0.4" />
        {/* Produce display */}
        {[
            { cx: 4.5, cy: 13, r: 0.9, fill: "#ef4444" },
            { cx: 6.5, cy: 13.5, r: 0.9, fill: "#f97316" },
            { cx: 8.5, cy: 13, r: 1, fill: "#84cc16" },
            { cx: 10.5, cy: 13.5, r: 0.8, fill: "#facc15" },
            { cx: 12.5, cy: 13, r: 0.9, fill: "#a78bfa" },
            { cx: 14.5, cy: 13.5, r: 0.9, fill: "#f43f5e" },
            { cx: 16.5, cy: 13, r: 0.8, fill: "#fb923c" },
            { cx: 18.5, cy: 13.5, r: 0.7, fill: "#4ade80" },
        ].map((c, i) => (
            <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill={c.fill} />
        ))}
        {/* Door */}
        <rect x="8.5" y="16" width="5" height="4" rx="0.5" fill="#92400e" stroke="#78350f" strokeWidth="0.3" />
        <circle cx="13" cy="18" r="0.5" fill="#d97706" />
        {/* Fairy lights */}
        {[1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21].map((lx) => (
            <circle key={lx} cx={lx} cy="8.8" r="0.5" fill={["#fde68a", "#fca5a5", "#a5f3fc"][lx % 3]} />
        ))}
        {/* A-frame sign on ground */}
        <path d="M4 20 L5.5 22.5 M7 20 L5.5 22.5" stroke="#d97706" strokeWidth="0.5" />
        <rect x="4.2" y="21" width="2.6" height="1" rx="0.2" fill="#fef9c3" stroke="#d97706" strokeWidth="0.2" />
    </g>
);

const HomeBuildingSVG = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x - 12}, ${y - 15})`}>
        {/* Garden */}
        <rect x="0" y="20" width="24" height="3.5" rx="0.5" fill="#86efac" />
        {/* Garden path */}
        <rect x="9.5" y="20" width="5" height="3.5" fill="#d6d3d1" />
        {/* Flowers */}
        {[1.5, 20.5].map((fx) => (
            <g key={fx}>
                <line x1={fx + 0.5} y1="20" x2={fx + 0.5} y2="17.5" stroke="#16a34a" strokeWidth="0.5" />
                <circle cx={fx + 0.5} cy="17" r="1" fill="#f472b6" />
                <circle cx={fx} cy="17.5" r="0.7" fill="#fb7185" />
                <circle cx={fx + 1} cy="17.5" r="0.7" fill="#fda4af" />
            </g>
        ))}
        {/* House shadow */}
        <rect x="4" y="10" width="16" height="11" rx="0.5" fill="#1c1917" opacity="0.06" transform="translate(1,1)" />
        {/* House body */}
        <rect x="3" y="9" width="16" height="11" fill="#fef9c3" stroke="#ca8a04" strokeWidth="0.6" />
        {/* Pitched roof */}
        <polygon points="1,9 11,2 23,9" fill="#b45309" stroke="#92400e" strokeWidth="0.6" />
        {/* Roof ridge cap */}
        <line x1="11" y1="2" x2="11" y2="9" stroke="#92400e" strokeWidth="0.4" />
        {/* Chimney */}
        <rect x="15.5" y="3" width="3" height="5" fill="#57534e" stroke="#44403c" strokeWidth="0.4" />
        <rect x="15" y="2.5" width="4" height="1" fill="#6b7280" />
        {/* Smoke */}
        <path d="M17 2.5 Q18 0.5 16.5 -1 Q15 -2.5 16.5 -4" fill="none" stroke="#e5e7eb" strokeWidth="0.7" strokeLinecap="round" opacity="0.7" />
        {/* Front door with arch */}
        <rect x="9" y="14.5" width="5" height="5.5" rx="0.5" fill="#92400e" />
        <path d="M9 14.5 Q11.5 12.5 14 14.5" fill="#7c2d12" />
        <circle cx="13.5" cy="17" r="0.5" fill="#fbbf24" />
        <line x1="11.5" y1="14.5" x2="11.5" y2="20" stroke="#78350f" strokeWidth="0.3" />
        {/* Left window */}
        <rect x="4" y="11" width="4" height="3.5" rx="0.3" fill="#bae6fd" stroke="#7dd3fc" strokeWidth="0.4" />
        <line x1="6" y1="11" x2="6" y2="14.5" stroke="#7dd3fc" strokeWidth="0.3" />
        <line x1="4" y1="12.75" x2="8" y2="12.75" stroke="#7dd3fc" strokeWidth="0.3" />
        {/* Right window */}
        <rect x="16" y="11" width="4" height="3.5" rx="0.3" fill="#bae6fd" stroke="#7dd3fc" strokeWidth="0.4" />
        <line x1="18" y1="11" x2="18" y2="14.5" stroke="#7dd3fc" strokeWidth="0.3" />
        <line x1="16" y1="12.75" x2="20" y2="12.75" stroke="#7dd3fc" strokeWidth="0.3" />
        {/* Garage */}
        <rect x="3" y="15" width="4" height="5" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="0.4" />
        {[15.5, 16.5, 17.5, 18.5, 19.5].map((dy) => (
            <line key={dy} x1="3" y1={dy} x2="7" y2={dy} stroke="#9ca3af" strokeWidth="0.2" />
        ))}
        {/* Mature oak */}
        <rect x="20" y="13" width="1.2" height="7" fill="#78350f" />
        <circle cx="20.6" cy="10" r="3.5" fill="#15803d" />
        <circle cx="19" cy="12" r="2.3" fill="#166534" />
        <circle cx="22" cy="12" r="2" fill="#14532d" />
        {/* Mailbox */}
        <rect x="0.5" y="17" width="2.5" height="2" rx="0.4" fill="#6b7280" />
        <rect x="0.8" y="15.5" width="0.6" height="1.8" fill="#4b5563" />
        <path d="M0.5 18 Q1.75 16.5 3 18" fill="#9ca3af" stroke="#6b7280" strokeWidth="0.2" />
    </g>
);

// ─── TREE / FOLIAGE DECORATIONS ───────────────────────────────────────────────

const Tree = ({ x, y, scale = 1, variant = 0 }: { x: number; y: number; scale?: number; variant?: number }) => {
    const fills = [["#15803d", "#166534"], ["#1a643a", "#14532d"], ["#16a34a", "#15803d"]];
    const [light, dark] = fills[variant % 3];
    return (
        <g transform={`translate(${x}, ${y}) scale(${scale})`}>
            {variant === 0 ? (
                <>
                    <rect x="-0.6" y="0" width="1.2" height="3.5" fill="#78350f" />
                    <polygon points="0,-1.5 -3,3 3,3" fill={light} />
                    <polygon points="0,-4 -2,0.5 2,0.5" fill={dark} />
                </>
            ) : (
                <>
                    <rect x="-0.5" y="0" width="1" height="3" fill="#92400e" />
                    <circle cx="0" cy="-1.5" r="2.5" fill={light} />
                    <circle cx="-1" cy="0" r="1.8" fill={dark} />
                </>
            )}
        </g>
    );
};

// ─── BICYCLE SVG ──────────────────────────────────────────────────────────────

const BicycleSVG = ({ className, wheelRotation }: { className?: string; wheelRotation: number }) => (
    <svg className={className} viewBox="0 0 120 80" fill="none">
        <ellipse cx="60" cy="72" rx="35" ry="4" fill="#292524" opacity="0.2" />
        {[{ cx: 25, origin: "25px 60px" }, { cx: 95, origin: "95px 60px" }].map(({ cx, origin }) => (
            <g key={cx} style={{ transform: `rotate(${wheelRotation}deg)`, transformOrigin: origin }}>
                <circle cx={cx} cy="60" r="18" stroke="#78716c" strokeWidth="3" fill="#f5f5f4" fillOpacity="0.05" />
                <circle cx={cx} cy="60" r="2" fill="#57534e" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                    <line key={a} x1={cx} y1="60"
                        x2={cx + 15 * Math.cos((a * Math.PI) / 180)}
                        y2={60 + 15 * Math.sin((a * Math.PI) / 180)}
                        stroke="#a8a29e" strokeWidth="1.2" />
                ))}
            </g>
        ))}
        {/* Frame */}
        <path d="M25 60 L45 30 L75 30 L95 60 M45 30 L35 50 M75 30 L65 50"
            stroke="#e7e5e4" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M45 30 L55 20 L75 30" stroke="#e7e5e4" strokeWidth="3" strokeLinecap="round" />
        {/* Seat */}
        <path d="M35 20 Q35 17.5 40 17.5 L50 17.5 Q55 17.5 55 20" stroke="#57534e" strokeWidth="3.5" fill="none" />
        {/* Handlebars */}
        <path d="M70 20 Q76 13.5 82 17 L87 19" stroke="#57534e" strokeWidth="3" fill="none" />
        {/* Wicker basket */}
        <rect x="65" y="21" width="22" height="13" rx="2" fill="#fef3c7" stroke="#a16207" strokeWidth="2" />
        {[25.5, 29, 32.5].map((dy) => (
            <line key={dy} x1="67" y1={dy} x2="85" y2={dy} stroke="#a16207" strokeWidth="0.8" />
        ))}
        {/* Produce */}
        <circle cx="72" cy="19" r="3.5" fill="#84cc16" />
        <circle cx="79" cy="18.5" r="3" fill="#f97316" />
        <ellipse cx="75.5" cy="17" rx="2.5" ry="3.5" fill="#16a34a" />
        {/* Rider */}
        <circle cx="50" cy="14" r="4.5" fill="#d6d3d1" />
        <path d="M50 18.5 L47 29 L53 29 Z" fill="#a8a29e" />
        {/* Straw hat */}
        <ellipse cx="50" cy="11" rx="7" ry="2.5" fill="#eab308" />
        <ellipse cx="50" cy="10" rx="4" ry="2" fill="#ca8a04" />
    </svg>
);

// ─── DATA ─────────────────────────────────────────────────────────────────────

const waypoints = [
    {
        id: "harvest",
        title: "Dawn Harvest",
        subtitle: "The Beginning",
        description: "At 4 AM, our farmers hand-pick produce at peak ripeness while the dew still clings to each leaf.",
        color: "#f59e0b",
        bgGradient: "from-amber-500/20 to-orange-500/20",
        position: { x: 50, y: 7 },
        Building: FarmBuildingSVG,
        bx: 74, by: 10,      // building center
        skyColors: ["#fef3c7", "#fed7aa"],
    },
    {
        id: "barn",
        title: "The Packing Barn",
        subtitle: "Quality & Care",
        description: "Within 2 hours, produce is washed, sorted, and packed in our temperature-controlled barn.",
        color: "#b45309",
        bgGradient: "from-amber-700/20 to-yellow-600/20",
        position: { x: 20, y: 28 },
        Building: BarnBuildingSVG,
        bx: 5, by: 30,
        skyColors: ["#fef9c3", "#fde68a"],
    },
    {
        id: "road",
        title: "Country Roads",
        subtitle: "The Journey",
        description: "Winding through scenic farmland, keeping produce pristine and fresh on every mile.",
        color: "#65a30d",
        bgGradient: "from-lime-600/20 to-green-500/20",
        position: { x: 78, y: 50 },
        Building: WarehouseBuildingSVG,
        bx: 85, by: 53,
        skyColors: ["#d9f99d", "#bbf7d0"],
    },
    {
        id: "market",
        title: "Town Market",
        subtitle: "Community Hub",
        description: "Supporting local businesses — some deliveries nourish neighborhood markets first.",
        color: "#059669",
        bgGradient: "from-emerald-600/20 to-teal-500/20",
        position: { x: 22, y: 72 },
        Building: MarketBuildingSVG,
        bx: 8, by: 74,
        skyColors: ["#a7f3d0", "#6ee7b7"],
    },
    {
        id: "home",
        title: "Your Doorstep",
        subtitle: "Farm to Table",
        description: "Direct delivery in under 24 hours. Unpack and taste the difference of true freshness.",
        color: "#0d9488",
        bgGradient: "from-teal-600/20 to-cyan-500/20",
        position: { x: 50, y: 92 },
        Building: HomeBuildingSVG,
        bx: 74, by: 91,
        skyColors: ["#99f6e4", "#67e8f9"],
    },
];

// S-curve bezier path connecting all waypoints
const ROAD_PATH = (() => {
    const [p0, p1, p2, p3, p4] = waypoints.map((w) => w.position);
    return [
        `M ${p0.x} ${p0.y}`,
        `C ${p0.x + 42} ${p0.y + 2}, ${p1.x + 35} ${p1.y - 6}, ${p1.x} ${p1.y}`,
        `C ${p1.x - 30} ${p1.y + 6}, ${p2.x - 38} ${p2.y - 6}, ${p2.x} ${p2.y}`,
        `C ${p2.x + 28} ${p2.y + 6}, ${p3.x + 36} ${p3.y - 6}, ${p3.x} ${p3.y}`,
        `C ${p3.x - 26} ${p3.y + 6}, ${p4.x - 20} ${p4.y - 6}, ${p4.x} ${p4.y}`,
    ].join(" ");
})();

const TREES: Array<{ x: number; y: number; s: number; v: number }> = [
    { x: 8, y: 15, s: 0.7, v: 0 }, { x: 88, y: 10, s: 0.8, v: 1 },
    { x: 5, y: 38, s: 0.65, v: 0 }, { x: 90, y: 33, s: 0.7, v: 1 },
    { x: 11, y: 58, s: 0.75, v: 0 }, { x: 85, y: 60, s: 0.6, v: 1 },
    { x: 7, y: 82, s: 0.8, v: 0 }, { x: 88, y: 79, s: 0.65, v: 1 },
    { x: 40, y: 18, s: 0.5, v: 1 }, { x: 62, y: 32, s: 0.55, v: 0 },
    { x: 35, y: 60, s: 0.5, v: 1 }, { x: 65, y: 78, s: 0.55, v: 0 },
    { x: 15, y: 47, s: 0.6, v: 0 }, { x: 80, y: 42, s: 0.55, v: 1 },
];

const PARTICLES = [
    { left: 23, top: 53, dx: 12, dur: 7.2, delay: 0.0 },
    { left: 73, top: 40, dx: -8, dur: 9.1, delay: 0.8 },
    { left: 55, top: 20, dx: 14, dur: 6.5, delay: 1.6 },
    { left: 26, top: 58, dx: -10, dur: 8.3, delay: 2.4 },
    { left: 83, top: 70, dx: 7, dur: 7.8, delay: 3.2 },
    { left: 34, top: 49, dx: -13, dur: 9.5, delay: 0.4 },
    { left: 18, top: 35, dx: 11, dur: 6.9, delay: 1.2 },
    { left: 61, top: 63, dx: -6, dur: 8.7, delay: 2.0 },
    { left: 45, top: 85, dx: 9, dur: 7.3, delay: 0.6 },
    { left: 72, top: 22, dx: -12, dur: 8.1, delay: 1.8 },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function DeliveryJourney() {
    const containerRef = useRef<HTMLDivElement>(null);
    const pathRef = useRef<SVGPathElement>(null);
    const prevProgressRef = useRef(0);

    const [activeWaypoint, setActiveWaypoint] = useState(0);
    const [wheelRotation, setWheelRotation] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 60,
        damping: 20,
        restDelta: 0.001,
    });

    // Motion values for rider — no React re-renders on position update
    const riderX = useMotionValue(waypoints[0].position.x);
    const riderY = useMotionValue(waypoints[0].position.y);
    const riderScaleX = useMotionValue(1);
    const pathLength = useTransform(smoothProgress, [0, 1], [0, 1]);

    const riderLeft = useTransform(riderX, (v) => `${v}%`);
    const riderTop = useTransform(riderY, (v) => `${v}%`);

    // Track rider along path
    useMotionValueEvent(smoothProgress, "change", (latest) => {
        if (!pathRef.current) return;

        const totalLen = pathRef.current.getTotalLength();
        const clamped = Math.max(0, Math.min(1, latest));
        const pt = pathRef.current.getPointAtLength(totalLen * clamped);
        const ahead = pathRef.current.getPointAtLength(
            Math.min(totalLen * clamped + 1.5, totalLen)
        );

        riderX.set(pt.x);
        riderY.set(pt.y);

        // Flip horizontally if going left
        const goingLeft = ahead.x < pt.x;
        riderScaleX.set(goingLeft ? -1 : 1);

        // Wheel rotation proportional to distance traveled
        const delta = latest - prevProgressRef.current;
        prevProgressRef.current = latest;
        setWheelRotation((prev) => prev + delta * 1800);

        // Active waypoint
        const idx = Math.round(clamped * (waypoints.length - 1));
        setActiveWaypoint(Math.max(0, Math.min(waypoints.length - 1, idx)));
    });

    useEffect(() => {
        setIsLoaded(true);

        if (!containerRef.current) return;
        waypoints.forEach((_, index) => {
            const pct = (index / (waypoints.length - 1)) * 85;
            ScrollTrigger.create({
                trigger: containerRef.current,
                start: `${Math.max(0, pct - 8)}% center`,
                end: `${pct + 12}% center`,
                onEnter: () => setActiveWaypoint(index),
                onEnterBack: () => setActiveWaypoint(Math.max(0, index - 1)),
            });
        });

        return () => ScrollTrigger.getAll().forEach((st) => st.kill());
    }, []);

    const activeWp = waypoints[activeWaypoint];

    // Sky gradient interpolation
    const skyGrad = `linear-gradient(180deg, ${activeWp.skyColors[0]} 0%, ${activeWp.skyColors[1]} 40%, #f5f1ea 100%)`;

    return (
        <section ref={containerRef} className="relative" style={{ height: "500vh" }}>
            {/* Scroll progress bar */}
            <div className="fixed top-0 left-0 right-0 h-[3px] bg-stone-200 z-50">
                <motion.div
                    className="h-full bg-gradient-to-r from-amber-500 via-lime-500 to-teal-500"
                    style={{ scaleX: smoothProgress, transformOrigin: "left" }}
                />
            </div>

            {/* Sticky viewport */}
            <div className="sticky top-0 h-screen w-full overflow-hidden">

                {/* Sky */}
                <motion.div
                    className="absolute inset-0"
                    animate={{ background: skyGrad }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                />

                {/* Grain overlay */}
                <div
                    className="absolute inset-0 opacity-[0.025] pointer-events-none mix-blend-multiply"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    }}
                />

                {/* Floating pollen/dust particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {PARTICLES.map((p, i) => (
                        <motion.div
                            key={i}
                            className="absolute rounded-full"
                            style={{
                                width: 4 + (i % 3),
                                height: 4 + (i % 2),
                                backgroundColor: activeWp.color,
                                left: `${p.left}%`,
                                top: `${p.top}%`,
                            }}
                            animate={{
                                y: [0, -45, 0],
                                x: [0, p.dx, 0],
                                opacity: [0.06, 0.35, 0.06],
                            }}
                            transition={{
                                duration: p.dur,
                                repeat: Infinity,
                                delay: p.delay,
                                ease: "easeInOut",
                            }}
                        />
                    ))}
                </div>

                {/* ── MAIN SVG CANVAS ── */}
                <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="xMidYMid meet"
                >
                    <defs>
                        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                            <feGaussianBlur stdDeviation="0.4" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <filter id="buildingShadow">
                            <feDropShadow dx="0.5" dy="0.8" stdDeviation="0.8" floodColor="#1c1917" floodOpacity="0.18" />
                        </filter>
                        <filter id="roadShadow">
                            <feDropShadow dx="0" dy="0.3" stdDeviation="0.5" floodColor="#1c1917" floodOpacity="0.25" />
                        </filter>
                    </defs>

                    {/* Background foliage trees */}
                    {TREES.map((t, i) => (
                        <Tree key={i} x={t.x} y={t.y} scale={t.s} variant={t.v} />
                    ))}

                    {/* ── ROAD LAYERS ── */}

                    {/* Dirt shoulder / ghost road (full path, subtle) */}
                    <path
                        d={ROAD_PATH}
                        fill="none"
                        stroke="#d6d3d1"
                        strokeWidth="5"
                        strokeLinecap="round"
                        opacity="0.5"
                    />

                    {/* Grass verge highlight */}
                    <path
                        d={ROAD_PATH}
                        fill="none"
                        stroke="#86efac"
                        strokeWidth="6.2"
                        strokeLinecap="round"
                        strokeDasharray="0.1 6"
                        opacity="0.3"
                    />

                    {/* Asphalt road body — drawn as path progresses */}
                    <motion.path
                        d={ROAD_PATH}
                        fill="none"
                        stroke="#1e2a35"
                        strokeWidth="4.5"
                        strokeLinecap="round"
                        filter="url(#roadShadow)"
                        style={{ pathLength }}
                    />

                    {/* Road edge lines (white) */}
                    <motion.path
                        d={ROAD_PATH}
                        fill="none"
                        stroke="white"
                        strokeWidth="4.9"
                        strokeLinecap="round"
                        strokeDasharray="0.2 4.5"
                        opacity="0.5"
                        style={{ pathLength }}
                    />

                    {/* Center line dashes (yellow) */}
                    <motion.path
                        d={ROAD_PATH}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="0.45"
                        strokeLinecap="round"
                        strokeDasharray="1.8 1.8"
                        opacity="0.9"
                        style={{ pathLength }}
                        filter="url(#glow)"
                    />

                    {/* ── BUILDINGS ── */}
                    {waypoints.map((wp) => (
                        <motion.g
                            key={wp.id}
                            filter="url(#buildingShadow)"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
                        >
                            <wp.Building x={wp.bx} y={wp.by} />
                        </motion.g>
                    ))}

                    {/* ── WAYPOINT MARKERS ── */}
                    {waypoints.map((wp, index) => {
                        const isActive = index === activeWaypoint;
                        const isPast = index < activeWaypoint;
                        return (
                            <g key={wp.id}>
                                {/* Pulse ring */}
                                {isActive && (
                                    <motion.circle
                                        cx={wp.position.x}
                                        cy={wp.position.y}
                                        r={4}
                                        fill="none"
                                        stroke={wp.color}
                                        strokeWidth="0.5"
                                        animate={{ r: [3.5, 5.5, 3.5], opacity: [0.7, 0.1, 0.7] }}
                                        transition={{ duration: 1.8, repeat: Infinity }}
                                    />
                                )}
                                {/* Pin drop shadow */}
                                <ellipse
                                    cx={wp.position.x + 0.3}
                                    cy={wp.position.y + 0.4}
                                    rx={isActive ? 2.3 : 1.6}
                                    ry={0.5}
                                    fill="#1c1917"
                                    opacity="0.15"
                                />
                                {/* Marker circle */}
                                <motion.circle
                                    cx={wp.position.x}
                                    cy={wp.position.y}
                                    r={isActive ? 2.4 : 1.7}
                                    fill={isPast || isActive ? wp.color : "#d6d3d1"}
                                    stroke="white"
                                    strokeWidth="0.6"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: index * 0.15, type: "spring", stiffness: 260 }}
                                />
                                {/* Checkmark for completed */}
                                {isPast && (
                                    <path
                                        d={`M${wp.position.x - 0.9} ${wp.position.y} L${wp.position.x - 0.2} ${wp.position.y + 0.8} L${wp.position.x + 0.9} ${wp.position.y - 0.7}`}
                                        stroke="white"
                                        strokeWidth="0.5"
                                        fill="none"
                                        strokeLinecap="round"
                                    />
                                )}
                                {/* Number for future */}
                                {!isPast && !isActive && (
                                    <text
                                        x={wp.position.x}
                                        y={wp.position.y + 0.6}
                                        textAnchor="middle"
                                        fontSize="1.6"
                                        fill="#78716c"
                                        fontWeight="bold"
                                    >
                                        {index + 1}
                                    </text>
                                )}
                                {/* Dot for active (number shown in card) */}
                                {isActive && (
                                    <circle
                                        cx={wp.position.x}
                                        cy={wp.position.y}
                                        r={0.7}
                                        fill="white"
                                    />
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* ── BICYCLE RIDER ── */}
                <motion.div
                    className="absolute z-20 pointer-events-none"
                    style={{ left: riderLeft, top: riderTop, x: "-50%", y: "-85%" }}
                >
                    <motion.div
                        style={{ scaleX: riderScaleX }}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                    >
                        {/* Speed lines */}
                        <div className="absolute top-1/2 -left-10 -translate-y-1/2 flex flex-col gap-1.5 pointer-events-none">
                            {[{ w: 24, c: "#84cc16", d: 0 }, { w: 16, c: "#d97706", d: 0.08 }, { w: 20, c: "#84cc16", d: 0.16 }].map((l, i) => (
                                <motion.div
                                    key={i}
                                    className="rounded-full"
                                    style={{ width: l.w, height: 1.5, backgroundColor: l.c }}
                                    animate={{ x: [0, -20, 0], opacity: [0, 0.65, 0] }}
                                    transition={{ duration: 0.45, repeat: Infinity, delay: l.d }}
                                />
                            ))}
                        </div>
                        <BicycleSVG className="w-32 h-24 drop-shadow-2xl" wheelRotation={wheelRotation} />
                    </motion.div>
                </motion.div>

                {/* ── INFO CARDS ── */}
                <div className="absolute inset-0 pointer-events-none">
                    <AnimatePresence mode="wait">
                        {waypoints.map((wp, index) => {
                            if (index !== activeWaypoint) return null;
                            const isLeft = index % 2 === 0;

                            return (
                                <motion.div
                                    key={wp.id}
                                    className={`absolute ${isLeft ? "left-4 lg:left-10" : "right-4 lg:right-10"} w-80 xl:w-96`}
                                    style={{ top: `${wp.position.y}%` }}
                                    initial={{ opacity: 0, x: isLeft ? -55 : 55, filter: "blur(10px)" }}
                                    animate={{ opacity: 1, x: 0, y: "-50%", filter: "blur(0px)" }}
                                    exit={{ opacity: 0, x: isLeft ? -30 : 30, filter: "blur(8px)" }}
                                    transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
                                >
                                    <div className="pointer-events-auto relative overflow-hidden rounded-2xl bg-white/75 backdrop-blur-2xl border border-white/70 shadow-2xl shadow-stone-900/15 p-7">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${wp.bgGradient} opacity-50`} />

                                        {/* Decorative blob */}
                                        <div
                                            className="absolute -bottom-10 -right-10 w-28 h-28 rounded-full opacity-20"
                                            style={{ backgroundColor: wp.color }}
                                        />

                                        <div className="relative z-10">
                                            <div className="flex items-center gap-4 mb-5">
                                                <motion.div
                                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg flex-shrink-0"
                                                    style={{ backgroundColor: wp.color }}
                                                    animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.06, 1] }}
                                                    transition={{ duration: 4, repeat: Infinity }}
                                                >
                                                    {index + 1}
                                                </motion.div>
                                                <div>
                                                    <motion.p
                                                        className="text-xs font-bold uppercase tracking-[0.18em]"
                                                        style={{ color: wp.color }}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.1 }}
                                                    >
                                                        {wp.subtitle}
                                                    </motion.p>
                                                    <h3 className="text-[1.35rem] font-bold text-stone-800 leading-snug tracking-tight">
                                                        {wp.title}
                                                    </h3>
                                                </div>
                                            </div>

                                            <motion.p
                                                className="text-stone-600 text-sm leading-relaxed"
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.18 }}
                                            >
                                                {wp.description}
                                            </motion.p>

                                            {/* Step progress */}
                                            <motion.div
                                                className="mt-5 flex items-center gap-3"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.28 }}
                                            >
                                                <div className="flex-1 h-[3px] bg-stone-200 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: wp.color }}
                                                        initial={{ width: "0%" }}
                                                        animate={{ width: "100%" }}
                                                        transition={{ duration: 3.5, ease: "linear" }}
                                                    />
                                                </div>
                                                <span className="text-xs font-semibold text-stone-400 tabular-nums">
                                                    0{index + 1} / 05
                                                </span>
                                            </motion.div>

                                            {/* Step dots */}
                                            <div className="mt-3 flex gap-1.5">
                                                {waypoints.map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className="h-1 rounded-full transition-all duration-300"
                                                        style={{
                                                            backgroundColor: i <= index ? wp.color : "#e2e8f0",
                                                            width: i === index ? 20 : 6,
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* ── NAV DOTS ── */}
                <div className="fixed right-5 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-40">
                    {waypoints.map((wp, i) => (
                        <motion.button
                            key={wp.id}
                            className="group flex items-center justify-end gap-2"
                            whileHover={{ scale: 1.15 }}
                            onClick={() => {
                                const el = containerRef.current;
                                if (!el) return;
                                const ratio = i / (waypoints.length - 1);
                                window.scrollTo({
                                    top: el.offsetTop + ratio * (el.scrollHeight - window.innerHeight),
                                    behavior: "smooth",
                                });
                            }}
                        >
                            <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-xs font-semibold text-stone-600 bg-white/85 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap">
                                {wp.title}
                            </span>
                            <motion.div
                                className="w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm transition-colors duration-300"
                                style={{ backgroundColor: i === activeWaypoint ? wp.color : "#cbd5e1" }}
                                animate={i === activeWaypoint ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                                transition={{ duration: 1.6, repeat: Infinity }}
                            />
                        </motion.button>
                    ))}
                </div>

                {/* ── SCROLL INDICATOR ── */}
                <motion.div
                    className="fixed bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-stone-400 z-40"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 12 }}
                    transition={{ delay: 1 }}
                >
                    <span className="text-[10px] uppercase tracking-[0.22em] font-semibold">Scroll to follow</span>
                    <motion.div
                        className="w-5 h-9 border-2 border-stone-300 rounded-full flex justify-center pt-1"
                        animate={{ y: [0, 4, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <motion.div
                            className="w-1 h-2 bg-lime-500 rounded-full"
                            animate={{ y: [0, 10, 0], opacity: [1, 0.3, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll spacers */}
            {waypoints.map((wp) => (
                <div key={wp.id} id={`journey-${wp.id}`} className="h-[100vh]" />
            ))}
        </section>
    );
}