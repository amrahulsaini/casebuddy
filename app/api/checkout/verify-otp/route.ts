import { NextRequest, NextResponse } from 'next/server';

// Shared OTP store (same reference as send-otp)
declare global {
  var otpStore: Map<string, { otp: string; expires: number }> | undefined;
}

// Initialize global OTP store
if (!global.otpStore) {
  global.otpStore = new Map();
}

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
    const storedOtp = global.otpStore.get(key);

    if (!storedOtp) {
      return NextResponse.json(
        { error: 'OTP not found or expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (Date.now() > storedOtp.expires) {
      global.otpStore.delete(key);
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
    global.otpStore.delete(key);

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
