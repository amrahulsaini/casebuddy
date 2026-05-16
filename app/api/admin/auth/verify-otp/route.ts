import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { productsPool } from '@/lib/db';
import { createToken } from '@/lib/auth';

declare global {
  // eslint-disable-next-line no-var
  var adminOtpStore: Map<string, { sessionId: string; userId: number; expires: number }> | undefined;
}

if (!global.adminOtpStore) global.adminOtpStore = new Map();

export async function POST(request: Request) {
  try {
    const { userId, otp } = await request.json();

    if (!userId || !otp) {
      return NextResponse.json(
        { error: 'User ID and OTP are required' },
        { status: 400 }
      );
    }

    if (!/^\d{4,8}$/.test(String(otp))) {
      return NextResponse.json({ error: 'Invalid OTP format' }, { status: 400 });
    }

    if (!global.adminOtpStore) {
      return NextResponse.json(
        { error: 'OTP session not found. Please log in again.' },
        { status: 400 }
      );
    }

    const key = `admin:${userId}`;
    const session = global.adminOtpStore.get(key);
    if (!session) {
      return NextResponse.json(
        { error: 'OTP not found or expired. Please log in again.' },
        { status: 400 }
      );
    }

    if (Date.now() > session.expires) {
      global.adminOtpStore.delete(key);
      return NextResponse.json(
        { error: 'OTP has expired. Please log in again.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.TWO_FACTOR_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'SMS service not configured' },
        { status: 500 }
      );
    }

    const verifyUrl = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${session.sessionId}/${otp}`;
    const res = await fetch(verifyUrl);
    const data = await res.json();

    if (data.Status !== 'Success') {
      return NextResponse.json(
        { error: 'Invalid OTP. Please try again.' },
        { status: 400 }
      );
    }

    global.adminOtpStore.delete(key);

    const connection = await productsPool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM admin_users WHERE id = ? AND is_active = TRUE',
        [userId]
      );
      const users = rows as any[];
      if (users.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 401 });
      }
      const user = users[0];

      await connection.execute(
        'UPDATE admin_users SET last_login = NOW() WHERE id = ?',
        [user.id]
      );

      const token = await createToken({
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      });

      const cookieStore = await cookies();
      cookieStore.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      });

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Admin OTP verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
