export type SearchClassType = "Individual" | "Group";
export type TutorClassType = "INDIVIDUAL" | "GROUP";

export interface TutorDemoVideo {
  videoId: string;
  title: string;
  subject: string;
  videoUrl: string;
  durationSeconds?: number;
  isPrimary?: boolean;
}

export interface TutorProfile {
  fullName: string;
  headline: string;
  avatarUrl: string;
  demoVideos: TutorDemoVideo[];
  about: string;
  experienceYears?: number;
  rating?: number;
  reviewCount?: number;
  languages?: string[];
  mediums: string[];
  subjects: string[];
  syllabusSupported: string[];
  teachingStyle?: string[];
  qualifications?: string[];
}

export interface IndividualClassPricing {
  durationMinutes: number;
  amount: number;
  currency: string;
}

export interface IndividualClassSlot {
  slotId: string;
  day: string;
  startTime: string;
  endTime: string;
  durationOptions: number[];
  isAvailable: boolean;
}

export interface IndividualClass {
  classCode: string;
  classType: "INDIVIDUAL";
  title: string;
  subject: string;
  grades: string[];
  medium: string;
  syllabus: string;
  pricing: IndividualClassPricing[];
  availableWeeklySlots: IndividualClassSlot[];
}

export interface GroupClassFee {
  amount: number;
  currency: string;
}

export interface GroupClassSchedule {
  day: string;
  startTime: string;
  endTime: string;
}

export interface GroupClass {
  classCode: string;
  classType: "GROUP";
  title: string;
  subject: string;
  grades: string[];
  medium: string;
  syllabus: string;
  monthlyFee: GroupClassFee;
  fixedTimetable: GroupClassSchedule[];
  seatCapacity: number;
  seatsLeft: number;
  status: string;
}

export interface Tutor {
  tutorId: string;
  slug?: string;
  featured?: boolean;
  isVerified?: boolean;
  profile: TutorProfile;
  individualClasses: IndividualClass[];
  groupClasses: GroupClass[];
}

export interface TutorDirectory {
  tutors: Tutor[];
}

export interface FlattenedTutorClass {
  tutorId: string;
  tutorName: string;
  classCode: string;
  classType: SearchClassType;
  title: string;
  subject: string;
  grades: string[];
  medium: string;
  syllabus: string;
  amount: number;
  currency: string;
  billingLabel: "session" | "month";
}
