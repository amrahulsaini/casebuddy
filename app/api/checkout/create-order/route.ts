import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-main';
import nodemailer from 'nodemailer';

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: 'mail.casebuddy.co.in',
  port: 587,
  secure: false,
  auth: {
    user: 'info@casebuddy.co.in',
    pass: 'info@123'
  },
  tls: {
    rejectUnauthorized: false
  }
});

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
    if (!emailVerified || !mobileVerified) {
      return NextResponse.json(
        { error: 'Email and mobile must be verified' },
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
    
    const result = await db.query(
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

    // Send order confirmation email
    try {
      await transporter.sendMail({
        from: '"CaseBuddy" <info@casebuddy.co.in>',
        to: email,
        subject: `Order Confirmation - ${orderNumber}`,
        html: `
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
        `
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the order if email fails
    }

    return NextResponse.json({ 
      success: true, 
      orderId,
      orderNumber,
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
