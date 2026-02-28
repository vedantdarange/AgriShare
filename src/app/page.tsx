"use client";

import HeroHarvestScroll from "@/components/HeroHarvestScroll";
import Navbar from "@/components/Navbar";
import Features from "@/components/Features";
import TrustSection from "@/components/TrustSection";
import CTASection from "@/components/CTASection";
import AuthModal from "@/components/AuthModal";
import HowItWorks from "@/components/HowItWorks";
import DeliveryJourney from "@/components/DeliveryJourney";
import { useState } from "react";

export default function Home() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#f5f1ea]">
      <Navbar onGetStarted={() => setIsAuthOpen(true)} />

      {/* Hero Section */}
      <HeroHarvestScroll />

      {/* Content Sections */}
      <div className="relative z-10 bg-[#f5f1ea]">
        <Features />
        <HowItWorks />
        <DeliveryJourney />
        <TrustSection />
        <CTASection onStartOrder={() => setIsAuthOpen(true)} />

        <footer className="py-8 text-center text-stone-500 text-sm bg-stone-900">
          <p>© {new Date().getFullYear()} Farmer Web. Bringing nature to your table.</p>
        </footer>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </main>
  );
}
