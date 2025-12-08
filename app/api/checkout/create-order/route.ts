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
        order_status,
        payment_status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
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
        paymentUrl = responseData.payment_link;

        console.log('Payment session created successfully:', {
          sessionId: paymentSessionId,
          paymentUrl: paymentUrl
        });

        // Update order with payment session ID
        await caseMainPool.query(
          'UPDATE orders SET payment_id = ? WHERE id = ?',
          [paymentSessionId, orderId]
        );
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

    // Send order confirmation email to customer
    const customerEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b00 0%, #ff9500 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #ddd; }
          .product-item { display: flex; padding: 15px 0; border-bottom: 1px solid #eee; }
          .summary-row { display: flex; justify-content: space-between; padding: 10px 0; }
          .total-row { font-weight: bold; font-size: 18px; color: #ff6b00; padding-top: 15px; border-top: 2px solid #ddd; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmed!</h1>
            <p>Thank you for your order</p>
          </div>
          <div class="content">
            <p>Hi ${fullName},</p>
            <p>We've received your order and will process it shortly. Here are your order details:</p>
            
            <div class="order-details">
              <h3>Order #${orderNumber}</h3>
              
              <div class="product-item">
                <div>
                  <strong>${orderItem.productName}</strong><br>
                  ${orderItem.phoneModel}${orderItem.designName ? ` • ${orderItem.designName}` : ''}<br>
                  Quantity: ${orderItem.quantity}
                </div>
                <div style="margin-left: auto;">₹${orderItem.price.toFixed(2)}</div>
              </div>
              
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>₹${subtotal.toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>Shipping:</span>
                <span>${shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</span>
              </div>
              <div class="summary-row total-row">
                <span>Total:</span>
                <span>₹${total.toFixed(2)}</span>
              </div>
            </div>
            
            <h3>Shipping Address</h3>
            <p>
              ${fullName}<br>
              ${addressLine1}<br>
              ${addressLine2 ? `${addressLine2}<br>` : ''}
              ${city}, ${state} ${pincode}<br>
              Phone: ${mobile}
            </p>
            
            <p>We'll send you a shipping confirmation email with tracking details once your order ships.</p>
            
            <p>If you have any questions, feel free to contact us at +918107624752 or reply to this email.</p>
            
            <p>Best regards,<br>Team CaseBuddy</p>
          </div>
          <div class="footer">
            <p>CaseBuddy - Premium Phone Cases<br>
            Rajgarh, Rajasthan 331023<br>
            Phone: +918107624752 | Email: info@casebuddy.co.in</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Admin notification email HTML
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: white; padding: 25px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 25px; border-radius: 0 0 10px 10px; }
          .order-details { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border: 1px solid #ddd; }
          .info-row { padding: 8px 0; border-bottom: 1px solid #eee; display: flex; }
          .info-label { font-weight: bold; width: 150px; color: #666; }
          .info-value { flex: 1; }
          .product-section { background: #fff3e0; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #ff6b00; }
          .total-amount { font-size: 24px; font-weight: bold; color: #ff6b00; text-align: center; padding: 15px; background: white; border-radius: 8px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 New Order Received</h1>
            <p>Order #${orderNumber}</p>
          </div>
          <div class="content">
            <h3>Order Information</h3>
            <div class="order-details">
              <div class="info-row">
                <div class="info-label">Order Number:</div>
                <div class="info-value"><strong>${orderNumber}</strong></div>
              </div>
              <div class="info-row">
                <div class="info-label">Order ID:</div>
                <div class="info-value">${orderId}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Payment Status:</div>
                <div class="info-value">Pending</div>
              </div>
              ${paymentSessionId ? `<div class="info-row">
                <div class="info-label">Payment Session:</div>
                <div class="info-value">${paymentSessionId}</div>
              </div>` : ''}
            </div>

            <h3>Customer Details</h3>
            <div class="order-details">
              <div class="info-row">
                <div class="info-label">Name:</div>
                <div class="info-value">${fullName}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Email:</div>
                <div class="info-value">${email}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Mobile:</div>
                <div class="info-value">${mobile}</div>
              </div>
            </div>

            <h3>Shipping Address</h3>
            <div class="order-details">
              <div>${addressLine1}</div>
              ${addressLine2 ? `<div>${addressLine2}</div>` : ''}
              <div>${city}, ${state} ${pincode}</div>
            </div>

            <h3>Product Details</h3>
            <div class="product-section">
              <strong>${orderItem.productName}</strong><br>
              <div style="margin-top: 8px;">
                Phone Model: ${orderItem.phoneModel}<br>
                ${orderItem.designName ? `Design: ${orderItem.designName}<br>` : ''}
                Quantity: ${orderItem.quantity}<br>
                Unit Price: ₹${orderItem.price.toFixed(2)}
              </div>
            </div>

            <h3>Order Summary</h3>
            <div class="order-details">
              <div class="info-row">
                <div class="info-label">Subtotal:</div>
                <div class="info-value">₹${subtotal.toFixed(2)}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Shipping:</div>
                <div class="info-value">${shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</div>
              </div>
            </div>

            <div class="total-amount">
              Total: ₹${total.toFixed(2)}
            </div>

            ${notes ? `
            <h3>Customer Notes</h3>
            <div class="order-details">
              <p style="margin: 0;">${notes}</p>
            </div>
            ` : ''}

            <p style="text-align: center; margin-top: 25px; color: #666; font-size: 14px;">
              This is an automated notification. Please process this order promptly.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send emails (customer + admin)
    try {
      // Send customer confirmation
      await transporter.sendMail({
        from: `"CaseBuddy" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Order Confirmation - ${orderNumber}`,
        html: customerEmailHtml
      });

      // Send admin notification
      await transporter.sendMail({
        from: `"CaseBuddy Orders" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL || 'info@casebuddy.co.in',
        subject: `New Order: ${orderNumber} - ₹${total.toFixed(2)}`,
        html: adminEmailHtml
      });
    } catch (emailError) {
      console.error('Error sending emails:', emailError);
      // Don't fail the order if email fails
    }

    return NextResponse.json({ 
      success: true, 
      orderId,
      orderNumber,
      paymentUrl,
      paymentSessionId,
      message: 'Order created successfully' 
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
