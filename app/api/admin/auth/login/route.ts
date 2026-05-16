import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { productsPool } from '@/lib/db';

declare global {
  // eslint-disable-next-line no-var
  var adminOtpStore: Map<string, { sessionId: string; userId: number; expires: number }> | undefined;
  // eslint-disable-next-line no-var
  var adminOtpRateLimit: Map<string, { count: number; resetTime: number }> | undefined;
}

if (!global.adminOtpStore) global.adminOtpStore = new Map();
if (!global.adminOtpRateLimit) global.adminOtpRateLimit = new Map();

function checkRateLimit(key: string): { allowed: boolean; minutesLeft?: number } {
  const now = Date.now();
  if (!global.adminOtpRateLimit) global.adminOtpRateLimit = new Map();
  const rateLimit = global.adminOtpRateLimit.get(key);

  if (rateLimit) {
    if (now > rateLimit.resetTime) {
      global.adminOtpRateLimit.set(key, { count: 1, resetTime: now + 10 * 60 * 1000 });
    } else if (rateLimit.count >= 5) {
      return { allowed: false, minutesLeft: Math.ceil((rateLimit.resetTime - now) / 60000) };
    } else {
      rateLimit.count++;
      global.adminOtpRateLimit.set(key, rateLimit);
    }
  } else {
    global.adminOtpRateLimit.set(key, { count: 1, resetTime: now + 10 * 60 * 1000 });
  }
  return { allowed: true };
}

function maskMobile(mobile: string): string {
  if (!mobile || mobile.length < 4) return '****';
  return mobile.slice(0, 2) + '******' + mobile.slice(-2);
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const connection = await productsPool.getConnection();

    try {
      const [rows] = await connection.execute(
        'SELECT * FROM admin_users WHERE username = ? AND is_active = TRUE',
        [username]
      );

      const users = rows as any[];

      if (users.length === 0) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      const user = users[0];

      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      const mobile: string | null = user.mobile;
      if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
        return NextResponse.json(
          { error: 'No registered admin mobile found. Contact system administrator.' },
          { status: 500 }
        );
      }

      const limit = checkRateLimit(`admin-login:${user.id}`);
      if (!limit.allowed) {
        return NextResponse.json(
          {
            error: `Too many OTP requests. Please try again in ${limit.minutesLeft} minute${
              limit.minutesLeft! > 1 ? 's' : ''
            }.`,
          },
          { status: 429 }
        );
      }

      const apiKey = process.env.TWO_FACTOR_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: 'SMS service not configured' },
          { status: 500 }
        );
      }

      const url = `https://2factor.in/API/V1/${apiKey}/SMS/${mobile}/AUTOGEN/CASEBUDDYLOGIN`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.Status !== 'Success') {
        console.error('2factor API error (admin login):', data);
        return NextResponse.json(
          { error: 'Failed to send OTP. Please try again.' },
          { status: 500 }
        );
      }

      if (!global.adminOtpStore) global.adminOtpStore = new Map();
      global.adminOtpStore.set(`admin:${user.id}`, {
        sessionId: data.Details,
        userId: user.id,
        expires: Date.now() + 10 * 60 * 1000,
      });

      return NextResponse.json({
        success: true,
        otpRequired: true,
        userId: user.id,
        maskedMobile: maskMobile(mobile),
        message: 'OTP sent to registered admin mobile',
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
