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
  // Admin check removed: Net Billing is now public

  try {
    const connection = await pool.getConnection();

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const filterDate = searchParams.get('filter_date');
    const filterModel = searchParams.get('filter_model');

    // Get summary data
    let summaryQuery = `
      SELECT 
        COUNT(DISTINCT u.id) as total_users,
        COALESCE(COUNT(aul.id), 0) as total_operations,
        COALESCE(SUM(aul.cost_usd), 0) as total_cost_usd,
        COALESCE(SUM(aul.cost_inr), 0) as total_cost_inr,
        COALESCE(SUM(aul.input_tokens + aul.output_tokens), 0) as total_tokens,
        COALESCE(SUM(aul.input_images + aul.output_images), 0) as total_images,
        COALESCE(COUNT(DISTINCT dbl.id), 0) as total_downloads,
        COALESCE(SUM(dbl.amount_inr), 0) as total_download_cost_inr
      FROM users u
      LEFT JOIN api_usage_logs aul ON u.id = aul.user_id
      LEFT JOIN download_billing_logs dbl ON u.id = dbl.user_id
    `;

    const summaryParams: any[] = [];
    
    if (filterDate || filterModel) {
      summaryQuery += ' WHERE 1=1';
      if (filterDate) {
        summaryQuery += ' AND (DATE(aul.created_at) = ? OR DATE(dbl.created_at) = ?)';
        summaryParams.push(filterDate, filterDate);
      }
      if (filterModel) {
        summaryQuery += ' AND aul.model_name = ?';
        summaryParams.push(filterModel);
      }
    }

    const [summaryResult] = summaryParams.length > 0 
      ? await connection.query<any>(summaryQuery, summaryParams)
      : await connection.query<any>(summaryQuery);
    const summary = summaryResult[0] || {};

    // Get per-user billing details with downloads
    let userBillingQuery = `
      SELECT 
        u.id as user_id,
        u.email,
        COALESCE(COUNT(DISTINCT aul.id), 0) as total_operations,
        COALESCE(SUM(CASE WHEN aul.operation_type = 'text_analysis' THEN 1 ELSE 0 END), 0) as text_analysis_count,
        COALESCE(SUM(CASE WHEN aul.operation_type = 'image_generation' THEN 1 ELSE 0 END), 0) as image_generation_count,
        COALESCE(SUM(CASE WHEN aul.operation_type = 'image_enhancement' THEN 1 ELSE 0 END), 0) as image_enhancement_count,
        COALESCE(SUM(aul.input_tokens + aul.output_tokens), 0) as total_tokens,
        COALESCE(SUM(aul.input_images + aul.output_images), 0) as total_images,
        COALESCE(SUM(aul.cost_usd), 0) as total_cost_usd,
        COALESCE(SUM(aul.cost_inr), 0) as total_cost_inr,
        COALESCE(COUNT(DISTINCT dbl.id), 0) as downloads_count,
        COALESCE(SUM(dbl.amount_inr), 0) as download_cost_inr,
        COALESCE(MAX(aul.created_at), COALESCE(MAX(dbl.created_at), u.created_at)) as last_activity
      FROM users u
      LEFT JOIN api_usage_logs aul ON u.id = aul.user_id
      LEFT JOIN download_billing_logs dbl ON u.id = dbl.user_id
    `;

    const userBillingParams: any[] = [];
    
    if (filterDate || filterModel) {
      userBillingQuery += ' WHERE 1=1';
      if (filterDate) {
        userBillingQuery += ' AND (DATE(aul.created_at) = ? OR DATE(dbl.created_at) = ?)';
        userBillingParams.push(filterDate, filterDate);
      }
      if (filterModel) {
        userBillingQuery += ' AND aul.model_name = ?';
        userBillingParams.push(filterModel);
      }
    }
    userBillingQuery += `
      GROUP BY u.id, u.email
      ORDER BY (COALESCE(SUM(aul.cost_inr), 0) + COALESCE(SUM(dbl.amount_inr), 0)) DESC
    `;

    const [userBillingResult] = userBillingParams.length > 0
      ? await connection.query<any>(userBillingQuery, userBillingParams)
      : await connection.query<any>(userBillingQuery);

    // Get model usage breakdown
    let modelUsageQuery = `
      SELECT 
        model_name,
        operation_type,
        COUNT(*) as count,
        SUM(cost_usd) as total_cost_usd,
        SUM(cost_inr) as total_cost_inr,
        AVG(cost_usd) as avg_cost_per_operation
      FROM api_usage_logs
    `;

    const modelUsageParams: any[] = [];
    
    if (filterDate || filterModel) {
      modelUsageQuery += ' WHERE 1=1';
      if (filterDate) {
        modelUsageQuery += ' AND DATE(created_at) = ?';
        modelUsageParams.push(filterDate);
      }
      if (filterModel) {
        modelUsageQuery += ' AND model_name = ?';
        modelUsageParams.push(filterModel);
      }
    }

    modelUsageQuery += `
      GROUP BY model_name, operation_type
      ORDER BY model_name, operation_type
    `;

    const [modelUsageResult] = modelUsageParams.length > 0
      ? await connection.query<any>(modelUsageQuery, modelUsageParams)
      : await connection.query<any>(modelUsageQuery);

    // Get daily report (generations only)
    let dailyReportQuery = `
      SELECT 
        DATE(created_at) as day,
        COUNT(*) as generations,
        SUM(cost_inr) as total_inr,
        GROUP_CONCAT(DISTINCT model_name ORDER BY model_name SEPARATOR ',') as models
      FROM api_usage_logs
      WHERE operation_type IN ('image_generation', 'image_enhancement')
    `;

    const dailyReportParams: any[] = [];
    
    if (filterDate) {
      dailyReportQuery += ' AND DATE(created_at) = ?';
      dailyReportParams.push(filterDate);
    }
    if (filterModel) {
      dailyReportQuery += ' AND model_name = ?';
      dailyReportParams.push(filterModel);
    }

    dailyReportQuery += `
      GROUP BY DATE(created_at)
      ORDER BY day DESC
      LIMIT 30
    `;

    const [dailyReportResult] = dailyReportParams.length > 0
      ? await connection.query<any>(dailyReportQuery, dailyReportParams)
      : await connection.query<any>(dailyReportQuery);

    // Get download billing data - corrected table name
    let downloadBillingQuery = `
      SELECT 
        DATE(dbl.created_at) as day,
        u.id as user_id,
        u.email,
        COUNT(DISTINCT dbl.id) as images_downloaded,
        SUM(dbl.amount_inr) as total_inr,
        GROUP_CONCAT(DISTINCT gl.phone_model ORDER BY gl.phone_model SEPARATOR ',') as models
      FROM download_billing_logs dbl
      JOIN users u ON dbl.user_id = u.id
      LEFT JOIN generation_logs gl ON dbl.generation_log_id = gl.id
    `;
    
    const downloadBillingParams: any[] = [];
    
    if (filterDate) {
      downloadBillingQuery += ' WHERE DATE(dbl.created_at) = ?';
      downloadBillingParams.push(filterDate);
    }
    
    downloadBillingQuery += `
      GROUP BY DATE(dbl.created_at), u.id, u.email
      ORDER BY day DESC, total_inr DESC
    `;

    const [downloadBillingResult] = downloadBillingParams.length > 0
      ? await connection.query<any>(downloadBillingQuery, downloadBillingParams)
      : await connection.query<any>(downloadBillingQuery);

    // Get list of available models for filtering
    const [modelListResult] = await connection.query<any>(`
      SELECT DISTINCT model_name 
      FROM api_usage_logs 
      ORDER BY model_name
    `);

    connection.release();

    // Format response data
    const formattedSummary = {
      total_users: Number(summary.total_users) || 0,
      total_operations: Number(summary.total_operations) || 0,
      total_cost_usd: parseFloat(summary.total_cost_usd) || 0,
      total_cost_inr: parseFloat(summary.total_cost_inr) || 0,
      total_tokens: Number(summary.total_tokens) || 0,
      total_images: Number(summary.total_images) || 0,
      total_downloads: Number(summary.total_downloads) || 0,
      total_download_cost_inr: parseFloat(summary.total_download_cost_inr) || 0,
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
      total_cost_usd: parseFloat(user.total_cost_usd) || 0,
      total_cost_inr: parseFloat(user.total_cost_inr) || 0,
      downloads_count: Number(user.downloads_count) || 0,
      download_cost_inr: parseFloat(user.download_cost_inr) || 0,
      last_activity: user.last_activity || new Date().toISOString(),
    }));

    const formattedModelUsage = (modelUsageResult || []).map((model: any) => ({
      model_name: model.model_name,
      operation_type: model.operation_type,
      count: Number(model.count) || 0,
      total_cost_usd: parseFloat(model.total_cost_usd) || 0,
      total_cost_inr: parseFloat(model.total_cost_inr) || 0,
      avg_cost_per_operation: parseFloat(model.avg_cost_per_operation) || 0,
    }));

    const formattedDailyReport = (dailyReportResult || []).map((row: any) => ({
      day: row.day,
      generations: Number(row.generations) || 0,
      total_inr: parseFloat(row.total_inr) || 0,
      models: row.models ? row.models.split(',').filter((m: string) => m) : [],
    }));

    const formattedDownloadBilling = (downloadBillingResult || []).map((row: any) => ({
      day: row.day,
      user_id: row.user_id,
      email: row.email,
      images_downloaded: Number(row.images_downloaded) || 0,
      total_inr: parseFloat(row.total_inr) || 0,
      models: row.models ? row.models.split(',').filter((m: string) => m) : [],
    }));

    const formattedModelList = (modelListResult || []).map((row: any) => row.model_name);

    return NextResponse.json({
      success: true,
      data: {
        summary: formattedSummary,
        userBilling: formattedUserBilling,
        modelUsage: formattedModelUsage,
        dailyReport: formattedDailyReport,
        downloadBilling: formattedDownloadBilling,
        availableModels: formattedModelList,
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
