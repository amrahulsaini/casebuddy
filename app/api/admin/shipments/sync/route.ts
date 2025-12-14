import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';
import { requireRole } from '@/lib/auth';
import { shiprocketRequest } from '@/lib/shiprocket';

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
    status: status != null ? String(status) : null,
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

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'manager', 'staff']);

    const { orderId } = await request.json();
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

    const [rows]: any = await caseMainPool.execute('SELECT * FROM shipments WHERE order_id = ? LIMIT 1', [orderId]);
    const shipment = rows?.[0];
    if (!shipment) return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });

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
      return NextResponse.json({ error: 'Missing shiprocket order/shipment id to sync' }, { status: 400 });
    }

    const { endpoint, response } = await tryShiprocketEndpoints(endpoints);
    const extracted = extractAwbCourierStatus(response);

    const shouldMarkAwb = extracted.awb && !shipment.shiprocket_awb;
    const nextStatus =
      shipment.status === 'created' && extracted.awb ? 'awb_assigned' : extracted.status || shipment.status;

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
    return NextResponse.json({
      success: true,
      shipment: updated?.[0] || null,
      shiprocket: response,
      syncedFrom: endpoint,
      note: shouldMarkAwb ? 'Synced AWB from Shiprocket.' : 'Synced shipment from Shiprocket.',
    });
  } catch (error: any) {
    const message = error?.message || 'Failed to sync shipment';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
