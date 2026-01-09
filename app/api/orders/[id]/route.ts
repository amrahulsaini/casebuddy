import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';
import { isNumericOnly, shiprocketStatusCodeToLabel } from '@/lib/shiprocket-status';
import {
  fetchPrimaryImagesByProductId,
  parseItemsFromCustomizationJson,
} from '@/lib/order-email-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    const [rows]: any = await caseMainPool.execute(
      `SELECT 
        o.*,
        s.status AS shipment_status,
        s.updated_at AS shipment_updated_at,
        s.shiprocket_awb AS shiprocket_awb,
        p.slug AS product_slug,
        (
          SELECT c.slug 
          FROM categories c
          INNER JOIN product_categories pc ON pc.category_id = c.id
          WHERE pc.product_id = o.product_id
          LIMIT 1
        ) AS category_slug
      FROM orders o
      LEFT JOIN shipments s ON s.order_id = o.id
      LEFT JOIN products p ON p.id = o.product_id
      WHERE o.id = ?`,
      [orderId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = rows[0];
    
    // Normalize shipment status
    const rawStatus = order?.shipment_status != null ? String(order.shipment_status).trim() : '';
    let shipment_status = rawStatus || null;
    if (shipment_status && isNumericOnly(shipment_status)) {
      shipment_status = shiprocketStatusCodeToLabel(shipment_status) || `Tracking in progress (code ${shipment_status})`;
    }
    order.shipment_status = shipment_status;

    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://casebuddy.co.in').replace(/\/+$/, '');
    const items = parseItemsFromCustomizationJson({
      customizationData: order.customization_data ?? null,
      fallback: {
        productId: order.product_id != null ? Number(order.product_id) : null,
        productName: order.product_name,
        phoneModel: order.phone_model,
        designName: null,
        quantity: Number(order.quantity) || 1,
      },
    });

    const productIds = items
      .map((it) => it.productId)
      .filter((v: any): v is number => v != null && Number.isFinite(v));

    const imageByProductId = await fetchPrimaryImagesByProductId({
      pool: caseMainPool as any,
      productIds,
      baseUrl,
    });

    const enrichedItems = items.map((it) => ({
      ...it,
      imageUrl: it.productId != null ? imageByProductId.get(Number(it.productId)) || null : null,
    }));

    return NextResponse.json({
      ...order,
      items: enrichedItems,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
