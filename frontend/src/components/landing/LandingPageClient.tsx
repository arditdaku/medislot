"use client";

import { useEffect, useState } from "react";
import Benefits from "./Benefits";
import FAQ from "./FAQ";
import Features from "./Features";
import Footer from "./Footer";
import Header from "./Header";
import Hero from "./Hero";
import HowItWorks from "./HowItWorks";
import Pricing from "./Pricing";
import Testimonials from "./Testimonials";
import TrustedBy from "./TrustedBy";

export default function LandingPageClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div className="min-h-screen bg-white text-slate-950 antialiased">
      <Header />
      <main>
        <Hero />
        <TrustedBy />
        <Features />
        <HowItWorks />
        <Benefits />
        <Testimonials />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
