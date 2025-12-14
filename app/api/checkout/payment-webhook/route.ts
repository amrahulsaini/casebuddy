import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';
import crypto from 'crypto';

const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-webhook-signature');
    
    // Verify webhook signature
    if (signature && CASHFREE_SECRET_KEY) {
      const computedSignature = crypto
        .createHmac('sha256', CASHFREE_SECRET_KEY)
        .update(JSON.stringify(body))
        .digest('base64');
      
      if (signature !== computedSignature) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const { data, type } = body;
    
    console.log('Cashfree Webhook:', { type, data });

    // Handle payment success
    if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const { order } = data;
      const orderId = order.order_id.split('_')[1]; // Extract orderId from "order_123_timestamp"
      
      // Update order status
      await caseMainPool.query(
        `UPDATE orders SET 
          payment_status = ?,
          order_status = ?,
          payment_method = ?,
          updated_at = NOW()
        WHERE id = ?`,
        ['paid', 'confirmed', order.payment_group || 'online', orderId]
      );
      
      console.log(`Order ${orderId} marked as paid`);

      // Emails disabled (confirmation-only policy)
    }
    
    // Handle payment failure
    if (type === 'PAYMENT_FAILED_WEBHOOK') {
      const { order } = data;
      const orderId = order.order_id.split('_')[1];
      
      await caseMainPool.query(
        `UPDATE orders SET 
          payment_status = ?,
          order_status = ?,
          updated_at = NOW()
        WHERE id = ?`,
        ['failed', 'cancelled', orderId]
      );
      
      console.log(`Order ${orderId} marked as failed`);

      // Emails disabled (confirmation-only policy)
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
