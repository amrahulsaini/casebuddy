const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

function authHeader() {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured');
  }
  return 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
}

export async function getPaymentsForRazorpayOrder(razorpayOrderId: string): Promise<any[]> {
  const res = await fetch(`https://api.razorpay.com/v1/orders/${razorpayOrderId}/payments`, {
    method: 'GET',
    headers: { Authorization: authHeader() },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.description || 'Failed to fetch Razorpay payments for order');
  }
  return data?.items || [];
}

/**
 * Resolves the actual Razorpay payment id (pay_xxx) for an order, given either
 * an already-known payment id or a Razorpay order id (order_xxx) to look up.
 */
export async function resolveCapturedPaymentId(args: {
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
}): Promise<string | null> {
  if (args.razorpayPaymentId) return args.razorpayPaymentId;
  if (!args.razorpayOrderId) return null;

  const payments = await getPaymentsForRazorpayOrder(args.razorpayOrderId);
  const captured = payments.find((p) => p.status === 'captured') || payments[0];
  return captured?.id || null;
}

/**
 * Issues a refund for a captured Razorpay payment. Amount is in the smallest
 * currency unit (paise for INR). Omit amount for a full refund.
 */
export async function refundPayment(paymentId: string, amount?: number): Promise<any> {
  const body: Record<string, unknown> = {};
  if (amount != null) body.amount = amount;

  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.description || 'Razorpay refund failed');
  }
  return data;
}
