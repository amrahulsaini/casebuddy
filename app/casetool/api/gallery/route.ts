import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from cookie
    const userIdCookie = request.cookies.get('casetool_user_id');
    const userId = userIdCookie ? parseInt(userIdCookie.value) : null;

    let query = `SELECT 
        gl.id,
        gl.session_id,
        gl.user_id,
        u.email as user_email,
        gl.phone_model,
        gl.original_image_name,
        gl.ai_prompt,
        gl.generated_image_url,
        gl.generation_time,
        gl.status,
        gl.feedback_status,
        gl.created_at
      FROM generation_logs gl
      LEFT JOIN users u ON gl.user_id = u.id`;
    
    const params: any[] = [];

    // Filter by user if logged in
    if (userId) {
      query += ` WHERE gl.user_id = ?`;
      params.push(userId);
    }

    query += ` ORDER BY gl.created_at DESC LIMIT 100`;

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
