import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tutorId, studentName, studentEmail, studentPhone, grade, subject, medium, syllabus } = body;

    if (!tutorId || !studentName || !studentEmail) {
      return NextResponse.json(
        { message: 'Missing required booking information.', success: false },
        { status: 400 }
      );
    }

    // Pretend to store in CRM
    console.log('--- NEW BOOKING RECEIVED IN CRM ---');
    console.log(`Tutor ID: ${tutorId}`);
    console.log(`Student: ${studentName} (${studentEmail}, ${studentPhone || 'No Phone'})`);
    console.log(`Requirements: Grade ${grade}, Subject ${subject}, ${medium} Medium, ${syllabus} Syllabus`);
    console.log('-----------------------------------');

    return NextResponse.json({
      success: true,
      message: 'Booking successfully stored in CRM.',
      bookingId: `BKG-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
    });

  } catch (error) {
    console.error('Error processing booking:', error);
    return NextResponse.json(
      { message: 'Failed to process booking.', success: false },
      { status: 500 }
    );
  }
}
