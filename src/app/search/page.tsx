"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TutorCard from "@/components/TutorCard";
import { Loader2, ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

function SearchContent() {
  const searchParams = useSearchParams();
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutors = async () => {
      setLoading(true);
      const params = searchParams.toString();
      const res = await fetch(`/api/tutors?${params}`);
      const data = await res.json();
      setTutors(data);
      setLoading(false);
    };
    fetchTutors();
  }, [searchParams]);

  const grade = searchParams.get("grade");
  const subject = searchParams.get("subject");
  const medium = searchParams.get("medium");
  const syllabus = searchParams.get("syllabus");
  const hasFilters = grade || subject || medium || syllabus;

  return (
    <div className="w-full max-w-7xl mx-auto relative z-10">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200/50 pb-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Discover Tutors
          </h1>
          {hasFilters ? (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-gray-600 text-lg">Showing results for</span>
              {syllabus && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-primary font-semibold text-sm border border-primary/15">
                  {syllabus}
                </span>
              )}
              {grade && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-primary font-semibold text-sm border border-primary/15">
                  Grade {grade}
                </span>
              )}
              {subject && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-primary font-semibold text-sm border border-primary/15">
                  {subject}
                </span>
              )}
              {medium && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-primary font-semibold text-sm border border-primary/15">
                  {medium} Medium
                </span>
              )}
            </div>
          ) : (
            <p className="text-gray-600 mt-3 text-lg">All subjects and grades available.</p>
          )}
        </motion.div>
        
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <Link href="/">
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-all border border-gray-200/80 px-5 py-2.5 rounded-2xl bg-white/70 backdrop-blur-md hover:bg-white hover:shadow-md hover:-translate-y-0.5">
              <ArrowLeft className="w-4 h-4" /> Change Filters
            </span>
          </Link>
        </motion.div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40">
          <Loader2 className="w-14 h-14 animate-spin text-indigo-500 mb-6 drop-shadow-lg" />
          <p className="text-gray-500 font-medium text-lg animate-pulse">Finding the perfect match...</p>
        </div>
      ) : tutors.length > 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
        >
          {tutors.map((tutor: any, index: number) => (
            <TutorCard key={tutor.id || index} tutor={tutor} />
          ))}
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="py-32 bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-dashed border-gray-300 shadow-sm flex flex-col items-center justify-center text-center"
        >
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <SearchX className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">No tutors found</h3>
          <p className="text-gray-500 max-w-md text-lg leading-relaxed">We couldn't find any tutors matching your exact criteria. Try adjusting your filters to see more results.</p>
          <div className="mt-8">
             <Link href="/">
              <span className="inline-flex items-center gap-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors px-6 py-3 rounded-full shadow-lg shadow-indigo-200">
                <ArrowLeft className="w-5 h-5" /> Go Back
              </span>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-[#FDFDFD] relative overflow-hidden py-12 px-6 sm:px-12 lg:px-24">
      {/* Premium ambient background elements */}
      <div className="fixed top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-indigo-100/40 to-purple-100/40 blur-[120px] -z-10 pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-emerald-50/40 to-teal-50/40 blur-[100px] -z-10 pointer-events-none"></div>

      <Suspense fallback={<div className="flex justify-center py-40"><Loader2 className="w-12 h-12 animate-spin text-indigo-500" /></div>}>
        <SearchContent />
      </Suspense>
    </main>
  );
}
