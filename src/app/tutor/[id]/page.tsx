"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock3,
  CreditCard,
  GraduationCap,
  Languages,
  PlayCircle,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import {
  findTutorById,
  formatDayLabel,
  formatGradeLabel,
  formatTimeRange,
  getBookableClassesByType,
  getPrimaryDemoVideo,
  getTutorClassTypes,
} from "@/lib/tutors";
import type {
  GroupClass,
  IndividualClass,
  SearchClassType,
} from "@/types/tutor";

type BookingFormState = {
  studentName: string;
  studentEmail: string;
  studentPhone: string;
};

function isSearchClassType(value: string | null): value is SearchClassType {
  return value === "Individual" || value === "Group";
}

function getInitialClassType(
  requestedType: SearchClassType | null,
  availableClassTypes: SearchClassType[]
): SearchClassType {
  if (requestedType && availableClassTypes.includes(requestedType)) {
    return requestedType;
  }
  return availableClassTypes[0] || "Individual";
}

function getClassBadgeLabel(classType: SearchClassType) {
  return classType === "Individual" ? "1-to-1" : "Batch";
}

/* ─── Wise-style ring shadow constant ─── */
const RING = "rgba(14,15,12,0.12) 0px 0px 0px 1px";

export default function TutorProfile() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = params.id;
  const tutorId = Array.isArray(rawId) ? rawId[0] : rawId;
  const requestedType = searchParams.get("type");
  const requestedClassType = isSearchClassType(requestedType) ? requestedType : null;

  const tutor = useMemo(() => (
    tutorId ? findTutorById(tutorId) || null : null
  ), [tutorId]);

  const availableClassTypes = useMemo(() => (
    tutor ? getTutorClassTypes(tutor) : []
  ), [tutor]);

  const [selectedClassType, setSelectedClassType] = useState<SearchClassType>("Individual");
  const [selectedClassCode, setSelectedClassCode] = useState("");
  const [selectedDurationMinutes, setSelectedDurationMinutes] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [bookingForm, setBookingForm] = useState<BookingFormState>({
    studentName: "",
    studentEmail: "",
    studentPhone: "",
  });
  const [agreeRules, setAgreeRules] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  useEffect(() => {
    if (!tutor) return;
    setSelectedClassType(getInitialClassType(requestedClassType, availableClassTypes));
  }, [tutor, requestedClassType, availableClassTypes]);

  const bookableClasses = useMemo(() => (
    tutor ? getBookableClassesByType(tutor, selectedClassType) : []
  ), [tutor, selectedClassType]);

  useEffect(() => {
    if (bookableClasses.length === 0) {
      setSelectedClassCode("");
      return;
    }
    if (!bookableClasses.some((c) => c.classCode === selectedClassCode)) {
      setSelectedClassCode(bookableClasses[0].classCode);
    }
  }, [bookableClasses, selectedClassCode]);

  const selectedClass = useMemo(() => (
    bookableClasses.find((c) => c.classCode === selectedClassCode) || bookableClasses[0] || null
  ), [bookableClasses, selectedClassCode]);

  const selectedIndividualClass = selectedClass?.classType === "INDIVIDUAL" ? selectedClass : null;
  const selectedGroupClass = selectedClass?.classType === "GROUP" ? selectedClass : null;

  useEffect(() => {
    if (!selectedClass) {
      setSelectedDurationMinutes("");
      setSelectedSlotId("");
      return;
    }
    if (selectedClass.classType === "INDIVIDUAL") {
      const durations = selectedClass.pricing.map((p) => p.durationMinutes);
      if (!durations.includes(Number(selectedDurationMinutes))) {
        setSelectedDurationMinutes(String(durations[0] || ""));
      }
      const available = selectedClass.availableWeeklySlots.filter((s) => s.isAvailable);
      if (!available.some((s) => s.slotId === selectedSlotId)) {
        setSelectedSlotId(available[0]?.slotId || "");
      }
      return;
    }
    if (selectedDurationMinutes) setSelectedDurationMinutes("");
    if (selectedSlotId) setSelectedSlotId("");
  }, [selectedClass, selectedDurationMinutes, selectedSlotId]);

  useEffect(() => {
    setActiveVideoIndex(0);
  }, [tutorId]);

  const selectedPrice = selectedIndividualClass
    ? selectedIndividualClass.pricing.find((p) => p.durationMinutes === Number(selectedDurationMinutes)) || selectedIndividualClass.pricing[0] || null
    : null;
  const selectedSlot = selectedIndividualClass
    ? selectedIndividualClass.availableWeeklySlots.find((s) => s.slotId === selectedSlotId) || selectedIndividualClass.availableWeeklySlots[0] || null
    : null;
  const videos = tutor?.profile.demoVideos || [];
  const currentVideo = tutor ? videos[activeVideoIndex] || getPrimaryDemoVideo(tutor.profile) : null;

  if (!tutor) {
    return (
      <main className="min-h-screen bg-white px-4 py-16 sm:px-6">
        <div
          className="mx-auto flex max-w-3xl flex-col items-center bg-white p-10 text-center"
          style={{ borderRadius: "30px", boxShadow: RING }}
        >
          <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#0e0f0c", fontFeatureSettings: '"calt"' }}>
            Tutor not found
          </h1>
          <p className="mt-3 max-w-lg text-sm text-[#6b7280]" style={{ fontWeight: 500, fontFeatureSettings: '"calt"' }}>
            This tutor profile could not be loaded.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-8 inline-flex items-center gap-2 bg-cta text-cta-text font-bold text-sm cursor-pointer"
            style={{
              padding: "12px 24px",
              borderRadius: "9999px",
              fontFeatureSettings: '"calt"',
              transition: "transform 200ms ease",
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  async function handleBookingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tutor || !selectedClass) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorId: tutor.tutorId,
          tutorSlug: tutor.slug,
          studentName: bookingForm.studentName.trim(),
          studentEmail: bookingForm.studentEmail.trim(),
          studentPhone: bookingForm.studentPhone.trim(),
          classType: selectedClassType,
          classCode: selectedClass.classCode,
          classTitle: selectedClass.title,
          subject: selectedClass.subject,
          grade: selectedClass.grades.join(", "),
          medium: selectedClass.medium,
          syllabus: selectedClass.syllabus,
          durationMinutes: selectedPrice?.durationMinutes || null,
          slotId: selectedSlot?.slotId || null,
        }),
      });
      const data = await response.json();
      if (data.success) setBookingSuccess(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const pricingLabel = selectedIndividualClass ? "Per Session" : "Monthly Fee";
  const pricingAmount = selectedIndividualClass
    ? selectedPrice?.amount || 0
    : selectedGroupClass?.monthlyFee.amount || 0;
  const pricingCurrency = selectedIndividualClass
    ? selectedPrice?.currency || "LKR"
    : selectedGroupClass?.monthlyFee.currency || "LKR";

  return (
    <main className="min-h-screen bg-white pb-24" style={{ fontFeatureSettings: '"calt"' }}>
      {/* Back button */}
      <div className="mx-auto flex max-w-7xl justify-end px-4 pt-6 sm:px-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 bg-white text-sm font-bold text-[#0e0f0c] px-5 py-2.5 cursor-pointer"
          style={{
            borderRadius: "9999px",
            boxShadow: RING,
            transition: "transform 200ms ease",
            fontFeatureSettings: '"calt"',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Search
        </button>
      </div>

      <div className="mx-auto mt-6 flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:flex-row">
        {/* ─── Left Column ─── */}
        <div className="flex w-full flex-col gap-8 lg:w-[65%]">

          {/* Profile Header */}
          <motion.section
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative overflow-hidden bg-white p-8 sm:p-10"
            style={{ borderRadius: "30px", boxShadow: RING }}
          >
            <div className="absolute left-0 top-0 h-1 w-full bg-cta" />

            <div className="flex flex-col gap-8 text-center sm:flex-row sm:items-start sm:text-left">
              <div
                className="relative h-40 w-40 flex-shrink-0 self-center overflow-hidden sm:h-48 sm:w-48 sm:self-start"
                style={{ borderRadius: "24px", boxShadow: RING }}
              >
                <Image
                  src={tutor.profile.avatarUrl || `https://i.pravatar.cc/150?u=${tutor.profile.fullName}`}
                  alt={tutor.profile.fullName}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>

              <div className="flex w-full flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-start">
                    <h1
                      className="text-[#0e0f0c]"
                      style={{
                        fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                        fontWeight: 900,
                        lineHeight: 0.95,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {tutor.profile.fullName}
                    </h1>
                    {tutor.isVerified && (
                      <span
                        className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-white px-2.5 py-1"
                        style={{ borderRadius: "9999px", background: "#2563eb" }}
                      >
                        VERIFIED
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-bold text-cta">
                    {tutor.profile.headline || "EDUS Certified Tutor"}
                  </p>
                </div>

                {/* Meta badges */}
                <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                  <MetaBadge>
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-[#0e0f0c]">{tutor.profile.rating || "5.0"}</span>
                    <span className="text-[#6b7280]">({tutor.profile.reviewCount || "0"})</span>
                  </MetaBadge>
                  {tutor.profile.qualifications?.[0] && (
                    <MetaBadge>
                      <GraduationCap className="h-4 w-4 text-[#6b7280]" />
                      <span className="font-semibold text-[#0e0f0c]">{tutor.profile.qualifications[0]}</span>
                    </MetaBadge>
                  )}
                  <MetaBadge>
                    <ShieldCheck className="h-4 w-4 text-cta" />
                    <span className="font-semibold text-[#0e0f0c]">{availableClassTypes.join(" + ")} Classes</span>
                  </MetaBadge>
                </div>

                {tutor.profile.about && (
                  <p
                    className="text-[#6b7280] pt-4"
                    style={{
                      borderTop: "1px solid rgba(14,15,12,0.08)",
                      fontSize: "0.9375rem",
                      fontWeight: 500,
                      lineHeight: 1.6,
                    }}
                  >
                    {tutor.profile.about}
                  </p>
                )}
              </div>
            </div>
          </motion.section>

          {/* Overview */}
          <motion.section
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="bg-white p-8"
            style={{ borderRadius: "30px", boxShadow: RING }}
          >
            <SectionTitle icon={<BookOpen className="h-5 w-5 text-cta" />} title="Tutor Overview" />
            <div className="grid gap-5 md:grid-cols-2">
              <InfoList label="Subjects" values={tutor.profile.subjects} />
              <InfoList label="Languages" values={tutor.profile.languages || []} icon={<Languages className="h-4 w-4 text-[#6b7280]" />} />
              <InfoList label="Mediums" values={tutor.profile.mediums} />
              <InfoList label="Syllabus" values={tutor.profile.syllabusSupported} />
            </div>

            {tutor.profile.qualifications?.length ? (
              <div className="mt-8">
                <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">Qualifications</h4>
                <ul className="flex flex-col gap-3">
                  {tutor.profile.qualifications.map((q) => (
                    <li
                      key={q}
                      className="flex items-start gap-3 p-4 text-sm font-medium text-[#0e0f0c]"
                      style={{ borderRadius: "16px", background: "#f8fafc", boxShadow: RING }}
                    >
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {tutor.profile.teachingStyle?.length ? (
              <div className="mt-8">
                <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">Teaching Style</h4>
                <div className="flex flex-wrap gap-2">
                  {tutor.profile.teachingStyle.map((s) => (
                    <span
                      key={s}
                      className="text-xs font-semibold text-[#0e0f0c] px-3 py-1.5 bg-white"
                      style={{ borderRadius: "9999px", boxShadow: RING }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </motion.section>

          {/* Individual Classes */}
          {tutor.individualClasses.length > 0 && (
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-8"
              style={{ borderRadius: "30px", boxShadow: RING }}
            >
              <SectionTitle icon={<Calendar className="h-5 w-5 text-cta" />} title="Individual Classes" />
              <div className="grid gap-5">
                {tutor.individualClasses.map((c) => (
                  <IndividualClassCard
                    key={c.classCode}
                    classItem={c}
                    isSelected={selectedClassType === "Individual" && selectedClassCode === c.classCode}
                    onSelect={() => { setSelectedClassType("Individual"); setSelectedClassCode(c.classCode); }}
                  />
                ))}
              </div>
            </motion.section>
          )}

          {/* Group Classes */}
          {tutor.groupClasses.length > 0 && (
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="bg-white p-8"
              style={{ borderRadius: "30px", boxShadow: RING }}
            >
              <SectionTitle icon={<Users className="h-5 w-5 text-cta" />} title="Group Classes" />
              <div className="grid gap-5">
                {tutor.groupClasses.map((c) => (
                  <GroupClassCard
                    key={c.classCode}
                    classItem={c}
                    isSelected={selectedClassType === "Group" && selectedClassCode === c.classCode}
                    onSelect={() => { setSelectedClassType("Group"); setSelectedClassCode(c.classCode); }}
                  />
                ))}
              </div>
            </motion.section>
          )}

          {/* Demo Videos */}
          <motion.section
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="overflow-hidden bg-white p-8"
            style={{ borderRadius: "30px", boxShadow: RING }}
          >
            <SectionTitle icon={<PlayCircle className="h-5 w-5 text-cta" />} title="Demo Videos" />
            {currentVideo ? (
              <div className="flex flex-col gap-6 lg:flex-row">
                <div className="flex-1">
                  <div className="mb-4 flex flex-col gap-1">
                    <h4 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0e0f0c" }}>{currentVideo.title}</h4>
                    <p className="text-sm text-[#6b7280] font-medium">{currentVideo.subject}</p>
                  </div>
                  <div
                    className="relative aspect-video overflow-hidden bg-[#0e0f0c]"
                    style={{ borderRadius: "20px", boxShadow: RING }}
                  >
                    <iframe
                      key={currentVideo.videoId}
                      src={currentVideo.videoUrl}
                      className="absolute inset-0 h-full w-full"
                      allowFullScreen
                      title={currentVideo.title}
                    />
                  </div>
                </div>

                {videos.length > 1 ? (
                  <div className="w-full lg:w-80">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">Preview Queue</h4>
                      <span
                        className="text-[10px] font-bold text-[#6b7280] px-2 py-0.5"
                        style={{ borderRadius: "6px", background: "#f8fafc", boxShadow: RING }}
                      >
                        {activeVideoIndex + 1} / {videos.length}
                      </span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 lg:max-h-[380px] lg:flex-col lg:overflow-y-auto">
                      {videos.map((video, index) => (
                        <button
                          key={video.videoId}
                          onClick={() => setActiveVideoIndex(index)}
                          className="flex min-w-[240px] items-center gap-3 p-3 text-left cursor-pointer lg:min-w-0"
                          style={{
                            borderRadius: "16px",
                            boxShadow: activeVideoIndex === index
                              ? "rgba(59,130,246,0.3) 0px 0px 0px 2px"
                              : RING,
                            background: activeVideoIndex === index ? "rgba(59, 130, 246, 0.05)" : "white",
                            transition: "all 200ms ease",
                          }}
                        >
                          <div
                            className="relative flex h-14 w-20 flex-shrink-0 items-center justify-center overflow-hidden bg-[#0e0f0c]"
                            style={{ borderRadius: "12px" }}
                          >
                            <PlayCircle className="h-6 w-6 text-white/80" />
                          </div>
                          <div className="min-w-0">
                            <p
                              className="truncate text-[11px] font-bold leading-tight"
                              style={{ color: activeVideoIndex === index ? "#2563eb" : "#0e0f0c" }}
                            >
                              {video.title}
                            </p>
                            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[#6b7280]">
                              {video.subject}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center p-14 text-[#6b7280]"
                style={{ borderRadius: "20px", background: "#f8fafc", boxShadow: RING }}
              >
                <div
                  className="mb-4 flex h-16 w-16 items-center justify-center bg-white"
                  style={{ borderRadius: "9999px", boxShadow: RING }}
                >
                  <PlayCircle className="h-8 w-8 text-cta opacity-30" />
                </div>
                <span className="text-sm font-semibold text-[#6b7280]">No demo videos uploaded yet</span>
                <p className="mt-1 text-xs text-[#6b7280]">Tutor hasn&apos;t provided session previews</p>
              </div>
            )}
          </motion.section>

          {/* Class Rules */}
          <motion.section
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="bg-white p-8"
            style={{ borderRadius: "30px", boxShadow: RING }}
          >
            <SectionTitle icon={<ShieldCheck className="h-5 w-5 text-cta" />} title="Class Rules" />
            <ol className="flex flex-col gap-3">
              {[
                "Your internet connection and device need to be ready for online learning.",
                "Attendance is monitored. Missing more than 3 consecutive classes can result in removal.",
                "Students are expected to respond to the tutor and participate during live sessions.",
                "Subject-related doubts should be raised during class so the tutor can address them quickly.",
                "Assignments and academic follow-ups should be completed on time.",
              ].map((rule, index) => (
                <li
                  key={rule}
                  className="flex items-start gap-4 p-4 text-sm text-[#0e0f0c]"
                  style={{ borderRadius: "16px", background: "#f8fafc", boxShadow: RING }}
                >
                  <span
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center text-xs font-black text-white"
                    style={{ borderRadius: "9999px", background: "#3b82f6" }}
                  >
                    {index + 1}
                  </span>
                  <span className="font-medium leading-relaxed">{rule}</span>
                </li>
              ))}
            </ol>
          </motion.section>
        </div>

        {/* ─── Right Column (Booking) ─── */}
        <div className="relative w-full lg:w-[35%]">
          <motion.aside
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="sticky top-[100px] bg-white p-8"
            style={{ borderRadius: "30px", boxShadow: "rgba(14,15,12,0.12) 0px 0px 0px 1px, rgba(59,130,246,0.08) 0px 20px 60px" }}
          >
            {bookingSuccess ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div
                  className="mb-6 flex h-20 w-20 items-center justify-center"
                  style={{ borderRadius: "9999px", background: "rgba(5, 150, 105, 0.1)" }}
                >
                  <CheckCircle className="h-10 w-10 text-success" />
                </div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0e0f0c" }}>Request Submitted</h3>
                <p className="mb-8 max-w-xs text-sm text-[#6b7280] mt-2" style={{ fontWeight: 500, lineHeight: 1.6 }}>
                  Thank you, {bookingForm.studentName || "student"}. Your class request is in progress and the EDUS team will contact you shortly.
                </p>
                <button
                  onClick={() => router.push("/")}
                  className="w-full py-4 text-sm font-bold text-[#0e0f0c] bg-[#f8fafc] cursor-pointer"
                  style={{
                    borderRadius: "16px",
                    boxShadow: RING,
                    transition: "transform 200ms ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  Return to Home
                </button>
              </div>
            ) : (
              <>
                {/* Booking Summary Card */}
                <div
                  className="relative mb-8 overflow-hidden p-6 text-white"
                  style={{ borderRadius: "20px", background: "#0e0f0c" }}
                >
                  <div
                    className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-40 blur-[80px]"
                    style={{ background: "#3b82f6" }}
                  />

                  <div className="relative z-10 mb-6 flex items-center justify-between pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <h3 className="flex items-center gap-2 text-base font-bold">
                      <CreditCard className="h-4 w-4 text-cta" />
                      Booking Summary
                    </h3>
                    <div
                      className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                      style={{ borderRadius: "9999px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      {selectedClassType} Class
                    </div>
                  </div>

                  <div className="relative z-10 space-y-4 text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
                    <div className="flex items-center justify-between gap-4">
                      <span>Selected class</span>
                      <span className="text-right font-semibold text-white">{selectedClass?.title || "Choose a class"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>{pricingLabel}</span>
                      <span className="font-semibold text-white">{pricingCurrency} {pricingAmount}</span>
                    </div>
                    {selectedIndividualClass && selectedPrice ? (
                      <div
                        className="flex items-center justify-between gap-4 p-3"
                        style={{ borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                      >
                        <span className="flex items-center gap-1.5 text-xs font-semibold"><Clock3 className="h-3.5 w-3.5" /> Duration</span>
                        <span className="text-xs font-bold text-white">{selectedPrice.durationMinutes} Minutes</span>
                      </div>
                    ) : null}
                    {selectedGroupClass ? (
                      <div
                        className="flex items-center justify-between gap-4 p-3"
                        style={{ borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                      >
                        <span className="flex items-center gap-1.5 text-xs font-semibold"><Users className="h-3.5 w-3.5" /> Seats Left</span>
                        <span className="text-xs font-bold text-white">{selectedGroupClass.seatsLeft} / {selectedGroupClass.seatCapacity}</span>
                      </div>
                    ) : null}
                    <div className="pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
                      <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.4)" }}>Class Coverage</p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {selectedClass?.subject || "Select a class"} &bull; {selectedClass?.medium || "Medium"} &bull; {selectedClass?.syllabus || "Syllabus"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Booking Form */}
                <form onSubmit={handleBookingSubmit} className="flex flex-col gap-5">
                  <h4 className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#0e0f0c]">
                    Student Registration Details
                  </h4>

                  <Field label="Student Name" htmlFor="studentName" input={
                    <FormInput id="studentName" required type="text" value={bookingForm.studentName}
                      onChange={(e) => setBookingForm({ ...bookingForm, studentName: e.target.value })}
                      placeholder="John Doe" />
                  } />

                  <Field label="Email Address" htmlFor="studentEmail" input={
                    <FormInput id="studentEmail" required type="email" value={bookingForm.studentEmail}
                      onChange={(e) => setBookingForm({ ...bookingForm, studentEmail: e.target.value })}
                      placeholder="john@example.com" />
                  } />

                  <Field label="Phone Number" htmlFor="studentPhone" hint="Digits only, starting with country code." input={
                    <FormInput id="studentPhone" required type="tel" value={bookingForm.studentPhone}
                      onChange={(e) => setBookingForm({ ...bookingForm, studentPhone: e.target.value.replace(/\D/g, "") })}
                      placeholder="94707072072" />
                  } />

                  <Field label="Class Type" htmlFor="classType" input={
                    <Select id="classType" value={selectedClassType}
                      onChange={(e) => setSelectedClassType(e.target.value as SearchClassType)}
                      options={availableClassTypes.map((ct) => ({ value: ct, label: `${ct} (${getClassBadgeLabel(ct)})` }))} />
                  } />

                  <Field label={selectedClassType === "Individual" ? "Individual Class" : "Group Class"} htmlFor="classCode" input={
                    <Select id="classCode" value={selectedClassCode}
                      onChange={(e) => setSelectedClassCode(e.target.value)}
                      options={bookableClasses.map((c) => ({ value: c.classCode, label: `${c.title} \u2022 ${c.subject}` }))} />
                  } />

                  {selectedIndividualClass && selectedIndividualClass.pricing.length > 0 ? (
                    <Field label="Session Duration" htmlFor="duration" input={
                      <Select id="duration" value={selectedDurationMinutes}
                        onChange={(e) => setSelectedDurationMinutes(e.target.value)}
                        options={selectedIndividualClass.pricing.map((p) => ({ value: String(p.durationMinutes), label: `${p.durationMinutes} Minutes \u2022 ${p.currency} ${p.amount}` }))} />
                    } />
                  ) : null}

                  {selectedIndividualClass && selectedIndividualClass.availableWeeklySlots.length > 0 ? (
                    <Field label="Preferred Weekly Slot" htmlFor="slotId" input={
                      <Select id="slotId" value={selectedSlotId}
                        onChange={(e) => setSelectedSlotId(e.target.value)}
                        options={selectedIndividualClass.availableWeeklySlots.filter((s) => s.isAvailable).map((s) => ({
                          value: s.slotId,
                          label: `${formatDayLabel(s.day)} \u2022 ${formatTimeRange(s.startTime, s.endTime)}`,
                        }))} />
                    } />
                  ) : null}

                  {selectedClass ? (
                    <div
                      className="grid grid-cols-2 gap-4 p-4"
                      style={{ borderRadius: "16px", background: "#f8fafc", boxShadow: RING }}
                    >
                      <SummaryItem label="Subject" value={selectedClass.subject} />
                      <SummaryItem label="Grades" value={selectedClass.grades.map(formatGradeLabel).join(", ")} />
                      <SummaryItem label="Medium" value={selectedClass.medium} />
                      <SummaryItem label="Syllabus" value={selectedClass.syllabus} />
                    </div>
                  ) : null}

                  {/* Agreement */}
                  <div
                    className="mt-2 flex items-start gap-2.5 p-3.5"
                    style={{ borderRadius: "12px", background: "rgba(59, 130, 246, 0.05)", boxShadow: RING }}
                  >
                    <input
                      id="agreeRules" type="checkbox" checked={agreeRules}
                      onChange={(e) => setAgreeRules(e.target.checked)}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer accent-cta"
                    />
                    <label htmlFor="agreeRules" className="text-xs leading-relaxed text-[#6b7280]" style={{ fontWeight: 500 }}>
                      I agree to the class rules and understand that EDUS may contact me to confirm the booking.
                    </label>
                  </div>

                  {/* Submit */}
                  <button
                    disabled={isSubmitting || !agreeRules || !selectedClass}
                    type="submit"
                    className="mt-4 flex w-full items-center justify-center gap-2 bg-cta text-cta-text font-bold text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      padding: "16px",
                      borderRadius: "16px",
                      transition: "transform 200ms ease",
                      fontFeatureSettings: '"calt"',
                    }}
                    onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = "scale(1.03)"; }}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    onMouseDown={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = "scale(0.97)"; }}
                    onMouseUp={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = "scale(1.03)"; }}
                  >
                    {isSubmitting ? "Processing..." : "Enroll Now"}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </form>
              </>
            )}
          </motion.aside>
        </div>
      </div>
    </main>
  );
}

/* ─── Sub-components ─── */

function MetaBadge({ children }: { readonly children: ReactNode }) {
  return (
    <div
      className="flex items-center gap-1.5 text-sm px-3 py-1.5"
      style={{ borderRadius: "9999px", boxShadow: RING, fontFeatureSettings: '"calt"' }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ icon, title }: { readonly icon: ReactNode; readonly title: string }) {
  return (
    <h3
      className="mb-5 flex items-center gap-2 text-[#0e0f0c]"
      style={{ fontSize: "1.125rem", fontWeight: 800, fontFeatureSettings: '"calt"' }}
    >
      {icon}
      {title}
    </h3>
  );
}

function InfoList({ label, values, icon }: { readonly label: string; readonly values: string[]; readonly icon?: ReactNode }) {
  return (
    <div className="p-5" style={{ borderRadius: "20px", background: "#f8fafc", boxShadow: RING }}>
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">{label}</h4>
      </div>
      <div className="flex flex-wrap gap-2">
        {values.length > 0 ? values.map((v) => (
          <span key={v} className="text-xs font-semibold text-[#0e0f0c] px-3 py-1.5 bg-white" style={{ borderRadius: "9999px", boxShadow: RING }}>
            {v}
          </span>
        )) : (
          <span className="text-sm text-[#6b7280]">Not listed</span>
        )}
      </div>
    </div>
  );
}

function IndividualClassCard({ classItem, isSelected, onSelect }: { readonly classItem: IndividualClass; readonly isSelected: boolean; readonly onSelect: () => void }) {
  const startingPrice = classItem.pricing.reduce((low, cur) => cur.amount < low.amount ? cur : low, classItem.pricing[0]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full p-6 text-left cursor-pointer"
      style={{
        borderRadius: "20px",
        boxShadow: isSelected ? "rgba(59,130,246,0.3) 0px 0px 0px 2px" : RING,
        background: isSelected ? "rgba(59, 130, 246, 0.03)" : "#f8fafc",
        transition: "all 200ms ease",
      }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cta px-3 py-1" style={{ borderRadius: "9999px", background: "rgba(59, 130, 246, 0.08)" }}>
              Individual
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b7280] px-3 py-1 bg-white" style={{ borderRadius: "9999px", boxShadow: RING }}>
              {classItem.subject}
            </span>
          </div>
          <div>
            <h4 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0e0f0c" }}>{classItem.title}</h4>
            <p className="mt-1 text-sm text-[#6b7280] font-medium">{classItem.medium} &bull; {classItem.syllabus}</p>
          </div>
        </div>
        <div className="px-4 py-3 text-right bg-white" style={{ borderRadius: "16px", boxShadow: RING }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">From</p>
          <p style={{ fontSize: "1.25rem", fontWeight: 900, color: "#0e0f0c", marginTop: "4px" }}>{startingPrice.currency} {startingPrice.amount}</p>
          <p className="text-xs font-medium text-[#6b7280]">per session</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <CardMeta label="Grades" value={classItem.grades.map(formatGradeLabel).join(", ")} />
        <CardMeta label="Durations" value={classItem.pricing.map((p) => `${p.durationMinutes}m`).join(", ")} />
      </div>
      {classItem.availableWeeklySlots.length > 0 ? (
        <div className="mt-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">Weekly Slots</p>
          <div className="flex flex-wrap gap-2">
            {classItem.availableWeeklySlots.filter((s) => s.isAvailable).map((s) => (
              <span key={s.slotId} className="text-[11px] font-semibold text-[#0e0f0c] px-3 py-1.5 bg-white" style={{ borderRadius: "12px", boxShadow: RING }}>
                {formatDayLabel(s.day)} &bull; {formatTimeRange(s.startTime, s.endTime)}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </button>
  );
}

function GroupClassCard({ classItem, isSelected, onSelect }: { readonly classItem: GroupClass; readonly isSelected: boolean; readonly onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full p-6 text-left cursor-pointer"
      style={{
        borderRadius: "20px",
        boxShadow: isSelected ? "rgba(59,130,246,0.3) 0px 0px 0px 2px" : RING,
        background: isSelected ? "rgba(59, 130, 246, 0.03)" : "#f8fafc",
        transition: "all 200ms ease",
      }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-success px-3 py-1" style={{ borderRadius: "9999px", background: "rgba(5, 150, 105, 0.08)" }}>
              Group
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b7280] px-3 py-1 bg-white" style={{ borderRadius: "9999px", boxShadow: RING }}>
              {classItem.subject}
            </span>
          </div>
          <div>
            <h4 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0e0f0c" }}>{classItem.title}</h4>
            <p className="mt-1 text-sm text-[#6b7280] font-medium">{classItem.medium} &bull; {classItem.syllabus} &bull; {classItem.status}</p>
          </div>
        </div>
        <div className="px-4 py-3 text-right bg-white" style={{ borderRadius: "16px", boxShadow: RING }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">Monthly Fee</p>
          <p style={{ fontSize: "1.25rem", fontWeight: 900, color: "#0e0f0c", marginTop: "4px" }}>{classItem.monthlyFee.currency} {classItem.monthlyFee.amount}</p>
          <p className="text-xs font-medium text-[#6b7280]">{classItem.seatsLeft} seats left</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <CardMeta label="Grades" value={classItem.grades.map(formatGradeLabel).join(", ")} />
        <CardMeta label="Capacity" value={`${classItem.seatsLeft} left of ${classItem.seatCapacity}`} />
      </div>
      {classItem.fixedTimetable.length > 0 ? (
        <div className="mt-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">Fixed Timetable</p>
          <div className="grid gap-3 md:grid-cols-2">
            {classItem.fixedTimetable.map((sch, idx) => (
              <div key={`${classItem.classCode}-${sch.day}-${sch.startTime}-${idx}`} className="p-4 bg-white" style={{ borderRadius: "16px", boxShadow: RING }}>
                <p className="text-sm font-bold text-[#0e0f0c]">{formatDayLabel(sch.day)}</p>
                <p className="mt-1 text-xs font-medium text-[#6b7280]">{formatTimeRange(sch.startTime, sch.endTime)}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </button>
  );
}

function CardMeta({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="p-4 bg-white" style={{ borderRadius: "16px", boxShadow: RING }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#0e0f0c]">{value}</p>
    </div>
  );
}

function Field({ label, htmlFor, input, hint }: { readonly label: string; readonly htmlFor: string; readonly input: ReactNode; readonly hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="ml-1 text-xs font-semibold text-[#6b7280]" style={{ fontFeatureSettings: '"calt"' }}>
        {label}
      </label>
      {input}
      {hint ? <span className="ml-1 text-[10px] text-[#6b7280]">{hint}</span> : null}
    </div>
  );
}

function FormInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-4 py-3 text-sm font-semibold text-[#0e0f0c] bg-[#f8fafc] placeholder-[#9ca3af] focus:outline-none"
      style={{
        borderRadius: "12px",
        boxShadow: RING,
        transition: "box-shadow 200ms ease",
        fontFeatureSettings: '"calt"',
      }}
      onFocus={(e) => { e.currentTarget.style.boxShadow = "rgba(59,130,246,0.4) 0px 0px 0px 2px"; props.onFocus?.(e); }}
      onBlur={(e) => { e.currentTarget.style.boxShadow = RING; props.onBlur?.(e); }}
    />
  );
}

function Select({ id, value, onChange, options }: { readonly id: string; readonly value: string; readonly onChange: (e: ChangeEvent<HTMLSelectElement>) => void; readonly options: Array<{ value: string; label: string }> }) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="w-full appearance-none px-4 py-3 pr-10 text-sm font-semibold text-[#0e0f0c] bg-[#f8fafc] cursor-pointer focus:outline-none"
        style={{
          borderRadius: "12px",
          boxShadow: RING,
          fontFeatureSettings: '"calt"',
        }}
        onFocus={(e) => { e.currentTarget.style.boxShadow = "rgba(59,130,246,0.4) 0px 0px 0px 2px"; }}
        onBlur={(e) => { e.currentTarget.style.boxShadow = RING; }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <ChevronDown className="h-4 w-4 text-[#6b7280]" />
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b7280]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#0e0f0c]">{value}</p>
    </div>
  );
}
