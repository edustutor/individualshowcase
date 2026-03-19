import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import FloatingCallButton from "@/components/FloatingCallButton";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EDUS Tutor Booking",
  description: "Find your perfect tutor for all subjects and grades.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50">
        {/* Brand accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/80 to-primary/50 shrink-0" />

        <header className="w-full z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 shadow-sm shadow-gray-100/50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-center md:justify-between">
            <Link href="/" className="flex items-center gap-3 cursor-pointer group">
              <Image 
                src="/EDUSLogo .jpg" 
                alt="EDUS Logo" 
                width={130} 
                height={42} 
                className="object-contain h-9 w-auto group-hover:opacity-90 transition-opacity"
                priority
              />
            </Link>

            {/* Phone CTA — desktop only, complements the floating button */}
            <a
              href="tel:+94707072072"
              className="hidden md:flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              +94 70 707 2072
            </a>
          </div>
        </header>

        {children}

        {/* Global floating call button */}
        <FloatingCallButton />
      </body>
    </html>
  );
}
