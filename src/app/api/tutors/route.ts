import { NextResponse } from "next/server";
import { tutors, tutorMatchesFilters } from "@/lib/tutors";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = {
    grade: searchParams.get("grade"),
    subject: searchParams.get("subject"),
    medium: searchParams.get("medium"),
    syllabus: searchParams.get("syllabus"),
    classType: searchParams.get("classType"),
  };

  const filteredTutors = tutors.filter((tutor) => tutorMatchesFilters(tutor, filters));

  return NextResponse.json(filteredTutors);
}
