import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

const GOOGLE_CLOUD_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || '';
const GOOGLE_CLOUD_BILLING_ACCOUNT = process.env.GOOGLE_CLOUD_BILLING_ACCOUNT || '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // Format: YYYY-MM
    
    // Try to get manually entered billing data from database
    const [manualBilling]: any = await pool.execute(
      'SELECT * FROM google_cloud_billing ORDER BY month DESC LIMIT 1'
    );
    
    if (manualBilling.length > 0) {
      const billing = manualBilling[0];
      return NextResponse.json({
        success: true,
        source: 'manual',
        billing: {
          month: billing.month,
          total_cost_usd: parseFloat(billing.total_cost_usd),
          total_cost_inr: parseFloat(billing.total_cost_inr),
          gemini_cost_usd: parseFloat(billing.gemini_cost_usd),
          gemini_cost_inr: parseFloat(billing.gemini_cost_inr),
          last_updated: billing.updated_at,
        }
      });
    }
    
    // If no manual data, return instructions
    return NextResponse.json({
      success: true,
      source: 'none',
      message: 'No Google Cloud billing data found. Please add manually.',
      instructions: {
        step1: 'Go to Google Cloud Console > Billing > Reports',
        step2: 'Filter by date and service (Generative Language API / Gemini)',
        step3: 'Copy the total cost and enter it using the form',
        database: 'Data will be stored in google_cloud_billing table',
      }
    });
  } catch (error: any) {
    console.error('Error fetching Google Cloud billing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Google Cloud billing', details: error.message },
      { status: 500 }
    );
  }
}

// POST endpoint to manually enter billing data
export async function POST(request: NextRequest) {
  try {
    const { month, total_cost_usd, gemini_cost_usd } = await request.json();
    
    if (!month || !total_cost_usd) {
      return NextResponse.json(
        { success: false, error: 'Month and total_cost_usd are required' },
        { status: 400 }
      );
    }
    
    // Convert USD to INR (approximate rate: 1 USD = 83 INR)
    const USD_TO_INR = 83;
    const total_cost_inr = parseFloat(total_cost_usd) * USD_TO_INR;
    const gemini_cost_inr = gemini_cost_usd ? parseFloat(gemini_cost_usd) * USD_TO_INR : total_cost_inr;
    
    // Check if table exists, create if not
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS google_cloud_billing (
        id INT AUTO_INCREMENT PRIMARY KEY,
        month VARCHAR(7) NOT NULL UNIQUE,
        total_cost_usd DECIMAL(10,2) NOT NULL,
        total_cost_inr DECIMAL(10,2) NOT NULL,
        gemini_cost_usd DECIMAL(10,2),
        gemini_cost_inr DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_month (month)
      )
    `);
    
    // Insert or update billing data
    await pool.execute(
      `INSERT INTO google_cloud_billing (month, total_cost_usd, total_cost_inr, gemini_cost_usd, gemini_cost_inr)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       total_cost_usd = VALUES(total_cost_usd),
       total_cost_inr = VALUES(total_cost_inr),
       gemini_cost_usd = VALUES(gemini_cost_usd),
       gemini_cost_inr = VALUES(gemini_cost_inr)`,
      [month, total_cost_usd, total_cost_inr, gemini_cost_usd || total_cost_usd, gemini_cost_inr]
    );
    
    return NextResponse.json({
      success: true,
      message: 'Google Cloud billing data saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving Google Cloud billing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save billing data', details: error.message },
      { status: 500 }
    );
  }
}
