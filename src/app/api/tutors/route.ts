import { NextResponse } from 'next/server';
import tutors from '@/data/tutors.json';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const grade = searchParams.get('grade');
  const subject = searchParams.get('subject');
  const medium = searchParams.get('medium');
  const syllabus = searchParams.get('syllabus');

  let filteredTutors = tutors;

  if (grade || subject || medium || syllabus) {
    filteredTutors = tutors.filter((tutor: any) => {
      // A tutor matches if ANY of their teachingSubjects matches all provided criteria
      return tutor.teachingSubjects.some((ts: any) => {
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
