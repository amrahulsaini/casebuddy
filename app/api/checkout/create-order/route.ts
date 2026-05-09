import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';
import { calculateShipping } from '@/lib/shipping';
import crypto from 'crypto';
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

// Razorpay Configuration
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      mobile,
      fullName,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      notes,
      orderItems,
      orderItem,
      subtotal,
      shipping,
      total,
      emailVerified,
      mobileVerified
    } = body;

    // Validation
    if (!emailVerified) {
      return NextResponse.json(
        { error: 'Email must be verified' },
        { status: 400 }
      );
    }

    if (!email || !mobile || !fullName || !addressLine1 || !city || !state || !pincode) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    const normalizedItems = Array.isArray(orderItems) && orderItems.length > 0
      ? orderItems
      : (orderItem ? [orderItem] : []);

    if (!normalizedItems || normalizedItems.length === 0) {
      return NextResponse.json(
        { error: 'Order item(s) are required' },
        { status: 400 }
      );
    }

    if (normalizedItems.some((it: any) => !it || !it.productId)) {
      return NextResponse.json(
        { error: 'Each order item must have a productId' },
        { status: 400 }
      );
    }

    // Sanitize user inputs to prevent XSS
    const sanitizedName = DOMPurify.sanitize(fullName);
    const sanitizedAddress1 = DOMPurify.sanitize(addressLine1);
    const sanitizedAddress2 = addressLine2 ? DOMPurify.sanitize(addressLine2) : null;
    const sanitizedCity = DOMPurify.sanitize(city);
    const sanitizedState = DOMPurify.sanitize(state);
    const sanitizedNotes = notes ? DOMPurify.sanitize(notes) : null;
    
    // Validate email format
    if (!validator.isEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // SERVER-SIDE PRICE VALIDATION: Get actual product prices from database
    const productIds: number[] = Array.from(
      new Set(normalizedItems.map((it: any) => parseInt(it.productId)))
    ).filter((id) => Number.isFinite(id));

    if (productIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid product id(s)' },
        { status: 400 }
      );
    }

    const placeholders = productIds.map(() => '?').join(',');
    const [productRows]: any = await caseMainPool.query(
      `SELECT id, price FROM products WHERE id IN (${placeholders})`,
      productIds
    );

    const priceByProductId = new Map<number, number>();
    for (const row of productRows || []) {
      priceByProductId.set(parseInt(row.id), parseFloat(row.price));
    }

    // Ensure all products exist
    const missing = productIds.filter((id) => !priceByProductId.has(id));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: 'One or more products not found' },
        { status: 404 }
      );
    }

    // Recalculate totals server-side (don't trust frontend)
    const normalizedWithValidatedPrice = normalizedItems.map((it: any) => {
      const productId = parseInt(it.productId);
      const qty = Math.max(1, parseInt(it.quantity) || 1);
      const unitPrice = priceByProductId.get(productId) || 0;
      return {
        ...it,
        productId,
        quantity: qty,
        validatedUnitPrice: unitPrice,
        lineSubtotal: unitPrice * qty,
      };
    });

    const calculatedSubtotal = normalizedWithValidatedPrice.reduce(
      (sum: number, it: any) => sum + it.lineSubtotal,
      0
    );
    const calculatedShipping = calculateShipping(calculatedSubtotal);
    const calculatedTotal = calculatedSubtotal + calculatedShipping;

    // Verify frontend calculation matches (allow 1 rupee tolerance for rounding)
    if (Math.abs(calculatedTotal - total) > 1) {
      console.error('Price mismatch:', {
        frontend: { subtotal, shipping, total },
        backend: { 
          subtotal: calculatedSubtotal, 
          shipping: calculatedShipping, 
          total: calculatedTotal 
        }
      });
      return NextResponse.json(
        { error: 'Price validation failed. Please refresh and try again.' },
        { status: 400 }
      );
    }

    const primaryItem = normalizedWithValidatedPrice[0];
    const totalQuantity = normalizedWithValidatedPrice.reduce((sum: number, it: any) => sum + it.quantity, 0);
    const effectiveUnitPrice = totalQuantity > 0 ? calculatedSubtotal / totalQuantity : primaryItem.validatedUnitPrice;
    const storedProductName = normalizedWithValidatedPrice.length > 1
      ? `Multiple Items (${normalizedWithValidatedPrice.length})`
      : (primaryItem.productName || 'Custom Phone Case');

    // Use a unique temporary order number to satisfy UNIQUE/NOT NULL constraints
    // until we can derive the final CB+5-digit order number from insertId.
    const orderNumberTemp = `TEMP_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
    
    const [result]: any = await caseMainPool.query(
      `INSERT INTO orders (
        order_number,
        customer_email,
        customer_mobile,
        customer_name,
        shipping_address_line1,
        shipping_address_line2,
        shipping_city,
        shipping_state,
        shipping_pincode,
        product_id,
        product_name,
        phone_model,
        design_name,
        quantity,
        unit_price,
        subtotal,
        shipping_cost,
        total_amount,
        notes,
        customization_data,
        order_status,
        payment_status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        orderNumberTemp,
        email,
        mobile,
        sanitizedName,
        sanitizedAddress1,
        sanitizedAddress2,
        sanitizedCity,
        sanitizedState,
        pincode,
        primaryItem.productId,
        storedProductName,
        primaryItem.phoneModel,
        primaryItem.designName || null,
        totalQuantity,
        effectiveUnitPrice, // informational when multiple items
        calculatedSubtotal, // Use server-calculated subtotal
        calculatedShipping, // Use server-calculated shipping
        calculatedTotal, // Use server-calculated total
        sanitizedNotes,
        normalizedWithValidatedPrice.length > 1
          ? JSON.stringify({ items: normalizedWithValidatedPrice.map(({ validatedUnitPrice, lineSubtotal, ...it }: any) => it) })
          : (primaryItem.customizationOptions ? JSON.stringify(primaryItem.customizationOptions) : null),
        'pending', // order_status
        'pending'  // payment_status
      ]
    );

    const orderId = result.insertId;

    // Generate readable order number: CB + 5 digits (from DB id)
    const orderNumber = `CB${String(orderId).padStart(5, '0')}`;
    await caseMainPool.query('UPDATE orders SET order_number = ? WHERE id = ?', [orderNumber, orderId]);

    // Create Razorpay order
    let razorpayOrderId: string | null = null;
    let amountInPaise: number | null = null;

    try {
      const razorpayPayload = {
        amount: Math.round(calculatedTotal * 100), // Razorpay requires paise (integer)
        currency: 'INR',
        receipt: orderNumber,
        notes: {
          internal_order_id: String(orderId),
          customer_email: email,
          customer_name: sanitizedName
        }
      };

      console.log('Creating Razorpay order:', razorpayPayload);

      const credentials = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        body: JSON.stringify(razorpayPayload)
      });

      const responseData = await response.json();

      console.log('Razorpay API Response:', {
        status: response.status,
        data: responseData
      });

      if (response.ok) {
        razorpayOrderId = responseData.id;
        amountInPaise = responseData.amount;

        // Store Razorpay order ID as payment_id
        await caseMainPool.query(
          'UPDATE orders SET payment_id = ?, payment_method = ? WHERE id = ?',
          [razorpayOrderId, 'Razorpay', orderId]
        );

        console.log(`Order ${orderId} updated with Razorpay order ID: ${razorpayOrderId}`);
      } else {
        console.error('Razorpay API Error:', {
          status: response.status,
          error: responseData
        });
      }
    } catch (paymentError) {
      console.error('Error creating Razorpay order:', paymentError);
    }

    if (!razorpayOrderId) {
      try {
        await caseMainPool.query('DELETE FROM orders WHERE id = ? AND payment_status = ?', [orderId, 'pending']);
      } catch (cleanupError) {
        console.error('Failed to cleanup pending order after Razorpay order creation failure:', cleanupError);
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Unable to initiate payment. Please check Razorpay configuration and try again.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
      razorpayOrderId,
      amount: amountInPaise,
      message: 'Order created successfully. Complete payment to confirm.'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
