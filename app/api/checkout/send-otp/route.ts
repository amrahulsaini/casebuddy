import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

declare global {
  var otpStore: Map<string, { otp: string; expires: number }> | undefined;
  var otpRateLimit: Map<string, { count: number; resetTime: number }> | undefined;
  var smsSessionStore: Map<string, { sessionId: string; expires: number }> | undefined;
}

if (!global.otpStore) global.otpStore = new Map();
if (!global.otpRateLimit) global.otpRateLimit = new Map();
if (!global.smsSessionStore) global.smsSessionStore = new Map();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'localhost',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: { rejectUnauthorized: false }
});

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function checkRateLimit(key: string): { allowed: boolean; minutesLeft?: number } {
  const now = Date.now();
  if (!global.otpRateLimit) global.otpRateLimit = new Map();
  const rateLimit = global.otpRateLimit.get(key);

  if (rateLimit) {
    if (now > rateLimit.resetTime) {
      global.otpRateLimit.set(key, { count: 1, resetTime: now + 10 * 60 * 1000 });
    } else if (rateLimit.count >= 3) {
      return { allowed: false, minutesLeft: Math.ceil((rateLimit.resetTime - now) / 60000) };
    } else {
      rateLimit.count++;
      global.otpRateLimit.set(key, rateLimit);
    }
  } else {
    global.otpRateLimit.set(key, { count: 1, resetTime: now + 10 * 60 * 1000 });
  }
  return { allowed: true };
}

async function handleEmailOtp(email: string, purpose: string) {
  const limit = checkRateLimit(`email:${email}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many OTP requests. Please try again in ${limit.minutesLeft} minute${limit.minutesLeft! > 1 ? 's' : ''}.` },
      { status: 429 }
    );
  }

  const otp = generateOTP();
  const expires = Date.now() + 10 * 60 * 1000;
  if (!global.otpStore) global.otpStore = new Map();
  global.otpStore.set(`email:${email}`, { otp, expires });

  const isOrdersLogin = purpose === 'orders_login';
  await transporter.sendMail({
    from: `"CaseBuddy" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: isOrdersLogin
      ? 'Your OTP to view your orders - CaseBuddy'
      : 'Your OTP for Order Verification - CaseBuddy',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b00 0%, #ff9500 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #ff6b00; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #ff6b00; letter-spacing: 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isOrdersLogin ? 'Login Verification' : 'Email Verification'}</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>${isOrdersLogin
              ? 'Use the OTP below to securely view your order history on CaseBuddy:'
              : 'Thank you for shopping with CaseBuddy! To complete your order, please verify your email address using the OTP below:'
            }</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            <p><strong>This OTP is valid for 10 minutes.</strong></p>
            <p>If you didn't request this OTP, please ignore this email.</p>
            <p>Best regards,<br>Team CaseBuddy</p>
          </div>
          <div class="footer">
            <p>CaseBuddy - Premium Phone Cases<br>
            Rajgarh, Rajasthan 331023<br>
            Phone: +918107624752 | Email: info@casebuddy.co.in</p>
          </div>
        </div>
      </body>
      </html>
    `
  });

  return NextResponse.json({ success: true, message: 'OTP sent to email' });
}

async function handleSmsOtp(phone: string) {
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return NextResponse.json(
      { error: 'Invalid mobile number (10 digits starting with 6-9)' },
      { status: 400 }
    );
  }

  const limit = checkRateLimit(`sms:${phone}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many OTP requests. Please try again in ${limit.minutesLeft} minute${limit.minutesLeft! > 1 ? 's' : ''}.` },
      { status: 429 }
    );
  }

  const apiKey = process.env.TWO_FACTOR_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'SMS service not configured' }, { status: 500 });
  }

  const url = `https://2factor.in/API/V1/${apiKey}/SMS/${phone}/AUTOGEN/CASEBUDDYLOGIN`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.Status !== 'Success') {
    console.error('2factor API error:', data);
    return NextResponse.json({ error: 'Failed to send SMS OTP. Please try again.' }, { status: 500 });
  }

  if (!global.smsSessionStore) global.smsSessionStore = new Map();
  global.smsSessionStore.set(`sms:${phone}`, {
    sessionId: data.Details,
    expires: Date.now() + 10 * 60 * 1000
  });

  return NextResponse.json({ success: true, message: 'OTP sent to mobile number' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    if (type === 'email') {
      const { email } = body;
      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      }
      const purpose = typeof body?.purpose === 'string'
        ? String(body.purpose).trim().toLowerCase().replace(/[\s-]+/g, '_')
        : '';
      return await handleEmailOtp(email, purpose);
    }

    if (type === 'sms') {
      const { phone } = body;
      if (!phone) {
        return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
      }
      return await handleSmsOtp(phone);
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
