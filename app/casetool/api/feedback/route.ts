import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { generationLogId, feedbackType, issueCategory, issueDescription } = await request.json();

    // Update generation log
    await pool.execute(
      'UPDATE generation_logs SET user_feedback = ?, feedback_note = ?, updated_at = NOW() WHERE id = ?',
      [feedbackType, issueDescription || null, generationLogId]
    );

    // Insert detailed feedback
    await pool.execute(
      'INSERT INTO user_feedback (generation_log_id, feedback_type, issue_category, issue_description) VALUES (?, ?, ?, ?)',
      [generationLogId, feedbackType, issueCategory || null, issueDescription || null]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Feedback error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
