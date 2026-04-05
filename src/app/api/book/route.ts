import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tutorId,
      studentEmail,
      studentPhone,
      grade,
      subject,
      medium,
      syllabus,
      classType,
      firstName,
      lastName,
    } = body;
    const studentName = (
      body.studentName ||
      [firstName, lastName].filter(Boolean).join(' ')
    ).trim();

    if (!tutorId || !studentName || !studentEmail) {
      return NextResponse.json(
        { message: 'Missing required booking information.', success: false },
        { status: 400 }
      );
    }

    // Pretend to store in CRM
    console.log('--- NEW BOOKING RECEIVED IN CRM ---');
    console.log(`Tutor ID: ${tutorId}`);
    console.log(`Student Record: Captured`);
    console.log(`Contact Provided: ${studentPhone ? 'Phone + Email' : 'Email Only'}`);
    console.log(`Requirements: ${classType || 'Unknown'} class, Grade ${grade}, Subject ${subject}, ${medium} Medium, ${syllabus} Syllabus`);
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
