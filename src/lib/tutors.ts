import tutorDirectoryData from "@/data/tutors.json";
import type {
  FlattenedTutorClass,
  GroupClass,
  IndividualClass,
  SearchClassType,
  Tutor,
  TutorClassType,
  TutorDirectory,
  TutorProfile,
} from "@/types/tutor";

const tutorDirectory = tutorDirectoryData as TutorDirectory;

const FALLBACK_AVATAR_BASE_URL = "https://i.pravatar.cc";
const BROKEN_CDN_HOSTS = new Set(["cdn.edus.lk"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeGrades(grades: string[] | string | undefined): string[] {
  if (Array.isArray(grades)) {
    return grades;
  }
  return grades ? [grades] : [];
}

function normalizeIndividualClass(classItem: IndividualClass): IndividualClass {
  const runtimeClass = classItem as IndividualClass & { grades?: string[] | string };

  return {
    ...classItem,
    grades: normalizeGrades(runtimeClass.grades),
  };
}

function normalizeGroupClass(classItem: GroupClass): GroupClass {
  const runtimeClass = classItem as GroupClass & { grades?: string[] | string };

  return {
    ...classItem,
    grades: normalizeGrades(runtimeClass.grades),
  };
}

function isBrokenRemoteUrl(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  try {
    return BROKEN_CDN_HOSTS.has(new URL(url).hostname);
  } catch {
    return true;
  }
}

function getFallbackAvatarUrl(tutor: Pick<Tutor, "tutorId" | "profile">): string {
  const fallbackId = tutor.tutorId || tutor.profile.fullName || "edus-tutor";
  return `${FALLBACK_AVATAR_BASE_URL}/300?u=${encodeURIComponent(fallbackId)}`;
}

function isIndividualClass(classItem: unknown): classItem is IndividualClass {
  return (
    isRecord(classItem) &&
    classItem.classType === "INDIVIDUAL" &&
    typeof classItem.classCode === "string" &&
    typeof classItem.subject === "string" &&
    Array.isArray(classItem.pricing)
  );
}

function isGroupClass(classItem: unknown): classItem is GroupClass {
  return (
    isRecord(classItem) &&
    classItem.classType === "GROUP" &&
    typeof classItem.classCode === "string" &&
    typeof classItem.subject === "string" &&
    isRecord(classItem.monthlyFee) &&
    typeof classItem.monthlyFee.amount === "number"
  );
}

function normalizeTutor(tutor: Tutor): Tutor {
  const avatarUrl = isBrokenRemoteUrl(tutor.profile.avatarUrl)
    ? getFallbackAvatarUrl(tutor)
    : tutor.profile.avatarUrl;

  return {
    ...tutor,
    profile: {
      ...tutor.profile,
      avatarUrl,
    },
    individualClasses: (tutor.individualClasses || [])
      .filter(isIndividualClass)
      .map(normalizeIndividualClass),
    groupClasses: (tutor.groupClasses || [])
      .filter(isGroupClass)
      .map(normalizeGroupClass),
  };
}

export const tutors: Tutor[] = (tutorDirectory.tutors || []).map(normalizeTutor);

export const DAY_LABELS: Record<string, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

export function findTutorById(id: string): Tutor | undefined {
  return tutors.find((tutor) => tutor.tutorId === id || tutor.slug === id);
}

export function splitClassType(classType: SearchClassType): TutorClassType {
  return classType === "Group" ? "GROUP" : "INDIVIDUAL";
}

export function joinClassType(classType: TutorClassType): SearchClassType {
  return classType === "GROUP" ? "Group" : "Individual";
}

export function getTutorFullName(tutor: Tutor): string {
  return tutor.profile.fullName;
}

export function getTutorSubjects(tutor: Tutor): string[] {
  return tutor.profile.subjects;
}

export function getTutorClassTypes(tutor: Tutor): SearchClassType[] {
  const classTypes: SearchClassType[] = [];
  if (tutor.individualClasses.length > 0) {
    classTypes.push("Individual");
  }
  if (tutor.groupClasses.length > 0) {
    classTypes.push("Group");
  }
  return classTypes;
}

export function normalizeGradeValue(grade: string): string {
  return grade.replace(/^Grade\s+/i, "").trim();
}

export function formatGradeLabel(grade: string): string {
  const normalizedGrade = normalizeGradeValue(grade);
  return /^\d+$/.test(normalizedGrade) ? `Grade ${normalizedGrade}` : normalizedGrade;
}

export function formatDayLabel(day: string): string {
  return DAY_LABELS[day] || day;
}

export function formatTimeLabel(time24: string): string {
  const [hoursRaw, minutesRaw] = time24.split(":").map(Number);
  if (Number.isNaN(hoursRaw) || Number.isNaN(minutesRaw)) {
    return time24;
  }

  const period = hoursRaw >= 12 ? "PM" : "AM";
  const normalizedHours = hoursRaw % 12 || 12;
  return `${normalizedHours.toString().padStart(2, "0")}:${minutesRaw.toString().padStart(2, "0")} ${period}`;
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTimeLabel(startTime)} - ${formatTimeLabel(endTime)}`;
}

export function getAllFlattenedClasses(tutor: Tutor): FlattenedTutorClass[] {
  const tutorName = getTutorFullName(tutor);
  const individualClasses = tutor.individualClasses.map((individualClass) => ({
    tutorId: tutor.tutorId,
    tutorName,
    classCode: individualClass.classCode,
    classType: "Individual" as const,
    title: individualClass.title,
    subject: individualClass.subject,
    grades: individualClass.grades,
    medium: individualClass.medium,
    syllabus: individualClass.syllabus,
    amount: Math.min(...individualClass.pricing.map((priceOption) => priceOption.amount)),
    currency: individualClass.pricing[0]?.currency || "LKR",
    billingLabel: "session" as const,
  }));

  const groupClasses = tutor.groupClasses.map((groupClass) => ({
    tutorId: tutor.tutorId,
    tutorName,
    classCode: groupClass.classCode,
    classType: "Group" as const,
    title: groupClass.title,
    subject: groupClass.subject,
    grades: groupClass.grades,
    medium: groupClass.medium,
    syllabus: groupClass.syllabus,
    amount: groupClass.monthlyFee.amount,
    currency: groupClass.monthlyFee.currency,
    billingLabel: "month" as const,
  }));

  return [...individualClasses, ...groupClasses];
}

export function tutorMatchesFilters(
  tutor: Tutor,
  filters: {
    grade?: string | null;
    subject?: string | null;
    medium?: string | null;
    syllabus?: string | null;
    classType?: string | null;
  }
): boolean {
  const normalizedClassType = filters.classType === "Group" || filters.classType === "Individual"
    ? filters.classType
    : null;
  const normalizedGradeFilter = filters.grade ? normalizeGradeValue(filters.grade) : null;

  const classes = getAllFlattenedClasses(tutor);
  return classes.some((classItem) => {
    const matchesClassType = !normalizedClassType || classItem.classType === normalizedClassType;
    const matchesSubject = !filters.subject || classItem.subject.toLowerCase() === filters.subject.toLowerCase();
    const matchesMedium = !filters.medium || classItem.medium.toLowerCase() === filters.medium.toLowerCase();
    const matchesSyllabus = !filters.syllabus || classItem.syllabus.toLowerCase() === filters.syllabus.toLowerCase();
    const matchesGrade = !normalizedGradeFilter || classItem.grades.some((grade) => (
      normalizeGradeValue(grade) === normalizedGradeFilter
    ));

    return matchesClassType && matchesSubject && matchesMedium && matchesSyllabus && matchesGrade;
  });
}

export function getTutorCardPricing(
  tutor: Tutor,
  selectedClassType?: SearchClassType | null
): { amount: number; currency: string; billingLabel: "session" | "month" } | null {
  const classes = getAllFlattenedClasses(tutor).filter((classItem) => (
    !selectedClassType || classItem.classType === selectedClassType
  ));

  if (classes.length === 0) {
    return null;
  }

  const selectedClass = classes.reduce((lowest, current) => (
    current.amount < lowest.amount ? current : lowest
  ));

  return {
    amount: selectedClass.amount,
    currency: selectedClass.currency,
    billingLabel: selectedClass.billingLabel,
  };
}

export function getPrimaryDemoVideo(profile: TutorProfile) {
  return profile.demoVideos.find((video) => video.isPrimary) || profile.demoVideos[0] || null;
}

export function getBookableClassesByType(
  tutor: Tutor,
  selectedClassType: SearchClassType
): Array<IndividualClass | GroupClass> {
  return selectedClassType === "Individual" ? tutor.individualClasses : tutor.groupClasses;
}
