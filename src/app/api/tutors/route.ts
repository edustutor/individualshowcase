import { NextResponse } from 'next/server';
import tutors from '@/data/tutors.json';
import type { Tutor, TeachingSubject } from '@/types/tutor';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const grade = searchParams.get('grade');
  const subject = searchParams.get('subject');
  const medium = searchParams.get('medium');
  const syllabus = searchParams.get('syllabus');

  let filteredTutors: unknown[] = tutors;

  if (grade || subject || medium || syllabus) {
    const allTutors = tutors as unknown as Tutor[];
    filteredTutors = allTutors.filter((tutor: Tutor) => {
      // A tutor matches if ANY of their teachingSubjects matches all provided criteria
      return tutor.teachingSubjects.some((ts: TeachingSubject) => {
        const matchesSubject = !subject || ts.subject.toLowerCase() === subject.toLowerCase();
        const matchesGrade = !grade || ts.grades.includes(grade);
        const matchesMedium = !medium || ts.mediums.includes(medium);
        const matchesSyllabus = !syllabus || ts.syllabuses.includes(syllabus);
        
        return matchesSubject && matchesGrade && matchesMedium && matchesSyllabus;
      });
    });
  }

  return NextResponse.json(filteredTutors);
}
