import tutorDirectoryData from "@/data/tutors.json";
import type {
  FlattenedTutorClass,
  GroupClass,
  IndividualClass,
  SearchClassType,
  Tutor,
  TutorClassType,
  TutorProfile,
} from "@/types/tutor";

const tutorDirectory = tutorDirectoryData as { tutors?: unknown[] };

const FALLBACK_AVATAR_BASE_URL = "https://i.pravatar.cc";
const BROKEN_CDN_HOSTS = new Set(["cdn.edus.lk"]);
const GOOGLE_DRIVE_HOSTS = new Set(["drive.google.com", "drive.usercontent.google.com"]);

function extractGoogleDriveFileId(url: URL): string | null {
  const fileMatch = /\/file\/d\/([a-zA-Z0-9_-]+)/.exec(url.pathname);
  if (fileMatch) return fileMatch[1];
  const idParam = url.searchParams.get("id");
  if (idParam && /^[a-zA-Z0-9_-]+$/.test(idParam)) return idParam;
  return null;
}

function normalizeAvatarUrl(url: string): string {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (!GOOGLE_DRIVE_HOSTS.has(parsed.hostname)) return url;
    const fileId = extractGoogleDriveFileId(parsed);
    return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : url;
  } catch {
    return url;
  }
}

function normalizeVideoUrl(url: string): string {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (!GOOGLE_DRIVE_HOSTS.has(parsed.hostname)) return url;
    const fileId = extractGoogleDriveFileId(parsed);
    return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : url;
  } catch {
    return url;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeGrades(grades: string[] | string | undefined): string[] {
  if (Array.isArray(grades)) {
    return grades;
  }
  return grades ? [grades] : [];
}

function normalizeStringList(value: string[] | string | undefined): string[] {
  if (Array.isArray(value)) {
    return value;
  }
  return value ? [value] : [];
}

function normalizeSyllabus(syllabus: string[] | string | undefined): string {
  if (Array.isArray(syllabus)) {
    const first = syllabus.map((s) => s.trim()).find(Boolean);
    return first || "National";
  }
  return syllabus?.trim() || "National";
}

// Some class records ship `medium` as an array (e.g. ["Tamil","English"]).
// Collapse to the first non-empty entry; fall back to the tutor's profile medium.
function normalizeMedium(medium: string[] | string | undefined, profileMediums: string[]): string {
  if (Array.isArray(medium)) {
    const first = medium.map((m) => m.trim()).find(Boolean);
    if (first) return first;
  } else if (typeof medium === "string" && medium.trim()) {
    return medium.trim();
  }
  return profileMediums[0] || "Tamil";
}

function normalizeIndividualClass(classItem: IndividualClass, tutor: Tutor): IndividualClass {
  const runtimeClass = classItem as IndividualClass & {
    grades?: string[] | string;
    medium?: string[] | string;
    syllabus?: string[] | string;
    subject?: string;
  };
  const profileSubjects = normalizeStringList(
    (tutor.profile as TutorProfile & { subjects?: string[] | string }).subjects
  );
  const profileMediums = normalizeStringList(
    (tutor.profile as TutorProfile & { mediums?: string[] | string }).mediums
  );
  const subject = runtimeClass.subject || profileSubjects[0] || "General";

  return {
    ...classItem,
    subject,
    grades: normalizeGrades(runtimeClass.grades),
    medium: normalizeMedium(runtimeClass.medium, profileMediums),
    syllabus: normalizeSyllabus(runtimeClass.syllabus),
  };
}

function normalizeGroupClass(classItem: GroupClass, tutor: Tutor): GroupClass {
  const runtimeClass = classItem as Partial<GroupClass> & {
    grades?: string[] | string;
    medium?: string[] | string;
    syllabus?: string[] | string;
  };
  const profileSubjects = normalizeStringList(
    (tutor.profile as TutorProfile & { subjects?: string[] | string }).subjects
  );
  const profileMediums = normalizeStringList(
    (tutor.profile as TutorProfile & { mediums?: string[] | string }).mediums
  );
  const subject = runtimeClass.subject || profileSubjects[0] || "General";
  const medium = normalizeMedium(runtimeClass.medium, profileMediums);

  return {
    ...classItem,
    title: runtimeClass.title || `${subject} (${medium} Medium)`,
    subject,
    grades: normalizeGrades(runtimeClass.grades),
    medium,
    syllabus: normalizeSyllabus(runtimeClass.syllabus),
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

function isTutorRecord(value: unknown): value is Tutor {
  return (
    isRecord(value) &&
    typeof value.tutorId === "string" &&
    isRecord(value.profile)
  );
}

function collectTutorRecords(value: unknown): Tutor[] {
  const records: Tutor[] = [];

  function visit(node: unknown) {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    if (!isRecord(node)) {
      return;
    }

    if (isTutorRecord(node)) {
      records.push(node);
    }

    Object.values(node).forEach(visit);
  }

  visit(value);
  return records;
}

function isIndividualClass(classItem: unknown): classItem is IndividualClass {
  // Subject may be missing on some records — the normalizer fills it from the tutor profile.
  return (
    isRecord(classItem) &&
    classItem.classType === "INDIVIDUAL" &&
    typeof classItem.classCode === "string" &&
    Array.isArray(classItem.pricing)
  );
}

function isGroupClass(classItem: unknown): classItem is GroupClass {
  return (
    isRecord(classItem) &&
    classItem.classType === "GROUP" &&
    typeof classItem.classCode === "string" &&
    isRecord(classItem.monthlyFee) &&
    typeof classItem.monthlyFee.amount === "number"
  );
}

function normalizeTutor(tutor: Tutor): Tutor {
  const runtimeTutor = tutor as Tutor & {
    individualClasses?: unknown[];
    groupClasses?: unknown[];
    syllabusSupported?: string[] | string;
    teachingStyle?: string[] | string;
  };
  const runtimeProfile = tutor.profile as TutorProfile & {
    languages?: string[] | string;
    mediums?: string[] | string;
    subjects?: string[] | string;
    syllabusSupported?: string[] | string;
    teachingStyle?: string[] | string;
  };
  const avatarUrl = isBrokenRemoteUrl(runtimeProfile.avatarUrl)
    ? getFallbackAvatarUrl(tutor)
    : normalizeAvatarUrl(runtimeProfile.avatarUrl);

  return {
    ...tutor,
    profile: {
      ...tutor.profile,
      avatarUrl,
      demoVideos: Array.isArray(runtimeProfile.demoVideos)
        ? runtimeProfile.demoVideos
            .filter((video) => !isBrokenRemoteUrl(video.videoUrl))
            .map((video) => ({ ...video, videoUrl: normalizeVideoUrl(video.videoUrl) }))
        : [],
      languages: normalizeStringList(runtimeProfile.languages),
      mediums: normalizeStringList(runtimeProfile.mediums),
      subjects: normalizeStringList(runtimeProfile.subjects),
      syllabusSupported: normalizeStringList(
        runtimeProfile.syllabusSupported ?? runtimeTutor.syllabusSupported
      ),
      teachingStyle: normalizeStringList(
        runtimeProfile.teachingStyle ?? runtimeTutor.teachingStyle
      ),
    },
    individualClasses: (runtimeTutor.individualClasses || [])
      .filter(isIndividualClass)
      .map((classItem) => normalizeIndividualClass(classItem, tutor)),
    groupClasses: (runtimeTutor.groupClasses || [])
      .filter(isGroupClass)
      .map((classItem) => normalizeGroupClass(classItem, tutor)),
  };
}

export const tutors: Tutor[] = Array.from(
  new Map(
    collectTutorRecords(tutorDirectory.tutors).map((tutor) => [
      tutor.tutorId,
      normalizeTutor(tutor),
    ])
  ).values()
);

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

// Case-insensitive membership test used by tutor-match + filter cascading.
function listIncludes(list: string[], value: string): boolean {
  const needle = value.toLowerCase();
  return list.some((item) => item.toLowerCase() === needle);
}

// Subject, medium, and syllabus can be satisfied by EITHER a matching class OR the
// tutor's profile-level capability (profile.subjects / profile.mediums / profile.syllabusSupported).
// Grade and classType need a real class — no profile-level analogue exists.
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
  const hasAnyFilter = Boolean(
    filters.grade || filters.subject || filters.medium || filters.syllabus || filters.classType
  );
  if (!hasAnyFilter) {
    return true;
  }

  const normalizedClassType = filters.classType === "Group" || filters.classType === "Individual"
    ? filters.classType
    : null;
  const normalizedGradeFilter = filters.grade ? normalizeGradeValue(filters.grade) : null;

  const profileCoversSubject = !filters.subject || listIncludes(tutor.profile.subjects, filters.subject);
  const profileCoversMedium = !filters.medium || listIncludes(tutor.profile.mediums, filters.medium);
  const profileCoversSyllabus = !filters.syllabus || listIncludes(tutor.profile.syllabusSupported, filters.syllabus);

  const classes = getAllFlattenedClasses(tutor);
  // A tutor matches if at least one class satisfies the class-bound filters
  // (classType, grade) AND each of subject/medium/syllabus is satisfied by either
  // that class OR the tutor's profile-level capability.
  return classes.some((classItem) => {
    const matchesClassType = !normalizedClassType || classItem.classType === normalizedClassType;
    const matchesGrade = !normalizedGradeFilter || classItem.grades.some((grade) => (
      normalizeGradeValue(grade) === normalizedGradeFilter
    ));
    if (!matchesClassType || !matchesGrade) return false;

    const subjectOk =
      !filters.subject ||
      classItem.subject.toLowerCase() === filters.subject.toLowerCase() ||
      profileCoversSubject;
    const mediumOk =
      !filters.medium ||
      classItem.medium.toLowerCase() === filters.medium.toLowerCase() ||
      profileCoversMedium;
    const syllabusOk =
      !filters.syllabus ||
      classItem.syllabus.toLowerCase() === filters.syllabus.toLowerCase() ||
      profileCoversSyllabus;

    return subjectOk && mediumOk && syllabusOk;
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
