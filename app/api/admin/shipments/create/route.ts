import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';
import { requireRole } from '@/lib/auth';
import { getShipDefaults, shiprocketRequest } from '@/lib/shiprocket';

type OrderRow = {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_mobile: string;
  product_name: string;
  phone_model: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  shipping_cost: number;
  payment_status: string;
  customization_data: string | null;
  shipping_address_line1: string;
  shipping_address_line2: string | null;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  created_at: string;
};

function safeJsonParse(value: string | null) {
  if (!value) return null;
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

function normalizeMobile(mobile: string) {
  const digits = String(mobile || '').replace(/\D/g, '');
  // Keep last 10 digits if country code included
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'manager']);

    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    // Prevent duplicates
    const [existing]: any = await caseMainPool.execute(
      'SELECT id, shiprocket_shipment_id, shiprocket_awb FROM shipments WHERE order_id = ? LIMIT 1',
      [orderId]
    );
    const existingShipment = existing?.[0] || null;
    const canRetryExisting =
      existingShipment &&
      !existingShipment.shiprocket_shipment_id &&
      !existingShipment.shiprocket_awb;

    if (existingShipment && !canRetryExisting) {
      return NextResponse.json(
        { error: 'Shipment already exists for this order', shipment: existingShipment },
        { status: 409 }
      );
    }

    const [orderRows]: any = await caseMainPool.execute('SELECT * FROM orders WHERE id = ? LIMIT 1', [orderId]);
    const order: OrderRow | undefined = orderRows?.[0];
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const defaults = getShipDefaults();

    const customData = safeJsonParse(order.customization_data);
    const itemsFromJson: any[] | null = Array.isArray(customData?.items) ? customData.items : null;

    const skuCounts = new Map<string, number>();
    const makeUniqueSku = (baseSku: string, index: number) => {
      const cleaned = String(baseSku || '').trim() || `CASE-${order.id}-${index + 1}`;
      const n = (skuCounts.get(cleaned) || 0) + 1;
      skuCounts.set(cleaned, n);
      return n === 1 ? cleaned : `${cleaned}-${n}`;
    };

    const orderItems = (itemsFromJson?.length
      ? itemsFromJson
      : [
          {
            productId: null,
            productName: order.product_name,
            phoneModel: order.phone_model,
            quantity: order.quantity,
            unitPrice: order.unit_price,
          },
        ]
    ).map((it: any, index: number) => {
      const qty = Number(it.quantity || 1);
      const unitPrice = Number(it.unitPrice ?? it.price ?? order.unit_price);
      const name = String(it.productName || order.product_name || 'Product');
      const model = String(it.phoneModel || order.phone_model || '');
      const baseSku = String(it.sku || (it.productId ? `CASE-${it.productId}` : `CASE-${order.id}-${index + 1}`));
      const sku = makeUniqueSku(baseSku, index);

      return {
        name: model ? `${name} (${model})` : name,
        sku,
        units: qty,
        selling_price: unitPrice,
        discount: 0,
        tax: 0,
        hsn: it.hsn || '',
      };
    });

    const paymentMethod = String(order.payment_status || '').toLowerCase() === 'completed' ? 'Prepaid' : 'Prepaid';

    const payload: any = {
      order_id: String(order.order_number || order.id),
      order_date: new Date(order.created_at || Date.now()).toISOString().slice(0, 19).replace('T', ' '),
      pickup_location: defaults.pickup_location,

      billing_customer_name: order.customer_name,
      billing_last_name: '',
      billing_address: order.shipping_address_line1,
      billing_address_2: order.shipping_address_line2 || '',
      billing_city: order.shipping_city,
      billing_pincode: order.shipping_pincode,
      billing_state: order.shipping_state,
      billing_country: 'India',
      billing_email: order.customer_email,
      billing_phone: normalizeMobile(order.customer_mobile),

      shipping_is_billing: true,

      order_items: orderItems,

      payment_method: paymentMethod,
      shipping_charges: Number(order.shipping_cost || 0),
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: Number(order.total_amount || 0) - Number(order.shipping_cost || 0),

      length: defaults.length,
      breadth: defaults.breadth,
      height: defaults.height,
      weight: defaults.weight,
    };

    // Shiprocket: create adhoc order
    // Note: endpoint can vary by Shiprocket account/version; adjust SHIPROCKET_BASE_URL if needed.
    const response = await shiprocketRequest<any>('/v1/external/orders/create/adhoc', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const { shiprocketOrderId, shiprocketShipmentId } = extractShiprocketIds(response);

    // Shiprocket sometimes returns 200 OK with an error message and no IDs.
    // Treat that as a failure so admin can retry after fixing config.
    if (!shiprocketOrderId && !shiprocketShipmentId) {
      const message =
        typeof response?.message === 'string' && response.message.trim()
          ? response.message
          : 'Shiprocket did not return order/shipment ids';

      const pickupList =
        response?.data?.data?.data && Array.isArray(response.data.data.data)
          ? response.data.data.data
          : response?.data?.data && Array.isArray(response.data.data)
            ? response.data.data
            : null;

      const pickupLocations = Array.isArray(pickupList)
        ? pickupList
            .map((x: any) => x?.pickup_location)
            .filter((x: any) => typeof x === 'string' && x.trim())
        : [];

      if (canRetryExisting) {
        await caseMainPool.execute(
          `UPDATE shipments
           SET status = 'error',
               pickup_location = ?,
               payload_json = ?,
               response_json = ?
           WHERE id = ?`,
          [defaults.pickup_location, JSON.stringify(payload), JSON.stringify(response), existingShipment.id]
        );
      }

      return NextResponse.json(
        {
          error: message,
          hint:
            pickupLocations.length > 0
              ? `Set SHIPROCKET_PICKUP_LOCATION to one of: ${pickupLocations.join(', ')}`
              : 'Check SHIPROCKET_PICKUP_LOCATION (must exactly match a Shiprocket pickup_location).',
          pickupLocations,
          attemptedPickupLocation: defaults.pickup_location,
        },
        { status: 400 }
      );
    }

    if (canRetryExisting) {
      await caseMainPool.execute(
        `UPDATE shipments
         SET shiprocket_order_id = ?,
             shiprocket_shipment_id = ?,
             status = 'created',
             pickup_location = ?,
             payload_json = ?,
             response_json = ?
         WHERE id = ?`,
        [
          shiprocketOrderId,
          shiprocketShipmentId,
          defaults.pickup_location,
          JSON.stringify(payload),
          JSON.stringify(response),
          existingShipment.id,
        ]
      );
    } else {
      await caseMainPool.execute(
        `INSERT INTO shipments (
          order_id,
          provider,
          shiprocket_order_id,
          shiprocket_shipment_id,
          status,
          pickup_location,
          payload_json,
          response_json
        ) VALUES (?, 'shiprocket', ?, ?, ?, ?, ?, ?)`,
        [
          order.id,
          shiprocketOrderId,
          shiprocketShipmentId,
          'created',
          defaults.pickup_location,
          JSON.stringify(payload),
          JSON.stringify(response),
        ]
      );
    }

    const [rows]: any = await caseMainPool.execute('SELECT * FROM shipments WHERE order_id = ? LIMIT 1', [order.id]);

    // Notify customer/admin immediately when shipment is created
    // Emails disabled (confirmation-only policy)

    return NextResponse.json({ success: true, shipment: rows?.[0] || null, shiprocket: response });
  } catch (error: any) {
    const message = error?.message || 'Failed to create shipment';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
