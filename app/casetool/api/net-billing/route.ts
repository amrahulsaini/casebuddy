import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { cookies } from 'next/headers';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'case_main',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function GET(request: NextRequest) {
      // Parse date filter from query params
      const url = new URL(request.url, 'http://localhost');
      const dateParam = url.searchParams.get('download_date');
      let downloadBillingWhere = '';
      let downloadBillingParams: any[] = [];
      if (dateParam) {
        downloadBillingWhere = 'WHERE DATE(dbl.created_at) = ?';
        downloadBillingParams.push(dateParam);
      }

      // Download billing report: by date, user, images, INR, model
      const downloadBillingQuery = `
        SELECT 
          DATE(dbl.created_at) as day,
          u.id as user_id,
          u.email,
          COUNT(dbl.id) as images_downloaded,
          SUM(dbl.amount_inr) as total_inr,
          GROUP_CONCAT(DISTINCT gl.model_name ORDER BY gl.model_name) as models
        FROM download_billing_logs dbl
        JOIN users u ON dbl.user_id = u.id
        JOIN generation_logs gl ON dbl.generation_log_id = gl.id
        ${downloadBillingWhere}
        GROUP BY day, u.id, u.email
        ORDER BY day DESC, images_downloaded DESC
        LIMIT 200
      `;
      const [downloadBillingResult] = await connection.query<any>(downloadBillingQuery, downloadBillingParams);
  // Admin check removed: Net Billing is now public

  try {
    const connection = await pool.getConnection();

    // Get summary data (INR only)
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT u.id) as total_users,
        COALESCE(COUNT(aul.id), 0) as total_operations,
        COALESCE(SUM(aul.cost_inr), 0) as total_cost_inr,
        COALESCE(SUM(aul.input_tokens + aul.output_tokens), 0) as total_tokens,
        COALESCE(SUM(aul.input_images + aul.output_images), 0) as total_images
      FROM users u
      LEFT JOIN api_usage_logs aul ON u.id = aul.user_id
    `;

    const [summaryResult] = await connection.query<any>(summaryQuery);
    const summary = summaryResult[0] || {};

    // Get per-user billing details (INR only)
    const userBillingQuery = `
      SELECT 
        u.id as user_id,
        u.email,
        COALESCE(COUNT(aul.id), 0) as total_operations,
        COALESCE(SUM(CASE WHEN aul.operation_type = 'text_analysis' THEN 1 ELSE 0 END), 0) as text_analysis_count,
        COALESCE(SUM(CASE WHEN aul.operation_type = 'image_generation' THEN 1 ELSE 0 END), 0) as image_generation_count,
        COALESCE(SUM(CASE WHEN aul.operation_type = 'image_enhancement' THEN 1 ELSE 0 END), 0) as image_enhancement_count,
        COALESCE(SUM(aul.input_tokens + aul.output_tokens), 0) as total_tokens,
        COALESCE(SUM(aul.input_images + aul.output_images), 0) as total_images,
        COALESCE(SUM(aul.cost_inr), 0) as total_cost_inr,
        COALESCE(MAX(aul.created_at), u.created_at) as last_activity
      FROM users u
      LEFT JOIN api_usage_logs aul ON u.id = aul.user_id
      GROUP BY u.id, u.email
      ORDER BY total_cost_inr DESC
    `;

    const [userBillingResult] = await connection.query<any>(userBillingQuery);

    // Get model usage breakdown (INR only)
    const modelUsageQuery = `
      SELECT 
        model_name,
        operation_type,
        COUNT(*) as count,
        SUM(cost_inr) as total_cost_inr
      FROM api_usage_logs
      GROUP BY model_name, operation_type
      ORDER BY model_name, operation_type
    `;

    const [modelUsageResult] = await connection.query<any>(modelUsageQuery);

    // Get daily report: date, generations, INR, model(s)
    const dailyReportQuery = `
      SELECT 
        DATE(created_at) as day,
        COUNT(*) as generations,
        SUM(cost_inr) as total_inr,
        GROUP_CONCAT(DISTINCT model_name ORDER BY model_name) as models
      FROM api_usage_logs
      GROUP BY day
      ORDER BY day DESC
      LIMIT 60
    `;
    const [dailyReportResult] = await connection.query<any>(dailyReportQuery);

    connection.release();

    // Format response data
    const formattedSummary = {
      total_users: Number(summary.total_users) || 0,
      total_operations: Number(summary.total_operations) || 0,
      total_cost_inr: parseFloat(summary.total_cost_inr) || 0,
      total_tokens: Number(summary.total_tokens) || 0,
      total_images: Number(summary.total_images) || 0,
    };

    const formattedUserBilling = (userBillingResult || []).map((user: any) => ({
      user_id: user.user_id,
      email: user.email,
      total_operations: Number(user.total_operations) || 0,
      text_analysis_count: Number(user.text_analysis_count) || 0,
      image_generation_count: Number(user.image_generation_count) || 0,
      image_enhancement_count: Number(user.image_enhancement_count) || 0,
      total_tokens: Number(user.total_tokens) || 0,
      total_images: Number(user.total_images) || 0,
      total_cost_inr: parseFloat(user.total_cost_inr) || 0,
      last_activity: user.last_activity || new Date().toISOString(),
    }));

    const formattedModelUsage = (modelUsageResult || []).map((model: any) => ({
      model_name: model.model_name,
      operation_type: model.operation_type,
      count: Number(model.count) || 0,
      total_cost_inr: parseFloat(model.total_cost_inr) || 0,
    }));

    const formattedDailyReport = (dailyReportResult || []).map((row: any) => ({
      day: row.day,
      generations: Number(row.generations) || 0,
      total_inr: parseFloat(row.total_inr) || 0,
      models: (row.models || '').split(',').filter(Boolean),
    }));

    return NextResponse.json({
      success: true,
      data: {
        summary: formattedSummary,
        userBilling: formattedUserBilling,
        modelUsage: formattedModelUsage,
        dailyReport: formattedDailyReport,
        downloadBilling: (downloadBillingResult || []).map((row: any) => ({
          day: row.day,
          user_id: row.user_id,
          email: row.email,
          images_downloaded: Number(row.images_downloaded) || 0,
          total_inr: parseFloat(row.total_inr) || 0,
          models: (row.models || '').split(',').filter(Boolean),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching net billing data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch net billing data' },
      { status: 500 }
    );
  }
}
