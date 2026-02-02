import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('casetool_user_id')?.value;

    const url = new URL(req.url);
    const pageParam = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSizeParam = parseInt(url.searchParams.get('pageSize') || '100', 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const pageSize = Number.isFinite(pageSizeParam) ? Math.min(Math.max(pageSizeParam, 1), 200) : 100;
    const offset = (page - 1) * pageSize;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if table exists first
    const [tableCheck] = await pool.execute(
      `SHOW TABLES LIKE 'download_billing_logs'`
    );

    if (!Array.isArray(tableCheck) || tableCheck.length === 0) {
      // Table doesn't exist yet - return empty data
      return NextResponse.json({
        success: true,
        logs: [],
        summary: { total_generations: 0, total_cost_inr: 0 },
        pagination: { page, pageSize, total: 0, totalPages: 0 },
        message: 'API usage tables exist. Using generation-based billing.',
      });
    }

    // Generation-based billing summary from API usage logs
    const [summaryRows] = await pool.execute(
      `SELECT 
        COUNT(DISTINCT generation_log_id) as total_generations,
        COALESCE(SUM(cost_inr), 0) as total_cost_inr
      FROM api_usage_logs
      WHERE user_id = ? AND operation_type = 'image_generation'`,
      [userId]
    );

    const summary = Array.isArray(summaryRows) && summaryRows.length > 0
      ? summaryRows[0]
      : { total_generations: 0, total_cost_inr: 0 };

    const total = Number((summary as any).total_generations) || 0;
    const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;

    // Generation billing logs (one row per image generation)
    const [logs] = await pool.execute(
      `SELECT
        aul.id,
        aul.generation_log_id,
        aul.cost_inr as amount_inr,
        aul.created_at,
        aul.model_name,
        gl.phone_model,
        gl.generated_image_url
      FROM api_usage_logs aul
      LEFT JOIN generation_logs gl ON aul.generation_log_id = gl.id
      WHERE aul.user_id = ? AND aul.operation_type = 'image_generation'
      ORDER BY aul.created_at DESC
      LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    );

    return NextResponse.json({
      success: true,
      logs,
      summary,
      pagination: { page, pageSize, total, totalPages },
    });

  } catch (error: any) {
    console.error('Billing API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch billing data', details: error.message },
      { status: 500 }
    );
  }
}
