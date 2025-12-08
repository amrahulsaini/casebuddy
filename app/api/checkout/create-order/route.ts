import { NextRequest, NextResponse } from 'next/server';
import caseMainPool from '@/lib/db-main';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Email transporter configuration from environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'localhost',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Cashfree Configuration
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_ENV = process.env.CASHFREE_ENV || 'TEST';
const CASHFREE_API_URL = CASHFREE_ENV === 'PROD' 
  ? 'https://api.cashfree.com' 
  : 'https://sandbox.cashfree.com';

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

    if (!orderItem) {
      return NextResponse.json(
        { error: 'Order item is required' },
        { status: 400 }
      );
    }

    // Create order in database
    const orderNumber = `CB${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
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
        orderNumber,
        email,
        mobile,
        fullName,
        addressLine1,
        addressLine2 || null,
        city,
        state,
        pincode,
        orderItem.productId,
        orderItem.productName,
        orderItem.phoneModel,
        orderItem.designName || null,
        orderItem.quantity,
        orderItem.price,
        subtotal,
        shipping,
        total,
        notes || null,
        orderItem.customizationOptions ? JSON.stringify(orderItem.customizationOptions) : null,
        'pending', // order_status
        'pending'  // payment_status
      ]
    );

    const orderId = result.insertId;

    // Create Cashfree payment session
    let paymentSessionId = null;
    let paymentUrl = null;

    try {
      const cashfreeOrderId = `order_${orderId}_${Date.now()}`;
      
      const paymentSessionRequest = {
        order_id: cashfreeOrderId,
        order_amount: total,
        order_currency: 'INR',
        customer_details: {
          customer_id: `cust_${orderId}`,
          customer_email: email,
          customer_phone: mobile,
          customer_name: fullName
        },
        order_meta: {
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout/payment-callback?order_id=${orderId}`
        },
        order_note: notes || `Order for ${orderItem.productName}`
      };

      console.log('Creating Cashfree payment session:', {
        url: `${CASHFREE_API_URL}/pg/orders`,
        appId: CASHFREE_APP_ID,
        request: paymentSessionRequest
      });

      const response = await fetch(`${CASHFREE_API_URL}/pg/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-version': '2023-08-01',
          'x-client-id': CASHFREE_APP_ID!,
          'x-client-secret': CASHFREE_SECRET_KEY!
        },
        body: JSON.stringify(paymentSessionRequest)
      });

      const responseData = await response.json();
      
      console.log('Cashfree API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });
      
      if (response.ok) {
        paymentSessionId = responseData.payment_session_id;
        
        // Use the payment_link from response if available, otherwise construct URL
        if (responseData.payment_link) {
          paymentUrl = responseData.payment_link;
        } else {
          // Construct payment URL using session ID
          // For both production and sandbox, use the checkout URL format
          const paymentBaseUrl = CASHFREE_ENV === 'PROD' 
            ? 'https://payments.cashfree.com/forms' 
            : 'https://payments-test.cashfree.com/forms';
          
          paymentUrl = `${paymentBaseUrl}/${paymentSessionId}`;
        }

        console.log('Payment session created successfully:', {
          sessionId: paymentSessionId,
          cashfreeOrderId: cashfreeOrderId,
          paymentUrl: paymentUrl,
          environment: CASHFREE_ENV,
          hasPaymentLink: !!responseData.payment_link
        });

        // Update order with Cashfree order ID (CRITICAL: Store order ID, not session ID)
        await caseMainPool.query(
          'UPDATE orders SET payment_id = ?, payment_method = ? WHERE id = ?',
          [cashfreeOrderId, 'Cashfree', orderId]
        );
        
        console.log(`Order ${orderId} updated with Cashfree order ID: ${cashfreeOrderId}`);
      } else {
        console.error('Cashfree API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: responseData
        });
      }
    } catch (paymentError) {
      console.error('Error creating Cashfree payment session:', paymentError);
      // Continue even if payment session creation fails
    }

    // DON'T send emails here - only send after payment is confirmed
    // Emails will be sent by the webhook when payment succeeds

    return NextResponse.json({ 
      success: true, 
      orderId,
      orderNumber,
      paymentUrl,
      paymentSessionId,
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
