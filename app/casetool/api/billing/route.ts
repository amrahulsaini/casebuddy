import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('casetool_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if table exists first
    const [tableCheck] = await pool.execute(
      `SHOW TABLES LIKE 'api_usage_logs'`
    );

    if (!Array.isArray(tableCheck) || tableCheck.length === 0) {
      // Table doesn't exist yet - return empty data
      return NextResponse.json({
        success: true,
        logs: [],
        summary: { total_operations: 0, total_cost_usd: 0, total_cost_inr: 0 },
        message: 'Billing tables not yet created. Please run the database migration.',
      });
    }

    // Fetch usage logs for the user
    const [logs] = await pool.execute(
      `SELECT 
        id,
        model_name,
        operation_type,
        input_images,
        output_images,
        output_tokens,
        cost_usd,
        cost_inr,
        created_at
      FROM api_usage_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 100`,
      [userId]
    );

    // Fetch billing summary for the user
    const [summaryRows] = await pool.execute(
      `SELECT 
        COUNT(*) as total_operations,
        COALESCE(SUM(cost_usd), 0) as total_cost_usd,
        COALESCE(SUM(cost_inr), 0) as total_cost_inr
      FROM api_usage_logs
      WHERE user_id = ?`,
      [userId]
    );

    const summary = Array.isArray(summaryRows) && summaryRows.length > 0
      ? summaryRows[0]
      : { total_operations: 0, total_cost_usd: 0, total_cost_inr: 0 };

    return NextResponse.json({
      success: true,
      logs,
      summary,
    });

  } catch (error: any) {
    console.error('Billing API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch billing data', details: error.message },
      { status: 500 }
    );
  }
}
