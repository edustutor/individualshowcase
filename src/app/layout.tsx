import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import FloatingCallButton from "@/components/FloatingCallButton";
import ScrollToTop from "@/components/ScrollToTop";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
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
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontFeatureSettings: '"calt"' }}>
        <header className="w-full z-50 sticky top-0">
          <div className="bg-white" style={{ boxShadow: "rgba(14,15,12,0.12) 0px 0px 0px 1px" }}>
            <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3 cursor-pointer group">
                <Image
                  src="/EDUSLogo .jpg"
                  alt="EDUS Logo"
                  width={130}
                  height={42}
                  className="object-contain h-10 w-auto transition-transform duration-200 group-hover:scale-105 group-active:scale-95"
                  priority
                />
              </Link>

              <div className="flex items-center gap-3">
                <a
                  href="tel:+94707072072"
                  className="hidden md:flex items-center gap-2 text-[15px] font-semibold text-[#0e0f0c] transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                  style={{ fontFeatureSettings: '"calt"' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  +94 70 707 2072
                </a>

                <Link
                  href="/"
                  className="bg-cta text-cta-text px-5 py-2.5 font-bold text-[15px] transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                  style={{ borderRadius: "9999px", fontFeatureSettings: '"calt"' }}
                >
                  Find a Tutor
                </Link>
              </div>
            </div>
          </div>
        </header>

        <ScrollToTop />
        {children}

        <FloatingCallButton />
      </body>
    </html>
  );
}
