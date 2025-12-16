import { NextResponse } from 'next/server';
import pool from '@/lib/db-main';
import { isNumericOnly, shiprocketStatusCodeToLabel } from '@/lib/shiprocket-status';
import { fetchPrimaryImagesByProductId } from '@/lib/order-email-utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const [countResult] = await pool.execute<any[]>(
      'SELECT COUNT(*) as total FROM orders'
    );
    const totalOrders = countResult[0].total;
    const totalPages = Math.ceil(totalOrders / limit);

    // Get paginated orders
    const [rows] = await pool.execute(
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
        o.created_at,
        s.status AS shipment_status,
        s.updated_at AS shipment_updated_at,
        s.shiprocket_awb AS shiprocket_awb
      FROM orders o
      LEFT JOIN shipments s ON s.order_id = o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const normalizedRows = (rows as any[]).map((r) => {
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
    const productIds = normalizedRows
      .map((r) => Number(r?.product_id))
      .filter((v) => Number.isFinite(v));

    const imageByProductId = await fetchPrimaryImagesByProductId({
      pool: pool as any,
      productIds,
      baseUrl,
    });

    const withImages = normalizedRows.map((r) => {
      const pid = Number(r?.product_id);
      const primary_image_url = Number.isFinite(pid) ? imageByProductId.get(pid) || null : null;
      return {
        ...r,
        primary_image_url,
      };
    });

    return NextResponse.json({
      orders: withImages,
      pagination: {
        page,
        limit,
        totalOrders,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
