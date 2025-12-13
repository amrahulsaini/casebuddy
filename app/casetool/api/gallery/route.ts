import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from cookie
    const userIdCookie = request.cookies.get('casetool_user_id');
    const userId = userIdCookie ? parseInt(userIdCookie.value) : null;

    const baseSelectWithOriginalUrl = `SELECT 
        gl.id,
        gl.session_id,
        gl.user_id,
        u.email as user_email,
        gl.phone_model,
        gl.original_image_name,
        gl.original_image_url,
        gl.ai_prompt,
        gl.generated_image_url,
        gl.generation_time,
        gl.status,
        gl.feedback_status,
        gl.created_at
      FROM generation_logs gl
      LEFT JOIN users u ON gl.user_id = u.id`;

    const baseSelectWithoutOriginalUrl = `SELECT 
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
    const whereClause = userId ? ` WHERE gl.user_id = ?` : '';
    if (userId) params.push(userId);

    const suffix = ` ORDER BY gl.created_at DESC LIMIT 100`;

    let rows: any;
    try {
      const [r] = await pool.execute(baseSelectWithOriginalUrl + whereClause + suffix, params);
      rows = r;
    } catch (e: any) {
      // Backward-compatible fallback if DB schema isn't migrated yet
      const message = String(e?.message || '');
      if (message.toLowerCase().includes('unknown column') && message.includes('original_image_url')) {
        const [r] = await pool.execute(baseSelectWithoutOriginalUrl + whereClause + suffix, params);
        rows = r;
      } else {
        throw e;
      }
    }

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
