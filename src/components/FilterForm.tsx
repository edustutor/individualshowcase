"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, ChevronDown } from "lucide-react";
import { formatGradeLabel, getAllFlattenedClasses, tutors } from "@/lib/tutors";

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

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (formData.grade) params.append("grade", formData.grade);
    if (formData.subject) params.append("subject", formData.subject);
    if (formData.medium) params.append("medium", formData.medium);
    if (formData.syllabus) params.append("syllabus", formData.syllabus);

    router.push(`/search?${params.toString()}`);
  };

  const allClasses = tutors.flatMap((tutor) => getAllFlattenedClasses(tutor));
  const allSubjects = Array.from(new Set(allClasses.map((classItem) => classItem.subject))).sort((a, b) => a.localeCompare(b));
  const allGrades = Array.from(new Set(allClasses.flatMap((classItem) => classItem.grades))).sort((a, b) => (
    formatGradeLabel(a).localeCompare(formatGradeLabel(b), undefined, { numeric: true })
  ));
  const allMediums = Array.from(new Set(allClasses.map((classItem) => classItem.medium))).sort((a, b) => a.localeCompare(b));
  const allSyllabuses = Array.from(new Set(allClasses.map((classItem) => classItem.syllabus))).sort((a, b) => a.localeCompare(b));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white p-6 md:p-10 w-full max-w-[70rem] mx-auto"
      style={{
        borderRadius: "30px",
        boxShadow: "rgba(14,15,12,0.12) 0px 0px 0px 1px",
      }}
    >
      <form onSubmit={handleSearch} className="flex flex-col gap-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { id: "grade", label: "Grade", placeholder: "Any Grade", options: allGrades.map(g => ({ value: g, label: formatGradeLabel(g) })) },
            { id: "subject", label: "Subject", placeholder: "Any Subject", options: allSubjects.map(s => ({ value: s, label: s })) },
            { id: "medium", label: "Medium", placeholder: "Any Medium", options: allMediums.map(m => ({ value: m, label: m })) },
            { id: "syllabus", label: "Syllabus", placeholder: "Any Syllabus", options: allSyllabuses.map(s => ({ value: s, label: s })) },
          ].map((field) => (
            <div key={field.id} className="flex flex-col gap-2">
              <label
                htmlFor={field.id}
                className="text-xs font-bold uppercase tracking-[0.15em] text-[#6b7280] ml-1"
                style={{ fontFeatureSettings: '"calt"' }}
              >
                {field.label}
              </label>
              <div className="relative">
                <select
                  id={field.id}
                  name={field.id}
                  value={formData[field.id as keyof typeof formData]}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 pr-10 bg-[#f8fafc] text-[#0e0f0c] font-semibold text-[15px] cursor-pointer appearance-none transition-all focus:outline-none"
                  style={{
                    borderRadius: "16px",
                    boxShadow: "rgba(14,15,12,0.12) 0px 0px 0px 1px",
                    fontFeatureSettings: '"calt"',
                  }}
                >
                  <option value="">{field.placeholder}</option>
                  {field.options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                  <ChevronDown className="h-5 w-5 text-[#6b7280]" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-2">
          <button
            type="submit"
            className="flex items-center gap-2.5 bg-cta text-cta-text font-bold text-lg cursor-pointer"
            style={{
              padding: "14px 32px",
              borderRadius: "9999px",
              fontFeatureSettings: '"calt"',
              transition: "transform 200ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          >
            <Search className="w-5 h-5" />
            Find Tutors
          </button>
        </div>
      </form>
    </motion.div>
  );
}
