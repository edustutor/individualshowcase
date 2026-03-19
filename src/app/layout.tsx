import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
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
        <header className="w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 cursor-pointer">
              <Image 
                src="/EDUSLogo .jpg" 
                alt="EDUS Logo" 
                width={140} 
                height={45} 
                className="object-contain h-10 w-auto"
                priority
              />
            </Link>
            <div className="flex items-center">
              <button className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                Sign In
              </button>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
