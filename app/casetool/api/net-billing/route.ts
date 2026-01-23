import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filterDate = searchParams.get('filter_date');
    const filterUserId = searchParams.get('filter_user_id');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);
    const offset = (page - 1) * pageSize;

    // Check if table exists
    const [tableCheck] = await pool.execute(`SHOW TABLES LIKE 'download_billing_logs'`);
    if (!Array.isArray(tableCheck) || tableCheck.length === 0) {
      return NextResponse.json({
        success: true,
        logs: [],
        summary: { total_users: 0, total_downloads: 0, total_cost_inr: 0 },
        pagination: { page, pageSize, total: 0, totalPages: 0 },
        availableUsers: [],
        message: 'Billing tables not yet created.',
      });
    }

    // Build WHERE clause for filters
    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    
    if (filterDate) {
      whereConditions.push('DATE(dbl.created_at) = ?');
      queryParams.push(filterDate);
    }
    if (filterUserId) {
      whereConditions.push('u.id = ?');
      queryParams.push(filterUserId);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get summary
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT u.id) as total_users,
        COUNT(dbl.id) as total_downloads,
        COALESCE(SUM(dbl.amount_inr), 0) as total_cost_inr
      FROM download_billing_logs dbl
      JOIN users u ON dbl.user_id = u.id
      ${whereClause}
    `;

    const [summaryResult] = queryParams.length > 0
      ? await pool.execute(summaryQuery, queryParams)
      : await pool.execute(summaryQuery);
    
    const summary = Array.isArray(summaryResult) && summaryResult.length > 0 ? summaryResult[0] : {};
    const total = Number((summary as any).total_downloads) || 0;
    const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;

    // Get download logs
    const logsQuery = `
      SELECT
        dbl.id,
        dbl.user_id,
        dbl.generation_log_id,
        dbl.amount_inr,
        dbl.created_at,
        u.email,
        gl.phone_model,
        gl.generated_image_url
      FROM download_billing_logs dbl
      JOIN users u ON dbl.user_id = u.id
      LEFT JOIN generation_logs gl ON dbl.generation_log_id = gl.id
      ${whereClause}
      ORDER BY dbl.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const logsParams = [...queryParams, pageSize, offset];
    const [logs] = await pool.execute(logsQuery, logsParams);

    // Get list of users for filter
    const [userListResult] = await pool.execute(`
      SELECT DISTINCT u.id, u.email 
      FROM users u
      JOIN download_billing_logs dbl ON u.id = dbl.user_id
      ORDER BY u.id
    `);

    // Format response
    const formattedSummary = {
      total_users: Number((summary as any).total_users) || 0,
      total_downloads: Number((summary as any).total_downloads) || 0,
      total_cost_inr: parseFloat((summary as any).total_cost_inr) || 0,
    };

    const formattedUserList = Array.isArray(userListResult) 
      ? userListResult.map((row: any) => ({ id: row.id, email: row.email }))
      : [];

    return NextResponse.json({
      success: true,
      logs,
      summary: formattedSummary,
      pagination: { page, pageSize, total, totalPages },
      availableUsers: formattedUserList,
    });
  } catch (error: any) {
    console.error('Error fetching net billing data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch net billing data', details: error.message },
      { status: 500 }
    );
  }
}
