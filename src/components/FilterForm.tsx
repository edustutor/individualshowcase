"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, ChevronDown, X } from "lucide-react";
import { formatGradeLabel, normalizeGradeValue, tutorMatchesFilters, tutors } from "@/lib/tutors";

export default function FilterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    grade: "",
    subject: "",
    medium: "",
    syllabus: "",
  });

  // Tutors that would still match if we IGNORE the named filter — used to compute
  // what's still pickable in each dropdown without auto-zeroing the user's other choices.
  function matchingTutors(exclude?: keyof typeof formData) {
    const f = {
      grade: exclude === "grade" ? null : formData.grade || null,
      subject: exclude === "subject" ? null : formData.subject || null,
      medium: exclude === "medium" ? null : formData.medium || null,
      syllabus: exclude === "syllabus" ? null : formData.syllabus || null,
    };
    return tutors.filter((t) => tutorMatchesFilters(t, f));
  }

  // Available options for each filter — union of class values + tutor profile capability,
  // across the tutors that still match the other selected filters.
  const availableGrades = useMemo(() => {
    const set = new Set<string>();
    // Grade only comes from classes — no profile-level grade list exists.
    for (const t of matchingTutors("grade")) {
      for (const cls of [...t.individualClasses, ...t.groupClasses]) {
        for (const g of cls.grades) set.add(g);
      }
    }
    // Numeric grades (3, 4, ... 11) come first in ascending order; non-numeric grades
    // like "A/L" and "O/L" go to the end so the dropdown reads in school-progression order.
    return Array.from(set).sort((a, b) => {
      const aIsNumeric = /^\d+$/.test(normalizeGradeValue(a));
      const bIsNumeric = /^\d+$/.test(normalizeGradeValue(b));
      if (aIsNumeric && !bIsNumeric) return -1;
      if (!aIsNumeric && bIsNumeric) return 1;
      return formatGradeLabel(a).localeCompare(formatGradeLabel(b), undefined, {
        numeric: true,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.subject, formData.medium, formData.syllabus]);

  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    for (const t of matchingTutors("subject")) {
      for (const cls of [...t.individualClasses, ...t.groupClasses]) set.add(cls.subject);
      for (const s of t.profile.subjects) set.add(s);
    }
    return Array.from(set).sort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.grade, formData.medium, formData.syllabus]);

  const availableMediums = useMemo(() => {
    const set = new Set<string>();
    for (const t of matchingTutors("medium")) {
      for (const cls of [...t.individualClasses, ...t.groupClasses]) set.add(cls.medium);
      for (const m of t.profile.mediums) set.add(m);
    }
    return Array.from(set).sort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.grade, formData.subject, formData.syllabus]);

  const availableSyllabuses = useMemo(() => {
    const set = new Set<string>();
    for (const t of matchingTutors("syllabus")) {
      for (const cls of [...t.individualClasses, ...t.groupClasses]) set.add(cls.syllabus);
      for (const s of t.profile.syllabusSupported) set.add(s);
    }
    return Array.from(set).sort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.grade, formData.subject, formData.medium]);

  // Count matching tutors for preview — uses the same match logic as the search results page.
  const matchCount = useMemo(() => {
    const hasAnyFilter =
      formData.grade || formData.subject || formData.medium || formData.syllabus;
    if (!hasAnyFilter) return tutors.length;
    return tutors.filter((t) =>
      tutorMatchesFilters(t, {
        grade: formData.grade || null,
        subject: formData.subject || null,
        medium: formData.medium || null,
        syllabus: formData.syllabus || null,
      })
    ).length;
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      // Auto-clear dependent filters if their current value is no longer valid
      // We'll validate after setting, using a mini-check
      return next;
    });
  };

  // After formData updates, clean up invalid selections
  // (e.g., if grade changed and selected subject no longer exists for that grade)
  useMemo(() => {
    let needsUpdate = false;
    const cleaned = { ...formData };

    if (cleaned.subject && !availableSubjects.includes(cleaned.subject)) {
      cleaned.subject = "";
      needsUpdate = true;
    }
    if (cleaned.medium && !availableMediums.includes(cleaned.medium)) {
      cleaned.medium = "";
      needsUpdate = true;
    }
    if (cleaned.syllabus && !availableSyllabuses.includes(cleaned.syllabus)) {
      cleaned.syllabus = "";
      needsUpdate = true;
    }
    if (
      cleaned.grade &&
      !availableGrades.some(
        (g) => normalizeGradeValue(g) === normalizeGradeValue(cleaned.grade)
      )
    ) {
      cleaned.grade = "";
      needsUpdate = true;
    }

    if (needsUpdate) {
      setFormData(cleaned);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableGrades, availableSubjects, availableMediums, availableSyllabuses]);

  const clearFilter = (key: keyof typeof formData) => {
    setFormData((prev) => ({ ...prev, [key]: "" }));
  };

  const hasAnyFilter =
    formData.grade || formData.subject || formData.medium || formData.syllabus;

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (formData.grade) params.append("grade", formData.grade);
    if (formData.subject) params.append("subject", formData.subject);
    if (formData.medium) params.append("medium", formData.medium);
    if (formData.syllabus) params.append("syllabus", formData.syllabus);
    router.push(`/search?${params.toString()}`);
  };

  const fields = [
    {
      id: "grade" as const,
      label: "Grade",
      placeholder: "Any Grade",
      options: availableGrades.map((g) => ({
        value: g,
        label: formatGradeLabel(g),
      })),
    },
    {
      id: "subject" as const,
      label: "Subject",
      placeholder: "Any Subject",
      options: availableSubjects.map((s) => ({ value: s, label: s })),
    },
    {
      id: "medium" as const,
      label: "Medium",
      placeholder: "Any Medium",
      options: availableMediums.map((m) => ({ value: m, label: m })),
    },
    {
      id: "syllabus" as const,
      label: "Syllabus",
      placeholder: "Any Syllabus",
      options: availableSyllabuses.map((s) => ({ value: s, label: s })),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white p-4 sm:p-6 md:p-10 w-full max-w-[70rem] mx-auto"
      style={{
        borderRadius: "30px",
        boxShadow:
          "rgba(14,15,12,0.12) 0px 0px 0px 1px",
      }}
    >
      <form onSubmit={handleSearch} className="flex flex-col gap-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {fields.map((field) => {
            const currentValue =
              formData[field.id];
            const isActive = !!currentValue;

            return (
              <div key={field.id} className="flex flex-col gap-2">
                <label
                  htmlFor={field.id}
                  className="text-xs font-bold uppercase tracking-[0.15em] text-[#6b7280] ml-1"
                  style={{ fontFeatureSettings: '"calt"' }}
                >
                  {field.label}
                  {isActive && (
                    <button
                      type="button"
                      onClick={() => clearFilter(field.id)}
                      className="ml-2 inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600 cursor-pointer hover:text-blue-800 transition-colors uppercase"
                    >
                      <X className="h-3 w-3" /> Clear
                    </button>
                  )}
                </label>
                <div className="relative">
                  <select
                    id={field.id}
                    name={field.id}
                    value={currentValue}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 pr-10 text-[15px] cursor-pointer appearance-none transition-all focus:outline-none"
                    style={{
                      borderRadius: "16px",
                      border: isActive
                        ? "2px solid #2563eb"
                        : "2px solid transparent",
                      boxShadow: "rgba(14,15,12,0.12) 0px 0px 0px 1px",
                      background: isActive ? "#eff6ff" : "#f8fafc",
                      color: isActive ? "#1e3a8a" : "#0e0f0c",
                      fontWeight: isActive ? 800 : 600,
                      fontFeatureSettings: '"calt"',
                    }}
                  >
                    <option value="">{field.placeholder}</option>
                    {field.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <ChevronDown
                      className="h-5 w-5"
                      style={{
                        color: isActive ? "#2563eb" : "#6b7280",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active filter chips */}
        {hasAnyFilter && (
          <div className="flex flex-wrap items-center gap-2 -mt-3">
            {formData.grade && (
              <FilterChip
                label={formatGradeLabel(formData.grade)}
                onClear={() => clearFilter("grade")}
              />
            )}
            {formData.subject && (
              <FilterChip
                label={formData.subject}
                onClear={() => clearFilter("subject")}
              />
            )}
            {formData.medium && (
              <FilterChip
                label={`${formData.medium} Medium`}
                onClear={() => clearFilter("medium")}
              />
            )}
            {formData.syllabus && (
              <FilterChip
                label={formData.syllabus}
                onClear={() => clearFilter("syllabus")}
              />
            )}
            <button
              type="button"
              onClick={() =>
                setFormData({
                  grade: "",
                  subject: "",
                  medium: "",
                  syllabus: "",
                })
              }
              className="text-xs font-bold text-[#6b7280] cursor-pointer hover:text-[#374151] transition-colors ml-1"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="flex justify-center mt-2">
          <button
            type="submit"
            className="flex items-center gap-2.5 bg-cta text-cta-text font-bold text-base sm:text-lg cursor-pointer w-full sm:w-auto justify-center"
            style={{
              padding: "14px 24px",
              borderRadius: "9999px",
              fontFeatureSettings: '"calt"',
              transition: "transform 200ms ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "scale(1)")
            }
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.95)")
            }
            onMouseUp={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
          >
            <Search className="w-5 h-5" />
            {hasAnyFilter
              ? `Find Tutors (${matchCount})`
              : `Browse All Tutors (${tutors.length})`}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

function FilterChip({
  label,
  onClear,
}: {
  readonly label: string;
  readonly onClear: () => void;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700"
      style={{
        borderRadius: "9999px",
        background: "rgba(37, 99, 235, 0.08)",
        boxShadow: "rgba(14,15,12,0.12) 0px 0px 0px 1px",
      }}
    >
      {label}
      <button
        type="button"
        onClick={onClear}
        className="cursor-pointer hover:text-blue-900 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
