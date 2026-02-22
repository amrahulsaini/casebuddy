import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filterDate = searchParams.get('filter_date');
    const filterUserId = searchParams.get('filter_user_id');
    const filterDownloaded = searchParams.get('filter_downloaded');

    // Build WHERE clause for filters
    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    
    if (filterDate) {
      whereConditions.push('DATE(aul.created_at) = ?');
      queryParams.push(filterDate);
    }
    if (filterUserId) {
      whereConditions.push('u.id = ?');
      queryParams.push(filterUserId);
    }
    if (filterDownloaded === '1') {
      whereConditions.push('dbl.id IS NOT NULL');
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total cost
    const summaryQuery = `
      SELECT 
        COALESCE(SUM(aul.cost_inr), 0) as total_cost_inr
      FROM api_usage_logs aul
      JOIN users u ON aul.user_id = u.id
      LEFT JOIN generation_logs gl ON aul.generation_log_id = gl.id
      LEFT JOIN download_billing_logs dbl ON dbl.generation_log_id = gl.id
      ${whereClause}
      ${whereConditions.length === 0 ? "WHERE aul.operation_type = 'image_generation'" : "AND aul.operation_type = 'image_generation'"}
    `;

    const [summaryResult] = queryParams.length > 0
      ? await pool.execute(summaryQuery, queryParams)
      : await pool.execute(summaryQuery);
    
    const summary = Array.isArray(summaryResult) && summaryResult.length > 0 ? summaryResult[0] : {};

    return NextResponse.json({
      success: true,
      total_cost_inr: Number((summary as any).total_cost_inr) || 0,
    });
  } catch (error: any) {
    console.error('Total cost API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch total cost' },
      { status: 500 }
    );
  }
}
