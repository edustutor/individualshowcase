"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TutorCard from "@/components/TutorCard";
import type { Tutor } from "@/types/tutor";
import { Loader2, ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

function SearchContent() {
  const searchParams = useSearchParams();
  const [tutors, setTutors] = useState<Tutor[]>([]);
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

  const classType = searchParams.get("classType");
  const grade = searchParams.get("grade");
  const subject = searchParams.get("subject");
  const medium = searchParams.get("medium");
  const syllabus = searchParams.get("syllabus");
  const hasFilters = classType || grade || subject || medium || syllabus;

  let content;
  if (loading) {
    content = (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="w-12 h-12 animate-spin text-cta mb-6" />
        <p
          className="text-[#6b7280] text-lg animate-pulse"
          style={{ fontWeight: 600, fontFeatureSettings: '"calt"' }}
        >
          Finding the perfect match...
        </p>
      </div>
    );
  } else if (tutors.length > 0) {
    content = (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {tutors.map((tutor: Tutor, index: number) => (
          <TutorCard key={tutor.tutorId || index} tutor={tutor} selectedClassType={classType as "Individual" | "Group"} />
        ))}
      </motion.div>
    );
  } else {
    content = (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="py-32 bg-white flex flex-col items-center justify-center text-center"
        style={{
          borderRadius: "30px",
          boxShadow: "rgba(14,15,12,0.12) 0px 0px 0px 1px",
        }}
      >
        <div
          className="w-20 h-20 flex items-center justify-center mb-6"
          style={{
            borderRadius: "9999px",
            background: "rgba(59, 130, 246, 0.08)",
          }}
        >
          <SearchX className="w-10 h-10 text-cta" />
        </div>
        <h3
          className="text-[#0e0f0c] mb-3"
          style={{ fontSize: "1.625rem", fontWeight: 800, fontFeatureSettings: '"calt"' }}
        >
          No tutors found
        </h3>
        <p
          className="text-[#6b7280] max-w-md text-lg leading-relaxed"
          style={{ fontWeight: 500, fontFeatureSettings: '"calt"' }}
        >
          We couldn&apos;t find any tutors matching your exact criteria. Try adjusting your filters.
        </p>
        <div className="mt-8">
          <Link href="/">
            <span
              className="inline-flex items-center gap-2 font-bold text-cta-text bg-cta px-6 py-3 cursor-pointer"
              style={{
                borderRadius: "9999px",
                fontFeatureSettings: '"calt"',
                transition: "transform 200ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <ArrowLeft className="w-5 h-5" /> Go Back
            </span>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto relative z-10">
      {/* Header area */}
      <div
        className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8"
        style={{ borderBottom: "1px solid rgba(14,15,12,0.12)" }}
      >
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <h1
            className="text-[#0e0f0c]"
            style={{
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              fontWeight: 900,
              lineHeight: 0.9,
              letterSpacing: "-0.02em",
              fontFeatureSettings: '"calt"',
            }}
          >
            Discover Tutors
          </h1>

          {hasFilters ? (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-[#6b7280] text-base font-semibold" style={{ fontFeatureSettings: '"calt"' }}>
                Showing results for
              </span>
              {[
                classType && `${classType} Classes`,
                syllabus,
                grade,
                subject,
                medium && `${medium} Medium`,
              ].filter(Boolean).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-bold text-cta"
                  style={{
                    borderRadius: "9999px",
                    background: "rgba(59, 130, 246, 0.08)",
                    boxShadow: "rgba(14,15,12,0.12) 0px 0px 0px 1px",
                    fontFeatureSettings: '"calt"',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p
              className="text-[#6b7280] mt-3 text-lg"
              style={{ fontWeight: 600, fontFeatureSettings: '"calt"' }}
            >
              All subjects and grades available.
            </p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <Link href="/">
            <span
              className="flex items-center gap-2 text-sm font-bold text-[#0e0f0c] bg-white px-5 py-2.5 cursor-pointer"
              style={{
                borderRadius: "9999px",
                boxShadow: "rgba(14,15,12,0.12) 0px 0px 0px 1px",
                fontFeatureSettings: '"calt"',
                transition: "transform 200ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <ArrowLeft className="w-4 h-4" /> Change Filters
            </span>
          </Link>
        </motion.div>
      </div>

      {content}
    </div>
  );
}

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-white relative pt-8 pb-12 px-6 sm:px-12 lg:px-24">
      <Suspense fallback={<div className="flex justify-center py-40"><Loader2 className="w-12 h-12 animate-spin text-cta" /></div>}>
        <SearchContent />
      </Suspense>
    </main>
  );
}
