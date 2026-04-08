"use client";

import { useEffect, useMemo, useState, useCallback, type FormEvent, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Layers,
  Mail,
  MapPin,
  Phone,
  PlayCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  Users,
  Zap,
} from "lucide-react";
import {
  findTutorById,
  formatDayLabel,
  formatGradeLabel,
  formatTimeRange,
  getPrimaryDemoVideo,
} from "@/lib/tutors";
import type { GroupClass, IndividualClass } from "@/types/tutor";

type BookingFormState = { studentName: string; studentEmail: string; studentPhone: string };
const STEPS = ["Choose Classes", "Pick Schedule", "Your Details", "Confirm"] as const;
type Step = 0 | 1 | 2 | 3;

/* ══════════════════════════════════════════════════════════════
   TUTOR PROFILE PAGE
   ══════════════════════════════════════════════════════════════ */
export default function TutorProfile() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id;
  const tutorId = Array.isArray(rawId) ? rawId[0] : rawId;
  const tutor = useMemo(() => (tutorId ? findTutorById(tutorId) || null : null), [tutorId]);

  const allClasses = useMemo(() => {
    if (!tutor) return [];
    const individual: Array<IndividualClass | GroupClass> = tutor.individualClasses;
    const group: Array<IndividualClass | GroupClass> = tutor.groupClasses;
    const combined = [...individual, ...group];
    // De-duplicate: keep first occurrence when title+subject+medium+grades match
    const seen = new Set<string>();
    return combined.filter(c => {
      const key = `${c.title}|${c.subject}|${c.medium}|${c.grades.join(",")}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [tutor]);

  const uniqueSubjects = useMemo(() => Array.from(new Set(allClasses.map(c => c.subject))).sort(), [allClasses]);
  const uniqueGrades = useMemo(() => Array.from(new Set(allClasses.flatMap(c => c.grades))).sort((a, b) => formatGradeLabel(a).localeCompare(formatGradeLabel(b), undefined, { numeric: true })), [allClasses]);
  const uniqueMediums = useMemo(() => Array.from(new Set(allClasses.map(c => c.medium))).sort(), [allClasses]);
  const uniqueSyllabuses = useMemo(() => Array.from(new Set(allClasses.map(c => c.syllabus))).sort(), [allClasses]);

  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [selectedClassCodes, setSelectedClassCodes] = useState<Set<string>>(new Set());
  const [gradeByClass, setGradeByClass] = useState<Record<string, string>>({});
  const [durationByClass, setDurationByClass] = useState<Record<string, string>>({});
  const [slotsByClass, setSlotsByClass] = useState<Record<string, Set<string>>>({});
  const [bookingForm, setBookingForm] = useState<BookingFormState>({ studentName: "", studentEmail: "", studentPhone: "" });
  const [agreeRules, setAgreeRules] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarError, setAvatarError] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const bookableClasses = allClasses;

  useEffect(() => {
    const newGrades = { ...gradeByClass };
    const newDurations = { ...durationByClass };
    let changed = false;
    for (const code of selectedClassCodes) {
      const cls = allClasses.find(c => c.classCode === code);
      if (!cls) continue;
      if (!newGrades[code] && cls.grades.length === 1) { newGrades[code] = cls.grades[0]; changed = true; }
      if (cls.classType !== "INDIVIDUAL") continue;
      const indCls = cls as IndividualClass;
      if (!newDurations[code] && indCls.pricing.length > 0) { newDurations[code] = String(indCls.pricing[0].durationMinutes); changed = true; }
    }
    if (changed) { setGradeByClass(newGrades); setDurationByClass(newDurations); }
  }, [selectedClassCodes, allClasses, gradeByClass, durationByClass]);

  function toggleSlot(classCode: string, slotId: string) {
    setErrors(prev => { const n = { ...prev }; delete n[`slot-${classCode}`]; return n; });
    setSlotsByClass(prev => {
      const current = prev[classCode] || new Set<string>();
      const next = new Set(current);
      if (next.has(slotId)) next.delete(slotId); else next.add(slotId);
      return { ...prev, [classCode]: next };
    });
  }

  useEffect(() => { setActiveVideoIndex(0); }, [tutorId]);

  const videos = tutor?.profile.demoVideos || [];
  const currentVideo = tutor ? videos[activeVideoIndex] || getPrimaryDemoVideo(tutor.profile) : null;

  const selectedClasses = useMemo(() => (
    bookableClasses.filter(c => selectedClassCodes.has(c.classCode))
  ), [bookableClasses, selectedClassCodes]);

  function toggleClass(code: string) {
    setErrors(prev => { const n = { ...prev }; delete n.step0; return n; });
    setSelectedClassCodes(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  }

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

  const hasIndividual = selectedClasses.some(c => c.classType === "INDIVIDUAL");
  const hasGroup = selectedClasses.some(c => c.classType === "GROUP");
  const admissionFee = hasIndividual && hasGroup ? 3500 : hasIndividual ? 2500 : hasGroup ? 1000 : 0;

  function validateStep0(): boolean {
    if (selectedClassCodes.size === 0) { setErrors({ step0: "Please select at least one class" }); scrollToError("step0-error"); return false; }
    setErrors({}); return true;
  }
  function validateStep1(): boolean {
    const newErrors: Record<string, string> = {};
    for (const cls of selectedClasses) {
      if (cls.grades.length > 1 && !gradeByClass[cls.classCode]) newErrors[`grade-${cls.classCode}`] = "Select your grade";
      if (cls.classType === "INDIVIDUAL") {
        if (!durationByClass[cls.classCode]) newErrors[`duration-${cls.classCode}`] = "Select a duration";
        if (!(slotsByClass[cls.classCode]?.size > 0)) newErrors[`slot-${cls.classCode}`] = "Select at least one time slot";
      }
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) { scrollToError(`${Object.keys(newErrors)[0]}-error`); return false; }
    return true;
  }
  function validateStep2(): boolean {
    const newErrors: Record<string, string> = {};
    if (!bookingForm.studentName.trim()) newErrors.studentName = "Enter your name";
    if (!bookingForm.studentEmail.trim()) newErrors.studentEmail = "Enter your email";
    if (!bookingForm.studentPhone.trim()) newErrors.studentPhone = "Enter your phone number";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) { scrollToError(`${Object.keys(newErrors)[0]}-error`); return false; }
    return true;
  }
  function scrollToError(id: string) { setTimeout(() => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" }); }, 50); }

  if (!tutor) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center" style={{ borderRadius: "20px", background: "#f1f5f9" }}>
            <User className="h-8 w-8 text-[#94a3b8]" />
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}>Tutor not found</h1>
          <p className="mt-2" style={{ color: "#64748b", fontSize: "1rem" }}>This profile could not be loaded.</p>
          <button onClick={() => router.push("/")} className="mt-8 inline-flex items-center gap-2 text-white font-bold text-sm cursor-pointer" style={{ padding: "14px 28px", borderRadius: "14px", background: "#2563eb" }}>
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
      for (const cls of selectedClasses) {
        const indCls = cls.classType === "INDIVIDUAL" ? cls as IndividualClass : null;
        const dur = indCls ? durationByClass[cls.classCode] : null;
        const price = indCls?.pricing.find(p => String(p.durationMinutes) === dur) || indCls?.pricing[0];
        const selectedSlotIds = indCls ? Array.from(slotsByClass[cls.classCode] || []) : [];
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

  const lowestIndividualPrice = allClasses
    .filter(c => c.classType === "INDIVIDUAL")
    .flatMap(c => (c as IndividualClass).pricing)
    .reduce((min, p) => p.amount < min ? p.amount : min, Infinity);
  const lowestGroupPrice = allClasses
    .filter(c => c.classType === "GROUP")
    .map(c => (c as GroupClass).monthlyFee.amount)
    .reduce((min, a) => a < min ? a : min, Infinity);

  const fallbackAvatar = `https://i.pravatar.cc/300?u=${encodeURIComponent(tutor.profile.fullName)}`;
  // Use original URL on server + initial render, switch to fallback only after client-side error
  const avatarSrc = (mounted && avatarError) ? fallbackAvatar : (tutor.profile.avatarUrl || fallbackAvatar);

  const initials = tutor.profile.fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <main className="min-h-screen bg-white" style={{ fontFeatureSettings: '"calt"' }}>

      {/* ══════════ HERO ══════════ */}
      <section className="relative" style={{ background: "linear-gradient(165deg, #0c1b3a 0%, #162d5a 40%, #1e40af 100%)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 70% 0%, rgba(59,130,246,0.25) 0%, transparent 60%)" }} />

        <div className="relative mx-auto max-w-5xl px-5 sm:px-8 lg:px-10">
          {/* Nav */}
          <div className="pt-4 pb-8 sm:pt-6 sm:pb-12">
            <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-blue-300/70 cursor-pointer hover:text-white transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          </div>

          {/* Profile row */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-7 pb-8 sm:pb-10">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] overflow-hidden relative" style={{ borderRadius: "22px", border: "3px solid rgba(255,255,255,0.15)", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
                <Image
                  src={avatarSrc}
                  alt={tutor.profile.fullName}
                  fill
                  className="object-cover"
                  onError={() => setAvatarError(true)}
                />
              </div>
              {tutor.isVerified && (
                <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 flex items-center justify-center" style={{ borderRadius: "9px", background: "#22c55e", boxShadow: "0 2px 8px rgba(34,197,94,0.5)", border: "2px solid #162d5a" }}>
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="text-center sm:text-left flex-1 min-w-0 pb-1">
              <h1 className="text-white mb-1" style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
                {tutor.profile.fullName}
              </h1>
              <p className="text-blue-200/60 text-sm font-medium mb-3">{tutor.profile.headline || "EDUS Certified Tutor"}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 px-2.5 py-1" style={{ borderRadius: "8px", background: "rgba(251,191,36,0.12)" }}>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {tutor.profile.rating || "5.0"} ({tutor.profile.reviewCount || 0})
                </span>
                {tutor.profile.experienceYears && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-200/70 px-2.5 py-1" style={{ borderRadius: "8px", background: "rgba(255,255,255,0.06)" }}>
                    <Award className="h-3 w-3" /> {tutor.profile.experienceYears}+ yrs
                  </span>
                )}
                {uniqueSubjects.map(s => (
                  <span key={s} className="text-xs font-medium text-blue-200/70 px-2.5 py-1" style={{ borderRadius: "8px", background: "rgba(255,255,255,0.06)" }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA (desktop only) */}
            <div className="hidden sm:block flex-shrink-0">
              <a href="#booking" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white cursor-pointer transition-transform hover:scale-[1.03] active:scale-[0.97]"
                style={{ borderRadius: "14px", background: "linear-gradient(135deg, #3b82f6, #2563eb)", boxShadow: "0 4px 20px rgba(37,99,235,0.45), inset 0 1px 0 rgba(255,255,255,0.15)" }}>
                <Calendar className="h-4 w-4" /> Book a Class
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ CONTENT ══════════ */}
      <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-10">

        {/* ── Snapshot Bar ── */}
        <div className="flex flex-wrap gap-px -mt-px overflow-hidden" style={{ borderRadius: "0 0 16px 16px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          {[
            { label: "Subjects", value: uniqueSubjects.join(" · "), icon: <BookOpen className="h-3.5 w-3.5" /> },
            { label: "Grades", value: uniqueGrades.map(formatGradeLabel).join(", "), icon: <GraduationCap className="h-3.5 w-3.5" /> },
            { label: "Medium", value: uniqueMediums.join(", "), icon: <MapPin className="h-3.5 w-3.5" /> },
            { label: "Syllabus", value: uniqueSyllabuses.join(", "), icon: <Layers className="h-3.5 w-3.5" /> },
          ].map((item, i) => (
            <div key={item.label} className="flex-1 min-w-[140px] bg-white px-4 py-4 sm:px-5 sm:py-5" style={{ borderRight: i < 3 ? "1px solid #f1f5f9" : "none" }}>
              <div className="flex items-center gap-1.5 text-[#94a3b8] mb-1">{item.icon}<span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span></div>
              <p className="text-[13px] font-semibold text-[#1e293b] leading-snug line-clamp-2">{item.value}</p>
            </div>
          ))}
        </div>

        {/* ── Main grid ── */}
        <div className="mt-8 sm:mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">

          {/* LEFT COL (2 of 3) */}
          <div className="lg:col-span-2 space-y-8 sm:space-y-10">

            {/* About */}
            {(tutor.profile.about || (tutor.profile.qualifications?.length ?? 0) > 0 || (tutor.profile.teachingStyle?.length ?? 0) > 0) && (
              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.4 }}>
                <SectionTitle>About</SectionTitle>

                {tutor.profile.about && (
                  <p className="text-[#475569] text-[15px] leading-[1.75] mb-6" style={{ fontWeight: 450 }}>{tutor.profile.about}</p>
                )}

                {(tutor.profile.qualifications?.length ?? 0) > 0 && (
                  <div className="mb-6">
                    <SubLabel>Qualifications</SubLabel>
                    <div className="space-y-2">
                      {tutor.profile.qualifications!.map((q) => (
                        <div key={q} className="flex items-start gap-2.5 text-[14px] text-[#334155]" style={{ fontWeight: 500 }}>
                          <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                          {q}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(tutor.profile.teachingStyle?.length ?? 0) > 0 && (
                  <div>
                    <SubLabel>Teaching Approach</SubLabel>
                    <div className="flex flex-wrap gap-2">
                      {tutor.profile.teachingStyle!.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-3.5 py-2" style={{ borderRadius: "10px", background: "#fefce8", color: "#854d0e", border: "1px solid #fef08a" }}>
                          <Zap className="h-3 w-3 text-amber-500" /> {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.section>
            )}

            {/* Demo Videos */}
            {videos.length > 0 && (
              <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
                <SectionTitle badge={String(videos.length)}>Demo Videos</SectionTitle>

                {currentVideo && (
                  <>
                    <div className="relative aspect-video overflow-hidden mb-4" style={{ borderRadius: "16px", background: "#0f172a", boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}>
                      <iframe key={currentVideo.videoId} src={currentVideo.videoUrl} className="absolute inset-0 h-full w-full" allowFullScreen title={currentVideo.title} />
                    </div>
                    <p className="text-sm font-bold text-[#1e293b]">{currentVideo.title} <span className="text-[#94a3b8] font-medium ml-1">{currentVideo.subject}</span></p>

                    {videos.length > 1 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                        {videos.map((v, i) => (
                          <button key={v.videoId} onClick={() => setActiveVideoIndex(i)}
                            className="flex items-center gap-2.5 px-3 py-2 min-w-[160px] cursor-pointer flex-shrink-0 transition-all" style={{
                              borderRadius: "10px",
                              background: activeVideoIndex === i ? "#eff6ff" : "#f8fafc",
                              border: activeVideoIndex === i ? "2px solid #2563eb" : "2px solid #f1f5f9",
                            }}>
                            <div className="w-8 h-6 flex items-center justify-center flex-shrink-0" style={{ borderRadius: "4px", background: "#0f172a" }}>
                              <PlayCircle className="h-3 w-3 text-white/50" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold truncate" style={{ color: activeVideoIndex === i ? "#1e40af" : "#475569" }}>{v.title}</p>
                              <p className="text-[10px] text-[#94a3b8]">{v.subject}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.section>
            )}

            {/* Available Classes preview */}
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
              <SectionTitle badge={String(allClasses.length)}>Available Classes</SectionTitle>
              <div className="grid gap-3 sm:grid-cols-2">
                {allClasses.map(c => {
                  const isInd = c.classType === "INDIVIDUAL";
                  const price = isInd
                    ? (c as IndividualClass).pricing.reduce((low, cur) => cur.amount < low.amount ? cur : low, (c as IndividualClass).pricing[0])
                    : null;
                  const grp = !isInd ? (c as GroupClass) : null;
                  return (
                    <div key={c.classCode} className="p-4" style={{ borderRadius: "14px", border: "1px solid #f1f5f9", background: "#fafbfc" }}>
                      <div className="flex items-center flex-wrap gap-1.5 mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5" style={{ borderRadius: "5px", background: isInd ? "#dbeafe" : "#dcfce7", color: isInd ? "#1e40af" : "#166534" }}>
                          {isInd ? "1-on-1" : "Group"}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5" style={{ borderRadius: "5px", background: "#fef3c7", color: "#92400e" }}>
                          {c.medium} Medium
                        </span>
                        <span className="text-[11px] text-[#94a3b8] font-medium">{c.subject}</span>
                      </div>
                      <p className="text-[14px] font-bold text-[#1e293b] mb-1">{c.title}</p>
                      <p className="text-[12px] text-[#94a3b8] mb-2">{c.grades.map(formatGradeLabel).join(", ")}</p>

                      {/* Group class timetable */}
                      {grp && (
                        <div className="mb-2.5 space-y-1">
                          {grp.fixedTimetable.map((sch, idx) => (
                            <div key={`${sch.day}-${idx}`} className="flex items-center gap-1.5 text-[11px] text-[#64748b]">
                              <Calendar className="h-3 w-3 text-blue-400 flex-shrink-0" />
                              <span className="font-semibold">{formatDayLabel(sch.day)}</span>
                              <span className="text-[#94a3b8]">{formatTimeRange(sch.startTime, sch.endTime)}</span>
                            </div>
                          ))}
                          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold mt-1">
                            <Users className="h-3 w-3" /> {grp.seatsLeft} seats left
                          </div>
                        </div>
                      )}

                      <p className="text-[15px] font-extrabold text-[#0f172a]">
                        {price ? `LKR ${price.amount.toLocaleString()}` : `LKR ${grp?.monthlyFee.amount.toLocaleString()}`}
                        <span className="text-[11px] font-medium text-[#94a3b8] ml-1">{isInd ? "/session" : "/month"}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
              <a href="#booking" className="mt-5 flex items-center justify-center gap-2 w-full py-3.5 text-[15px] font-bold text-white cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.98] sm:hidden"
                style={{ borderRadius: "14px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
                <Calendar className="h-4 w-4" /> Book Now
              </a>
            </motion.section>
          </div>

          {/* RIGHT COL (1 of 3) — Sticky sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-[84px] space-y-6">

              {/* Pricing card */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}
                className="p-6" style={{ borderRadius: "20px", background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>

                <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mb-3">Starting from</p>

                {lowestIndividualPrice < Infinity && (
                  <div className="mb-1">
                    <span style={{ fontSize: "2rem", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.04em", lineHeight: 1 }}>LKR {lowestIndividualPrice.toLocaleString()}</span>
                    <span className="text-[13px] text-[#94a3b8] font-medium ml-1.5">/session</span>
                  </div>
                )}
                {lowestGroupPrice < Infinity && lowestIndividualPrice < Infinity && (
                  <p className="text-[13px] text-[#64748b] font-medium mb-4">Group from LKR {lowestGroupPrice.toLocaleString()}/mo</p>
                )}
                {lowestGroupPrice < Infinity && lowestIndividualPrice >= Infinity && (
                  <div className="mb-4">
                    <span style={{ fontSize: "2rem", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.04em", lineHeight: 1 }}>LKR {lowestGroupPrice.toLocaleString()}</span>
                    <span className="text-[13px] text-[#94a3b8] font-medium ml-1.5">/month</span>
                  </div>
                )}

                <div className="pt-3 mb-4" style={{ borderTop: "1px solid #f1f5f9" }}>
                  <div className="flex justify-between py-1.5 text-[13px]"><span className="text-[#94a3b8]">Individual</span><span className="font-semibold text-[#1e293b]">{allClasses.filter(c => c.classType === "INDIVIDUAL").length}</span></div>
                  <div className="flex justify-between py-1.5 text-[13px]"><span className="text-[#94a3b8]">Group</span><span className="font-semibold text-[#1e293b]">{allClasses.filter(c => c.classType === "GROUP").length}</span></div>
                  <div className="flex justify-between py-1.5 text-[13px]"><span className="text-[#94a3b8]">Total</span><span className="font-bold text-[#0f172a]">{allClasses.length} classes</span></div>
                </div>

                <a href="#booking" className="flex items-center justify-center gap-2 w-full py-3.5 text-[15px] font-bold text-white cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{ borderRadius: "14px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", boxShadow: "0 4px 16px rgba(37,99,235,0.35), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
                  <Sparkles className="h-4 w-4" /> Book a Class
                </a>
                <p className="text-center text-[11px] text-[#cbd5e1] mt-2.5">Free cancellation · Coordinator support</p>
              </motion.div>

              {/* Help card */}
              <div className="p-5" style={{ borderRadius: "16px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <p className="text-[13px] font-semibold text-[#475569] mb-2">Need help choosing?</p>
                <p className="text-[12px] text-[#94a3b8] leading-relaxed mb-3">Our coordinator will guide you to the right class and schedule.</p>
                <a href="tel:+94707072072" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#2563eb]">
                  <Phone className="h-3.5 w-3.5" /> +94 70 707 2072
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ BOOKING WIZARD ══════════ */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          id="booking" className="mt-12 sm:mt-16 mb-16 sm:mb-24 scroll-mt-24" style={{ borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 8px 40px rgba(0,0,0,0.06)" }}>

          {bookingSuccess ? (
            <SuccessPanel name={bookingForm.studentName} tutorName={tutor.profile.fullName} classCount={selectedClasses.length}
              onHome={() => router.push("/")}
              onBookAnother={() => { setBookingSuccess(false); setCurrentStep(0); setSelectedClassCodes(new Set()); setBookingForm({ studentName: "", studentEmail: "", studentPhone: "" }); setAgreeRules(false); }}
            />
          ) : (
            <>
              {/* Header + progress */}
              <div className="px-5 sm:px-8 pt-6 sm:pt-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 flex items-center justify-center" style={{ borderRadius: "12px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}>
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[#0f172a]" style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Book a Class</h2>
                    <p className="text-[12px] text-[#94a3b8] font-medium">Step {currentStep + 1} of {STEPS.length} — {STEPS[currentStep]}</p>
                  </div>
                </div>
                <div className="flex gap-1.5 mb-1">
                  {STEPS.map((_, idx) => (
                    <div key={idx} className="flex-1 h-1" style={{ borderRadius: "9999px", background: idx < currentStep ? "#22c55e" : idx === currentStep ? "#2563eb" : "#e2e8f0", transition: "background 400ms" }} />
                  ))}
                </div>
              </div>

              <div className="px-5 sm:px-8 py-6 sm:py-8">
                <AnimatePresence mode="wait">

                  {/* ─── STEP 0: Choose Classes ─── */}
                  {currentStep === 0 && (
                    <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <p className="text-[#64748b] text-sm font-medium mb-5">Select one or more classes to enroll in.</p>
                      <div className="space-y-3">
                        {bookableClasses.map((c) => {
                          const isIndividual = c.classType === "INDIVIDUAL";
                          const price = isIndividual
                            ? (c as IndividualClass).pricing.reduce((low, cur) => cur.amount < low.amount ? cur : low, (c as IndividualClass).pricing[0])
                            : null;
                          const groupClass = !isIndividual ? (c as GroupClass) : null;
                          const isChecked = selectedClassCodes.has(c.classCode);
                          return (
                            <button key={c.classCode} type="button" onClick={() => toggleClass(c.classCode)}
                              className="w-full text-left cursor-pointer p-4 sm:p-5 transition-all" style={{
                                borderRadius: "16px",
                                border: isChecked ? "2px solid #2563eb" : "2px solid #f1f5f9",
                                background: isChecked ? "#eff6ff" : "#fafbfc",
                                boxShadow: isChecked ? "0 0 0 3px rgba(37,99,235,0.08)" : "none",
                              }}>
                              <div className="flex items-start gap-3 sm:gap-4">
                                <div className="mt-0.5 flex-shrink-0">
                                  <div className="w-5 h-5 flex items-center justify-center transition-all" style={{
                                    borderRadius: "6px",
                                    border: isChecked ? "none" : "2px solid #cbd5e1",
                                    background: isChecked ? "#2563eb" : "transparent",
                                  }}>
                                    {isChecked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5" style={{
                                      borderRadius: "5px", background: isIndividual ? "#dbeafe" : "#dcfce7", color: isIndividual ? "#1e40af" : "#166534",
                                    }}>{isIndividual ? "1-on-1" : "Group"}</span>
                                    <span className="text-[11px] font-medium text-[#94a3b8]">{c.subject}</span>
                                  </div>
                                  <h4 className="text-[#1e293b] font-bold text-[15px] leading-snug">{c.title}</h4>
                                  <p className="text-[#94a3b8] text-[12px] font-medium mt-0.5">{c.grades.map(formatGradeLabel).join(", ")} · {c.medium} · {c.syllabus}</p>
                                </div>
                                <div className="text-right flex-shrink-0 ml-2">
                                  <p style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                                    {price ? `${price.currency} ${price.amount.toLocaleString()}` : `${groupClass?.monthlyFee.currency} ${groupClass?.monthlyFee.amount.toLocaleString()}`}
                                  </p>
                                  <p className="text-[11px] text-[#94a3b8]">{isIndividual ? "per session" : "per month"}{groupClass ? ` · ${groupClass.seatsLeft} seats` : ""}</p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {selectedClassCodes.size > 0 && (
                        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700" style={{ borderRadius: "8px", background: "#eff6ff" }}>
                          <CheckCircle className="h-3.5 w-3.5" /> {selectedClassCodes.size} selected
                        </div>
                      )}
                      {errors.step0 && <p id="step0-error" className="text-red-500 text-xs font-semibold mt-3">{errors.step0}</p>}
                      <WizardNav onNext={() => { if (validateStep0()) setCurrentStep(1); }} />
                    </motion.div>
                  )}

                  {/* ─── STEP 1: Schedule ─── */}
                  {currentStep === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <p className="text-[#64748b] text-sm font-medium mb-5">Configure schedule for each class.</p>
                      <div className="space-y-6">
                        {selectedClasses.map((cls) => {
                          const indCls = cls.classType === "INDIVIDUAL" ? cls as IndividualClass : null;
                          const grpCls = cls.classType === "GROUP" ? cls as GroupClass : null;
                          return (
                            <div key={cls.classCode} className="p-5 sm:p-6" style={{ borderRadius: "16px", background: "#fafbfc", border: "1px solid #f1f5f9" }}>
                              <div className="flex items-center gap-2 mb-5 pb-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5" style={{ borderRadius: "5px", background: indCls ? "#dbeafe" : "#dcfce7", color: indCls ? "#1e40af" : "#166534" }}>
                                  {indCls ? "1-on-1" : "Group"}
                                </span>
                                <h4 className="text-sm font-bold text-[#1e293b]">{cls.title}</h4>
                                <span className="text-[11px] text-[#94a3b8] ml-auto">{cls.subject}</span>
                              </div>

                              {/* Grade */}
                              <div className="mb-5">
                                <FieldLabel>Your Grade</FieldLabel>
                                <div className="flex flex-wrap gap-2">
                                  {cls.grades.slice().sort((a, b) => formatGradeLabel(a).localeCompare(formatGradeLabel(b), undefined, { numeric: true })).map((g) => {
                                    const sel = (gradeByClass[cls.classCode] || (cls.grades.length === 1 ? cls.grades[0] : "")) === g;
                                    return (
                                      <button key={g} type="button"
                                        onClick={() => { setGradeByClass(prev => ({ ...prev, [cls.classCode]: g })); setErrors(prev => { const n = { ...prev }; delete n[`grade-${cls.classCode}`]; return n; }); }}
                                        className="py-2 px-4 cursor-pointer text-[13px] transition-all" style={{
                                          borderRadius: "10px", border: sel ? "2px solid #2563eb" : "2px solid #e5e7eb",
                                          background: sel ? "#eff6ff" : "#fff", color: sel ? "#1e40af" : "#475569", fontWeight: 700,
                                        }}>
                                        {formatGradeLabel(g)}
                                      </button>
                                    );
                                  })}
                                </div>
                                {errors[`grade-${cls.classCode}`] && <p id={`grade-${cls.classCode}-error`} className="text-red-500 text-xs font-semibold mt-2">{errors[`grade-${cls.classCode}`]}</p>}
                              </div>

                              {indCls && (
                                <>
                                  <div className="mb-5">
                                    <FieldLabel>Duration & Price</FieldLabel>
                                    <div className="flex flex-wrap gap-2">
                                      {indCls.pricing.map((p) => {
                                        const sel = durationByClass[cls.classCode] === String(p.durationMinutes);
                                        return (
                                          <button key={p.durationMinutes} type="button"
                                            onClick={() => { setDurationByClass(prev => ({ ...prev, [cls.classCode]: String(p.durationMinutes) })); setErrors(prev => { const n = { ...prev }; delete n[`duration-${cls.classCode}`]; return n; }); }}
                                            className="py-2 px-4 cursor-pointer text-[13px] transition-all" style={{
                                              borderRadius: "10px", border: sel ? "2px solid #2563eb" : "2px solid #e5e7eb",
                                              background: sel ? "#eff6ff" : "#fff", color: sel ? "#1e40af" : "#475569", fontWeight: 700,
                                            }}>
                                            <Clock3 className="h-3 w-3 inline mr-1 text-blue-500" />{p.durationMinutes}min — {p.currency} {p.amount.toLocaleString()}
                                          </button>
                                        );
                                      })}
                                    </div>
                                    {errors[`duration-${cls.classCode}`] && <p id={`duration-${cls.classCode}-error`} className="text-red-500 text-xs font-semibold mt-2">{errors[`duration-${cls.classCode}`]}</p>}
                                  </div>

                                  <div>
                                    <FieldLabel>Time Slots</FieldLabel>
                                    <p className="text-[11px] text-[#94a3b8] -mt-1 mb-3">Select one or more</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {indCls.availableWeeklySlots.filter(s => s.isAvailable).map((slot) => {
                                        const sel = slotsByClass[cls.classCode]?.has(slot.slotId) ?? false;
                                        return (
                                          <button key={slot.slotId} type="button" onClick={() => toggleSlot(cls.classCode, slot.slotId)}
                                            className="flex items-center gap-3 p-3 cursor-pointer transition-all text-left" style={{
                                              borderRadius: "10px", border: sel ? "2px solid #2563eb" : "2px solid #e5e7eb", background: sel ? "#eff6ff" : "#fff",
                                            }}>
                                            <div className="w-4.5 h-4.5 flex items-center justify-center flex-shrink-0" style={{
                                              borderRadius: "5px", border: sel ? "none" : "2px solid #cbd5e1", background: sel ? "#2563eb" : "transparent", width: 18, height: 18,
                                            }}>
                                              {sel && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                                            </div>
                                            <div>
                                              <p className="font-bold text-[12px] text-[#1e293b]">{formatDayLabel(slot.day)}</p>
                                              <p className="text-[11px] text-[#94a3b8]">{formatTimeRange(slot.startTime, slot.endTime)}</p>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                    {(slotsByClass[cls.classCode]?.size ?? 0) > 0 && (
                                      <p className="mt-2 text-xs text-blue-600 font-semibold">{slotsByClass[cls.classCode].size} slot{slotsByClass[cls.classCode].size > 1 ? "s" : ""} selected</p>
                                    )}
                                    {errors[`slot-${cls.classCode}`] && <p id={`slot-${cls.classCode}-error`} className="text-red-500 text-xs font-semibold mt-2">{errors[`slot-${cls.classCode}`]}</p>}
                                  </div>
                                </>
                              )}

                              {grpCls && (
                                <>
                                  <FieldLabel>Fixed Schedule</FieldLabel>
                                  <div className="grid gap-2 mb-3">
                                    {grpCls.fixedTimetable.map((sch, idx) => (
                                      <div key={`${sch.day}-${idx}`} className="flex items-center gap-3 p-3 bg-white" style={{ borderRadius: "10px", border: "1px solid #e5e7eb" }}>
                                        <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                        <div>
                                          <p className="font-bold text-[12px] text-[#1e293b]">{formatDayLabel(sch.day)}</p>
                                          <p className="text-[11px] text-[#94a3b8]">{formatTimeRange(sch.startTime, sch.endTime)}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex items-center justify-between text-sm p-3" style={{ borderRadius: "10px", background: "#eff6ff" }}>
                                    <span className="flex items-center gap-1.5 font-semibold text-blue-700"><Users className="h-4 w-4" /> {grpCls.seatsLeft} seats left</span>
                                    <span className="font-extrabold text-blue-700">{grpCls.monthlyFee.currency} {grpCls.monthlyFee.amount.toLocaleString()}/mo</span>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <WizardNav onNext={() => { if (validateStep1()) setCurrentStep(2); }} onBack={() => setCurrentStep(0)} />
                    </motion.div>
                  )}

                  {/* ─── STEP 2: Details ─── */}
                  {currentStep === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <p className="text-[#64748b] text-sm font-medium mb-6">Enter your contact information.</p>
                      <div className="space-y-4 max-w-lg">
                        <FormInput icon={<User className="h-4 w-4" />} label="Student Name" id="studentName" type="text"
                          value={bookingForm.studentName} onChange={(e) => { setBookingForm({ ...bookingForm, studentName: e.target.value }); setErrors(prev => { const n = { ...prev }; delete n.studentName; return n; }); }} placeholder="e.g. Kasun Perera" error={errors.studentName} />
                        <FormInput icon={<Mail className="h-4 w-4" />} label="Email Address" id="studentEmail" type="email"
                          value={bookingForm.studentEmail} onChange={(e) => { setBookingForm({ ...bookingForm, studentEmail: e.target.value }); setErrors(prev => { const n = { ...prev }; delete n.studentEmail; return n; }); }} placeholder="kasun@email.com" error={errors.studentEmail} />
                        <FormInput icon={<Phone className="h-4 w-4" />} label="Phone Number" id="studentPhone" type="tel"
                          value={bookingForm.studentPhone} onChange={(e) => { setBookingForm({ ...bookingForm, studentPhone: e.target.value.replace(/\D/g, "") }); setErrors(prev => { const n = { ...prev }; delete n.studentPhone; return n; }); }} placeholder="94707072072" error={errors.studentPhone}
                          hint="Digits only, starting with country code" />
                      </div>
                      <WizardNav onNext={() => { if (validateStep2()) setCurrentStep(3); }} onBack={() => setCurrentStep(1)} />
                    </motion.div>
                  )}

                  {/* ─── STEP 3: Confirm ─── */}
                  {currentStep === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <form onSubmit={handleBookingSubmit}>
                        {/* Dark summary */}
                        <div className="p-5 sm:p-6 mb-5" style={{ borderRadius: "18px", background: "linear-gradient(145deg, #0f172a, #1e293b)", color: "#fff" }}>
                          <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-white/30">Booking Summary</span>
                            <span className="text-[11px] font-bold px-2.5 py-1 text-white/60" style={{ borderRadius: "8px", background: "rgba(255,255,255,0.06)" }}>{selectedClasses.length} class{selectedClasses.length > 1 ? "es" : ""}</span>
                          </div>
                          <div className="space-y-2.5 text-sm">
                            <SummaryRow label="Student" value={bookingForm.studentName} />
                            <SummaryRow label="Email" value={bookingForm.studentEmail} />
                            <SummaryRow label="Phone" value={bookingForm.studentPhone} />
                            <div className="my-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }} />
                            {selectedClasses.map((cls) => {
                              const p = getClassPrice(cls);
                              const indCls = cls.classType === "INDIVIDUAL" ? cls as IndividualClass : null;
                              const classSlotIds = indCls ? Array.from(slotsByClass[cls.classCode] || []) : [];
                              const classSlots = indCls?.availableWeeklySlots.filter(s => classSlotIds.includes(s.slotId)) || [];
                              return (
                                <div key={cls.classCode} className="p-3.5" style={{ borderRadius: "12px", background: "rgba(255,255,255,0.03)" }}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-white text-[13px]">{cls.title}</span>
                                    <div className="text-right flex-shrink-0">
                                      {indCls && p && p.slotCount > 1 ? (
                                        <><span className="font-extrabold text-white">{p.currency} {p.total.toLocaleString()}</span><p className="text-white/25 text-[10px]">{p.slotCount} × {p.currency} {p.amount.toLocaleString()}</p></>
                                      ) : (
                                        <span className="font-extrabold text-white">{p?.currency} {p?.amount.toLocaleString()}<span className="text-white/25 text-[11px] font-medium"> /{p?.label === "per session" ? "session" : "mo"}</span></span>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-white/25 text-[11px]">{cls.subject} · {cls.medium} · {cls.syllabus}</p>
                                  <p className="text-white/40 text-[11px] font-semibold mt-0.5"><GraduationCap className="h-3 w-3 inline mr-1" />{formatGradeLabel(gradeByClass[cls.classCode] || cls.grades[0])}</p>
                                  {indCls && classSlots.length > 0 && (
                                    <div className="mt-1.5 space-y-0.5">
                                      <p className="text-white/30 text-[10px] font-bold uppercase tracking-wider">{durationByClass[cls.classCode]}min · {classSlots.length} slot{classSlots.length > 1 ? "s" : ""}</p>
                                      {classSlots.map(slot => (<p key={slot.slotId} className="text-white/20 text-[11px]">{formatDayLabel(slot.day)} {formatTimeRange(slot.startTime, slot.endTime)}</p>))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            <div className="my-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }} />
                            <div className="p-3.5" style={{ borderRadius: "12px", background: "rgba(255,255,255,0.03)" }}>
                              <div className="flex items-center justify-between">
                                <div><span className="font-semibold text-white text-[13px]">Admission Fee</span><span className="text-white/25 text-[11px] ml-2">(one-time)</span>
                                  <p className="text-white/25 text-[11px] mt-0.5">{hasIndividual && hasGroup ? "Individual + Group" : hasIndividual ? "Individual" : "Group"}</p></div>
                                <span className="font-extrabold text-white">LKR {admissionFee.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Total</span>
                              <span style={{ fontSize: "1.375rem", fontWeight: 900, letterSpacing: "-0.03em" }} className="text-white">
                                LKR {(admissionFee + selectedClasses.reduce((sum, cls) => sum + (getClassPrice(cls)?.total ?? 0), 0)).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Rules */}
                        <div className="mb-5 p-5" style={{ borderRadius: "16px", background: "#fffbeb", border: "1px solid #fef08a" }}>
                          <p className="text-[12px] font-bold text-amber-700 uppercase tracking-wider mb-2">Academic & Online Learning Standards</p>
                          <p className="text-[12px] text-amber-800/70 mb-4" style={{ fontWeight: 500, lineHeight: 1.6 }}>Please read and accept to continue.</p>
                          <ol className="space-y-2 text-[12px] text-amber-900/70" style={{ fontWeight: 500, lineHeight: 1.6 }}>
                            {[
                              "Your Internet Connection and device has to be fit for Online learning.",
                              "Your attendance to class will be strictly monitored. Failure to attend more than 3 consecutive classes will be resulting in dropout from classes.",
                              "Student must answer and respond to questions from tutor while learning. You\u2019ll be removed from class if not responding.",
                              "You have to ask and discuss all your subject related doubts during the class.",
                              "Students are requested to complete all required academic works by the tutor on time without fail.",
                            ].map((r, i) => (
                              <li key={i} className="flex items-start gap-2"><span className="font-extrabold text-amber-600 flex-shrink-0 w-4">{i + 1}.</span>{r}</li>
                            ))}
                          </ol>
                          <p className="text-[12px] text-amber-800/60 mt-3 pt-3" style={{ fontWeight: 600, lineHeight: 1.6, borderTop: "1px solid #fde68a" }}>
                            Our coordinator will help you achieve excellence in your learning at EDUS.
                          </p>
                        </div>

                        <label className="flex items-start gap-3 p-4 cursor-pointer mb-6 transition-all" style={{ borderRadius: "14px", background: agreeRules ? "#eff6ff" : "#fafbfc", border: agreeRules ? "2px solid #2563eb" : "2px solid #f1f5f9" }}>
                          <div className="mt-0.5 flex-shrink-0">
                            <div className="w-5 h-5 flex items-center justify-center transition-all" style={{ borderRadius: "6px", border: agreeRules ? "none" : "2px solid #cbd5e1", background: agreeRules ? "#2563eb" : "transparent" }}>
                              {agreeRules && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                            </div>
                          </div>
                          <input type="checkbox" checked={agreeRules} onChange={(e) => setAgreeRules(e.target.checked)} className="sr-only" />
                          <span className="text-[13px] text-[#475569] font-medium leading-relaxed">I agree to the Academic & Online Learning Standards and understand an EDUS coordinator will contact me.</span>
                        </label>

                        <div className="flex gap-3">
                          <button type="button" onClick={() => setCurrentStep(2)} className="px-5 py-3.5 text-sm font-bold text-[#64748b] cursor-pointer flex-shrink-0 transition-all hover:bg-[#f8fafc]"
                            style={{ borderRadius: "14px", border: "2px solid #e5e7eb" }}>
                            <ArrowLeft className="h-4 w-4 inline mr-1" /> Back
                          </button>
                          <button type="submit" disabled={isSubmitting || !agreeRules || selectedClasses.length === 0}
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            style={{ borderRadius: "14px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", boxShadow: !isSubmitting && agreeRules ? "0 4px 16px rgba(37,99,235,0.35)" : "none" }}>
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
        </motion.section>
      </div>
    </main>
  );
}

/* ═══════ Shared components ═══════ */

function SectionTitle({ children, badge }: { readonly children: ReactNode; readonly badge?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h3 className="text-[#0f172a] text-[17px]" style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>{children}</h3>
      {badge && <span className="text-[12px] font-bold text-[#94a3b8]">({badge})</span>}
    </div>
  );
}

function SubLabel({ children }: { readonly children: ReactNode }) {
  return <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mb-2.5">{children}</p>;
}

function FieldLabel({ children }: { readonly children: ReactNode }) {
  return <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-2.5">{children}</p>;
}

function WizardNav({ onNext, onBack }: { readonly onNext: () => void; readonly onBack?: () => void }) {
  return (
    <div className="flex gap-3 mt-8">
      {onBack && (
        <button type="button" onClick={onBack} className="px-5 py-3.5 text-sm font-bold text-[#64748b] cursor-pointer transition-all hover:bg-[#f8fafc]"
          style={{ borderRadius: "14px", border: "2px solid #e5e7eb" }}>
          <ArrowLeft className="h-4 w-4 inline mr-1" /> Back
        </button>
      )}
      <button type="button" onClick={onNext}
        className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-white cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.98]"
        style={{ borderRadius: "14px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
        Continue <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function FormInput({ icon, label, hint, error, ...props }: { readonly icon: ReactNode; readonly label: string; readonly hint?: string; readonly error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={props.id} className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] block mb-2">{label}</label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]">{icon}</div>
        <input {...props}
          className="w-full pl-10 pr-4 py-3.5 text-[14px] font-semibold text-[#1e293b] placeholder-[#c0c7d0] focus:outline-none"
          style={{ borderRadius: "14px", border: error ? "2px solid #ef4444" : "2px solid #e5e7eb", background: "#fafbfc", transition: "border-color 200ms, box-shadow 200ms" }}
          onFocus={(e) => { if (!error) { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.08)"; } }}
          onBlur={(e) => { e.currentTarget.style.borderColor = error ? "#ef4444" : "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
        />
      </div>
      {error && <p id={`${props.id}-error`} className="text-red-500 text-xs font-semibold mt-1.5">{error}</p>}
      {hint && !error && <p className="text-[10px] text-[#94a3b8] mt-1.5 ml-1">{hint}</p>}
    </div>
  );
}

function SummaryRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/30 text-[13px]">{label}</span>
      <span className="text-white font-semibold text-[13px] text-right truncate">{value}</span>
    </div>
  );
}

function SuccessPanel({ name, tutorName, classCount, onHome, onBookAnother }: {
  readonly name: string; readonly tutorName: string; readonly classCount: number;
  readonly onHome: () => void; readonly onBookAnother: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 sm:p-16 flex flex-col items-center text-center">
      <div className="w-16 h-16 flex items-center justify-center mb-5" style={{ borderRadius: "18px", background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 6px 20px rgba(34,197,94,0.3)" }}>
        <CheckCircle className="h-8 w-8 text-white" />
      </div>
      <h2 className="text-[#0f172a] mb-2" style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em" }}>You&apos;re all set!</h2>
      <p className="text-[#64748b] max-w-md text-[14px]" style={{ fontWeight: 500, lineHeight: 1.6 }}>
        Thank you, <strong className="text-[#1e293b]">{name}</strong>. Your booking for <strong className="text-[#1e293b]">{classCount} class{classCount > 1 ? "es" : ""}</strong> with <strong className="text-[#1e293b]">{tutorName}</strong> has been submitted.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full sm:w-auto">
        <button onClick={onHome} className="px-6 py-3 text-sm font-bold text-[#64748b] cursor-pointer transition-all hover:bg-[#f8fafc]" style={{ borderRadius: "14px", border: "2px solid #e5e7eb" }}>Back to Home</button>
        <button onClick={onBookAnother} className="px-6 py-3 text-sm font-bold text-white cursor-pointer transition-all hover:scale-[1.02]"
          style={{ borderRadius: "14px", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", boxShadow: "0 4px 14px rgba(37,99,235,0.3)" }}>Book Another</button>
      </div>
    </motion.div>
  );
}
