"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Star, Sparkles, ChevronRight } from "lucide-react";

export default function TutorCard({ tutor }: { tutor: any }) {
  return (
    <Link href={`/tutor/${tutor.id}`} className="block h-full">
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] border border-gray-200/60 overflow-hidden flex flex-col h-full relative group cursor-pointer"
    >
      <div className="p-8 flex flex-col items-center relative z-10">
        <div className="absolute top-5 right-5 bg-gradient-to-r from-accent/20 to-accent/10 text-yellow-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm border border-accent/30">
          <Star className="w-3.5 h-3.5 fill-accent text-accent" /> Top Rated
        </div>

        <div className="w-28 h-28 rounded-full overflow-hidden border-[6px] border-blue-50/50 mb-5 relative shadow-inner group-hover:border-blue-100 transition-colors duration-500">
          <Image
            src={tutor.profileImageUrl || `https://i.pravatar.cc/150?u=${tutor.firstName}`}
            alt={`${tutor.firstName} ${tutor.lastName}`}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
          />
        </div>
        
        <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-primary transition-colors text-center">
          {tutor.firstName} {tutor.lastName}
        </h3>
        <p className="text-sm text-slate-500 mt-2 flex items-center justify-center gap-1.5 text-center px-4 font-medium leading-relaxed line-clamp-2">
          <BookOpen className="w-4 h-4 flex-shrink-0 text-primary/70" /> {tutor.qualifications[0]}
        </p>
      </div>

      <div className="px-8 pb-8 flex-grow flex flex-col justify-end gap-5">
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-gray-100/80">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-success" />
            <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">Expertise</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tutor.teachingSubjects.slice(0, 3).map((ts: any, idx: number) => (
              <span key={idx} className="bg-white text-slate-700 border border-gray-200 shadow-sm text-xs px-2.5 py-1 rounded-lg font-medium">
                {ts.subject}
              </span>
            ))}
            {tutor.teachingSubjects.length > 3 && (
              <span className="bg-blue-50 text-primary border border-blue-100/50 text-xs px-2.5 py-1 rounded-lg font-bold">
                +{tutor.teachingSubjects.length - 3}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Pricing</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-900 tracking-tight">
                {tutor.pricing.currency} {tutor.pricing.feePerMonth}
              </span>
              <span className="text-sm text-slate-400 font-medium">/mo</span>
            </div>
          </div>
          <div className="bg-slate-900 text-white w-12 h-12 rounded-2xl flex items-center justify-center group-hover:bg-primary transition-colors shadow-md group-hover:shadow-[0_4px_14px_0_rgba(4,60,252,0.39)]">
            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </motion.div>
    </Link>
  );
}
