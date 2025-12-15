import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from cookie
    const userIdCookie = request.cookies.get('casetool_user_id');
    const userId = userIdCookie ? parseInt(userIdCookie.value) : null;

    const url = new URL(request.url);
    const pageParam = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSizeParam = parseInt(url.searchParams.get('pageSize') || '24', 10);
    const statusParam = (url.searchParams.get('status') || 'all').toLowerCase();
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const pageSize = Number.isFinite(pageSizeParam) ? Math.min(Math.max(pageSizeParam, 1), 60) : 24;
    const offset = (page - 1) * pageSize;
    const statusFilter = statusParam === 'completed' || statusParam === 'failed' ? statusParam : 'all';

    const baseSelectWithOriginalUrl = `SELECT 
        gl.id,
        gl.session_id,
        gl.user_id,
        u.email as user_email,
        gl.phone_model,
        gl.original_image_name,
        gl.original_image_url,
        gl.ai_prompt,
        gl.generated_image_url,
        gl.generation_time,
        gl.status,
        gl.feedback_status,
        gl.created_at
      FROM generation_logs gl
      LEFT JOIN users u ON gl.user_id = u.id`;

    const baseSelectWithoutOriginalUrl = `SELECT 
        gl.id,
        gl.session_id,
        gl.user_id,
        u.email as user_email,
        gl.phone_model,
        gl.original_image_name,
        gl.ai_prompt,
        gl.generated_image_url,
        gl.generation_time,
        gl.status,
        gl.feedback_status,
        gl.created_at
      FROM generation_logs gl
      LEFT JOIN users u ON gl.user_id = u.id`;
    
    const params: any[] = [];
    const whereParts: string[] = [];
    if (userId) {
      whereParts.push('gl.user_id = ?');
      params.push(userId);
    }
    if (statusFilter !== 'all') {
      whereParts.push('gl.status = ?');
      params.push(statusFilter);
    }
    const whereClause = whereParts.length ? ` WHERE ${whereParts.join(' AND ')}` : '';

    // Keep unauthenticated access conservative.
    const suffix = userId
      ? ` ORDER BY gl.created_at DESC LIMIT ? OFFSET ?`
      : ` ORDER BY gl.created_at DESC LIMIT 100`;

    let rows: any;
    try {
      const execParams = userId ? [...params, pageSize, offset] : params;
      const [r] = await pool.execute(baseSelectWithOriginalUrl + whereClause + suffix, execParams);
      rows = r;
    } catch (e: any) {
      // Backward-compatible fallback if DB schema isn't migrated yet
      const message = String(e?.message || '');
      if (message.toLowerCase().includes('unknown column') && message.includes('original_image_url')) {
        const execParams = userId ? [...params, pageSize, offset] : params;
        const [r] = await pool.execute(baseSelectWithoutOriginalUrl + whereClause + suffix, execParams);
        rows = r;
      } else {
        throw e;
      }
    }

    // Provide total + status counts for fast UI stats + pagination
    let total = 0;
    let stats = { total: 0, completed: 0, failed: 0 };
    if (userId) {
      const countParams: any[] = [];
      const countWhereParts: string[] = ['user_id = ?'];
      countParams.push(userId);
      if (statusFilter !== 'all') {
        countWhereParts.push('status = ?');
        countParams.push(statusFilter);
      }
      const [countRows]: any = await pool.execute(
        `SELECT COUNT(*) as total FROM generation_logs WHERE ${countWhereParts.join(' AND ')}`,
        countParams
      );
      total = Number(countRows?.[0]?.total) || 0;

      const [statusRows]: any = await pool.execute(
        `SELECT status, COUNT(*) as count FROM generation_logs WHERE user_id = ? GROUP BY status`,
        [userId]
      );
      const byStatus: Record<string, number> = {};
      for (const r of statusRows || []) {
        byStatus[String(r.status)] = Number(r.count) || 0;
      }
      stats = {
        total: (byStatus.generating || 0) + (byStatus.completed || 0) + (byStatus.failed || 0),
        completed: byStatus.completed || 0,
        failed: byStatus.failed || 0,
      };
    }

    const totalPages = userId ? (total > 0 ? Math.ceil(total / pageSize) : 0) : 0;

    return NextResponse.json({
      success: true,
      logs: rows,
      stats,
      pagination: userId ? { page, pageSize, total, totalPages, status: statusFilter } : undefined,
    });
  } catch (error: any) {
    console.error('Gallery fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
