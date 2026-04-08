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
    if (!tutor) {
      return;
    }

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

    if (!bookableClasses.some((classItem) => classItem.classCode === selectedClassCode)) {
      setSelectedClassCode(bookableClasses[0].classCode);
    }
  }, [bookableClasses, selectedClassCode]);

  const selectedClass = useMemo(() => (
    bookableClasses.find((classItem) => classItem.classCode === selectedClassCode) || bookableClasses[0] || null
  ), [bookableClasses, selectedClassCode]);

  const selectedIndividualClass = selectedClass?.classType === "INDIVIDUAL"
    ? selectedClass
    : null;
  const selectedGroupClass = selectedClass?.classType === "GROUP"
    ? selectedClass
    : null;

  useEffect(() => {
    if (!selectedClass) {
      setSelectedDurationMinutes("");
      setSelectedSlotId("");
      return;
    }

    if (selectedClass.classType === "INDIVIDUAL") {
      const pricingDurations = selectedClass.pricing.map((priceOption) => priceOption.durationMinutes);
      if (!pricingDurations.includes(Number(selectedDurationMinutes))) {
        setSelectedDurationMinutes(String(pricingDurations[0] || ""));
      }

      const availableSlots = selectedClass.availableWeeklySlots.filter((slot) => slot.isAvailable);
      if (!availableSlots.some((slot) => slot.slotId === selectedSlotId)) {
        setSelectedSlotId(availableSlots[0]?.slotId || "");
      }
      return;
    }

    if (selectedDurationMinutes) {
      setSelectedDurationMinutes("");
    }
    if (selectedSlotId) {
      setSelectedSlotId("");
    }
  }, [selectedClass, selectedDurationMinutes, selectedSlotId]);

  useEffect(() => {
    setActiveVideoIndex(0);
  }, [tutorId]);

  const selectedPrice = selectedIndividualClass
    ? selectedIndividualClass.pricing.find((priceOption) => (
        priceOption.durationMinutes === Number(selectedDurationMinutes)
      )) || selectedIndividualClass.pricing[0] || null
    : null;
  const selectedSlot = selectedIndividualClass
    ? selectedIndividualClass.availableWeeklySlots.find((slot) => slot.slotId === selectedSlotId) ||
      selectedIndividualClass.availableWeeklySlots[0] ||
      null
    : null;
  const videos = tutor?.profile.demoVideos || [];
  const currentVideo = tutor ? videos[activeVideoIndex] || getPrimaryDemoVideo(tutor.profile) : null;

  if (!tutor) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-3xl font-extrabold text-slate-900">Tutor not found</h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-500">
            This tutor profile could not be loaded from the current directory data.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
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

    if (!tutor || !selectedClass) {
      return;
    }

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
      if (data.success) {
        setBookingSuccess(true);
      }
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
    <main className="min-h-screen bg-slate-50 pb-24 font-sans selection:bg-primary selection:text-white">
      <div className="mx-auto flex max-w-7xl justify-end px-4 pt-6 sm:px-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200/80 bg-white/70 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:-translate-y-0.5 hover:bg-white hover:text-primary hover:shadow-md"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Search
        </button>
      </div>

      <div className="mx-auto mt-4 flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:flex-row">
        <div className="flex w-full flex-col gap-8 lg:w-[65%]">
          <motion.section
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative overflow-hidden rounded-[2rem] border border-gray-200/60 bg-white p-8 shadow-sm sm:p-10"
          >
            <div className="absolute left-0 top-0 h-1.5 w-full bg-primary" />

            <div className="flex flex-col gap-8 text-center sm:flex-row sm:items-start sm:text-left">
              <div className="relative h-40 w-40 flex-shrink-0 self-center overflow-hidden rounded-[1.75rem] border-4 border-white bg-slate-100 shadow-md ring-1 ring-slate-900/5 sm:h-48 sm:w-48 sm:self-start">
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
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                      {tutor.profile.fullName}
                    </h1>
                    {tutor.isVerified && (
                      <span className="inline-flex items-center rounded-md border border-[#4ADE80] bg-[#63FF94] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0A4D27]">
                        VERIFIED
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-bold text-[#3B4CB8]">
                    {tutor.profile.headline || "EDUS Certified Tutor"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-slate-500 sm:justify-start">
                  <div className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5">
                    <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
                    <span className="font-bold text-slate-900">{tutor.profile.rating || "5.0"}</span>
                    <span className="text-slate-500">({tutor.profile.reviewCount || "0"} Reviews)</span>
                  </div>
                  {tutor.profile.qualifications?.[0] && (
                    <div className="flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5">
                      <GraduationCap className="h-4 w-4 text-slate-400" />
                      <span className="font-bold text-slate-600">{tutor.profile.qualifications[0]}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="font-bold text-slate-600">
                      {availableClassTypes.join(" + ")} Classes
                    </span>
                  </div>
                </div>

                {tutor.profile.about && (
                  <p className="border-t border-slate-100 pt-4 text-base leading-relaxed text-slate-600">
                    {tutor.profile.about}
                  </p>
                )}
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="rounded-[2rem] border border-gray-200/60 bg-white p-8 shadow-sm"
          >
            <SectionTitle icon={<BookOpen className="h-5 w-5 text-primary" />} title="Tutor Overview" />
            <div className="grid gap-6 md:grid-cols-2">
              <InfoList
                label="Subjects"
                values={tutor.profile.subjects}
              />
              <InfoList
                label="Languages"
                values={tutor.profile.languages || []}
                icon={<Languages className="h-4 w-4 text-slate-400" />}
              />
              <InfoList
                label="Mediums"
                values={tutor.profile.mediums}
              />
              <InfoList
                label="Syllabus"
                values={tutor.profile.syllabusSupported}
              />
            </div>

            {tutor.profile.qualifications?.length ? (
              <div className="mt-8">
                <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
                  Qualifications
                </h4>
                <ul className="flex flex-col gap-3">
                  {tutor.profile.qualifications.map((qualification) => (
                    <li key={qualification} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-medium text-slate-700">
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                      <span>{qualification}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {tutor.profile.teachingStyle?.length ? (
              <div className="mt-8">
                <h4 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
                  Teaching Style
                </h4>
                <div className="flex flex-wrap gap-2">
                  {tutor.profile.teachingStyle.map((style) => (
                    <span key={style} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                      {style}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </motion.section>

          {tutor.individualClasses.length > 0 && (
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="rounded-[2rem] border border-gray-200/60 bg-white p-8 shadow-sm"
            >
              <SectionTitle icon={<Calendar className="h-5 w-5 text-primary" />} title="Individual Classes" />
              <div className="grid gap-5">
                {tutor.individualClasses.map((classItem) => (
                  <IndividualClassCard
                    key={classItem.classCode}
                    classItem={classItem}
                    isSelected={selectedClassType === "Individual" && selectedClassCode === classItem.classCode}
                    onSelect={() => {
                      setSelectedClassType("Individual");
                      setSelectedClassCode(classItem.classCode);
                    }}
                  />
                ))}
              </div>
            </motion.section>
          )}

          {tutor.groupClasses.length > 0 && (
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="rounded-[2rem] border border-gray-200/60 bg-white p-8 shadow-sm"
            >
              <SectionTitle icon={<Users className="h-5 w-5 text-primary" />} title="Group Classes" />
              <div className="grid gap-5">
                {tutor.groupClasses.map((classItem) => (
                  <GroupClassCard
                    key={classItem.classCode}
                    classItem={classItem}
                    isSelected={selectedClassType === "Group" && selectedClassCode === classItem.classCode}
                    onSelect={() => {
                      setSelectedClassType("Group");
                      setSelectedClassCode(classItem.classCode);
                    }}
                  />
                ))}
              </div>
            </motion.section>
          )}

          <motion.section
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="overflow-hidden rounded-[2rem] border border-gray-200/60 bg-white p-8 shadow-sm"
          >
            <SectionTitle icon={<PlayCircle className="h-5 w-5 text-primary" />} title="Demo Videos" />
            {currentVideo ? (
              <div className="flex flex-col gap-6 lg:flex-row">
                <div className="flex-1">
                  <div className="mb-4 flex flex-col gap-1">
                    <h4 className="text-lg font-bold text-slate-900">{currentVideo.title}</h4>
                    <p className="text-sm text-slate-500">{currentVideo.subject}</p>
                  </div>
                  <div className="relative aspect-video overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-950 shadow-2xl shadow-slate-200/50">
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
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        Preview Queue
                      </h4>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                        {activeVideoIndex + 1} / {videos.length}
                      </span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 lg:max-h-[380px] lg:flex-col lg:overflow-y-auto">
                      {videos.map((video, index) => (
                        <button
                          key={video.videoId}
                          onClick={() => setActiveVideoIndex(index)}
                          className={`flex min-w-[240px] items-center gap-3 rounded-2xl border p-3 text-left transition-all lg:min-w-0 ${
                            activeVideoIndex === index
                              ? "border-primary/20 bg-primary/5 shadow-sm ring-1 ring-primary/10"
                              : "border-gray-100 bg-white shadow-sm hover:bg-slate-50 hover:shadow-md"
                          }`}
                        >
                          <div className="relative flex h-14 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
                            <PlayCircle className="h-6 w-6 text-white/80" />
                          </div>
                          <div className="min-w-0">
                            <p className={`truncate text-[11px] font-bold leading-tight ${
                              activeVideoIndex === index ? "text-primary" : "text-slate-700"
                            }`}>
                              {video.title}
                            </p>
                            <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
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
              <div className="flex flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-slate-200 bg-slate-50 p-14 text-slate-400">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-100 bg-white shadow-sm">
                  <PlayCircle className="h-8 w-8 text-primary opacity-30" />
                </div>
                <span className="text-sm font-semibold text-slate-500">No demo videos uploaded yet</span>
                <p className="mt-1 text-xs italic text-slate-400">
                  Tutor hasn&apos;t provided session previews
                </p>
              </div>
            )}
          </motion.section>

          <motion.section
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="rounded-[2rem] border border-gray-200/60 bg-white p-8 shadow-sm"
          >
            <SectionTitle icon={<ShieldCheck className="h-5 w-5 text-primary" />} title="Class Rules" />
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
                  className="flex items-start gap-4 rounded-2xl border border-amber-100/50 bg-amber-50/10 p-4 text-sm text-slate-700"
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-black text-amber-700 shadow-sm">
                    {index + 1}
                  </span>
                  <span className="font-medium leading-relaxed">{rule}</span>
                </li>
              ))}
            </ol>
          </motion.section>
        </div>

        <div className="relative w-full lg:w-[35%]">
          <motion.aside
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="sticky top-[100px] rounded-[2rem] border border-gray-200/60 bg-white p-8 shadow-lg shadow-primary/5"
          >
            {bookingSuccess ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle className="h-10 w-10 text-success" />
                </div>
                <h3 className="mb-2 text-2xl font-extrabold text-slate-900">Request Submitted</h3>
                <p className="mb-8 max-w-xs text-sm leading-relaxed text-slate-500">
                  Thank you, {bookingForm.studentName || "student"}. Your class request is in progress and the EDUS team will contact you shortly.
                </p>
                <button
                  onClick={() => router.push("/")}
                  className="w-full rounded-xl bg-slate-100 py-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
                >
                  Return to Home
                </button>
              </div>
            ) : (
              <>
                <div className="relative mb-8 overflow-hidden rounded-[1.5rem] bg-slate-900 p-6 text-white shadow-xl">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary opacity-40 blur-[80px]" />

                  <div className="relative z-10 mb-8 flex items-center justify-between border-b border-white/10 pb-4">
                    <h3 className="flex items-center gap-2 text-base font-bold">
                      <CreditCard className="h-4 w-4 text-primary" />
                      Booking Summary
                    </h3>
                    <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-100">
                        {selectedClassType} Class
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 space-y-4 text-sm font-medium text-slate-300">
                    <div className="flex items-center justify-between gap-4">
                      <span>Selected class</span>
                      <span className="text-right font-semibold text-white">
                        {selectedClass?.title || "Choose a class"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>{pricingLabel}</span>
                      <span className="font-semibold text-white">
                        {pricingCurrency} {pricingAmount}
                      </span>
                    </div>
                    {selectedIndividualClass && selectedPrice ? (
                      <div className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/5 p-3">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                          <Clock3 className="h-3.5 w-3.5" />
                          Duration
                        </span>
                        <span className="text-xs font-bold text-white">
                          {selectedPrice.durationMinutes} Minutes
                        </span>
                      </div>
                    ) : null}
                    {selectedGroupClass ? (
                      <div className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/5 p-3">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                          <Users className="h-3.5 w-3.5" />
                          Seats Left
                        </span>
                        <span className="text-xs font-bold text-white">
                          {selectedGroupClass.seatsLeft} / {selectedGroupClass.seatCapacity}
                        </span>
                      </div>
                    ) : null}
                    <div className="border-t border-white/20 pt-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Class Coverage</p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {selectedClass?.subject || "Select a class"} • {selectedClass?.medium || "Medium"} • {selectedClass?.syllabus || "Syllabus"}
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleBookingSubmit} className="flex flex-col gap-5">
                  <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-900">
                    Student Registration Details
                  </h4>

                  <Field
                    label="Student Name"
                    htmlFor="studentName"
                    input={
                      <input
                        id="studentName"
                        required
                        type="text"
                        value={bookingForm.studentName}
                        onChange={(event) => setBookingForm({ ...bookingForm, studentName: event.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition-all placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                        placeholder="John Doe"
                      />
                    }
                  />

                  <Field
                    label="Email Address"
                    htmlFor="studentEmail"
                    input={
                      <input
                        id="studentEmail"
                        required
                        type="email"
                        value={bookingForm.studentEmail}
                        onChange={(event) => setBookingForm({ ...bookingForm, studentEmail: event.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition-all placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                        placeholder="john@example.com"
                      />
                    }
                  />

                  <Field
                    label="Phone Number"
                    htmlFor="studentPhone"
                    hint="Digits only, starting with country code."
                    input={
                      <input
                        id="studentPhone"
                        required
                        type="tel"
                        value={bookingForm.studentPhone}
                        onChange={(event) => setBookingForm({
                          ...bookingForm,
                          studentPhone: event.target.value.replace(/\D/g, ""),
                        })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition-all placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                        placeholder="94707072072"
                      />
                    }
                  />

                  <Field
                    label="Class Type"
                    htmlFor="classType"
                    input={
                      <Select
                        id="classType"
                        value={selectedClassType}
                        onChange={(event) => setSelectedClassType(event.target.value as SearchClassType)}
                        options={availableClassTypes.map((classType) => ({
                          value: classType,
                          label: `${classType} (${getClassBadgeLabel(classType)})`,
                        }))}
                      />
                    }
                  />

                  <Field
                    label={selectedClassType === "Individual" ? "Individual Class" : "Group Class"}
                    htmlFor="classCode"
                    input={
                      <Select
                        id="classCode"
                        value={selectedClassCode}
                        onChange={(event) => setSelectedClassCode(event.target.value)}
                        options={bookableClasses.map((classItem) => ({
                          value: classItem.classCode,
                          label: `${classItem.title} • ${classItem.subject}`,
                        }))}
                      />
                    }
                  />

                  {selectedIndividualClass && selectedIndividualClass.pricing.length > 0 ? (
                    <Field
                      label="Session Duration"
                      htmlFor="duration"
                      input={
                        <Select
                          id="duration"
                          value={selectedDurationMinutes}
                          onChange={(event) => setSelectedDurationMinutes(event.target.value)}
                          options={selectedIndividualClass.pricing.map((priceOption) => ({
                            value: String(priceOption.durationMinutes),
                            label: `${priceOption.durationMinutes} Minutes • ${priceOption.currency} ${priceOption.amount}`,
                          }))}
                        />
                      }
                    />
                  ) : null}

                  {selectedIndividualClass && selectedIndividualClass.availableWeeklySlots.length > 0 ? (
                    <Field
                      label="Preferred Weekly Slot"
                      htmlFor="slotId"
                      input={
                        <Select
                          id="slotId"
                          value={selectedSlotId}
                          onChange={(event) => setSelectedSlotId(event.target.value)}
                          options={selectedIndividualClass.availableWeeklySlots
                            .filter((slot) => slot.isAvailable)
                            .map((slot) => ({
                              value: slot.slotId,
                              label: `${formatDayLabel(slot.day)} • ${formatTimeRange(slot.startTime, slot.endTime)}`,
                            }))}
                        />
                      }
                    />
                  ) : null}

                  {selectedClass ? (
                    <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <SummaryItem label="Subject" value={selectedClass.subject} />
                      <SummaryItem label="Grades" value={selectedClass.grades.map(formatGradeLabel).join(", ")} />
                      <SummaryItem label="Medium" value={selectedClass.medium} />
                      <SummaryItem label="Syllabus" value={selectedClass.syllabus} />
                    </div>
                  ) : null}

                  <div className="mt-2 flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50/50 p-3.5">
                    <input
                      id="agreeRules"
                      type="checkbox"
                      checked={agreeRules}
                      onChange={(event) => setAgreeRules(event.target.checked)}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer accent-primary"
                    />
                    <label htmlFor="agreeRules" className="text-xs leading-relaxed text-slate-600">
                      I agree to the class rules and understand that EDUS may contact me to confirm the booking.
                    </label>
                  </div>

                  <button
                    disabled={isSubmitting || !agreeRules || !selectedClass}
                    type="submit"
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-bold text-white shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
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

function SectionTitle({ icon, title }: { readonly icon: ReactNode; readonly title: string }) {
  return (
    <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-900">
      {icon}
      {title}
    </h3>
  );
}

function InfoList({
  label,
  values,
  icon,
}: {
  readonly label: string;
  readonly values: string[];
  readonly icon?: ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">{label}</h4>
      </div>
      <div className="flex flex-wrap gap-2">
        {values.length > 0 ? values.map((value) => (
          <span key={value} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
            {value}
          </span>
        )) : (
          <span className="text-sm text-slate-400">Not listed</span>
        )}
      </div>
    </div>
  );
}

function IndividualClassCard({
  classItem,
  isSelected,
  onSelect,
}: {
  readonly classItem: IndividualClass;
  readonly isSelected: boolean;
  readonly onSelect: () => void;
}) {
  const startingPrice = classItem.pricing.reduce((lowest, current) => (
    current.amount < lowest.amount ? current : lowest
  ), classItem.pricing[0]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-[1.75rem] border p-6 text-left transition-all ${
        isSelected
          ? "border-primary/30 bg-primary/5 shadow-md shadow-primary/5"
          : "border-slate-200 bg-slate-50 hover:border-primary/20 hover:bg-white hover:shadow-sm"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary/15 bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Individual
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              {classItem.subject}
            </span>
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-900">{classItem.title}</h4>
            <p className="mt-1 text-sm text-slate-500">
              {classItem.medium} • {classItem.syllabus}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">From</p>
          <p className="mt-1 text-xl font-black text-slate-900">
            {startingPrice.currency} {startingPrice.amount}
          </p>
          <p className="text-xs font-medium text-slate-400">per session</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <CardMeta label="Grades" value={classItem.grades.map(formatGradeLabel).join(", ")} />
        <CardMeta
          label="Durations"
          value={classItem.pricing.map((priceOption) => `${priceOption.durationMinutes}m`).join(", ")}
        />
      </div>

      {classItem.availableWeeklySlots.length > 0 ? (
        <div className="mt-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Weekly Slots
          </p>
          <div className="flex flex-wrap gap-2">
            {classItem.availableWeeklySlots
              .filter((slot) => slot.isAvailable)
              .map((slot) => (
                <span key={slot.slotId} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm">
                  {formatDayLabel(slot.day)} • {formatTimeRange(slot.startTime, slot.endTime)}
                </span>
              ))}
          </div>
        </div>
      ) : null}
    </button>
  );
}

function GroupClassCard({
  classItem,
  isSelected,
  onSelect,
}: {
  readonly classItem: GroupClass;
  readonly isSelected: boolean;
  readonly onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-[1.75rem] border p-6 text-left transition-all ${
        isSelected
          ? "border-primary/30 bg-primary/5 shadow-md shadow-primary/5"
          : "border-slate-200 bg-slate-50 hover:border-primary/20 hover:bg-white hover:shadow-sm"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
              Group
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              {classItem.subject}
            </span>
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-900">{classItem.title}</h4>
            <p className="mt-1 text-sm text-slate-500">
              {classItem.medium} • {classItem.syllabus} • {classItem.status}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Monthly Fee</p>
          <p className="mt-1 text-xl font-black text-slate-900">
            {classItem.monthlyFee.currency} {classItem.monthlyFee.amount}
          </p>
          <p className="text-xs font-medium text-slate-400">
            {classItem.seatsLeft} seats left
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <CardMeta label="Grades" value={classItem.grades.map(formatGradeLabel).join(", ")} />
        <CardMeta label="Capacity" value={`${classItem.seatsLeft} left of ${classItem.seatCapacity}`} />
      </div>

      {classItem.fixedTimetable.length > 0 ? (
        <div className="mt-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Fixed Timetable
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {classItem.fixedTimetable.map((schedule, index) => (
              <div key={`${classItem.classCode}-${schedule.day}-${schedule.startTime}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-slate-800">{formatDayLabel(schedule.day)}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {formatTimeRange(schedule.startTime, schedule.endTime)}
                </p>
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  input,
  hint,
}: {
  readonly label: string;
  readonly htmlFor: string;
  readonly input: ReactNode;
  readonly hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="ml-1 text-xs font-medium text-slate-500">
        {label}
      </label>
      {input}
      {hint ? <span className="ml-1 text-[10px] text-slate-400">{hint}</span> : null}
    </div>
  );
}

function Select({
  id,
  value,
  onChange,
  options,
}: {
  readonly id: string;
  readonly value: string;
  readonly onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  readonly options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm font-medium text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}
