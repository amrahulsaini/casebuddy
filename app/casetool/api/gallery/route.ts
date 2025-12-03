import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from cookie
    const userIdCookie = request.cookies.get('casetool_user_id');
    const userId = userIdCookie ? parseInt(userIdCookie.value) : null;

    let query = `SELECT 
        id,
        session_id,
        phone_model,
        original_image_name,
        ai_prompt,
        generated_image_url,
        generation_time,
        status,
        created_at
      FROM generation_logs`;
    
    const params: any[] = [];

    // Filter by user if logged in
    if (userId) {
      query += ` WHERE user_id = ?`;
      params.push(userId);
    }

    query += ` ORDER BY created_at DESC LIMIT 100`;

    const [rows] = await pool.execute(query, params);

    return NextResponse.json({
      success: true,
      logs: rows,
    });
  } catch (error: any) {
    console.error('Gallery fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
