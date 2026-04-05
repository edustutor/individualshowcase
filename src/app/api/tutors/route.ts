import { NextResponse } from 'next/server';
import tutors from '@/data/tutors.json';
import type { Tutor, TeachingSubject } from '@/types/tutor';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const grade = searchParams.get('grade');
  const subject = searchParams.get('subject');
  const medium = searchParams.get('medium');
  const syllabus = searchParams.get('syllabus');
  const classType = searchParams.get('classType');

  let filteredTutors: unknown[] = tutors;

  if (grade || subject || medium || syllabus || classType) {
    const allTutors = tutors as unknown as Tutor[];
    filteredTutors = allTutors.filter((tutor: Tutor) => {
      // General subjects filtering
      const matchesSubjectCriteria = tutor.teachingSubjects.some((ts: TeachingSubject) => {
        const matchesSubject = !subject || ts.subject.toLowerCase() === subject.toLowerCase();
        const matchesGrade = !grade || ts.grades.includes(grade);
        const matchesMedium = !medium || ts.mediums.includes(medium);
        const matchesSyllabus = !syllabus || ts.syllabuses.includes(syllabus);
        
        return matchesSubject && matchesGrade && matchesMedium && matchesSyllabus;
      });

      const matchesClassType = !classType || tutor.classTypes?.includes(classType as "Individual" | "Group");

      return matchesSubjectCriteria && matchesClassType;
    });
  }

  return NextResponse.json(filteredTutors);
}
