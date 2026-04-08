"use client";

import { Phone } from "lucide-react";

export default function FloatingCallButton() {
  return (
    <a
      href="tel:+94707072072"
      aria-label="Call EDUS now"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-cta text-cta-text pl-5 pr-6 py-3.5 cursor-pointer group md:bottom-8 md:right-8"
      style={{
        borderRadius: "9999px",
        transition: "transform 200ms ease",
        fontFeatureSettings: '"calt"',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
    >
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full bg-cta/40 animate-ping opacity-30 pointer-events-none" />

      <Phone className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform duration-200" />
      <span className="text-sm font-bold relative z-10 tracking-wide hidden sm:inline">
        Contact Now
      </span>
    </a>
  );
}
