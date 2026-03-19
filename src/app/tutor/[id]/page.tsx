"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, GraduationCap, PlayCircle, Calendar, CreditCard, ChevronRight, Info, ShieldCheck, MapPin } from "lucide-react";
import tutorsData from "@/data/tutors.json";

export default function TutorProfile() {
  const params = useParams();
  const router = useRouter();
  const [tutor, setTutor] = useState<any>(null);
  const [bookingForm, setBookingForm] = useState({
    studentName: "",
    studentEmail: "",
    studentPhone: "",
    grade: "",
    subject: "",
    medium: "",
    syllabus: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const found = tutorsData.find(t => t.id === params.id);
    if (found) {
      setTutor(found);
    }
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

  return (
    <main className="min-h-screen bg-slate-50 pb-24 font-sans selection:bg-primary selection:text-white">
      {/* Navigation Bar inside the page but below header */}
      <div className="w-full bg-white border-b border-gray-200 sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center">
          <button onClick={() => router.back()} className="text-slate-600 hover:text-primary flex items-center gap-2 transition-colors font-medium text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Search
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 flex flex-col lg:flex-row gap-8">
        
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
                    <MapPin className="w-4 h-4 text-primary" /> Available Online
                  </div>
                </div>
              </div>
              
              {tutor.about && (
                <p className="text-slate-600 mt-5 leading-relaxed text-base">{tutor.about}</p>
              )}
              
              <div className="flex flex-wrap gap-2 mt-6 justify-center sm:justify-start">
                {tutor.teachingSubjects.map((ts: any) => (
                  <span key={ts.subject} className="bg-blue-50/80 text-primary border border-primary/10 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide">
                    {ts.subject}
                  </span>
                ))}
              </div>
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
                <Calendar className="w-5 h-5 text-primary" /> Live Teaching Schedule
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
                <p className="text-slate-500 mb-8 max-w-xs leading-relaxed text-sm">Thank you, {bookingForm.studentName}. Your admission is processing securely and we will contact you shortly.</p>
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
                  
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="studentName" className="text-xs font-medium text-slate-500 ml-1">Full Name</label>
                    <input id="studentName" required type="text" onChange={(e) => setBookingForm({...bookingForm, studentName: e.target.value})} className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm font-medium text-slate-900 placeholder-slate-400" placeholder="John Doe" />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="studentEmail" className="text-xs font-medium text-slate-500 ml-1">Email Address</label>
                    <input id="studentEmail" required type="email" onChange={(e) => setBookingForm({...bookingForm, studentEmail: e.target.value})} className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm font-medium text-slate-900 placeholder-slate-400" placeholder="john@example.com" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="studentPhone" className="text-xs font-medium text-slate-500 ml-1">Phone Number</label>
                    <input id="studentPhone" required type="tel" onChange={(e) => setBookingForm({...bookingForm, studentPhone: e.target.value})} className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm font-medium text-slate-900 placeholder-slate-400" placeholder="+94 77 123 4567" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="grade" className="text-xs font-medium text-slate-500 ml-1">Grade</label>
                      <select id="grade" required onChange={(e) => setBookingForm({...bookingForm, grade: e.target.value})} className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm font-medium text-slate-900 appearance-none cursor-pointer">
                        <option value="">Select</option>
                        {[1,2,3,4,5,6,7,8,9,10,11,12,13].map(g => <option key={`grade-${g}`} value={g}>Grade {g}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="subject" className="text-xs font-medium text-slate-500 ml-1">Subject</label>
                      <select id="subject" required onChange={(e) => setBookingForm({...bookingForm, subject: e.target.value})} className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm font-medium text-slate-900 appearance-none cursor-pointer">
                        <option value="">Select</option>
                        {tutor.teachingSubjects.map((ts: any) => <option key={ts.subject} value={ts.subject}>{ts.subject}</option>)}
                      </select>
                    </div>
                  </div>

                  <button disabled={isSubmitting} type="submit" className="mt-4 w-full py-4 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover hover:-translate-y-0.5 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:hover:translate-y-0 flex justify-center items-center gap-2 text-sm shadow-primary/20">
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
  );
}
