import { NextResponse } from 'next/server';
import pool from '@/lib/db-main';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const { brandId } = await params;

    const [models]: any = await pool.execute(
      'SELECT * FROM phone_models WHERE brand_id = ? AND is_active = TRUE ORDER BY sort_order, model_name',
      [brandId]
    );

    return NextResponse.json({
      success: true,
      models: models,
    });
  } catch (error: any) {
    console.error('Phone models API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
