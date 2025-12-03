import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        id,
        session_id,
        phone_model,
        original_image_name,
        ai_prompt,
        generated_image_url,
        generation_time,
        status,
        created_at
      FROM generation_logs
      ORDER BY created_at DESC
      LIMIT 100`
    );

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
