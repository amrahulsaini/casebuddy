export type ShiprocketConfig = {
  baseUrl: string;
  email: string;
  password: string;
};

function getConfig(): ShiprocketConfig {
  const baseUrl = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in';
  const email = process.env.SHIPROCKET_EMAIL || '';
  const password = process.env.SHIPROCKET_PASSWORD || '';

  if (!email || !password) {
    throw new Error('Missing SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD');
  }

  return { baseUrl, email, password };
}

type CachedToken = {
  token: string;
  expiresAtMs: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __shiprocketToken: CachedToken | undefined;
}

function nowMs() {
  return Date.now();
}

export async function getShiprocketToken(): Promise<string> {
  const cached = globalThis.__shiprocketToken;
  if (cached && cached.expiresAtMs > nowMs()) {
    return cached.token;
  }

  const cfg = getConfig();
  const res = await fetch(`${cfg.baseUrl}/v1/external/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cfg.email, password: cfg.password }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Shiprocket auth failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  if (!json || typeof json.token !== 'string' || !json.token) {
    throw new Error('Shiprocket auth response format unexpected');
  }

  // Token lifetime can vary; cache conservatively for 9 hours.
  globalThis.__shiprocketToken = {
    token: json.token,
    expiresAtMs: nowMs() + 9 * 60 * 60 * 1000,
  };

  return json.token;
}

export async function shiprocketRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cfg = getConfig();
  const token = await getShiprocketToken();

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${cfg.baseUrl}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    throw new Error(`Shiprocket request failed (${res.status}) ${path}: ${message}`);
  }

  return data as T;
}

export function getShipDefaults() {
  const pickup_location = process.env.SHIPROCKET_PICKUP_LOCATION || '';
  if (!pickup_location) {
    throw new Error('Missing SHIPROCKET_PICKUP_LOCATION');
  }

  const weight = Number(process.env.SHIPROCKET_DEFAULT_WEIGHT_KG || '0.3');
  const length = Number(process.env.SHIPROCKET_DEFAULT_LENGTH_CM || '18');
  const breadth = Number(process.env.SHIPROCKET_DEFAULT_BREADTH_CM || '10');
  const height = Number(process.env.SHIPROCKET_DEFAULT_HEIGHT_CM || '3');

  return {
    pickup_location,
    weight,
    length,
    breadth,
    height,
  };
}
