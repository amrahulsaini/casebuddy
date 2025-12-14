import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';
import { requireRole } from '@/lib/auth';

function safeJsonParse(value: any) {
  if (value == null) return null;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

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

function extractShiprocketIds(response: any) {
  const dataNode = response?.data;
  const data0 = Array.isArray(dataNode) ? dataNode[0] : dataNode;

  const shiprocketOrderId = firstNonEmpty(
    response?.order_id,
    response?.orderId,
    getByPath(response, 'data.order_id'),
    getByPath(response, 'data.orderId'),
    data0?.order_id,
    data0?.orderId,
    getByPath(response, 'data.data.order_id'),
    getByPath(response, 'data.data.orderId')
  );

  const shiprocketShipmentId = firstNonEmpty(
    response?.shipment_id,
    response?.shipmentId,
    getByPath(response, 'data.shipment_id'),
    getByPath(response, 'data.shipmentId'),
    data0?.shipment_id,
    data0?.shipmentId,
    getByPath(response, 'shipment.shipment_id'),
    getByPath(response, 'shipment.id'),
    getByPath(response, 'shipment_details.shipment_id'),
    getByPath(response, 'shipment_details.id'),
    getByPath(response, 'data.shipment.shipment_id'),
    getByPath(response, 'data.shipment.id'),
    getByPath(response, 'data.data.shipment_id'),
    getByPath(response, 'data.data.shipmentId')
  );

  return {
    shiprocketOrderId: shiprocketOrderId != null ? String(shiprocketOrderId) : null,
    shiprocketShipmentId: shiprocketShipmentId != null ? String(shiprocketShipmentId) : null,
  };
}

function extractAwbAndCourier(response: any) {
  const dataNode = response?.data;
  const data0 = Array.isArray(dataNode) ? dataNode[0] : dataNode;

  const awb = firstNonEmpty(
    response?.awb_code,
    response?.awb,
    response?.awbCode,
    getByPath(response, 'data.awb_code'),
    getByPath(response, 'data.awb'),
    getByPath(response, 'data.awbCode'),
    data0?.awb_code,
    data0?.awb,
    data0?.awbCode,
    getByPath(response, 'data.data.awb_code'),
    getByPath(response, 'data.data.awb'),
    getByPath(response, 'data.data.awbCode')
  );

  const courierName = firstNonEmpty(
    response?.courier_name,
    response?.courierName,
    response?.courier_company_name,
    response?.courierCompanyName,
    getByPath(response, 'data.courier_name'),
    getByPath(response, 'data.courierName'),
    getByPath(response, 'data.courier_company_name'),
    getByPath(response, 'data.courierCompanyName'),
    data0?.courier_name,
    data0?.courierName,
    data0?.courier_company_name,
    data0?.courierCompanyName,
    getByPath(response, 'data.data.courier_name'),
    getByPath(response, 'data.data.courier_company_name')
  );

  const courierId = firstNonEmpty(
    response?.courier_company_id,
    response?.courierCompanyId,
    response?.courier_id,
    response?.courierId,
    getByPath(response, 'data.courier_company_id'),
    getByPath(response, 'data.courierCompanyId'),
    getByPath(response, 'data.courier_id'),
    getByPath(response, 'data.courierId'),
    data0?.courier_company_id,
    data0?.courierCompanyId,
    data0?.courier_id,
    data0?.courierId,
    getByPath(response, 'data.data.courier_company_id'),
    getByPath(response, 'data.data.courier_id')
  );

  return {
    shiprocket_awb: awb != null ? String(awb) : null,
    shiprocket_courier_name: courierName != null ? String(courierName) : null,
    shiprocket_courier_id: courierId != null ? String(courierId) : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'manager', 'staff']);

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const [rows]: any = await caseMainPool.execute(
      'SELECT * FROM shipments WHERE order_id = ? LIMIT 1',
      [orderId]
    );

    const shipment = rows?.[0] || null;
    if (shipment && (!shipment.shiprocket_shipment_id || !shipment.shiprocket_order_id) && shipment.response_json) {
      const parsed = safeJsonParse(shipment.response_json);
      const { shiprocketOrderId, shiprocketShipmentId } = extractShiprocketIds(parsed);

      const message = typeof parsed?.message === 'string' ? parsed.message : '';
      const looksLikePickupError = message.toLowerCase().includes('pickup location');

      if (shiprocketOrderId || shiprocketShipmentId) {
        await caseMainPool.execute(
          `UPDATE shipments
           SET shiprocket_order_id = COALESCE(shiprocket_order_id, ?),
               shiprocket_shipment_id = COALESCE(shiprocket_shipment_id, ?)
           WHERE id = ?`,
          [shiprocketOrderId, shiprocketShipmentId, shipment.id]
        );

        shipment.shiprocket_order_id = shipment.shiprocket_order_id || shiprocketOrderId;
        shipment.shiprocket_shipment_id = shipment.shiprocket_shipment_id || shiprocketShipmentId;
      } else if (looksLikePickupError && shipment.status !== 'error') {
        await caseMainPool.execute('UPDATE shipments SET status = ? WHERE id = ?', ['error', shipment.id]);
        shipment.status = 'error';
      }
    }

    // Repair missing AWB/courier fields if response_json contains them.
    if (shipment && shipment.response_json && (!shipment.shiprocket_awb || !shipment.shiprocket_courier_name)) {
      const parsed = safeJsonParse(shipment.response_json);
      const extracted = extractAwbAndCourier(parsed);

      const shouldUpdate =
        (extracted.shiprocket_awb && !shipment.shiprocket_awb) ||
        (extracted.shiprocket_courier_name && !shipment.shiprocket_courier_name) ||
        (extracted.shiprocket_courier_id && !shipment.shiprocket_courier_id);

      if (shouldUpdate) {
        await caseMainPool.execute(
          `UPDATE shipments
           SET shiprocket_awb = COALESCE(shiprocket_awb, ?),
               shiprocket_courier_name = COALESCE(shiprocket_courier_name, ?),
               shiprocket_courier_id = COALESCE(shiprocket_courier_id, ?)
           WHERE id = ?`,
          [
            extracted.shiprocket_awb,
            extracted.shiprocket_courier_name,
            extracted.shiprocket_courier_id,
            shipment.id,
          ]
        );

        shipment.shiprocket_awb = shipment.shiprocket_awb || extracted.shiprocket_awb;
        shipment.shiprocket_courier_name = shipment.shiprocket_courier_name || extracted.shiprocket_courier_name;
        shipment.shiprocket_courier_id = shipment.shiprocket_courier_id || extracted.shiprocket_courier_id;
      }
    }

    return NextResponse.json(shipment);
  } catch (error: any) {
    const message = error?.message || 'Failed to fetch shipment';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
