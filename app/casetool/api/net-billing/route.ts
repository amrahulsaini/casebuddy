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

    // Get summary data
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT u.id) as total_users,
        COALESCE(COUNT(aul.id), 0) as total_operations,
        COALESCE(SUM(aul.cost_usd), 0) as total_cost_usd,
        COALESCE(SUM(aul.cost_inr), 0) as total_cost_inr,
        COALESCE(SUM(aul.input_tokens + aul.output_tokens), 0) as total_tokens,
        COALESCE(SUM(aul.input_images + aul.output_images), 0) as total_images
      FROM users u
      LEFT JOIN api_usage_logs aul ON u.id = aul.user_id
    `;

    const [summaryResult] = await connection.query<any>(summaryQuery);
    const summary = summaryResult[0] || {};

    // Get per-user billing details
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
        COALESCE(SUM(aul.cost_usd), 0) as total_cost_usd,
        COALESCE(SUM(aul.cost_inr), 0) as total_cost_inr,
        COALESCE(MAX(aul.created_at), u.created_at) as last_activity
      FROM users u
      LEFT JOIN api_usage_logs aul ON u.id = aul.user_id
      GROUP BY u.id, u.email
      ORDER BY total_cost_usd DESC
    `;

    const [userBillingResult] = await connection.query<any>(userBillingQuery);

    // Get model usage breakdown
    const modelUsageQuery = `
      SELECT 
        model_name,
        operation_type,
        COUNT(*) as count,
        SUM(cost_usd) as total_cost_usd,
        SUM(cost_inr) as total_cost_inr,
        AVG(cost_usd) as avg_cost_per_operation
      FROM api_usage_logs
      GROUP BY model_name, operation_type
      ORDER BY model_name, operation_type
    `;

    const [modelUsageResult] = await connection.query<any>(modelUsageQuery);

    connection.release();

    // Format response data
    const formattedSummary = {
      total_users: Number(summary.total_users) || 0,
      total_operations: Number(summary.total_operations) || 0,
      total_cost_usd: parseFloat(summary.total_cost_usd) || 0,
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
      total_cost_usd: parseFloat(user.total_cost_usd) || 0,
      total_cost_inr: parseFloat(user.total_cost_inr) || 0,
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

    return NextResponse.json({
      success: true,
      data: {
        summary: formattedSummary,
        userBilling: formattedUserBilling,
        modelUsage: formattedModelUsage,
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
