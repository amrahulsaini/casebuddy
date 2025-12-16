import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db-main';
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
        id,
        order_number,
        customer_email,
        customer_mobile,
        customer_name,
        product_id,
        product_name,
        phone_model,
        quantity,
        total_amount,
        order_status,
        payment_status,
        customization_data,
        notes,
        created_at
      FROM orders 
      WHERE LOWER(customer_email) = ? 
      ORDER BY created_at DESC`,
      [email]
    );

    const orders: OrderRow[] = rows || [];

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
