import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getShiprocketToken } from '@/lib/shiprocket';

export async function GET() {
  try {
    await requireRole(['admin', 'manager']);

    const envEmail = process.env.SHIPROCKET_EMAIL || '';
    const envPassword = process.env.SHIPROCKET_PASSWORD || '';
    const envToken = process.env.SHIPROCKET_TOKEN || '';
    const baseUrl = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in';

    const diagnostics = {
      baseUrl,
      shiprocketEmail: envEmail,
      shiprocketPasswordLength: envPassword.length,
      shiprocketPasswordHasHash: envPassword.includes('#'),
      shiprocketPasswordHasQuotes: envPassword.startsWith('"') || envPassword.endsWith('"') || envPassword.startsWith("'") || envPassword.endsWith("'"),
      usingTokenOverride: !!envToken,
      tokenLooksLikeJwt: (envToken.match(/\./g) || []).length >= 2,
      nodeEnv: process.env.NODE_ENV || 'unknown',
    };

    const token = await getShiprocketToken();
    const dotCount = (token.match(/\./g) || []).length;

    // Never return the token itself.
    return NextResponse.json({
      ok: true,
      ...diagnostics,
      tokenPrefix: token.slice(0, 12),
      tokenDotCount: dotCount,
    });
  } catch (error: any) {
    const message = error?.message || 'Shiprocket health check failed';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;

    // Include safe diagnostics to debug env loading problems.
    const envEmail = process.env.SHIPROCKET_EMAIL || '';
    const envPassword = process.env.SHIPROCKET_PASSWORD || '';
    const envToken = process.env.SHIPROCKET_TOKEN || '';

    return NextResponse.json(
      {
        ok: false,
        error: message,
        diagnostics: {
          baseUrl: process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in',
          shiprocketEmail: envEmail,
          shiprocketPasswordLength: envPassword.length,
          shiprocketPasswordHasHash: envPassword.includes('#'),
          usingTokenOverride: !!envToken,
          tokenLooksLikeJwt: (envToken.match(/\./g) || []).length >= 2,
          nodeEnv: process.env.NODE_ENV || 'unknown',
        },
      },
      { status }
    );
  }
}
