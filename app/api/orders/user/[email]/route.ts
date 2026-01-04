import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db-main';
import { isNumericOnly, shiprocketStatusCodeToLabel } from '@/lib/shiprocket-status';
import {
  fetchPrimaryImagesByProductId,
  parseItemsFromCustomizationJson,
} from '@/lib/order-email-utils';

type OrderRow = {
  id: number;
  order_number: string;
  customer_email: string;
  customer_mobile: string;
  customer_name: string;
  product_id: number;
  product_name: string;
  phone_model: string;
  quantity: number;
  total_amount: number;
  order_status: string | null;
  payment_status: string;
  customization_data: string | null;
  notes: string | null;
  created_at: string;
  shipment_status?: string | null;
  shipment_updated_at?: string | null;
  shiprocket_awb?: string | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email: encodedEmail } = await params;
    const email = decodeURIComponent(encodedEmail).trim().toLowerCase();

    const [rows]: any = await pool.execute(
      `SELECT 
        o.id,
        o.order_number,
        o.customer_email,
        o.customer_mobile,
        o.customer_name,
        o.product_id,
        o.product_name,
        o.phone_model,
        o.quantity,
        o.total_amount,
        o.order_status,
        o.payment_status,
        o.customization_data,
        o.notes,
        o.created_at,
        s.status AS shipment_status,
        s.updated_at AS shipment_updated_at,
        s.shiprocket_awb AS shiprocket_awb
      FROM orders o
      LEFT JOIN shipments s ON s.order_id = o.id
      WHERE LOWER(o.customer_email) = ? 
      ORDER BY o.created_at DESC`,
      [email]
    );

    const orders: OrderRow[] = (rows || []).map((r: any) => {
      const rawStatus = r?.shipment_status != null ? String(r.shipment_status).trim() : '';
      let shipment_status = rawStatus || null;
      if (shipment_status && isNumericOnly(shipment_status)) {
        shipment_status = shiprocketStatusCodeToLabel(shipment_status) || `Tracking in progress (code ${shipment_status})`;
      }
      return {
        ...r,
        shipment_status,
      };
    });

    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://casebuddy.co.in').replace(/\/+$/, '');

    const parsedByOrderId = new Map<number, any[]>();
    const allProductIds: number[] = [];

    for (const o of orders) {
      const items = parseItemsFromCustomizationJson({
        customizationData: o.customization_data,
        fallback: {
          productId: o.product_id != null ? Number(o.product_id) : null,
          productName: o.product_name,
          phoneModel: o.phone_model,
          designName: null,
          quantity: Number(o.quantity) || 1,
        },
      });
      parsedByOrderId.set(o.id, items);
      for (const it of items) {
        if (it.productId != null && Number.isFinite(it.productId)) allProductIds.push(Number(it.productId));
      }
    }

    const imageByProductId = await fetchPrimaryImagesByProductId({
      pool: pool as any,
      productIds: allProductIds,
      baseUrl,
    });

    const enriched = orders.map((o) => {
      const items = (parsedByOrderId.get(o.id) || []).map((it) => ({
        ...it,
        imageUrl: it.productId != null ? imageByProductId.get(Number(it.productId)) || null : null,
      }));

      const firstWithImage = items.find((it) => it.imageUrl) || null;
      return {
        ...o,
        items,
        primary_image_url: firstWithImage?.imageUrl || null,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
