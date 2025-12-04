import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

// Admin endpoint to view all users and their generation stats
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('casetool_auth');

    if (!authCookie || authCookie.value !== 'authenticated') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const view = url.searchParams.get('view') || 'summary'; // 'summary' or 'detailed'
    const userId = url.searchParams.get('userId'); // Optional: filter by specific user

    if (view === 'detailed' && userId) {
      // Get detailed stats for a specific user
      const [userInfo]: any = await pool.execute(
        'SELECT id, email, created_at, last_login FROM users WHERE id = ?',
        [userId]
      );

      if (userInfo.length === 0) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      // Get all generations for this user
      const [generations]: any = await pool.execute(
        `SELECT 
          id,
          session_id,
          phone_model,
          original_image_name,
          ai_prompt,
          generated_image_url,
          generation_time,
          status,
          feedback_status,
          is_refunded,
          refund_amount_inr,
          created_at
        FROM generation_logs
        WHERE user_id = ?
        ORDER BY created_at DESC`,
        [userId]
      );

      // Get API usage costs for this user
      const [apiCosts]: any = await pool.execute(
        `SELECT 
          SUM(CASE WHEN is_billable = TRUE THEN cost_inr ELSE 0 END) as billable_cost,
          SUM(CASE WHEN is_billable = FALSE THEN cost_inr ELSE 0 END) as refunded_cost,
          COUNT(*) as total_api_calls
        FROM api_usage_logs aul
        JOIN generation_logs gl ON aul.generation_log_id = gl.id
        WHERE gl.user_id = ?`,
        [userId]
      );

      return NextResponse.json({
        success: true,
        user: userInfo[0],
        generations,
        apiCosts: apiCosts[0],
      });
    }

    // Default: Get summary stats for all users
    const [userStats]: any = await pool.execute(
      `SELECT 
        u.id,
        u.email,
        u.created_at,
        u.last_login,
        COUNT(DISTINCT gl.id) as total_generations,
        COUNT(DISTINCT CASE WHEN gl.status = 'completed' THEN gl.id END) as successful_generations,
        COUNT(DISTINCT CASE WHEN gl.status = 'failed' THEN gl.id END) as failed_generations,
        COUNT(DISTINCT CASE WHEN gl.feedback_status = 'accurate' THEN gl.id END) as accurate_feedbacks,
        COUNT(DISTINCT CASE WHEN gl.feedback_status = 'inaccurate' THEN gl.id END) as inaccurate_feedbacks,
        COUNT(DISTINCT CASE WHEN gl.feedback_status = 'pending' THEN gl.id END) as pending_feedbacks,
        COALESCE(SUM(CASE WHEN aul.is_billable = TRUE THEN aul.cost_inr ELSE 0 END), 0) as total_billable_cost,
        COALESCE(SUM(CASE WHEN aul.is_billable = FALSE THEN aul.cost_inr ELSE 0 END), 0) as total_refunded_cost
      FROM users u
      LEFT JOIN generation_logs gl ON u.id = gl.user_id
      LEFT JOIN api_usage_logs aul ON gl.id = aul.generation_log_id
      GROUP BY u.id, u.email, u.created_at, u.last_login
      ORDER BY total_billable_cost DESC`
    );

    // Get overall platform stats
    const [platformStats]: any = await pool.execute(
      `SELECT 
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT gl.id) as total_generations,
        COALESCE(SUM(CASE WHEN aul.is_billable = TRUE THEN aul.cost_inr ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN aul.is_billable = FALSE THEN aul.cost_inr ELSE 0 END), 0) as total_refunds
      FROM users u
      LEFT JOIN generation_logs gl ON u.id = gl.user_id
      LEFT JOIN api_usage_logs aul ON gl.id = aul.generation_log_id`
    );

    return NextResponse.json({
      success: true,
      platformStats: platformStats[0],
      userStats,
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
