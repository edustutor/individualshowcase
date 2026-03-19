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
  // Add 1 to 3 random videos
  const numberOfVideos = Math.floor(Math.random() * 3) + 1;
  const selectedVideos = [];
  
  for (let i = 0; i < numberOfVideos; i++) {
    const randomVideo = dummyVideos[Math.floor(Math.random() * dummyVideos.length)];
    if (!selectedVideos.includes(randomVideo)) {
      selectedVideos.push(randomVideo);
    }
  }
  
  tutor.demoVideos = selectedVideos;
});

fs.writeFileSync(filePath, JSON.stringify(tutors, null, 2), 'utf8');
console.log('Successfully added dummy videos to all tutors!');
