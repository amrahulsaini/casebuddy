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
      whereConditions.push('DATE(gl.created_at) = ?');
      queryParams.push(filterDate);
    }
    if (filterUserId) {
      whereConditions.push('gl.user_id = ?');
      queryParams.push(filterUserId);
    }
    if (filterDownloaded === '1') {
      whereConditions.push('dbl.id IS NOT NULL');
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get Google Cloud API usage summary (total API calls and costs)
    const googleCloudQuery = `
      SELECT
        COUNT(*) as total_api_calls,
        COALESCE(SUM(cost_inr), 0) as google_cloud_cost_inr
      FROM api_usage_logs
      WHERE operation_type IN ('text_analysis', 'image_generation')
    `;
    
    const [googleCloudResult] = await pool.execute(googleCloudQuery);
    const googleCloud = Array.isArray(googleCloudResult) && googleCloudResult.length > 0 ? googleCloudResult[0] : {};

    // Get summary - Pull from generation_logs directly (ALL statuses)
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT gl.user_id) as total_users,
        COUNT(DISTINCT gl.id) as total_generations,
        COUNT(DISTINCT CASE WHEN gl.status = 'completed' THEN gl.id END) as completed_generations,
        COUNT(DISTINCT CASE WHEN gl.status = 'failed' THEN gl.id END) as failed_generations,
        COALESCE(SUM(CASE WHEN aul.operation_type = 'image_generation' THEN aul.cost_inr ELSE 0 END), 0) as total_cost_inr,
        COALESCE(SUM(dbl.amount_inr), 0) as total_download_cost_inr
      FROM generation_logs gl
      LEFT JOIN api_usage_logs aul ON aul.generation_log_id = gl.id
      LEFT JOIN download_billing_logs dbl ON dbl.generation_log_id = gl.id
      ${whereClause}
    `;

    const [summaryResult] = queryParams.length > 0
      ? await pool.execute(summaryQuery, queryParams)
      : await pool.execute(summaryQuery);
    
    const summary = Array.isArray(summaryResult) && summaryResult.length > 0 ? summaryResult[0] : {};
    const total = Number((summary as any).total_generations) || 0;
    const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;

    // Get generation logs with download tracking - SHOW ALL STATUSES
    const logsQuery = `
      SELECT
        gl.id,
        gl.user_id,
        gl.id as generation_log_id,
        gl.status,
        COALESCE(aul.cost_inr, 0) as amount_inr,
        gl.created_at,
        COALESCE(aul.model_name, 'N/A') as model_name,
        u.email,
        gl.phone_model,
        gl.case_type,
        gl.original_image_url,
        gl.generated_image_url,
        CASE WHEN dbl.id IS NOT NULL THEN 1 ELSE 0 END as is_downloaded,
        dbl.created_at as download_date
      FROM generation_logs gl
      JOIN users u ON gl.user_id = u.id
      LEFT JOIN api_usage_logs aul ON aul.generation_log_id = gl.id AND aul.operation_type = 'image_generation'
      LEFT JOIN download_billing_logs dbl ON dbl.generation_log_id = gl.id
      ${whereClause}
      ORDER BY gl.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const logsParams = [...queryParams, pageSize, offset];
    const [logs] = await pool.execute(logsQuery, logsParams);

    // Get list of users for filter
    const [userListResult] = await pool.execute(`
      SELECT DISTINCT u.id, u.email 
      FROM users u
      JOIN generation_logs gl ON u.id = gl.user_id
      ORDER BY u.id
    `);

    // Format response
    const formattedSummary = {
      total_users: Number((summary as any).total_users) || 0,
      total_generations: Number((summary as any).total_generations) || 0,
      completed_generations: Number((summary as any).completed_generations) || 0,
      failed_generations: Number((summary as any).failed_generations) || 0,
      total_cost_inr: parseFloat((summary as any).total_cost_inr) || 0,
      total_download_cost_inr: parseFloat((summary as any).total_download_cost_inr) || 0,
    };

    const formattedGoogleCloud = {
      total_api_calls: Number((googleCloud as any).total_api_calls) || 0,
      google_cloud_cost_inr: parseFloat((googleCloud as any).google_cloud_cost_inr) || 0,
    };

    const formattedUserList = Array.isArray(userListResult) 
      ? userListResult.map((row: any) => ({ id: row.id, email: row.email }))
      : [];

    return NextResponse.json({
      success: true,
      logs,
      summary: formattedSummary,
      googleCloud: formattedGoogleCloud,
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
