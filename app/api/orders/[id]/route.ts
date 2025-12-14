import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';
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
      `SELECT * FROM orders WHERE id = ?`,
      [orderId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = rows[0];

    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://casebuddy.co.in').replace(/\/+$/, '');
    const items = parseItemsFromCustomizationJson({
      customizationData: order.customization_data ?? null,
      fallback: {
        productId: null,
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
