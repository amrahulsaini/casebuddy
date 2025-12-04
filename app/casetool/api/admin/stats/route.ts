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

    // Convert BigInt to Number for JSON serialization
    const sanitizedUserStats = userStats.map((user: any) => ({
      id: Number(user.id),
      email: user.email,
      created_at: user.created_at,
      last_login: user.last_login,
      total_generations: Number(user.total_generations),
      successful_generations: Number(user.successful_generations),
      failed_generations: Number(user.failed_generations),
      accurate_feedbacks: Number(user.accurate_feedbacks),
      inaccurate_feedbacks: Number(user.inaccurate_feedbacks),
      pending_feedbacks: Number(user.pending_feedbacks),
      total_billable_cost: Number(user.total_billable_cost),
      total_refunded_cost: Number(user.total_refunded_cost),
    }));

    const sanitizedPlatformStats = {
      total_users: Number(platformStats[0].total_users),
      total_generations: Number(platformStats[0].total_generations),
      total_revenue: Number(platformStats[0].total_revenue),
      total_refunds: Number(platformStats[0].total_refunds),
    };

    return NextResponse.json({
      success: true,
      platformStats: sanitizedPlatformStats,
      userStats: sanitizedUserStats,
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
