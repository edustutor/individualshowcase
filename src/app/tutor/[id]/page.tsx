"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, GraduationCap, PlayCircle, Calendar, CreditCard, ChevronRight, Info, ShieldCheck, Video, X, AlertTriangle } from "lucide-react";
import tutorsData from "@/data/tutors.json";

export default function TutorProfile() {
  const params = useParams();
  const router = useRouter();
  const [tutor, setTutor] = useState<any>(null);
  const [bookingForm, setBookingForm] = useState({
    firstName: "",
    lastName: "",
    studentEmail: "",
    studentPhone: "",
    grade: "",
    subject: "",
    medium: "",
    syllabus: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [agreeRules, setAgreeRules] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

  useEffect(() => {
    const found = tutorsData.find(t => t.id === params.id);
    if (found) {
      setTutor(found);
    }
    window.scrollTo(0, 0);
  }, [params.id]);

  if (!tutor) return <div className="min-h-screen flex items-center justify-center font-medium text-slate-500 bg-slate-50">Loading profile...</div>;

  const handleBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...bookingForm, tutorId: tutor.id })
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

  const classesPerMonth = tutor.pricing.weeklyClasses * 4;
  const { admissionFee, pricePerClass, totalFirstMonth, feePerMonth, currency } = tutor.pricing;

  // Derive unique options from tutor's teaching subjects
  const allSubjects = [...new Set(tutor.teachingSubjects.map((ts: any) => ts.subject))];
  const allGrades = [...new Set(tutor.teachingSubjects.flatMap((ts: any) => ts.grades || []))];
  const allMediums = [...new Set(tutor.teachingSubjects.flatMap((ts: any) => ts.mediums || []))];
  const allSyllabuses = [...new Set(tutor.teachingSubjects.flatMap((ts: any) => ts.syllabuses || []))];

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
          
          {/* Main Profile Identity Card */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-sm border border-gray-200/60 flex flex-col sm:flex-row gap-8 items-center sm:items-start text-center sm:text-left relative overflow-hidden">
            {/* Subtle brand color accent line */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-primary"></div>

            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl shadow-md overflow-hidden relative flex-shrink-0 bg-slate-100 border-4 border-white ring-1 ring-slate-900/5">
              <Image src={tutor.profileImageUrl || `https://i.pravatar.cc/150?u=${tutor.firstName}`} alt={`${tutor.firstName}'s Profile`} fill className="object-cover hover:scale-105 transition-transform duration-500" />
            </div>
            
            <div className="flex flex-col flex-1 pt-2 w-full">
              <div className="flex justify-between items-start w-full">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{tutor.firstName} {tutor.lastName}</h1>
                  <div className="flex items-center gap-2 mt-2 text-slate-500 font-medium text-sm justify-center sm:justify-start">
                    <Video className="w-4 h-4 text-primary" /> Available Online
                  </div>
                </div>
              </div>
              
              {tutor.about && (
                <p className="text-slate-600 mt-5 leading-relaxed text-base">{tutor.about}</p>
              )}
            </div>
          </motion.div>

          {/* Teaching Subjects — Separate Section */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }} className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-200/60 hover:shadow-md transition-shadow duration-300">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-900">
              <GraduationCap className="w-5 h-5 text-primary" /> Teaching Subjects
            </h3>
            <div className="flex flex-col gap-3">
              {tutor.teachingSubjects.map((ts: any) => (
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Qualifications Card */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-200/60 flex flex-col h-full hover:shadow-md transition-shadow duration-300">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-900">
                <GraduationCap className="w-5 h-5 text-primary" /> Education & Specializations
              </h3>
              <ul className="flex flex-col gap-4 flex-1">
                {tutor.qualifications.map((qual: string) => (
                  <li key={qual} className="flex gap-3 text-slate-700 items-start">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed text-sm font-medium">{qual}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Timetable / Schedule Card */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-200/60 flex flex-col h-full hover:shadow-md transition-shadow duration-300">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-900">
                <Calendar className="w-5 h-5 text-primary" /> Available Time
              </h3>
              <div className="flex flex-col gap-3 flex-1">
                {tutor.availableTimes?.map((schedule: any) => (
                  <div key={schedule.day} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col group hover:border-primary/30 transition-colors">
                    <div className="font-semibold text-slate-800 text-sm mb-2">{schedule.day}</div>
                    <div className="flex flex-wrap gap-2">
                      {schedule.times.map((time: string) => (
                        <span key={time} className="bg-white text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">{time}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Video Demos - Full Width */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-200/60 w-full mb-8">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-900">
              <PlayCircle className="w-5 h-5 text-primary" /> Watch Demo Classes
            </h3>
            {tutor.demoVideos && tutor.demoVideos.length > 0 ? (
              <div className={`grid gap-6 ${tutor.demoVideos.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {tutor.demoVideos.map((videoUrl: string, index: number) => (
                  <div key={videoUrl} className="rounded-xl overflow-hidden shadow-sm border border-slate-200 aspect-video relative bg-slate-100 w-full group">
                    <iframe 
                      src={videoUrl} 
                      className="w-full h-full absolute inset-0 z-10" 
                      allowFullScreen 
                      title={`Demo Video ${index + 1}`}
                    ></iframe>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
                <PlayCircle className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-sm font-medium">No demo videos uploaded yet</span>
              </div>
            )}
          </motion.div>

          {/* Class Rules Section */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }} className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-200/60 w-full hover:shadow-md transition-shadow duration-300">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-2 text-slate-900">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Class Rules
            </h3>
            <p className="text-slate-500 text-sm mb-5 leading-relaxed">Please read carefully and accept to continue to join our classes. We need this acceptance to maintain our Academic and Online Learning Standards. Your understanding in this is highly appreciated.</p>
            <ol className="flex flex-col gap-3 list-none">
              {[
                "Your Internet Connection and device has to be fit for Online learning.",
                "Your attendance to class will be strictly monitored. Failure to attend more than 3 consecutive classes will be resulting in dropout from classes.",
                "Student must answer and respond to questions from tutor while learning. You'll be removed from class if not responding.",
                "You have to ask and discuss all your subject related doubts during the class.",
                "Students are requested to complete all required academic works by the tutor on time without fail."
              ].map((rule, i) => (
                <li key={`rule-${i}`} className="flex gap-3 items-start text-sm text-slate-700 bg-amber-50/50 border border-amber-100 rounded-xl p-3.5">
                  <span className="flex-shrink-0 w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <span className="leading-relaxed">{rule}</span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-slate-400 mt-5 text-center">Our coordinator will help you all the ways possible for you to peacefully study to achieve excellence in your learning at EDUS.</p>
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
                  
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10 relative z-10">
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" /> Fees Breakdown
                    </h3>
                  </div>

                  {/* Pricing Breakdown from Hardcoded JSON values */}
                  <div className="flex flex-col gap-4 text-sm font-medium text-slate-300 relative z-10">
                    <div className="flex justify-between items-center">
                      <span>Admission (One-time)</span>
                      <span className="text-white font-semibold">{currency} {admissionFee}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Monthly ({classesPerMonth} Classes)</span>
                      <span className="text-white font-semibold">{currency} {feePerMonth}</span>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10 mt-2 flex justify-between items-center">
                      <span className="text-slate-400 text-xs font-semibold flex items-center gap-1.5"><Info className="w-3.5 h-3.5"/> Per Class</span>
                      <span className="text-white font-bold text-xs">{currency} {pricePerClass}</span>
                    </div>

                    <div className="border-t border-white/20 mt-2 pt-4 flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-white font-bold">1st Month Total</span>
                        <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Then {currency} {feePerMonth}/mo</span>
                      </div>
                      <span className="text-3xl font-black text-white">{currency} {totalFirstMonth}</span>
                    </div>
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

                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="subject" className="text-xs font-medium text-slate-500 ml-1">Subject</label>
                      {allSubjects.length === 1 ? (
                        <div className="px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700 cursor-not-allowed">{allSubjects[0] as string}</div>
                      ) : (
                        <select id="subject" required value={bookingForm.subject} onChange={(e) => setBookingForm({...bookingForm, subject: e.target.value})} className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm font-medium text-slate-900 appearance-none cursor-pointer">
                          <option value="">Select</option>
                          {allSubjects.map((s: any) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="grade" className="text-xs font-medium text-slate-500 ml-1">Grade</label>
                      {allGrades.length === 1 ? (
                        <div className="px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700 cursor-not-allowed">Grade {allGrades[0] as string}</div>
                      ) : (
                        <select id="grade" required value={bookingForm.grade} onChange={(e) => setBookingForm({...bookingForm, grade: e.target.value})} className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm font-medium text-slate-900 appearance-none cursor-pointer">
                          <option value="">Select</option>
                          {allGrades.map((g: any) => <option key={`grade-${g}`} value={g}>Grade {g}</option>)}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="medium" className="text-xs font-medium text-slate-500 ml-1">Medium</label>
                      {allMediums.length === 1 ? (
                        <div className="px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700 cursor-not-allowed">{allMediums[0] as string}</div>
                      ) : (
                        <select id="medium" required value={bookingForm.medium} onChange={(e) => setBookingForm({...bookingForm, medium: e.target.value})} className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm font-medium text-slate-900 appearance-none cursor-pointer">
                          <option value="">Select</option>
                          {allMediums.map((m: any) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="syllabus" className="text-xs font-medium text-slate-500 ml-1">Syllabus</label>
                      {allSyllabuses.length === 1 ? (
                        <div className="px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700 cursor-not-allowed">{allSyllabuses[0] as string}</div>
                      ) : (
                        <select id="syllabus" required value={bookingForm.syllabus} onChange={(e) => setBookingForm({...bookingForm, syllabus: e.target.value})} className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm font-medium text-slate-900 appearance-none cursor-pointer">
                          <option value="">Select</option>
                          {allSyllabuses.map((s: any) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
                    </div>
                  </div>

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
