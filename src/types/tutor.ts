export interface TeachingSubject {
  subject: string;
  syllabuses: string[];
  mediums: string[];
  grades: string[];
}

export interface AssignedGroupSchedule {
  day: string;
  times: string[];
}

export interface AssignedGroup {
  name?: string;
  schedules?: AssignedGroupSchedule[];
  seatsLeft?: number;
  totalSeats?: number;
  [key: string]: unknown;
}

export interface AvailableTime {
  day: string;
  times: string[];
}

export interface DemoVideo {
  title?: string;
  url?: string;
  [key: string]: unknown;
}

export interface Feedback {
  author?: string;
  text?: string;
  date?: string;
  stars?: number;
  name?: string;
  grade?: string;
  [key: string]: unknown;
}

export interface PricingDetails {
  weeklyClasses?: number;
  feePerMonth: number;
  currency: string;
  admissionFee: number;
  pricePerClass?: number;
  totalFirstMonth: number;
}

export interface TutorPricing {
  individual?: PricingDetails;
  group?: PricingDetails;
}

export interface DemoVideos {
  individual?: (DemoVideo | string)[];
  group?: (DemoVideo | string)[];
}

export interface Tutor {
  id: string;
  firstName: string;
  lastName: string;
  isVerified?: boolean;
  rating?: number;
  reviewCount?: number;
  currency?: string;
  sessionRate?: number;
  teachingStyle?: string | string[];
  assignedGroups?: (string | AssignedGroup)[];
  profileImageUrl: string;
  about: string;
  qualifications: string[];
  teachingSubjects: TeachingSubject[];
  availableTimes: AvailableTime[];
  classTypes: ("Individual" | "Group")[];
  demoVideos?: DemoVideos;
  feedback?: Feedback[];
  pricing: TutorPricing;
}
