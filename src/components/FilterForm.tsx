"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

export default function FilterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    grade: "",
    subject: "",
    medium: "",
    syllabus: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (formData.grade) params.append("grade", formData.grade);
    if (formData.subject) params.append("subject", formData.subject);
    if (formData.medium) params.append("medium", formData.medium);
    if (formData.syllabus) params.append("syllabus", formData.syllabus);

    router.push(`/search?${params.toString()}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/80 backdrop-blur-xl border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl p-6 md:p-10 w-full max-w-5xl mx-auto"
    >
      <form onSubmit={handleSearch} className="flex flex-col gap-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Grade</label>
            <select
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              className="px-4 py-3.5 rounded-2xl bg-slate-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all hover:bg-white text-slate-800 cursor-pointer shadow-sm"
            >
              <option value="">Any Grade</option>
              {[3, 4, 5, 6, 7, 8, 9, 10, 11].map(g => (
                <option key={g} value={g.toString()}>Grade {g}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Subject</label>
            <select
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="px-4 py-3.5 rounded-2xl bg-slate-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all hover:bg-white text-slate-800 cursor-pointer shadow-sm"
            >
              <option value="">Any Subject</option>
              {["Maths", "Science", "English", "Tamil", "ENV", "IQ"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Medium</label>
            <select
              name="medium"
              value={formData.medium}
              onChange={handleChange}
              className="px-4 py-3.5 rounded-2xl bg-slate-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all hover:bg-white text-slate-800 cursor-pointer shadow-sm"
            >
              <option value="">Any Medium</option>
              {["English", "Tamil", "Sinhala"].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Syllabus</label>
            <select
              name="syllabus"
              value={formData.syllabus}
              onChange={handleChange}
              className="px-4 py-3.5 rounded-2xl bg-slate-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all hover:bg-white text-slate-800 cursor-pointer shadow-sm"
            >
              <option value="">Any Syllabus</option>
              {["National", "Cambridge", "Edexcel"].map(s => (
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
