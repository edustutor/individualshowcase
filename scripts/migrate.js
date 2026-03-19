const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../../EDUScourses.json');
const outputPath = path.join(__dirname, '../src/data/tutors.json');

const rawData = fs.readFileSync(inputPath, 'utf8');
const courses = JSON.parse(rawData);

const tutorMap = new Map();

courses.forEach(course => {
  const teacherName = course.teacherName;
  if (!teacherName) return;

  // Attempt to extract subject from courseTitle (e.g. "Grade 3 : Maths (Tamil Medium)")
  let subject = "General";
  const titleMatch = course.courseTitle.match(/:\s*(.*?)\s*\(/);
  if (titleMatch && titleMatch[1]) {
    subject = titleMatch[1].trim();
  }

  if (!tutorMap.has(teacherName)) {
    // Generate an ID
    const id = `tutor-${teacherName.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '')}`;
    
    // Split name
    const nameParts = teacherName.split(' ');
    const firstName = nameParts.length > 1 ? nameParts.slice(0, 2).join(' ') : nameParts[0];
    const lastName = nameParts.length > 2 ? nameParts.slice(2).join(' ') : (nameParts.length > 1 ? "" : "");

    tutorMap.set(teacherName, {
      id,
      firstName,
      lastName,
      qualifications: [`EDUS Verified Tutor`, `${course.syllabus} Syllabus Expert`],
      profileImageUrl: course.imageUrl || `https://i.pravatar.cc/150?u=${encodeURIComponent(teacherName)}`,
      demoVideos: [], // Could add default demo video if desired
      pricing: {
        weeklyClasses: course.schedule ? course.schedule.length : 1,
        feePerMonth: course.fee.amount,
        currency: course.fee.currency
      },
      teachingSubjects: []
    });
  }

  const tutor = tutorMap.get(teacherName);

  // Use the image from the first course as their profile image
  // It gives a nice thumbnail.
  if (!tutor.profileImageUrl.startsWith("http") && course.imageUrl) {
    tutor.profileImageUrl = course.imageUrl;
  }

  // Find if subject already exists
  let subjectEntry = tutor.teachingSubjects.find(ts => ts.subject === subject);
  if (!subjectEntry) {
    subjectEntry = {
      subject,
      grades: [],
      mediums: [],
      syllabuses: []
    };
    tutor.teachingSubjects.push(subjectEntry);
  }

  if (!subjectEntry.grades.includes(course.grade)) subjectEntry.grades.push(course.grade);
  if (!subjectEntry.mediums.includes(course.medium)) subjectEntry.mediums.push(course.medium);
  if (!subjectEntry.syllabuses.includes(course.syllabus)) subjectEntry.syllabuses.push(course.syllabus);

  // If there are specific pricing variations, we can just keep the highest or lowest, 
  // currently we keep the first one found.
});

// Convert Map to Array
const finalTutors = Array.from(tutorMap.values());

fs.writeFileSync(outputPath, JSON.stringify(finalTutors, null, 2), 'utf8');

console.log(`Successfully migrated ${courses.length} courses into ${finalTutors.length} tutors!`);
