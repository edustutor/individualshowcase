const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/tutors.json');
const rawData = fs.readFileSync(filePath, 'utf8');
const tutors = JSON.parse(rawData);

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const timeSlots = ["08:00 AM", "10:30 AM", "02:00 PM", "04:00 PM", "06:30 PM", "08:00 PM"];

tutors.forEach(tutor => {
  // Enforce pricing schema inside JSON
  const admissionFee = 2500;
  const classesPerMonth = (tutor.pricing.weeklyClasses || 1) * 4;
  const pricePerClass = Math.round((tutor.pricing.feePerMonth || 1000) / classesPerMonth);
  const totalFirstMonth = (tutor.pricing.feePerMonth || 1000) + admissionFee;

  tutor.pricing = {
    ...tutor.pricing,
    admissionFee,
    pricePerClass,
    totalFirstMonth
  };

  // Add dummy available times (Sri Lanka Time)
  const numberOfDays = Math.floor(Math.random() * 3) + 1; // 1 to 3 days
  const randomDays = [...days].sort(() => 0.5 - Math.random()).slice(0, numberOfDays);
  
  const availableTimes = randomDays.map(day => {
    const numSlots = Math.floor(Math.random() * 2) + 1; // 1 or 2 slots per day
    const slots = [...timeSlots].sort(() => 0.5 - Math.random()).slice(0, numSlots).sort();
    return {
      day,
      times: slots,
      timezone: "Sri Lanka Time (IST)"
    };
  });

  tutor.availableTimes = availableTimes;
});

fs.writeFileSync(filePath, JSON.stringify(tutors, null, 2), 'utf8');
console.log('Successfully updated tutors.json with strict pricing schema and availability times!');
