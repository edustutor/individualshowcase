const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/tutors.json');
const rawData = fs.readFileSync(filePath, 'utf8');
const tutors = JSON.parse(rawData);

const dummyVideos = [
  "https://www.youtube.com/embed/dQw4w9WgXcQ",
  "https://www.youtube.com/embed/tgbNymZ7vqY",
  "https://www.youtube.com/embed/aqz-KE-bpKQ",
  "https://www.youtube.com/embed/9bZkp7q19f0",
  "https://www.youtube.com/embed/jNQXAC9IVRw",
  "https://www.youtube.com/embed/kJQP7kiw5Fk"
];

tutors.forEach(tutor => {
  // Always assign 3 different videos
  const selectedVideos = [];
  const available = [...dummyVideos];
  
  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * available.length);
    selectedVideos.push(available[randomIndex]);
    available.splice(randomIndex, 1);
  }
  
  tutor.demoVideos = selectedVideos;
});

fs.writeFileSync(filePath, JSON.stringify(tutors, null, 2), 'utf8');
console.log('Successfully updated all tutors to have exactly 3 demo videos!');
