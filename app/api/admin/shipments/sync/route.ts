import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';
import { requireRole } from '@/lib/auth';
import { shiprocketRequest } from '@/lib/shiprocket';
import { shiprocketStatusCodeToLabel } from '@/lib/shiprocket-status';

function getByPath(obj: any, path: string) {
  return path.split('.').reduce((acc: any, key: string) => (acc == null ? undefined : acc[key]), obj);
}

function firstNonEmpty(...values: any[]) {
  for (const v of values) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    return v;
  }
  return null;
}

function extractAwbCourierStatus(response: any) {
  const dataNode = response?.data;
  const data0 = Array.isArray(dataNode) ? dataNode[0] : dataNode;

  const awb = firstNonEmpty(
    response?.awb,
    response?.awb_code,
    response?.awbCode,
    getByPath(response, 'data.awb'),
    getByPath(response, 'data.awb_code'),
    getByPath(response, 'data.awbCode'),
    data0?.awb,
    data0?.awb_code,
    data0?.awbCode,
    getByPath(response, 'data.data.awb'),
    getByPath(response, 'data.data.awb_code'),
    getByPath(response, 'tracking_data.awb'),
    getByPath(response, 'tracking_data.awb_code'),
    getByPath(response, 'tracking_data.shipment_track.0.awb'),
    getByPath(response, 'tracking_data.shipment_track.0.awb_code')
  );

  const courierName = firstNonEmpty(
    response?.courier_name,
    response?.courierName,
    response?.courier_company_name,
    getByPath(response, 'data.courier_name'),
    getByPath(response, 'data.courier_company_name'),
    data0?.courier_name,
    data0?.courier_company_name,
    getByPath(response, 'tracking_data.courier_name'),
    getByPath(response, 'tracking_data.shipment_track.0.courier_name'),
    getByPath(response, 'tracking_data.shipment_track.0.courier_company_name')
  );

  const courierId = firstNonEmpty(
    response?.courier_company_id,
    response?.courierCompanyId,
    response?.courier_id,
    response?.courierId,
    getByPath(response, 'data.courier_company_id'),
    getByPath(response, 'data.courier_id'),
    data0?.courier_company_id,
    data0?.courier_id
  );

  const status = firstNonEmpty(
    response?.status,
    response?.current_status,
    getByPath(response, 'data.status'),
    getByPath(response, 'tracking_data.shipment_status'),
    getByPath(response, 'tracking_data.shipment_track.0.current_status')
  );

  const trackingUrl = firstNonEmpty(response?.tracking_url, response?.trackingUrl, getByPath(response, 'tracking_data.track_url'));

  return {
    awb: awb != null ? String(awb) : null,
    courierName: courierName != null ? String(courierName) : null,
    courierId: courierId != null ? String(courierId) : null,
    status: status != null ? String(shiprocketStatusCodeToLabel(status) || status) : null,
    trackingUrl: trackingUrl != null ? String(trackingUrl) : null,
  };
}

async function tryShiprocketEndpoints(endpoints: string[]) {
  let lastErr: any = null;
  for (const ep of endpoints) {
    try {
      const res = await shiprocketRequest<any>(ep, { method: 'GET' });
      return { endpoint: ep, response: res };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Shiprocket sync failed');
}

async function authorize(request: NextRequest) {
  // Option A: logged-in admin
  try {
    await requireRole(['admin', 'manager', 'staff']);
    return;
  } catch {
    // ignore and try secret
  }

  // Option B: server-to-server secret (for cron)
  const secret = process.env.SHIPROCKET_SYNC_SECRET || '';
  if (!secret) {
    throw new Error('Unauthorized');
  }

  const header = request.headers.get('x-sync-secret') || '';
  if (header !== secret) {
    throw new Error('Unauthorized');
  }
}

async function syncSingleOrderShipment(orderId: number) {
  const [rows]: any = await caseMainPool.execute('SELECT * FROM shipments WHERE order_id = ? LIMIT 1', [orderId]);
  const shipment = rows?.[0];
  if (!shipment) {
    return { orderId, success: false, error: 'Shipment not found' };
  }

  const shiprocketOrderId = shipment.shiprocket_order_id;
  const shiprocketShipmentId = shipment.shiprocket_shipment_id;

  const endpoints: string[] = [];
  if (shiprocketShipmentId) {
    // Commonly available on many Shiprocket accounts.
    endpoints.push(`/v1/external/courier/track/shipment/${encodeURIComponent(String(shiprocketShipmentId))}`);
    endpoints.push(`/v1/external/shipments/${encodeURIComponent(String(shiprocketShipmentId))}`);
    endpoints.push(`/v1/external/shipments/show/${encodeURIComponent(String(shiprocketShipmentId))}`);
  }
  if (shiprocketOrderId) {
    endpoints.push(`/v1/external/orders/show/${encodeURIComponent(String(shiprocketOrderId))}`);
  }

  if (!endpoints.length) {
    return { orderId, success: false, error: 'Missing shiprocket order/shipment id to sync' };
  }

  const { endpoint, response } = await tryShiprocketEndpoints(endpoints);
  const extracted = extractAwbCourierStatus(response);

  const nextStatus = shipment.status === 'created' && extracted.awb ? 'awb_assigned' : extracted.status || shipment.status;

  await caseMainPool.execute(
    `UPDATE shipments
     SET shiprocket_awb = COALESCE(shiprocket_awb, ?),
         shiprocket_courier_name = COALESCE(shiprocket_courier_name, ?),
         shiprocket_courier_id = COALESCE(shiprocket_courier_id, ?),
         tracking_url = COALESCE(tracking_url, ?),
         status = COALESCE(?, status),
         response_json = ?
     WHERE order_id = ?`,
    [
      extracted.awb,
      extracted.courierName,
      extracted.courierId,
      extracted.trackingUrl,
      nextStatus,
      JSON.stringify({ syncedFrom: endpoint, response }),
      orderId,
    ]
  );

  const [updated]: any = await caseMainPool.execute('SELECT * FROM shipments WHERE order_id = ? LIMIT 1', [orderId]);
  return {
    orderId,
    success: true,
    shipment: updated?.[0] || null,
    syncedFrom: endpoint,
  };
}

export async function POST(request: NextRequest) {
  try {
    await authorize(request);

    const body = await request.json().catch(() => ({}));
    const orderId = body?.orderId ? Number(body.orderId) : null;
    const limit = Math.max(1, Math.min(50, Number(body?.limit ?? 20)));

    // Single-order mode (admin UI)
    if (orderId) {
      const result = await syncSingleOrderShipment(orderId);
      if (!result.success) {
        const status = result.error === 'Shipment not found' ? 404 : 400;
        return NextResponse.json({ error: result.error }, { status });
      }
      return NextResponse.json({
        success: true,
        shipment: result.shipment,
        syncedFrom: result.syncedFrom,
        note: 'Synced shipment from Shiprocket.',
      });
    }

    // Batch mode (cron): fetch AWB/courier for shipments missing AWB.
    const [candidates]: any = await caseMainPool.execute(
      `SELECT order_id
       FROM shipments
       WHERE provider = 'shiprocket'
         AND (shiprocket_awb IS NULL OR shiprocket_awb = '')
         AND (
           (shiprocket_shipment_id IS NOT NULL AND shiprocket_shipment_id <> '')
           OR (shiprocket_order_id IS NOT NULL AND shiprocket_order_id <> '')
         )
       ORDER BY updated_at ASC
       LIMIT ${limit}`
    );

    const results: any[] = [];
    for (const row of candidates || []) {
      const oid = Number(row.order_id);
      if (!Number.isFinite(oid) || oid <= 0) continue;
      try {
        results.push(await syncSingleOrderShipment(oid));
      } catch (e: any) {
        results.push({ orderId: oid, success: false, error: e?.message || 'Shiprocket sync failed' });
      }
    }

    return NextResponse.json({ success: true, synced: results.length, results });
  } catch (error: any) {
    const message = error?.message || 'Failed to sync shipment';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
