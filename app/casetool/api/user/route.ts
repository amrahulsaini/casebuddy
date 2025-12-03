import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check if user exists
    const [existingUsers]: any = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    let userId: number;

    if (existingUsers.length > 0) {
      // User exists, update last_login
      userId = existingUsers[0].id;
      await pool.execute(
        'UPDATE users SET last_login = NOW() WHERE id = ?',
        [userId]
      );
    } else {
      // Create new user
      const [result]: any = await pool.execute(
        'INSERT INTO users (email) VALUES (?)',
        [email]
      );
      userId = result.insertId;
    }

    // Set user cookie
    const cookieStore = await cookies();
    cookieStore.set('casetool_user_id', userId.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return NextResponse.json({
      success: true,
      userId,
      message: 'User registered successfully',
    });
  } catch (error: any) {
    console.error('User registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register user' },
      { status: 500 }
    );
  }
}

// Get current user info
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get('casetool_user_id');

    if (!userIdCookie) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = parseInt(userIdCookie.value);

    const [users]: any = await pool.execute(
      'SELECT id, email, created_at, last_login FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: users[0],
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user' },
      { status: 500 }
    );
  }
}
