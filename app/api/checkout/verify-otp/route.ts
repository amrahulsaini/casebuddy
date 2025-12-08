import { NextRequest, NextResponse } from 'next/server';

// Import the same OTP store (in production, use Redis or database)
// For now, we'll use a global map
declare global {
  var otpStore: Map<string, { otp: string; expires: number }> | undefined;
}

if (!global.otpStore) {
  global.otpStore = new Map();
}

const otpStore = global.otpStore;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, mobile, otp, type } = body;

    if (!type || (type !== 'email' && type !== 'mobile')) {
      return NextResponse.json(
        { error: 'Invalid request type' },
        { status: 400 }
      );
    }

    if (!otp) {
      return NextResponse.json(
        { error: 'OTP is required' },
        { status: 400 }
      );
    }

    const key = type === 'email' ? `email:${email}` : `mobile:${mobile}`;
    const storedOtp = otpStore.get(key);

    if (!storedOtp) {
      return NextResponse.json(
        { error: 'OTP not found or expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (Date.now() > storedOtp.expires) {
      otpStore.delete(key);
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (storedOtp.otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP. Please try again.' },
        { status: 400 }
      );
    }

    // OTP verified successfully, remove from store
    otpStore.delete(key);

    return NextResponse.json({ 
      success: true, 
      message: 'Verification successful' 
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
