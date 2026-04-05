"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, GraduationCap, PlayCircle, Calendar, CreditCard, ChevronRight, ChevronDown, Info, ShieldCheck, X, AlertTriangle, Star } from "lucide-react";
import tutorsData from "@/data/tutors.json";
import type { Tutor, TeachingSubject, AvailableTime, AssignedGroup, DemoVideo } from "@/types/tutor";

export default function TutorProfile() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type") as "Individual" | "Group" | null;
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [bookingForm, setBookingForm] = useState({
    firstName: "",
    lastName: "",
    studentEmail: "",
    studentPhone: "",
    grade: "",
    subject: "",
    medium: "",
    syllabus: "",
    classesPerWeek: "2"
  });
  const [selectedClassType, setSelectedClassType] = useState<"Individual" | "Group">("Individual");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [agreeRules, setAgreeRules] = useState(false);
  const [activeVideo, setActiveVideo] = useState(0);
  const [showRulesModal, setShowRulesModal] = useState(false);

  useEffect(() => {
    const found = (tutorsData as unknown as Tutor[]).find(t => t.id === params.id);
    if (found) {
      setTutor(found);
      
      // Initialize class type: 
      // 1. From URL parameter if valid
      // 2. From tutor's offered types if missing or invalid
      if (typeParam && found.classTypes?.includes(typeParam)) {
        setSelectedClassType(typeParam);
      } else if (found.classTypes && found.classTypes.length > 0) {
        setSelectedClassType(found.classTypes[0] as "Individual" | "Group");
      }
    }
    window.scrollTo(0, 0);
  }, [params.id, typeParam]);

  if (!tutor) return <div className="min-h-screen flex items-center justify-center font-medium text-slate-500 bg-slate-50">Loading profile...</div>;

  const handleBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const studentName = `${bookingForm.firstName} ${bookingForm.lastName}`.trim();
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...bookingForm, studentName, classType: selectedClassType, tutorId: tutor.id })
      });
      const data = await res.json();
      if (data.success) {
        setBookingSuccess(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPricing = tutor.pricing && selectedClassType === "Group" 
    ? tutor.pricing.group || tutor.pricing.individual // fallback
    : tutor.pricing?.individual || (tutor.pricing as unknown as typeof tutor.pricing.individual); // fallback for older format
    
  // Added safe fallback for currentPricing in case it's missing somehow
  const selectedWeeklyClasses = parseInt(bookingForm.classesPerWeek) || currentPricing?.weeklyClasses || 2;
  const classesPerMonth = selectedWeeklyClasses * 4;
  
  const admissionFee = currentPricing?.admissionFee || 0;
  const pricePerClass = currentPricing?.pricePerClass || 0;
  const currency = currentPricing?.currency || "LKR";
  
  const feePerMonth = selectedClassType === "Individual" 
    ? pricePerClass * classesPerMonth 
    : currentPricing?.feePerMonth || 0;
    
  const totalFirstMonth = selectedClassType === "Individual"
    ? admissionFee + feePerMonth
    : currentPricing?.totalFirstMonth || 0;

  const currentVideos = tutor.demoVideos 
    ? (selectedClassType === "Group" && tutor.demoVideos.group ? tutor.demoVideos.group : tutor.demoVideos.individual || [])
    : [];

  // Derive unique options from tutor's teaching subjects
  const allSubjects = [...new Set(tutor.teachingSubjects.map((ts: TeachingSubject) => ts.subject))];
  const allGrades = [...new Set(tutor.teachingSubjects.flatMap((ts: TeachingSubject) => ts.grades || []))];
  const allMediums = [...new Set(tutor.teachingSubjects.flatMap((ts: TeachingSubject) => ts.mediums || []))];
  const allSyllabuses = [...new Set(tutor.teachingSubjects.flatMap((ts: TeachingSubject) => ts.syllabuses || []))];

  return (
    <>
    <main className="min-h-screen bg-slate-50 pb-24 font-sans selection:bg-primary selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 mb-2 flex justify-end">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary transition-all border border-gray-200/80 px-5 py-2.5 rounded-2xl bg-white/70 backdrop-blur-md hover:bg-white hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Search
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4 flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Profile & Info */}
        <div className="w-full lg:w-[65%] flex flex-col gap-8">
          
          {/* Bio / Main Profile Identity Card */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-sm border border-gray-200/60 flex flex-col sm:flex-row gap-8 items-center sm:items-start text-center sm:text-left relative overflow-hidden">
            {/* Subtle brand color accent line */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-primary"></div>

            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl shadow-md overflow-hidden relative flex-shrink-0 bg-slate-100 border-4 border-white ring-1 ring-slate-900/5">
              <Image src={tutor.profileImageUrl || `https://i.pravatar.cc/150?u=${tutor.firstName}`} alt={`${tutor.firstName}'s Profile`} fill className="object-cover hover:scale-105 transition-transform duration-500" />
            </div>
            
              <div className="flex flex-col gap-5 w-full">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-center sm:justify-start">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{tutor.firstName} {tutor.lastName}</h1>
                    {tutor.isVerified && (
                      <span className="inline-flex items-center px-2 py-0.5 bg-[#63FF94] text-[#0A4D27] text-[10px] font-bold uppercase tracking-wider rounded-md border border-[#4ADE80]">
                        VERIFIED
                      </span>
                    )}
                  </div>

                  <p className="text-xl font-bold text-[#3B4CB8]">
                    {tutor.id === 'tutor-dr-aruni-perera' ? "Senior Mathematics & Physics Specialist" : (tutor.qualifications[1] || tutor.qualifications[0]) || "EDUS Certified Tutor"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm font-medium text-slate-500">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                    <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                    <span className="text-slate-900 font-bold">{tutor.rating || "5.0"}</span>
                    <span className="text-slate-500">({tutor.reviewCount || "0"} Reviews)</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 font-bold">{tutor.qualifications[0]}</span>
                  </div>
                </div>
                
                {tutor.about && (
                  <p className="text-slate-600 m-0 leading-relaxed text-base border-t border-slate-100 pt-4">{tutor.about}</p>
                )}
              </div>
          </motion.div>

          {/* 2. Education & Specializations Card */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }} className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-200/60 hover:shadow-md transition-shadow duration-300 h-fit">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-5 text-slate-900 m-0">
              <GraduationCap className="w-5 h-5 text-primary" /> Education & Specializations
            </h3>
            <ul className="flex flex-col gap-4">
              {tutor.qualifications.map((qual: string, index: number) => (
                <li key={`${qual}-${index}`} className="flex gap-3 text-slate-700 items-start">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed text-sm font-medium">{qual}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* 3. Teaching Subjects Section */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-200/60 hover:shadow-md transition-shadow duration-300 h-fit">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-5 text-slate-900 m-0">
              <GraduationCap className="w-5 h-5 text-primary" /> Teaching Subjects
            </h3>
            <div className="flex flex-col gap-3">
              {tutor.teachingSubjects.map((ts: TeachingSubject) => (
                <div key={ts.subject} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2.5">
                  <span className="text-primary font-bold text-sm">{ts.subject}</span>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-600">
                    {ts.grades?.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-500">Grades:</span>
                        <div className="flex gap-1 flex-wrap">
                          {ts.grades.map((g: string) => (
                            <span key={g} className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-semibold">{g}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {ts.mediums?.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-500">Medium:</span>
                        <div className="flex gap-1 flex-wrap">
                          {ts.mediums.map((m: string) => (
                            <span key={m} className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-semibold">{m}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {ts.syllabuses?.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-500">Syllabus:</span>
                        <div className="flex gap-1 flex-wrap">
                          {ts.syllabuses.map((s: string) => (
                            <span key={s} className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-semibold">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Conditional Rendering of Timetables based on selected Class Type */}
          {selectedClassType === "Individual" && tutor.availableTimes && tutor.availableTimes.length > 0 && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-200/60 hover:shadow-md transition-shadow duration-300 h-fit mb-8">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-5 text-slate-900 m-0">
                <Calendar className="w-5 h-5 text-primary" /> Individual Class Available Time
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tutor.availableTimes.map((schedule: AvailableTime) => (
                  <div key={schedule.day} className="bg-slate-50 border border-slate-200 rounded-[1.25rem] p-5 flex flex-col group hover:border-primary/30 transition-all duration-300 hover:shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-6 bg-primary/20 rounded-full group-hover:bg-primary/40 transition-colors" />
                      <span className="font-bold text-slate-900 text-sm">{schedule.day}</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {schedule.times.map((time: string) => (
                        <span key={time} className="bg-white text-slate-700 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm transition-transform hover:scale-105">
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {selectedClassType === "Group" && tutor.assignedGroups && tutor.assignedGroups.length > 0 && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-200/60 hover:shadow-md transition-shadow duration-300 h-fit mb-8">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-5 text-slate-900 m-0">
                <ShieldCheck className="w-5 h-5 text-primary" /> Group Class Time Table
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tutor.assignedGroups.map((group: string | AssignedGroup, index: number) => {
                  const groupObj = typeof group === 'string' ? { name: group } as AssignedGroup : group;
                  return (
                  <div key={groupObj.name || index} className="bg-slate-50 border border-slate-200 rounded-[1.25rem] p-5 flex flex-col gap-3 group hover:border-primary/30 transition-all duration-300 hover:shadow-sm">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-slate-900 text-sm leading-tight">{groupObj.name}</span>
                      {groupObj.status === "Limited" && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded-md flex-shrink-0">Limited</span>
                      )}
                    </div>
                    {groupObj.schedules && groupObj.schedules.length > 0 && (
                      <div className="flex flex-col gap-1.5 mb-2 mt-1">
                        {groupObj.schedules.map((schedule: {day: string, times: string[]}, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-500">
                            <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-700">{schedule.day}</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {schedule.times.map((time: string, j: number) => (
                                  <span key={j} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-200">
                                    {time}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {groupObj.seatsLeft !== undefined && groupObj.totalSeats !== undefined && (
                      <div className="w-full mt-auto">
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${((groupObj.totalSeats - groupObj.seatsLeft) / groupObj.totalSeats) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="bg-primary h-full rounded-full" 
                          />
                        </div>
                        <div className="flex justify-between mt-2 px-0.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{groupObj.seatsLeft} Seats Left</span>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter">{groupObj.totalSeats} Total</span>
                        </div>
                      </div>
                    )}
                  </div>
                )})}
              </div>
            </motion.div>
          )}

          {/* End of stacked sections */}

          {/* Video Demos - Professional Player UI */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-200/60 w-full mb-8 overflow-hidden">
            {currentVideos && currentVideos.length > 0 ? (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Player Area */}
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900">
                      <PlayCircle className="w-5 h-5 text-primary" /> 
                      {currentVideos.length > 1 ? `Watching Preview ${activeVideo + 1}` : "Watch Demo Class"}
                    </h3>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Now Playing</span>
                    </div>
                  </div>
                  
                  <div className="rounded-[1.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-200 aspect-video relative bg-slate-950 w-full group transition-all duration-500 ring-4 ring-white/50">
                    <iframe 
                      key={typeof currentVideos[activeVideo] === 'string' ? (currentVideos[activeVideo] as string) : (currentVideos[activeVideo] as DemoVideo)?.url || ''}
                      src={(currentVideos[activeVideo] as DemoVideo)?.url || (currentVideos[activeVideo] as string)} 
                      className="w-full h-full absolute inset-0 z-10" 
                      allowFullScreen 
                      title={`Featured Demo Video`}
                    ></iframe>
                    {/* Background glows for premium look */}
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 blur-[100px] rounded-full"></div>
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/10 blur-[100px] rounded-full"></div>
                  </div>
                </div>

                {/* Thumbnail Strip / Sidebar */}
                {currentVideos.length > 1 && (
                  <div className="w-full lg:w-72 flex flex-col pt-0 lg:pt-1">
                    <div className="flex items-center justify-between mb-4 px-1">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Next Previews</h4>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{activeVideo + 1} / {currentVideos.length}</span>
                    </div>
                    
                    <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto lg:max-h-[380px] pb-4 lg:pb-0 scroll-smooth no-scrollbar">
                      {currentVideos.map((video: string | DemoVideo, index: number) => {
                        const videoUrl = typeof video === 'string' ? video : (video as DemoVideo).url;
                        return (
                        <button 
                          key={videoUrl || index} 
                          onClick={() => setActiveVideo(index)}
                          className={`flex-shrink-0 flex items-center gap-3 p-3 rounded-2xl transition-all text-left group border ${activeVideo === index 
                            ? 'bg-primary/5 border-primary/20 shadow-sm ring-1 ring-primary/10' 
                            : 'bg-white hover:bg-slate-50 border-gray-100 shadow-sm hover:shadow-md'}`}
                        >
                           <div className="w-20 h-14 rounded-xl bg-slate-900 border border-slate-200 flex-shrink-0 relative overflow-hidden flex items-center justify-center">
                             {/* Small Play Overly */}
                             <div className={`absolute inset-0 z-10 flex items-center justify-center transition-opacity ${activeVideo === index ? 'bg-primary/20' : 'bg-black/30 opacity-0 group-hover:opacity-100'}`}>
                               <PlayCircle className={`w-6 h-6 ${activeVideo === index ? 'text-white' : 'text-white/80'}`} />
                             </div>
                             {/* Placeholder generic preview frame */}
                             <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950"></div>
                           </div>
                           
                           <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                             <span className={`text-[11px] font-bold truncate leading-tight ${activeVideo === index ? 'text-primary' : 'text-slate-700'}`}>Lesson Preview {index + 1}</span>
                             <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">Ready to Watch</span>
                           </div>

                           {activeVideo === index && (
                             <div className="ml-auto flex gap-0.5 self-center">
                               {[1, 2, 3].map(i => (
                                 <motion.div 
                                   key={i} 
                                   animate={{ scaleY: [1, 1.8, 1] }} 
                                   transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }} 
                                   className="w-0.5 h-3 bg-primary rounded-full"
                                 ></motion.div>
                               ))}
                             </div>
                           )}
                        </button>
                      )})}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-14 bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-200 text-slate-400">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-slate-100">
                  <PlayCircle className="w-8 h-8 opacity-30 text-primary" />
                </div>
                <span className="text-sm font-semibold text-slate-500">No demo videos uploaded yet</span>
                <p className="text-xs text-slate-400 mt-1 italic">Tutor hasn&apos;t provided session previews</p>
              </div>
            )}
          </motion.div>

          {/* Class Rules Section */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }} className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-sm border border-gray-200/60 w-full hover:shadow-md transition-shadow duration-300 h-fit flex flex-col gap-5">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 m-0">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Class Rules
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed m-0">Please read carefully and accept to continue to join our classes. We need this acceptance to maintain our Academic and Online Learning Standards. Your understanding in this is highly appreciated.</p>
            <ol className="flex flex-col gap-3 list-none m-0">
              {[
                "Your Internet Connection and device has to be fit for Online learning.",
                "Your attendance to class will be strictly monitored. Failure to attend more than 3 consecutive classes will be resulting in dropout from classes.",
                "Student must answer and respond to questions from tutor while learning. You'll be removed from class if not responding.",
                "You have to ask and discuss all your subject related doubts during the class.",
                "Students are requested to complete all required academic works by the tutor on time without fail."
              ].map((rule, i) => (
                <li key={`rule-${i}`} className="flex gap-4 items-start text-sm text-slate-700 bg-amber-50/10 border border-amber-100/50 rounded-2xl p-4 transition-colors hover:bg-amber-50/30">
                  <span className="flex-shrink-0 w-7 h-7 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-black shadow-sm">{i + 1}</span>
                  <span className="leading-relaxed font-medium">{rule}</span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-slate-400 text-center m-0 italic px-4">Our coordinator will help you all the ways possible for you to peacefully study to achieve excellence in your learning at EDUS.</p>
          </motion.div>

        </div>

        {/* Right Column: Checkout & Booking Form */}
        <div className="w-full lg:w-[35%] relative">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white rounded-[2rem] p-8 shadow-lg shadow-primary/5 border border-gray-200/60 sticky top-[100px]">
            {bookingSuccess ? (
              <div className="flex flex-col items-center justify-center text-center py-10">
                <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="w-10 h-10 text-success" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Request Subjected!</h3>
                <p className="text-slate-500 mb-8 max-w-xs leading-relaxed text-sm">Thank you, {bookingForm.firstName}. Your admission is processing securely and we will contact you shortly.</p>
                <button onClick={() => router.push('/')} className="w-full py-4 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-sm">
                  Return to Home
                </button>
              </div>
            ) : (
              <>
                {/* Clean SaaS Invoice Header */}
                <div className="bg-slate-900 rounded-[1.5rem] p-6 text-white mb-8 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary blur-[80px] rounded-full opacity-40 pointer-events-none -mr-10 -mt-10"></div>
                  
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10 relative z-10">
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" /> Fees Breakdown
                    </h3>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                      <span className="text-[10px] font-bold text-slate-100 uppercase tracking-wider">{selectedClassType} Class</span>
                    </div>
                  </div>

                  {/* Pricing Breakdown from Hardcoded JSON values */}
                  <div className="flex flex-col gap-4 text-sm font-medium text-slate-300 relative z-10">
                    <div className="flex justify-between items-center">
                      <span>Admission (One-time)</span>
                      <span className="text-white font-semibold">{currency} {admissionFee}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Monthly {selectedClassType === "Individual" ? `(${classesPerMonth} Classes)` : ""}</span>
                      <span className="text-white font-semibold">{currency} {feePerMonth}</span>
                    </div>
                    
                    {selectedClassType === "Individual" && (
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10 mt-2 flex justify-between items-center">
                        <span className="text-slate-400 text-xs font-semibold flex items-center gap-1.5"><Info className="w-3.5 h-3.5"/> Per Class</span>
                        <span className="text-white font-bold text-xs">{currency} {pricePerClass}</span>
                      </div>
                    )}

                    <div className="border-t border-white/20 mt-2 pt-4 flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-white font-bold">1st Month Total</span>
                        <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Then {currency} {feePerMonth}/mo</span>
                      </div>
                      <span className="text-3xl font-black text-white">{currency} {totalFirstMonth}</span>
                    </div>
                    
                    {selectedClassType === "Individual" ? (
                      <p className="text-[10px] text-slate-400 mt-3 leading-relaxed text-center">Class count can be adjusted according to your preference and schedule. We recommend at least 2 classes per week for best results.</p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-3 leading-relaxed text-center">We recommend you to study for 1 term or 4 months, then check your real results.</p>
                    )}
                  </div>
                </div>

                <form onSubmit={handleBooking} className="flex flex-col gap-5">
                  <h4 className="text-slate-900 font-bold mb-1 uppercase tracking-wide text-xs">Student Registration Details</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="firstName" className="text-xs font-medium text-slate-500 ml-1">First Name</label>
                      <input id="firstName" required type="text" onChange={(e) => setBookingForm({...bookingForm, firstName: e.target.value})} className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm font-medium text-slate-900 placeholder-slate-400" placeholder="John" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="lastName" className="text-xs font-medium text-slate-500 ml-1">Last Name</label>
                      <input id="lastName" required type="text" onChange={(e) => setBookingForm({...bookingForm, lastName: e.target.value})} className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm font-medium text-slate-900 placeholder-slate-400" placeholder="Doe" />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="studentEmail" className="text-xs font-medium text-slate-500 ml-1">Email Address</label>
                    <input id="studentEmail" required type="email" onChange={(e) => setBookingForm({...bookingForm, studentEmail: e.target.value})} className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm font-medium text-slate-900 placeholder-slate-400" placeholder="john@example.com" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="studentPhone" className="text-xs font-medium text-slate-500 ml-1">Phone Number <span className="text-slate-400">(with country code)</span></label>
                    <input id="studentPhone" required type="tel" onChange={(e) => setBookingForm({...bookingForm, studentPhone: e.target.value.replace(/\D/g, '')})} className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm font-medium text-slate-900 placeholder-slate-400" placeholder="e.g. 94707072072" />
                    <span className="text-[10px] text-slate-400 ml-1">Digits only, starting with country code (e.g. 94 for Sri Lanka, 91 for India)</span>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-1">
                    <label htmlFor="formClassType" className="text-xs font-medium text-slate-500 ml-1">Class Type</label>
                    <div className="px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700 cursor-not-allowed flex items-center justify-between">
                      {selectedClassType} Class
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="subject" className="text-xs font-medium text-slate-500 ml-1">Subject</label>
                      {allSubjects.length === 1 ? (
                        <div className="px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700 cursor-not-allowed">{allSubjects[0] as string}</div>
                      ) : (
                        <div className="relative">
                          <select id="subject" required value={bookingForm.subject} onChange={(e) => setBookingForm({...bookingForm, subject: e.target.value})} className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm font-medium text-slate-900 appearance-none cursor-pointer">
                            <option value="">Select</option>
                            {allSubjects.map((s: string) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="grade" className="text-xs font-medium text-slate-500 ml-1">Grade</label>
                      {allGrades.length === 1 ? (
                        <div className="px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700 cursor-not-allowed">Grade {allGrades[0] as string}</div>
                      ) : (
                        <div className="relative">
                          <select id="grade" required value={bookingForm.grade} onChange={(e) => setBookingForm({...bookingForm, grade: e.target.value})} className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm font-medium text-slate-900 appearance-none cursor-pointer">
                            <option value="">Select</option>
                            {allGrades.map((g: string) => <option key={`grade-${g}`} value={g}>Grade {g}</option>)}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="medium" className="text-xs font-medium text-slate-500 ml-1">Medium</label>
                      {allMediums.length === 1 ? (
                        <div className="px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700 cursor-not-allowed">{allMediums[0] as string}</div>
                      ) : (
                        <div className="relative">
                          <select id="medium" required value={bookingForm.medium} onChange={(e) => setBookingForm({...bookingForm, medium: e.target.value})} className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm font-medium text-slate-900 appearance-none cursor-pointer">
                            <option value="">Select</option>
                            {allMediums.map((m: string) => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="syllabus" className="text-xs font-medium text-slate-500 ml-1">Syllabus</label>
                      {allSyllabuses.length === 1 ? (
                        <div className="px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700 cursor-not-allowed">{allSyllabuses[0] as string}</div>
                      ) : (
                        <div className="relative">
                          <select id="syllabus" required value={bookingForm.syllabus} onChange={(e) => setBookingForm({...bookingForm, syllabus: e.target.value})} className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm font-medium text-slate-900 appearance-none cursor-pointer">
                            <option value="">Select</option>
                            {allSyllabuses.map((s: string) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedClassType === "Individual" && (
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="classesPerWeek" className="text-xs font-medium text-slate-500 ml-1">Classes per Week</label>
                      <div className="relative">
                        <select id="classesPerWeek" required value={bookingForm.classesPerWeek} onChange={(e) => setBookingForm({...bookingForm, classesPerWeek: e.target.value})} className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm font-medium text-slate-900 appearance-none cursor-pointer">
                          {[2, 3, 4, 5, 6, 7].map((n) => (
                            <option key={n} value={n}>{n} Classes</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2.5 mt-2 bg-amber-50/50 border border-amber-100 rounded-xl p-3.5">
                    <input id="agreeRules" type="checkbox" checked={agreeRules} onChange={(e) => setAgreeRules(e.target.checked)} className="mt-0.5 w-4 h-4 accent-primary cursor-pointer flex-shrink-0" />
                    <label htmlFor="agreeRules" className="text-xs text-slate-600 leading-relaxed">
                      I agree to the{' '}
                      <button type="button" onClick={() => setShowRulesModal(true)} className="text-primary font-semibold underline underline-offset-2 hover:text-primary-hover transition-colors cursor-pointer">Class Rules & Policies</button>
                    </label>
                  </div>

                  <button disabled={isSubmitting || !agreeRules} type="submit" className="mt-4 w-full py-4 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover hover:-translate-y-0.5 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex justify-center items-center gap-2 text-sm shadow-primary/20">
                    {isSubmitting ? "Processing..." : "Enroll Now"} <ChevronRight className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] text-center text-slate-400 mt-2 font-medium flex items-center justify-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5"/> Information is secure and encrypted</p>
                </form>
              </>
            )}
          </motion.div>
        </div>

      </div>
    </main>

    {/* Class Rules Modal */}
    {showRulesModal && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowRulesModal(false)}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Class Rules & Policies
            </h3>
            <button onClick={() => setShowRulesModal(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer">
              <X className="w-4 h-4 text-slate-600" />
            </button>
          </div>
          <div className="px-6 py-5">
            <p className="text-slate-500 text-sm mb-5 leading-relaxed">Please read carefully and accept to continue to join our classes. We need this acceptance to maintain our Academic and Online Learning Standards. Your understanding in this is highly appreciated.</p>
            <ol className="flex flex-col gap-3 list-none">
              {[
                "Your Internet Connection and device has to be fit for Online learning.",
                "Your attendance to class will be strictly monitored. Failure to attend more than 3 consecutive classes will be resulting in dropout from classes.",
                "Student must answer and respond to questions from tutor while learning. You'll be removed from class if not responding.",
                "You have to ask and discuss all your subject related doubts during the class.",
                "Students are requested to complete all required academic works by the tutor on time without fail."
              ].map((rule, i) => (
                <li key={`modal-rule-${i}`} className="flex gap-3 items-start text-sm text-slate-700 bg-amber-50/50 border border-amber-100 rounded-xl p-3.5">
                  <span className="flex-shrink-0 w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <span className="leading-relaxed">{rule}</span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-slate-400 mt-5 text-center leading-relaxed">Our coordinator will help you all the ways possible for you to peacefully study to achieve excellence in your learning at EDUS.</p>
            <button onClick={() => { setShowRulesModal(false); setAgreeRules(true); }} className="mt-6 w-full py-3.5 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover transition-all text-sm cursor-pointer">
              I Agree & Accept
            </button>
          </div>
        </motion.div>
      </div>
    )}
    </>
  );
}
