"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, ChevronRight } from "lucide-react";
import { getTutorCardPricing, getTutorFullName, getTutorSubjects } from "@/lib/tutors";
import type { SearchClassType, Tutor } from "@/types/tutor";

export default function TutorCard({ tutor, selectedClassType }: { readonly tutor: Tutor; readonly selectedClassType?: SearchClassType | null }) {
  const profileLink = selectedClassType
    ? `/tutor/${tutor.tutorId}?type=${selectedClassType}`
    : `/tutor/${tutor.tutorId}`;
  const currentPricing = getTutorCardPricing(tutor, selectedClassType);
  const tutorName = getTutorFullName(tutor);
  const tutorSubjects = getTutorSubjects(tutor);
  const description = tutor.profile.headline || tutor.profile.qualifications?.[0] || "EDUS Certified Tutor";

  return (
    <Link href={profileLink} className="block h-full group">
      <div
        className="bg-white overflow-hidden flex flex-col h-full relative cursor-pointer"
        style={{
          borderRadius: "30px",
          boxShadow: "rgba(14,15,12,0.12) 0px 0px 0px 1px",
          transition: "transform 200ms ease, box-shadow 200ms ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
          e.currentTarget.style.boxShadow = "rgba(14,15,12,0.12) 0px 0px 0px 1px, rgba(59,130,246,0.12) 0px 20px 40px";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0) scale(1)";
          e.currentTarget.style.boxShadow = "rgba(14,15,12,0.12) 0px 0px 0px 1px";
        }}
      >
        {/* Top accent */}
        <div className="h-1 w-full bg-cta" />

        <div className="p-5 sm:p-7 flex flex-col items-center relative z-10">
          {/* Rating badge */}
          <div
            className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
            style={{
              borderRadius: "9999px",
              background: "rgba(59, 130, 246, 0.08)",
              color: "#2563eb",
              boxShadow: "rgba(14,15,12,0.12) 0px 0px 0px 1px",
              fontFeatureSettings: '"calt"',
            }}
          >
            <Star className="w-3.5 h-3.5 fill-cta text-cta" /> Top Rated
          </div>

          {/* Avatar */}
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 overflow-hidden mb-5 relative"
            style={{
              borderRadius: "9999px",
              boxShadow: "rgba(14,15,12,0.12) 0px 0px 0px 3px",
            }}
          >
            <Image
              src={tutor.profile.avatarUrl || `https://i.pravatar.cc/150?u=${tutorName}`}
              alt={tutorName}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>

          {/* Name */}
          <h3
            className="text-[#0e0f0c] text-center"
            style={{
              fontSize: "1.375rem",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              fontFeatureSettings: '"calt"',
            }}
          >
            {tutorName}
          </h3>

          {/* Description */}
          <p
            className="text-[#6b7280] mt-2 text-center px-2 line-clamp-2"
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              lineHeight: 1.44,
              fontFeatureSettings: '"calt"',
            }}
          >
            {description}
          </p>
        </div>

        <div className="px-5 pb-5 sm:px-7 sm:pb-7 flex-grow flex flex-col justify-end gap-4">
          {/* Subjects */}
          <div
            className="p-4"
            style={{
              borderRadius: "16px",
              background: "#f8fafc",
              boxShadow: "rgba(14,15,12,0.08) 0px 0px 0px 1px",
            }}
          >
            <span
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b7280] block mb-2.5"
              style={{ fontFeatureSettings: '"calt"' }}
            >
              Expertise
            </span>
            <div className="flex flex-wrap gap-2">
              {tutorSubjects.slice(0, 3).map((subject) => (
                <span
                  key={subject}
                  className="text-xs font-semibold text-[#0e0f0c] px-3 py-1.5 bg-white"
                  style={{
                    borderRadius: "9999px",
                    boxShadow: "rgba(14,15,12,0.12) 0px 0px 0px 1px",
                    fontFeatureSettings: '"calt"',
                  }}
                >
                  {subject}
                </span>
              ))}
              {tutorSubjects.length > 3 && (
                <span
                  className="text-xs font-bold text-cta px-3 py-1.5"
                  style={{
                    borderRadius: "9999px",
                    background: "rgba(59, 130, 246, 0.08)",
                    boxShadow: "rgba(14,15,12,0.12) 0px 0px 0px 1px",
                    fontFeatureSettings: '"calt"',
                  }}
                >
                  +{tutorSubjects.length - 3}
                </span>
              )}
            </div>
          </div>

          {/* Price + Arrow */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex flex-col">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b7280] mb-0.5"
                style={{ fontFeatureSettings: '"calt"' }}
              >
                From
              </span>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-[#0e0f0c]"
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                    fontFeatureSettings: '"calt"',
                  }}
                >
                  {currentPricing?.currency || "LKR"} {currentPricing?.amount ?? "N/A"}
                </span>
                <span className="text-sm text-[#6b7280] font-semibold">
                  /{currentPricing?.billingLabel === "session" ? "session" : "mo"}
                </span>
              </div>
            </div>

            <div
              className="bg-cta text-cta-text w-12 h-12 flex items-center justify-center cursor-pointer"
              style={{
                borderRadius: "16px",
                transition: "transform 200ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <ChevronRight className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
