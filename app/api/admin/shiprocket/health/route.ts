import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getShiprocketToken } from '@/lib/shiprocket';

export async function GET() {
  try {
    await requireRole(['admin', 'manager']);

    const token = await getShiprocketToken();
    const dotCount = (token.match(/\./g) || []).length;

    // Never return the token itself.
    return NextResponse.json({
      ok: true,
      baseUrl: process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in',
      usingTokenOverride: !!process.env.SHIPROCKET_TOKEN,
      tokenLooksLikeJwt: dotCount >= 2,
      tokenPrefix: token.slice(0, 12),
    });
  } catch (error: any) {
    const message = error?.message || 'Shiprocket health check failed';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
