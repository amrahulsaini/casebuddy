import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filterDate = searchParams.get('filter_date');
    const filterUserId = searchParams.get('filter_user_id');
    const filterDownloaded = searchParams.get('filter_downloaded');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);
    const offset = (page - 1) * pageSize;

    // Check if table exists
    const [tableCheck] = await pool.execute(`SHOW TABLES LIKE 'api_usage_logs'`);
    if (!Array.isArray(tableCheck) || tableCheck.length === 0) {
      return NextResponse.json({
        success: true,
        logs: [],
        summary: { total_users: 0, total_generations: 0, total_cost_inr: 0 },
        pagination: { page, pageSize, total: 0, totalPages: 0 },
        availableUsers: [],
        message: 'API usage tables not yet created.',
      });
    }

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

    // Get summary
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT aul.generation_log_id) as total_generations,
        COALESCE(SUM(aul.cost_inr), 0) as total_cost_inr,
        COALESCE(SUM(CASE WHEN dbl.id IS NOT NULL THEN aul.cost_inr ELSE 0 END), 0) as total_download_cost_inr
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
    const total = Number((summary as any).total_generations) || 0;
    const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;

    // Get generation logs with download tracking
    const logsQuery = `
      SELECT
        aul.id,
        aul.user_id,
        aul.generation_log_id,
        aul.cost_inr as amount_inr,
        aul.created_at,
        aul.model_name,
        u.email,
        gl.phone_model,
        gl.case_type,
        gl.original_image_url,
        gl.generated_image_url,
        CASE WHEN dbl.id IS NOT NULL THEN 1 ELSE 0 END as is_downloaded,
        dbl.created_at as download_date
      FROM api_usage_logs aul
      JOIN users u ON aul.user_id = u.id
      LEFT JOIN generation_logs gl ON aul.generation_log_id = gl.id
      LEFT JOIN download_billing_logs dbl ON dbl.generation_log_id = gl.id
      ${whereClause}
      ${whereConditions.length === 0 ? "WHERE aul.operation_type = 'image_generation'" : "AND aul.operation_type = 'image_generation'"}
      ORDER BY aul.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const logsParams = [...queryParams, pageSize, offset];
    const [logs] = await pool.execute(logsQuery, logsParams);

    // Get list of users for filter
    const [userListResult] = await pool.execute(`
      SELECT DISTINCT u.id, u.email 
      FROM users u
      JOIN api_usage_logs aul ON u.id = aul.user_id
      WHERE aul.operation_type = 'image_generation'
      ORDER BY u.id
    `);

    // Format response
    const formattedSummary = {
      total_users: Number((summary as any).total_users) || 0,
      total_generations: Number((summary as any).total_generations) || 0,
      total_cost_inr: parseFloat((summary as any).total_cost_inr) || 0,
      total_download_cost_inr: parseFloat((summary as any).total_download_cost_inr) || 0,
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
