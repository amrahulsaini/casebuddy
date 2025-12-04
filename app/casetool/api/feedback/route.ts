/**
 * API Route: /casetool/api/feedback
 * Handle image feedback and refunds
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const userIdCookie = request.cookies.get('casetool_user_id');
    const userId = userIdCookie ? parseInt(userIdCookie.value) : null;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { logId, feedbackType, comment } = body;

    if (!logId || !feedbackType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['accurate', 'inaccurate'].includes(feedbackType)) {
      return NextResponse.json({ error: 'Invalid feedback type' }, { status: 400 });
    }

    // Get generation log details
    const [logRows]: any = await pool.execute(
      'SELECT * FROM generation_logs WHERE id = ? AND user_id = ?',
      [logId, userId]
    );

    if (logRows.length === 0) {
      return NextResponse.json({ error: 'Generation log not found' }, { status: 404 });
    }

    const log = logRows[0];

    // Check if feedback already submitted
    if (log.feedback_status !== 'pending') {
      return NextResponse.json({ 
        error: 'Feedback already submitted for this generation',
        currentFeedback: log.feedback_status
      }, { status: 400 });
    }

    let refundAmount = 0;

    if (feedbackType === 'inaccurate') {
      // Calculate refund amount from api_usage_logs
      const [usageRows]: any = await pool.execute(
        'SELECT SUM(cost_inr) as total_cost FROM api_usage_logs WHERE generation_log_id = ? AND is_billable = TRUE',
        [logId]
      );

      refundAmount = usageRows[0]?.total_cost || 0;

      // Mark api_usage_logs as non-billable
      await pool.execute(
        'UPDATE api_usage_logs SET is_billable = FALSE WHERE generation_log_id = ?',
        [logId]
      );

      // Update user balance (add refund)
      await pool.execute(
        'UPDATE users SET balance = balance + ? WHERE id = ?',
        [refundAmount, userId]
      );
    }

    // Update generation_logs with feedback
    await pool.execute(
      `UPDATE generation_logs 
       SET feedback_status = ?, 
           feedback_comment = ?, 
           feedback_at = NOW(), 
           is_refunded = ?, 
           refund_amount_inr = ? 
       WHERE id = ?`,
      [feedbackType, comment || null, feedbackType === 'inaccurate', refundAmount, logId]
    );

    // Insert into feedback_logs for detailed tracking
    await pool.execute(
      `INSERT INTO feedback_logs (generation_log_id, user_id, feedback_type, feedback_comment, refund_amount_inr) 
       VALUES (?, ?, ?, ?, ?)`,
      [logId, userId, feedbackType, comment || null, refundAmount]
    );

    return NextResponse.json({
      success: true,
      feedbackType,
      refundAmount: feedbackType === 'inaccurate' ? refundAmount : 0,
      message: feedbackType === 'inaccurate' 
        ? `Refund of ₹${refundAmount.toFixed(2)} has been added to your balance` 
        : 'Thank you for your feedback!'
    });

  } catch (error: any) {
    console.error('Feedback error:', error);
    return NextResponse.json({ 
      error: 'Failed to process feedback',
      details: error.message 
    }, { status: 500 });
  }
}
