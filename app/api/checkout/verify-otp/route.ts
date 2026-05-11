import { NextRequest, NextResponse } from 'next/server';

declare global {
  var otpStore: Map<string, { otp: string; expires: number }> | undefined;
  var smsSessionStore: Map<string, { sessionId: string; expires: number }> | undefined;
}

if (!global.otpStore) global.otpStore = new Map();
if (!global.smsSessionStore) global.smsSessionStore = new Map();

async function verifyEmailOtp(email: string, otp: string) {
  const key = `email:${email}`;
  if (!global.otpStore) {
    return NextResponse.json(
      { error: 'OTP not found or expired. Please request a new OTP.' },
      { status: 400 }
    );
  }

  const stored = global.otpStore.get(key);
  if (!stored) {
    return NextResponse.json(
      { error: 'OTP not found or expired. Please request a new OTP.' },
      { status: 400 }
    );
  }

  if (Date.now() > stored.expires) {
    global.otpStore.delete(key);
    return NextResponse.json(
      { error: 'OTP has expired. Please request a new OTP.' },
      { status: 400 }
    );
  }

  if (stored.otp !== otp) {
    return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 400 });
  }

  global.otpStore.delete(key);
  return NextResponse.json({ success: true, message: 'Verification successful' });
}

async function verifySmsOtp(phone: string, otp: string) {
  const key = `sms:${phone}`;
  if (!global.smsSessionStore) {
    return NextResponse.json(
      { error: 'OTP session not found. Please request a new OTP.' },
      { status: 400 }
    );
  }

  const session = global.smsSessionStore.get(key);
  if (!session) {
    return NextResponse.json(
      { error: 'OTP not found or expired. Please request a new OTP.' },
      { status: 400 }
    );
  }

  if (Date.now() > session.expires) {
    global.smsSessionStore.delete(key);
    return NextResponse.json(
      { error: 'OTP has expired. Please request a new OTP.' },
      { status: 400 }
    );
  }

  const apiKey = process.env.TWO_FACTOR_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'SMS service not configured' }, { status: 500 });
  }

  const url = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${session.sessionId}/${otp}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.Status !== 'Success') {
    return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 400 });
  }

  global.smsSessionStore.delete(key);
  return NextResponse.json({ success: true, message: 'Mobile number verified successfully' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, otp } = body;

    if (!otp) {
      return NextResponse.json({ error: 'OTP is required' }, { status: 400 });
    }

    if (type === 'email') {
      const { email } = body;
      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      }
      return await verifyEmailOtp(email, otp);
    }

    if (type === 'sms') {
      const { phone } = body;
      if (!phone) {
        return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
      }
      return await verifySmsOtp(phone, otp);
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
