import { NextRequest, NextResponse } from 'next/server';
import { productsPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, mobile, subject, message } = body;

    // Validation
    if (!name || !email || !mobile || !message) {
      return NextResponse.json(
        { error: 'Name, email, mobile, and message are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Mobile validation (10 digits)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile.replace(/[-\s]/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid mobile number. Please enter 10 digits' },
        { status: 400 }
      );
    }

    // Get IP address and user agent
    const ip_address = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
    const user_agent = request.headers.get('user-agent') || 'unknown';

    // Insert into database
    const [result] = await productsPool.execute(
      `INSERT INTO contact_submissions 
       (name, email, mobile, subject, message, ip_address, user_agent, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'new')`,
      [name, email, mobile, subject || null, message, ip_address, user_agent]
    );

    return NextResponse.json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
      submissionId: (result as any).insertId
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit contact form', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
