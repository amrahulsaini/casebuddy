import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';
import crypto from 'crypto';

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    // Verify webhook signature
    if (!RAZORPAY_WEBHOOK_SECRET) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    if (signature) {
      const computedSignature = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      if (signature !== computedSignature) {
        console.error('Invalid Razorpay webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);
    const { event, payload } = body;

    console.log('Razorpay Webhook event:', event);

    // payment.captured - user paid successfully
    if (event === 'payment.captured') {
      const payment = payload.payment?.entity;
      if (!payment) {
        console.error('No payment entity in payload');
        return NextResponse.json({ success: true });
      }

      const orderId = payment.notes?.internal_order_id;
      if (!orderId) {
        console.error('Could not extract internal_order_id from payment notes:', payment.notes);
        return NextResponse.json({ success: true });
      }

      await caseMainPool.query(
        `UPDATE orders SET
          payment_status = ?,
          order_status = ?,
          payment_method = ?,
          updated_at = NOW()
        WHERE id = ?`,
        ['completed', 'processing', payment.method || 'Razorpay', orderId]
      );

      console.log(`Order ${orderId} marked as completed via webhook`);
    }

    // order.paid - fired when full order amount is paid (use as backup)
    if (event === 'order.paid') {
      const order = payload.order?.entity;
      if (!order) {
        console.error('No order entity in payload');
        return NextResponse.json({ success: true });
      }

      const orderId = order.notes?.internal_order_id;
      if (!orderId) {
        console.error('Could not extract internal_order_id from order notes:', order.notes);
        return NextResponse.json({ success: true });
      }

      // Only update if still pending (avoid overwriting if already updated by payment.captured)
      await caseMainPool.query(
        `UPDATE orders SET
          payment_status = ?,
          order_status = ?,
          updated_at = NOW()
        WHERE id = ? AND payment_status = ?`,
        ['completed', 'processing', orderId, 'pending']
      );

      console.log(`Order ${orderId} marked as completed via order.paid webhook`);
    }

    // payment.failed - payment attempt failed
    if (event === 'payment.failed') {
      const payment = payload.payment?.entity;
      if (!payment) {
        console.error('No payment entity in failed payload');
        return NextResponse.json({ success: true });
      }

      const orderId = payment.notes?.internal_order_id;
      if (!orderId) {
        console.error('Could not extract internal_order_id from failed payment notes');
        return NextResponse.json({ success: true });
      }

      await caseMainPool.query(
        `UPDATE orders SET
          payment_status = ?,
          order_status = ?,
          updated_at = NOW()
        WHERE id = ?`,
        ['failed', 'cancelled', orderId]
      );

      console.log(`Order ${orderId} marked as failed via webhook`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
