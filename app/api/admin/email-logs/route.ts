import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db-main';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'manager']);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const emailType = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        el.*,
        o.order_number
      FROM email_logs el
      LEFT JOIN orders o ON o.id = el.order_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (emailType) {
      query += ` AND el.email_type = ?`;
      params.push(emailType);
    }

    if (status) {
      query += ` AND el.status = ?`;
      params.push(status);
    }

    // Get total count
    const countQuery = query.replace('el.*, o.order_number', 'COUNT(*) as total');
    const [countRows]: any = await pool.execute(countQuery, params);
    const total = countRows[0]?.total || 0;

    // Get paginated logs
    query += ` ORDER BY el.sent_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [logs]: any = await pool.execute(query, params);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    const message = error?.message || 'Failed to fetch email logs';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
