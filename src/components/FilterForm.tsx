"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import tutorsData from "@/data/tutors.json";
import type { Tutor, TeachingSubject } from "@/types/tutor";

export default function FilterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    classType: "",
    grade: "",
    subject: "",
    medium: "",
    syllabus: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (formData.classType) params.append("classType", formData.classType);
    if (formData.grade) params.append("grade", formData.grade);
    if (formData.subject) params.append("subject", formData.subject);
    if (formData.medium) params.append("medium", formData.medium);
    if (formData.syllabus) params.append("syllabus", formData.syllabus);

    router.push(`/search?${params.toString()}`);
  };

  const tutors = tutorsData as unknown as Tutor[];
  const allSubjects = Array.from(new Set(tutors.flatMap(t => t.teachingSubjects.map((ts: TeachingSubject) => ts.subject)))).sort((a, b) => a.localeCompare(b));
  const allGrades = Array.from(new Set(tutors.flatMap(t => t.teachingSubjects.flatMap((ts: TeachingSubject) => ts.grades || [])))).sort((a, b) => a.localeCompare(b));
  const allMediums = Array.from(new Set(tutors.flatMap(t => t.teachingSubjects.flatMap((ts: TeachingSubject) => ts.mediums || [])))).sort((a, b) => a.localeCompare(b));
  const allSyllabuses = Array.from(new Set(tutors.flatMap(t => t.teachingSubjects.flatMap((ts: TeachingSubject) => ts.syllabuses || [])))).sort((a, b) => a.localeCompare(b));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/80 backdrop-blur-xl border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl p-6 md:p-10 w-full max-w-[70rem] mx-auto"
    >
      <form onSubmit={handleSearch} className="flex flex-col gap-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          
          <div className="flex flex-col gap-2">
            <label htmlFor="classType" className="text-sm font-semibold text-slate-700 ml-1">Class Type</label>
            <select
              id="classType"
              name="classType"
              value={formData.classType}
              onChange={handleChange}
              className="px-4 py-3.5 rounded-2xl bg-slate-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all hover:bg-white text-slate-800 cursor-pointer shadow-sm"
            >
              <option value="">Any Type</option>
              <option value="Individual">Individual</option>
              <option value="Group">Group</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="grade" className="text-sm font-semibold text-slate-700 ml-1">Grade</label>
            <select
              id="grade"
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              className="px-4 py-3.5 rounded-2xl bg-slate-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all hover:bg-white text-slate-800 cursor-pointer shadow-sm"
            >
              <option value="">Any Grade</option>
              {allGrades.map(g => (
                <option key={g} value={g}>{g.includes("Grade") ? g : `Grade ${g}`}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="subject" className="text-sm font-semibold text-slate-700 ml-1">Subject</label>
            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="px-4 py-3.5 rounded-2xl bg-slate-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all hover:bg-white text-slate-800 cursor-pointer shadow-sm"
            >
              <option value="">Any Subject</option>
              {allSubjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="medium" className="text-sm font-semibold text-slate-700 ml-1">Medium</label>
            <select
              id="medium"
              name="medium"
              value={formData.medium}
              onChange={handleChange}
              className="px-4 py-3.5 rounded-2xl bg-slate-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all hover:bg-white text-slate-800 cursor-pointer shadow-sm"
            >
              <option value="">Any Medium</option>
              {allMediums.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="syllabus" className="text-sm font-semibold text-slate-700 ml-1">Syllabus</label>
            <select
              id="syllabus"
              name="syllabus"
              value={formData.syllabus}
              onChange={handleChange}
              className="px-4 py-3.5 rounded-2xl bg-slate-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all hover:bg-white text-slate-800 cursor-pointer shadow-sm"
            >
              <option value="">Any Syllabus</option>
              {allSyllabuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

        </div>

        <div className="flex justify-center mt-2">
          <button
            type="submit"
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-10 py-4 xl:py-4.5 rounded-full font-bold text-lg shadow-[0_4px_14px_0_rgba(4,60,252,0.39)] hover:shadow-[0_6px_20px_rgba(4,60,252,0.23)] hover:-translate-y-0.5 transition-all duration-300"
          >
            <Search className="w-5 h-5 pr-0.5" />
            Find Tutors
          </button>
        </div>
      </form>
    </motion.div>
  );
}

