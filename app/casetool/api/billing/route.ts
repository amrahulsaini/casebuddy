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
        summary: { total_downloads: 0, total_cost_inr: 0 },
        pagination: { page, pageSize, total: 0, totalPages: 0 },
        message: 'Billing tables not yet created. Please run database/add-download-billing.sql.',
      });
    }

    // Download-based billing summary
    const [summaryRows] = await pool.execute(
      `SELECT 
        COUNT(*) as total_downloads,
        COALESCE(SUM(amount_inr), 0) as total_cost_inr
      FROM download_billing_logs
      WHERE user_id = ?`,
      [userId]
    );

    const summary = Array.isArray(summaryRows) && summaryRows.length > 0
      ? summaryRows[0]
      : { total_downloads: 0, total_cost_inr: 0 };

    const total = Number((summary as any).total_downloads) || 0;
    const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;

    // Download billing logs (one row per downloaded generation)
    const [logs] = await pool.execute(
      `SELECT
        dbl.id,
        dbl.generation_log_id,
        dbl.slice_key,
        dbl.downloaded_url,
        dbl.downloaded_label,
        dbl.amount_inr,
        dbl.created_at,
        gl.phone_model,
        gl.generated_image_url
      FROM download_billing_logs dbl
      LEFT JOIN generation_logs gl ON dbl.generation_log_id = gl.id
      WHERE dbl.user_id = ?
      ORDER BY dbl.created_at DESC
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
