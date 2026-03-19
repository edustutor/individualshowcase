"use client";

import { Phone } from "lucide-react";

export default function FloatingCallButton() {
  return (
    <a
      href="tel:+94707072072"
      aria-label="Call EDUS now"
      className="
        fixed bottom-6 right-6 z-50
        flex items-center gap-2.5
        bg-primary text-white
        pl-5 pr-6 py-3.5
        rounded-full
        shadow-lg shadow-primary/30
        hover:shadow-xl hover:shadow-primary/40
        hover:-translate-y-0.5
        active:scale-95
        transition-all duration-200
        cursor-pointer
        group
        md:bottom-8 md:right-8
      "
    >
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping opacity-30 pointer-events-none" />

      <Phone className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform duration-200" />
      <span className="text-sm font-bold relative z-10 tracking-wide hidden sm:inline">
        Contact Now
      </span>
    </a>
  );
}
