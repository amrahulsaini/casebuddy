import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';
import { requireRole } from '@/lib/auth';
import { ensureRefundColumns } from '@/lib/ensure-refund-columns';
import { resolveCapturedPaymentId, refundPayment } from '@/lib/razorpay';
import { sendOrderCancelledRefundEmail } from '@/lib/order-cancel-refund-email';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['admin', 'manager']);

    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (!orderId) {
      return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });
    }

    await ensureRefundColumns(caseMainPool);

    const [rows]: any = await caseMainPool.execute('SELECT * FROM orders WHERE id = ? LIMIT 1', [orderId]);
    const order = rows?.[0];
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.payment_status !== 'completed') {
      return NextResponse.json({ error: 'Only captured/completed payments can be cancelled and refunded' }, { status: 400 });
    }

    if (order.order_status === 'cancelled') {
      return NextResponse.json({ error: 'Order is already cancelled' }, { status: 400 });
    }

    const paymentId = await resolveCapturedPaymentId({
      razorpayPaymentId: order.razorpay_payment_id,
      razorpayOrderId: order.payment_id,
    });

    if (!paymentId) {
      return NextResponse.json({ error: 'Could not resolve Razorpay payment for this order' }, { status: 400 });
    }

    const refund = await refundPayment(paymentId);

    await caseMainPool.execute(
      `UPDATE orders SET
        order_status = 'cancelled',
        payment_status = 'refunded',
        razorpay_payment_id = ?,
        razorpay_refund_id = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [paymentId, refund.id, orderId]
    );

    try {
      await sendOrderCancelledRefundEmail({
        orderId: order.id,
        orderNumber: order.order_number,
        customerEmail: order.customer_email,
        customerName: order.customer_name,
        totalAmount: parseFloat(order.total_amount),
        refundId: refund.id,
      });
    } catch (emailError) {
      console.error('Failed to send cancellation/refund email, but refund was processed:', emailError);
    }

    const [updated]: any = await caseMainPool.execute('SELECT * FROM orders WHERE id = ? LIMIT 1', [orderId]);
    return NextResponse.json({ success: true, order: updated?.[0] || null, refund });
  } catch (error: any) {
    console.error('Cancel/refund order error:', error);
    const message = error?.message || 'Failed to cancel and refund order';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
