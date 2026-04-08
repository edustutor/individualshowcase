"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle,
  CheckSquare,
  ChevronDown,
  Clock3,
  GraduationCap,
  PlayCircle,
  ShieldCheck,
  Square,
  Star,
  User,
  Users,
  Zap,
  Mail,
  Phone,
  Send,
} from "lucide-react";
import {
  findTutorById,
  formatDayLabel,
  formatGradeLabel,
  formatTimeRange,
  getPrimaryDemoVideo,
} from "@/lib/tutors";
import type {
  GroupClass,
  IndividualClass,
} from "@/types/tutor";

type BookingFormState = { studentName: string; studentEmail: string; studentPhone: string };

/* ─── Booking Steps ─── */
const STEPS = ["Choose Classes", "Pick Schedule", "Your Details", "Confirm"] as const;
type Step = 0 | 1 | 2 | 3;

export default function TutorProfile() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id;
  const tutorId = Array.isArray(rawId) ? rawId[0] : rawId;
  const tutor = useMemo(() => (tutorId ? findTutorById(tutorId) || null : null), [tutorId]);

  // Combine ALL classes from tutor into one flat list
  const allClasses = useMemo(() => {
    if (!tutor) return [];
    const individual: Array<IndividualClass | GroupClass> = tutor.individualClasses;
    const group: Array<IndividualClass | GroupClass> = tutor.groupClasses;
    return [...individual, ...group];
  }, [tutor]);

  // Extract unique values across all classes for filtering
  const uniqueSubjects = useMemo(() => Array.from(new Set(allClasses.map(c => c.subject))).sort(), [allClasses]);
  const uniqueGrades = useMemo(() => Array.from(new Set(allClasses.flatMap(c => c.grades))).sort((a, b) => formatGradeLabel(a).localeCompare(formatGradeLabel(b), undefined, { numeric: true })), [allClasses]);
  const uniqueMediums = useMemo(() => Array.from(new Set(allClasses.map(c => c.medium))).sort(), [allClasses]);
  const uniqueSyllabuses = useMemo(() => Array.from(new Set(allClasses.map(c => c.syllabus))).sort(), [allClasses]);

  const [currentStep, setCurrentStep] = useState<Step>(0);
  // Multi-select: store Set of class codes
  const [selectedClassCodes, setSelectedClassCodes] = useState<Set<string>>(new Set());
  // Per-class selections
  const [gradeByClass, setGradeByClass] = useState<Record<string, string>>({});
  const [durationByClass, setDurationByClass] = useState<Record<string, string>>({});
  const [slotsByClass, setSlotsByClass] = useState<Record<string, Set<string>>>({});
  const [bookingForm, setBookingForm] = useState<BookingFormState>({ studentName: "", studentEmail: "", studentPhone: "" });
  const [agreeRules, setAgreeRules] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  // All bookable classes (individual + group combined)
  const bookableClasses = allClasses;

  // Auto-set defaults for grade (single grade) and duration when a class is selected
  useEffect(() => {
    const newGrades = { ...gradeByClass };
    const newDurations = { ...durationByClass };
    let changed = false;

    for (const code of selectedClassCodes) {
      const cls = allClasses.find(c => c.classCode === code);
      if (!cls) continue;

      // Auto-set grade if class has only 1 grade
      if (!newGrades[code] && cls.grades.length === 1) {
        newGrades[code] = cls.grades[0];
        changed = true;
      }

      if (cls.classType !== "INDIVIDUAL") continue;
      const indCls = cls as IndividualClass;

      if (!newDurations[code] && indCls.pricing.length > 0) {
        newDurations[code] = String(indCls.pricing[0].durationMinutes);
        changed = true;
      }
    }

    if (changed) {
      setGradeByClass(newGrades);
      setDurationByClass(newDurations);
    }
  }, [selectedClassCodes, allClasses, gradeByClass, durationByClass]);

  // Toggle a slot for an individual class (multi-select)
  function toggleSlot(classCode: string, slotId: string) {
    setErrors(prev => { const n = { ...prev }; delete n[`slot-${classCode}`]; return n; });
    setSlotsByClass(prev => {
      const current = prev[classCode] || new Set<string>();
      const next = new Set(current);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return { ...prev, [classCode]: next };
    });
  }

  useEffect(() => { setActiveVideoIndex(0); }, [tutorId]);

  const videos = tutor?.profile.demoVideos || [];
  const currentVideo = tutor ? videos[activeVideoIndex] || getPrimaryDemoVideo(tutor.profile) : null;

  const selectedClasses = useMemo(() => (
    bookableClasses.filter(c => selectedClassCodes.has(c.classCode))
  ), [bookableClasses, selectedClassCodes]);

  // Toggle class selection
  function toggleClass(code: string) {
    setErrors(prev => { const n = { ...prev }; delete n.step0; return n; });
    setSelectedClassCodes(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  // Pricing helpers
  function getClassPrice(cls: IndividualClass | GroupClass) {
    if (cls.classType === "INDIVIDUAL") {
      const indCls = cls as IndividualClass;
      const dur = durationByClass[cls.classCode];
      const p = indCls.pricing.find(pr => String(pr.durationMinutes) === dur) || indCls.pricing[0];
      const slotCount = slotsByClass[cls.classCode]?.size || 1;
      return p ? { amount: p.amount, currency: p.currency, label: "per session", slotCount, total: p.amount * slotCount } : null;
    }
    const grp = cls as GroupClass;
    return { amount: grp.monthlyFee.amount, currency: grp.monthlyFee.currency, label: "per month", slotCount: 1, total: grp.monthlyFee.amount };
  }

  // Admission fee logic
  const hasIndividual = selectedClasses.some(c => c.classType === "INDIVIDUAL");
  const hasGroup = selectedClasses.some(c => c.classType === "GROUP");
  const admissionFee = hasIndividual && hasGroup ? 3500 : hasIndividual ? 2500 : hasGroup ? 1000 : 0;

  // Validation errors — keyed by field id (e.g. "step0", "grade-IND001", "slot-IND001", "studentName")
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validateStep0(): boolean {
    if (selectedClassCodes.size === 0) {
      setErrors({ step0: "Please select at least one class" });
      scrollToError("step0-error");
      return false;
    }
    setErrors({});
    return true;
  }

  function validateStep1(): boolean {
    const newErrors: Record<string, string> = {};
    for (const cls of selectedClasses) {
      if (cls.grades.length > 1 && !gradeByClass[cls.classCode]) {
        newErrors[`grade-${cls.classCode}`] = "Select your grade";
      }
      if (cls.classType === "INDIVIDUAL") {
        if (!durationByClass[cls.classCode]) {
          newErrors[`duration-${cls.classCode}`] = "Select a duration";
        }
        if (!(slotsByClass[cls.classCode]?.size > 0)) {
          newErrors[`slot-${cls.classCode}`] = "Select at least one time slot";
        }
      }
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      scrollToError(`${firstKey}-error`);
      return false;
    }
    return true;
  }

  function validateStep2(): boolean {
    const newErrors: Record<string, string> = {};
    if (!bookingForm.studentName.trim()) newErrors.studentName = "Enter your name";
    if (!bookingForm.studentEmail.trim()) newErrors.studentEmail = "Enter your email";
    if (!bookingForm.studentPhone.trim()) newErrors.studentPhone = "Enter your phone number";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      scrollToError(`${firstKey}-error`);
      return false;
    }
    return true;
  }

  function scrollToError(id: string) {
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  if (!tutor) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-blue-700" style={{ fontSize: "3rem", fontWeight: 900, lineHeight: 0.9 }}>Tutor not found</h1>
          <p className="mt-4 text-[#6b7280]" style={{ fontSize: "1.125rem", fontWeight: 500 }}>This profile could not be loaded.</p>
          <button onClick={() => router.push("/")} className="mt-8 inline-flex items-center gap-2 bg-blue-600 text-white font-bold text-sm cursor-pointer" style={{ padding: "14px 28px", borderRadius: "9999px", transition: "transform 200ms" }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")} onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </button>
        </div>
      </main>
    );
  }

  async function handleBookingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tutor || selectedClasses.length === 0) return;
    setIsSubmitting(true);
    try {
      // Submit each selected class as a booking
      for (const cls of selectedClasses) {
        const indCls = cls.classType === "INDIVIDUAL" ? cls as IndividualClass : null;
        const grpCls = cls.classType === "GROUP" ? cls as GroupClass : null;
        const dur = indCls ? durationByClass[cls.classCode] : null;
        const price = indCls?.pricing.find(p => String(p.durationMinutes) === dur) || indCls?.pricing[0];
        const selectedSlotIds = indCls ? Array.from(slotsByClass[cls.classCode] || []) : [];
        const selectedSlots = indCls?.availableWeeklySlots.filter(s => selectedSlotIds.includes(s.slotId)) || [];

        await fetch("/api/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tutorId: tutor.tutorId, tutorSlug: tutor.slug,
            studentName: bookingForm.studentName.trim(), studentEmail: bookingForm.studentEmail.trim(), studentPhone: bookingForm.studentPhone.trim(),
            classType: cls.classType === "INDIVIDUAL" ? "Individual" : "Group",
            classCode: cls.classCode, classTitle: cls.title,
            subject: cls.subject, grade: gradeByClass[cls.classCode] || cls.grades[0], medium: cls.medium, syllabus: cls.syllabus,
            durationMinutes: price?.durationMinutes || null,
            slotIds: selectedSlotIds.length > 0 ? selectedSlotIds : null,
            admissionFee,
          }),
        });
      }
      setBookingSuccess(true);
    } catch (error) { console.error(error); } finally { setIsSubmitting(false); }
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] pb-24" style={{ fontFeatureSettings: '"calt"' }}>

      {/* ═══════ HERO ═══════ */}
      <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 pb-28">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-bold text-white/80 cursor-pointer mb-8 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0 overflow-hidden" style={{ borderRadius: "20px", border: "3px solid rgba(255,255,255,0.2)" }}>
              <Image src={tutor.profile.avatarUrl || `https://i.pravatar.cc/150?u=${tutor.profile.fullName}`} alt={tutor.profile.fullName} fill className="object-cover" />
            </div>

            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 mb-2">
                <h1 className="text-white" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, lineHeight: 1 }}>
                  {tutor.profile.fullName}
                </h1>
                {tutor.isVerified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white px-2.5 py-1" style={{ borderRadius: "9999px", background: "rgba(255,255,255,0.2)" }}>
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-white/70 text-base font-semibold mb-4">{tutor.profile.headline || "EDUS Certified Tutor"}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-white/90 text-sm">
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold">{tutor.profile.rating || "5.0"}</span>
                  <span className="text-white/50">({tutor.profile.reviewCount || 0})</span>
                </div>
                {tutor.profile.qualifications?.[0] && (
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-white/50" />
                    <span className="font-semibold">{tutor.profile.qualifications[0]}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-white/50" />
                  <span className="font-semibold">{tutor.profile.subjects.join(", ")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 -mt-16 relative z-10 space-y-6">

        {/* ═══════ 1. ABOUT ═══════ */}
        {(tutor.profile.about || (tutor.profile.qualifications?.length ?? 0) > 0 || (tutor.profile.teachingStyle?.length ?? 0) > 0) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-white p-6 sm:p-8" style={{ borderRadius: "24px", boxShadow: "0 20px 60px rgba(14,15,12,0.08), rgba(14,15,12,0.12) 0px 0px 0px 1px" }}>

            <h3 className="flex items-center gap-2 font-bold text-blue-700 mb-5" style={{ fontSize: "1.125rem" }}>
              <BookOpen className="h-5 w-5" /> About {tutor.profile.fullName}
            </h3>

            {tutor.profile.about && (
              <p className="text-[#374151] text-[15px] leading-relaxed mb-6" style={{ fontWeight: 500 }}>{tutor.profile.about}</p>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ChipGroup label="Subjects" items={uniqueSubjects} color="#2563eb" />
              <ChipGroup label="Mediums" items={uniqueMediums} color="#2563eb" />
              <ChipGroup label="Syllabus" items={uniqueSyllabuses} color="#2563eb" />
            </div>

            {uniqueGrades.length > 0 && (
              <div className="mt-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-700 mb-2">Grades</p>
                <div className="flex flex-wrap gap-1.5">
                  {uniqueGrades.map(g => (
                    <span key={g} className="text-xs font-semibold text-[#1e3a8a] px-2.5 py-1 bg-blue-50" style={{ borderRadius: "8px" }}>
                      {formatGradeLabel(g)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(tutor.profile.qualifications?.length ?? 0) > 0 && (
              <div className="mt-6 pt-5" style={{ borderTop: "1px solid #e5e7eb" }}>
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-700 mb-3">Qualifications</p>
                <div className="space-y-2">
                  {tutor.profile.qualifications!.map((q) => (
                    <div key={q} className="flex items-start gap-2.5 text-sm text-[#1f2937] font-medium">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-emerald-600 flex-shrink-0" />
                      {q}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(tutor.profile.teachingStyle?.length ?? 0) > 0 && (
              <div className="mt-5 pt-5" style={{ borderTop: "1px solid #e5e7eb" }}>
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-700 mb-3">Teaching Style</p>
                <div className="flex flex-wrap gap-2">
                  {tutor.profile.teachingStyle!.map((s) => (
                    <span key={s} className="flex items-center gap-1.5 text-xs font-semibold text-[#1f2937] px-3 py-2 bg-amber-50 border border-amber-200" style={{ borderRadius: "10px" }}>
                      <Zap className="h-3 w-3 text-amber-500" /> {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════ 2. DEMO VIDEOS (open by default) ═══════ */}
        {videos.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white overflow-hidden" style={{ borderRadius: "24px", boxShadow: "0 20px 60px rgba(14,15,12,0.08), rgba(14,15,12,0.12) 0px 0px 0px 1px" }}>
            <div className="p-6 sm:p-8">
              <h3 className="flex items-center gap-2 font-bold text-blue-700 mb-5" style={{ fontSize: "1.125rem" }}>
                <PlayCircle className="h-5 w-5" /> Demo Videos
                <span className="text-xs font-bold text-[#94a3b8] ml-1">({videos.length})</span>
              </h3>

              {currentVideo && (
                <div className="flex flex-col gap-5 lg:flex-row">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#1f2937] mb-2">{currentVideo.title} <span className="text-[#94a3b8] font-medium">&middot; {currentVideo.subject}</span></p>
                    <div className="relative aspect-video overflow-hidden bg-[#0e0f0c]" style={{ borderRadius: "16px" }}>
                      <iframe key={currentVideo.videoId} src={currentVideo.videoUrl} className="absolute inset-0 h-full w-full" allowFullScreen title={currentVideo.title} />
                    </div>
                  </div>
                  {videos.length > 1 && (
                    <div className="w-full lg:w-64 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-y-auto lg:max-h-[300px]">
                      {videos.map((v, i) => (
                        <button key={v.videoId} onClick={() => setActiveVideoIndex(i)}
                          className="flex items-center gap-2.5 p-2.5 min-w-[180px] lg:min-w-0 cursor-pointer text-left flex-shrink-0" style={{
                            borderRadius: "12px",
                            background: activeVideoIndex === i ? "rgba(37,99,235,0.06)" : "#f8fafc",
                            border: activeVideoIndex === i ? "2px solid #2563eb" : "2px solid transparent",
                            transition: "all 200ms",
                          }}>
                          <div className="w-12 h-8 flex items-center justify-center bg-[#0e0f0c] flex-shrink-0" style={{ borderRadius: "6px" }}>
                            <PlayCircle className="h-4 w-4 text-white/70" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold truncate" style={{ color: activeVideoIndex === i ? "#2563eb" : "#1f2937" }}>{v.title}</p>
                            <p className="text-[10px] text-[#94a3b8] font-medium">{v.subject}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══════ 3. BOOKING WIZARD ═══════ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          id="booking"
          className="bg-white overflow-hidden" style={{ borderRadius: "24px", boxShadow: "0 20px 60px rgba(14,15,12,0.08), rgba(14,15,12,0.12) 0px 0px 0px 1px" }}>

          {bookingSuccess ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-12 flex flex-col items-center text-center">
              <div className="w-20 h-20 flex items-center justify-center mb-6" style={{ borderRadius: "9999px", background: "rgba(5,150,105,0.1)" }}>
                <CheckCircle className="h-10 w-10 text-emerald-600" />
              </div>
              <h2 className="text-blue-700" style={{ fontSize: "2rem", fontWeight: 900, lineHeight: 1 }}>You&apos;re all set!</h2>
              <p className="mt-3 text-[#6b7280] max-w-md" style={{ fontSize: "1rem", fontWeight: 500, lineHeight: 1.6 }}>
                Thank you, <strong className="text-[#1f2937]">{bookingForm.studentName}</strong>. Your booking for <strong className="text-[#1f2937]">{selectedClasses.length} class{selectedClasses.length > 1 ? "es" : ""}</strong> with <strong className="text-[#1f2937]">{tutor.profile.fullName}</strong> has been submitted.
              </p>
              <div className="flex gap-3 mt-8">
                <button onClick={() => router.push("/")} className="px-6 py-3 text-sm font-bold text-[#374151] bg-[#f1f5f9] cursor-pointer" style={{ borderRadius: "9999px", transition: "transform 200ms" }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")} onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
                  Back to Home
                </button>
                <button onClick={() => { setBookingSuccess(false); setCurrentStep(0); setSelectedClassCodes(new Set()); setBookingForm({ studentName: "", studentEmail: "", studentPhone: "" }); setAgreeRules(false); }}
                  className="px-6 py-3 text-sm font-bold text-white bg-blue-600 cursor-pointer" style={{ borderRadius: "9999px", transition: "transform 200ms" }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")} onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
                  Book Another
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Step indicator */}
              <div className="px-6 sm:px-10 pt-8 pb-2">
                <h3 className="font-bold text-blue-700 mb-4" style={{ fontSize: "1.125rem" }}>Book a Class</h3>
                <div className="flex items-center justify-between mb-2">
                  {STEPS.map((label, idx) => (
                    <div key={label} className="flex items-center flex-1 last:flex-none">
                      <button onClick={() => { if (idx <= currentStep) setCurrentStep(idx as Step); }} className="flex items-center gap-2 cursor-pointer" style={{ opacity: idx <= currentStep ? 1 : 0.35 }}>
                        <div className="w-8 h-8 flex items-center justify-center text-xs font-black" style={{
                          borderRadius: "9999px",
                          background: idx <= currentStep ? "#2563eb" : "#e2e8f0",
                          color: idx <= currentStep ? "#fff" : "#94a3b8",
                          transition: "all 300ms ease",
                        }}>
                          {idx < currentStep ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                        </div>
                        <span className="text-xs font-bold hidden sm:block" style={{ color: idx <= currentStep ? "#1e3a8a" : "#94a3b8" }}>{label}</span>
                      </button>
                      {idx < STEPS.length - 1 && (
                        <div className="flex-1 h-[2px] mx-3" style={{ background: idx < currentStep ? "#2563eb" : "#e2e8f0", transition: "background 300ms ease" }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 sm:px-10 pb-8">
                <AnimatePresence mode="wait">
                  {/* ─── STEP 0: Choose Classes (multi-select) ─── */}
                  {currentStep === 0 && (
                    <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                      <p className="text-[#6b7280] text-sm font-medium mb-4">Select one or more classes to enroll in.</p>

                      {/* Class list with checkboxes — shows ALL classes (individual + group) */}
                      <div className="grid gap-3">
                        {bookableClasses.map((c) => {
                          const isIndividual = c.classType === "INDIVIDUAL";
                          const price = isIndividual
                            ? (c as IndividualClass).pricing.reduce((low, cur) => cur.amount < low.amount ? cur : low, (c as IndividualClass).pricing[0])
                            : null;
                          const groupClass = !isIndividual ? (c as GroupClass) : null;
                          const isChecked = selectedClassCodes.has(c.classCode);

                          return (
                            <button key={c.classCode} type="button" onClick={() => toggleClass(c.classCode)}
                              className="w-full text-left cursor-pointer p-5" style={{
                                borderRadius: "16px",
                                border: isChecked ? "2px solid #2563eb" : "2px solid #e5e7eb",
                                background: isChecked ? "rgba(37,99,235,0.04)" : "#fff",
                                transition: "all 200ms ease",
                              }}>
                              <div className="flex items-start gap-3">
                                {/* Checkbox */}
                                <div className="mt-0.5 flex-shrink-0">
                                  {isChecked
                                    ? <CheckSquare className="h-5 w-5 text-blue-600" />
                                    : <Square className="h-5 w-5 text-[#d1d5db]" />
                                  }
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] px-2 py-0.5" style={{
                                      borderRadius: "6px",
                                      background: isIndividual ? "#dbeafe" : "#d1fae5",
                                      color: isIndividual ? "#1e40af" : "#065f46",
                                    }}>
                                      {isIndividual ? "Individual" : "Group"}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#94a3b8]">{c.subject}</span>
                                  </div>
                                  <h4 className="text-[#1f2937] font-bold text-[15px]">{c.title}</h4>
                                  <p className="text-[#6b7280] text-xs font-medium mt-0.5">
                                    {c.grades.map(formatGradeLabel).join(", ")} &middot; {c.medium} &middot; {c.syllabus}
                                  </p>
                                </div>

                                <div className="text-right flex-shrink-0">
                                  <p className="text-blue-700" style={{ fontSize: "1.125rem", fontWeight: 900 }}>
                                    {price ? `${price.currency} ${price.amount}` : `${groupClass?.monthlyFee.currency} ${groupClass?.monthlyFee.amount}`}
                                  </p>
                                  <p className="text-[11px] text-[#6b7280] font-medium">
                                    {isIndividual ? "per session" : "per month"}
                                    {groupClass && ` \u00B7 ${groupClass.seatsLeft} seats`}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {selectedClassCodes.size > 0 && (
                        <p className="mt-3 text-xs text-blue-700 font-semibold">{selectedClassCodes.size} class{selectedClassCodes.size > 1 ? "es" : ""} selected</p>
                      )}

                      {errors.step0 && <p id="step0-error" className="text-red-500 text-xs font-semibold mt-3">{errors.step0}</p>}
                      <StepNav onNext={() => { if (validateStep0()) setCurrentStep(1); }} />
                    </motion.div>
                  )}

                  {/* ─── STEP 1: Schedule (per selected class) ─── */}
                  {currentStep === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                      <p className="text-[#6b7280] text-sm font-medium mb-5">Configure schedule for each selected class.</p>

                      <div className="space-y-6">
                        {selectedClasses.map((cls) => {
                          const indCls = cls.classType === "INDIVIDUAL" ? cls as IndividualClass : null;
                          const grpCls = cls.classType === "GROUP" ? cls as GroupClass : null;

                          return (
                            <div key={cls.classCode} className="p-5" style={{ borderRadius: "16px", border: "1px solid #e5e7eb", background: "#fafbfc" }}>
                              <div className="flex items-center gap-2 mb-4">
                                <span className="text-[10px] font-bold uppercase tracking-[0.15em] px-2 py-0.5" style={{
                                  borderRadius: "6px",
                                  background: indCls ? "#dbeafe" : "#d1fae5",
                                  color: indCls ? "#1e40af" : "#065f46",
                                }}>
                                  {indCls ? "Individual" : "Group"}
                                </span>
                                <h4 className="text-sm font-bold text-[#1f2937]">{cls.title}</h4>
                                <span className="text-xs text-[#6b7280]">&middot; {cls.subject}</span>
                              </div>

                              {/* Grade selector */}
                              <div className="mb-4">
                                <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-700 block mb-2">Your Grade</label>
                                <div className="flex flex-wrap gap-2">
                                  {cls.grades
                                    .slice()
                                    .sort((a, b) => formatGradeLabel(a).localeCompare(formatGradeLabel(b), undefined, { numeric: true }))
                                    .map((g) => {
                                    const isSelected = (gradeByClass[cls.classCode] || (cls.grades.length === 1 ? cls.grades[0] : "")) === g;
                                    return (
                                      <button key={g} type="button"
                                        onClick={() => { setGradeByClass(prev => ({ ...prev, [cls.classCode]: g })); setErrors(prev => { const n = { ...prev }; delete n[`grade-${cls.classCode}`]; return n; }); }}
                                        className="py-2.5 px-4 text-center cursor-pointer text-sm" style={{
                                          borderRadius: "10px",
                                          border: isSelected ? "2px solid #2563eb" : "2px solid #e5e7eb",
                                          background: isSelected ? "#eff6ff" : "#fff",
                                          color: isSelected ? "#1e3a8a" : "#374151",
                                          fontWeight: 700, transition: "all 200ms ease",
                                        }}>
                                        <GraduationCap className="h-3.5 w-3.5 inline mr-1 text-blue-600" />{formatGradeLabel(g)}
                                      </button>
                                    );
                                  })}
                                </div>
                                {errors[`grade-${cls.classCode}`] && (
                                  <p id={`grade-${cls.classCode}-error`} className="text-red-500 text-xs font-semibold mt-1.5">{errors[`grade-${cls.classCode}`]}</p>
                                )}
                              </div>

                              {indCls && (
                                <>
                                  {/* Duration */}
                                  <div className="mb-4">
                                    <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-700 block mb-2">Duration</label>
                                    <div className="flex flex-wrap gap-2">
                                      {indCls.pricing.map((p) => (
                                        <button key={p.durationMinutes} type="button"
                                          onClick={() => { setDurationByClass(prev => ({ ...prev, [cls.classCode]: String(p.durationMinutes) })); setErrors(prev => { const n = { ...prev }; delete n[`duration-${cls.classCode}`]; return n; }); }}
                                          className="py-2.5 px-4 text-center cursor-pointer text-sm" style={{
                                            borderRadius: "10px",
                                            border: durationByClass[cls.classCode] === String(p.durationMinutes) ? "2px solid #2563eb" : "2px solid #e5e7eb",
                                            background: durationByClass[cls.classCode] === String(p.durationMinutes) ? "#eff6ff" : "#fff",
                                            color: durationByClass[cls.classCode] === String(p.durationMinutes) ? "#1e3a8a" : "#374151",
                                            fontWeight: 700, transition: "all 200ms ease",
                                          }}>
                                          <Clock3 className="h-3.5 w-3.5 inline mr-1 text-blue-600" />{p.durationMinutes}m &middot; {p.currency} {p.amount}
                                        </button>
                                      ))}
                                    </div>
                                    {errors[`duration-${cls.classCode}`] && (
                                      <p id={`duration-${cls.classCode}-error`} className="text-red-500 text-xs font-semibold mt-1.5">{errors[`duration-${cls.classCode}`]}</p>
                                    )}
                                  </div>

                                  {/* Time slots (multi-select) */}
                                  <div>
                                    <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-700 block mb-1">Time Slots</label>
                                    <p className="text-[11px] text-[#94a3b8] font-medium mb-2">Select one or more slots</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {indCls.availableWeeklySlots.filter(s => s.isAvailable).map((slot) => {
                                        const isSelected = slotsByClass[cls.classCode]?.has(slot.slotId) ?? false;
                                        return (
                                          <button key={slot.slotId} type="button"
                                            onClick={() => toggleSlot(cls.classCode, slot.slotId)}
                                            className="flex items-center gap-3 p-3 text-left cursor-pointer" style={{
                                              borderRadius: "10px",
                                              border: isSelected ? "2px solid #2563eb" : "2px solid #e5e7eb",
                                              background: isSelected ? "#eff6ff" : "#fff",
                                              transition: "all 200ms ease",
                                            }}>
                                            <div className="flex-shrink-0">
                                              {isSelected
                                                ? <CheckSquare className="h-4 w-4 text-blue-600" />
                                                : <Square className="h-4 w-4 text-[#d1d5db]" />
                                              }
                                            </div>
                                            <div>
                                              <p className="font-bold text-xs text-[#1f2937]">{formatDayLabel(slot.day)}</p>
                                              <p className="text-[11px] text-[#6b7280] font-medium">{formatTimeRange(slot.startTime, slot.endTime)}</p>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                    {(slotsByClass[cls.classCode]?.size ?? 0) > 0 && (
                                      <p className="mt-2 text-xs text-blue-700 font-semibold">{slotsByClass[cls.classCode].size} slot{slotsByClass[cls.classCode].size > 1 ? "s" : ""} selected</p>
                                    )}
                                    {errors[`slot-${cls.classCode}`] && (
                                      <p id={`slot-${cls.classCode}-error`} className="text-red-500 text-xs font-semibold mt-1.5">{errors[`slot-${cls.classCode}`]}</p>
                                    )}
                                  </div>
                                </>
                              )}

                              {grpCls && (
                                <>
                                  <div className="grid gap-2">
                                    {grpCls.fixedTimetable.map((sch, idx) => (
                                      <div key={`${sch.day}-${idx}`} className="flex items-center gap-3 p-3 bg-white" style={{ borderRadius: "10px", border: "1px solid #e5e7eb" }}>
                                        <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                        <div>
                                          <p className="font-bold text-xs text-[#1f2937]">{formatDayLabel(sch.day)}</p>
                                          <p className="text-[11px] text-[#6b7280] font-medium">{formatTimeRange(sch.startTime, sch.endTime)}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-3 flex items-center justify-between text-sm p-3 bg-blue-50" style={{ borderRadius: "10px" }}>
                                    <span className="flex items-center gap-1.5 font-semibold text-blue-700"><Users className="h-4 w-4" /> {grpCls.seatsLeft} seats left</span>
                                    <span className="font-black text-blue-700">{grpCls.monthlyFee.currency} {grpCls.monthlyFee.amount}/mo</span>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <StepNav onNext={() => { if (validateStep1()) setCurrentStep(2); }} onBack={() => setCurrentStep(0)} />
                    </motion.div>
                  )}

                  {/* ─── STEP 2: Student Details ─── */}
                  {currentStep === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                      <p className="text-[#6b7280] text-sm font-medium mb-6">Enter student contact details.</p>
                      <div className="space-y-4">
                        <InputField icon={<User className="h-4 w-4" />} label="Student Name" id="studentName" type="text" required
                          value={bookingForm.studentName} onChange={(e) => { setBookingForm({ ...bookingForm, studentName: e.target.value }); setErrors(prev => { const n = { ...prev }; delete n.studentName; return n; }); }} placeholder="e.g. Kasun Perera" error={errors.studentName} />
                        <InputField icon={<Mail className="h-4 w-4" />} label="Email Address" id="studentEmail" type="email" required
                          value={bookingForm.studentEmail} onChange={(e) => { setBookingForm({ ...bookingForm, studentEmail: e.target.value }); setErrors(prev => { const n = { ...prev }; delete n.studentEmail; return n; }); }} placeholder="kasun@email.com" error={errors.studentEmail} />
                        <InputField icon={<Phone className="h-4 w-4" />} label="Phone Number" id="studentPhone" type="tel" required
                          value={bookingForm.studentPhone} onChange={(e) => { setBookingForm({ ...bookingForm, studentPhone: e.target.value.replace(/\D/g, "") }); setErrors(prev => { const n = { ...prev }; delete n.studentPhone; return n; }); }} placeholder="94707072072" error={errors.studentPhone}
                          hint="Digits only, starting with country code" />
                      </div>
                      <StepNav onNext={() => { if (validateStep2()) setCurrentStep(3); }} onBack={() => setCurrentStep(1)} />
                    </motion.div>
                  )}

                  {/* ─── STEP 3: Confirm ─── */}
                  {currentStep === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                      <form onSubmit={handleBookingSubmit}>
                        {/* Summary */}
                        <div className="p-5 mb-5" style={{ borderRadius: "16px", background: "#0f172a", color: "#fff" }}>
                          <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                            <span className="text-xs font-bold uppercase tracking-[0.15em] text-white/50">Booking Summary</span>
                            <span className="text-xs font-bold px-2.5 py-1 text-white/80" style={{ borderRadius: "9999px", background: "rgba(255,255,255,0.1)" }}>{selectedClasses.length} class{selectedClasses.length > 1 ? "es" : ""}</span>
                          </div>

                          <div className="space-y-3 text-sm">
                            <SummaryRow label="Student" value={bookingForm.studentName} />
                            <SummaryRow label="Email" value={bookingForm.studentEmail} />
                            <SummaryRow label="Phone" value={bookingForm.studentPhone} />
                            <div className="my-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

                            {selectedClasses.map((cls) => {
                              const p = getClassPrice(cls);
                              const indCls = cls.classType === "INDIVIDUAL" ? cls as IndividualClass : null;
                              const classSlotIds = indCls ? Array.from(slotsByClass[cls.classCode] || []) : [];
                              const classSlots = indCls?.availableWeeklySlots.filter(s => classSlotIds.includes(s.slotId)) || [];
                              return (
                                <div key={cls.classCode} className="p-3" style={{ borderRadius: "10px", background: "rgba(255,255,255,0.05)" }}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-white text-sm">{cls.title}</span>
                                    <div className="text-right flex-shrink-0">
                                      {indCls && p && p.slotCount > 1 ? (
                                        <>
                                          <span className="font-black text-white">{p.currency} {p.total.toLocaleString()}</span>
                                          <p className="text-white/40 text-[10px]">{p.slotCount} slots &times; {p.currency} {p.amount}/session</p>
                                        </>
                                      ) : (
                                        <span className="font-black text-white">{p?.currency} {p?.amount}<span className="text-white/40 text-xs font-medium"> /{p?.label === "per session" ? "session" : "mo"}</span></span>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-white/40 text-xs">{cls.subject} &middot; {cls.medium} &middot; {cls.syllabus}</p>
                                  <p className="text-white/60 text-xs font-semibold mt-0.5"><GraduationCap className="h-3 w-3 inline mr-1" />{formatGradeLabel(gradeByClass[cls.classCode] || cls.grades[0])}</p>
                                  {indCls && classSlots.length > 0 && (
                                    <div className="mt-1 space-y-0.5">
                                      <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">{durationByClass[cls.classCode]}min &middot; {classSlots.length} slot{classSlots.length > 1 ? "s" : ""}</p>
                                      {classSlots.map(slot => (
                                        <p key={slot.slotId} className="text-white/40 text-xs">{formatDayLabel(slot.day)} {formatTimeRange(slot.startTime, slot.endTime)}</p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Admission Fee */}
                            <div className="my-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />
                            <div className="p-3" style={{ borderRadius: "10px", background: "rgba(255,255,255,0.05)" }}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-semibold text-white text-sm">Admission Fee</span>
                                  <span className="text-white/40 text-xs ml-2">(one-time)</span>
                                  <p className="text-white/40 text-xs mt-0.5">
                                    {hasIndividual && hasGroup ? "Individual + Group" : hasIndividual ? "Individual classes" : "Group classes"}
                                  </p>
                                </div>
                                <span className="font-black text-white">LKR {admissionFee.toLocaleString()}</span>
                              </div>
                            </div>

                            {/* Total Due Now */}
                            <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
                              <span className="text-xs font-bold uppercase tracking-[0.15em] text-white/60">Total Due Now</span>
                              <span style={{ fontSize: "1.25rem", fontWeight: 900 }} className="text-white">
                                LKR {(admissionFee + selectedClasses.reduce((sum, cls) => sum + (getClassPrice(cls)?.total ?? 0), 0)).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-white/30 text-[10px] mt-1 text-right">Admission fee + first session/month for each class</p>
                          </div>
                        </div>

                        {/* Class rules */}
                        <div className="mb-4 p-5" style={{ borderRadius: "14px", background: "#fffbeb", border: "1px solid #fef08a" }}>
                          <p className="text-xs font-bold text-amber-700 uppercase tracking-[0.1em] mb-3">Academic & Online Learning Standards</p>
                          <p className="text-xs text-amber-900 mb-4" style={{ fontWeight: 500, lineHeight: 1.6 }}>
                            Please read carefully and accept to continue to join our classes. We need this acceptance to maintain our Academic and Online Learning Standards. Your understanding in this is highly appreciated.
                          </p>
                          <ol className="space-y-2.5 text-xs text-amber-900" style={{ fontWeight: 500, lineHeight: 1.6 }}>
                            {[
                              "Your Internet Connection and device has to be fit for Online learning.",
                              "Your attendance to class will be strictly monitored. Failure to attend more than 3 consecutive classes will be resulting in dropout from classes.",
                              "Student must answer and respond to questions from tutor while learning. You\u2019ll be removed from class if not responding.",
                              "You have to ask and discuss all your subject related doubts during the class.",
                              "Students are requested to complete all required academic works by the tutor on time without fail.",
                            ].map((r, i) => (
                              <li key={i} className="flex items-start gap-2.5"><span className="font-black text-amber-700 flex-shrink-0">{i + 1}.</span>{r}</li>
                            ))}
                          </ol>
                          <p className="text-xs text-amber-800 mt-4 pt-3" style={{ fontWeight: 600, lineHeight: 1.6, borderTop: "1px solid #fde68a" }}>
                            Our coordinator will help you all the ways possible for you to peacefully study to achieve excellence in your learning at EDUS.
                          </p>
                        </div>

                        <label className="flex items-start gap-3 p-4 cursor-pointer mb-5" style={{ borderRadius: "14px", background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                          <input type="checkbox" checked={agreeRules} onChange={(e) => setAgreeRules(e.target.checked)} className="mt-0.5 h-4 w-4 accent-blue-600 cursor-pointer" />
                          <span className="text-xs text-blue-900 font-medium leading-relaxed">I have read and agree to the Academic & Online Learning Standards above, and I understand that an EDUS coordinator will contact me to confirm enrolment.</span>
                        </label>

                        <div className="flex gap-3">
                          <button type="button" onClick={() => setCurrentStep(2)} className="px-5 py-3.5 text-sm font-bold text-[#6b7280] bg-[#f1f5f9] cursor-pointer flex-shrink-0"
                            style={{ borderRadius: "14px", transition: "transform 200ms" }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")} onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
                            <ArrowLeft className="h-4 w-4 inline mr-1" /> Back
                          </button>
                          <button type="submit" disabled={isSubmitting || !agreeRules || selectedClasses.length === 0}
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-white bg-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ borderRadius: "14px", transition: "transform 200ms" }}
                            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = "scale(1.03)"; }}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
                            {isSubmitting ? "Processing..." : <><Send className="h-4 w-4" /> Confirm & Enroll</>}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </main>
  );
}

/* ═══════ Sub-components ═══════ */

function StepNav({ onNext, onBack }: { readonly onNext: () => void; readonly onBack?: () => void }) {
  return (
    <div className="flex gap-3 mt-8">
      {onBack && (
        <button type="button" onClick={onBack} className="px-5 py-3 text-sm font-bold text-[#6b7280] bg-[#f1f5f9] cursor-pointer"
          style={{ borderRadius: "14px", transition: "transform 200ms" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")} onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
          <ArrowLeft className="h-4 w-4 inline mr-1" /> Back
        </button>
      )}
      <button type="button" onClick={onNext}
        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-blue-600 cursor-pointer"
        style={{ borderRadius: "14px", transition: "transform 200ms" }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
        Continue <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function InputField({ icon, label, hint, error, ...props }: { readonly icon: ReactNode; readonly label: string; readonly hint?: string; readonly error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={props.id} className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-700 block mb-2">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]">{icon}</div>
        <input {...props}
          className="w-full pl-11 pr-4 py-3.5 text-sm font-semibold text-[#1f2937] bg-[#f8fafc] placeholder-[#94a3b8] focus:outline-none"
          style={{ borderRadius: "14px", border: error ? "2px solid #ef4444" : "2px solid #e5e7eb", transition: "border-color 200ms" }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#2563eb"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = error ? "#ef4444" : "#e5e7eb"; }}
        />
      </div>
      {error && <p id={`${props.id}-error`} className="text-red-500 text-xs font-semibold mt-1.5">{error}</p>}
      {hint && !error && <p className="text-[10px] text-[#94a3b8] mt-1 ml-1">{hint}</p>}
    </div>
  );
}

function SummaryRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/40 font-medium">{label}</span>
      <span className="text-white font-semibold text-right truncate">{value}</span>
    </div>
  );
}

function ChipGroup({ label, items, color }: { readonly label: string; readonly items: string[]; readonly color: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color }}>{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="text-xs font-semibold text-[#1e3a8a] px-2.5 py-1 bg-blue-50" style={{ borderRadius: "8px" }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
