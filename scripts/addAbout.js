const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/tutors.json');
const rawData = fs.readFileSync(filePath, 'utf8');
const tutors = JSON.parse(rawData);

const aboutOptions = [
  "Passionate educator with years of experience helping students achieve their highest potential through tailored learning strategies and interactive approaches.",
  "Dedicated to fostering a positive and engaging learning environment. Specialized in curriculum-aligned teaching that guarantees academic improvement.",
  "An enthusiastic and resourceful professional with a proven track record of inspiring students and driving academic excellence across multiple subjects.",
  "Committed to student success by simplifying complex concepts and instilling a lifelong love for learning in a supportive setting.",
  "Experienced in delivering high-quality education and mentorship, ensuring every student develops the confidence needed to excel in their academic journey."
];

tutors.forEach(tutor => {
  if (!tutor.about) {
    tutor.about = aboutOptions[Math.floor(Math.random() * aboutOptions.length)];
  }
});

fs.writeFileSync(filePath, JSON.stringify(tutors, null, 2), 'utf8');
console.log('Successfully added about sections to all tutors!');
