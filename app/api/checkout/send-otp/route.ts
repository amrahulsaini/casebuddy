import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; expires: number }>();

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

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, mobile, type } = body;

    if (!type || (type !== 'email' && type !== 'mobile')) {
      return NextResponse.json(
        { error: 'Invalid request type' },
        { status: 400 }
      );
    }

    const otp = generateOTP();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    if (type === 'email') {
      if (!email) {
        return NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        );
      }

      // Store OTP
      otpStore.set(`email:${email}`, { otp, expires });

      // Send email
      await transporter.sendMail({
        from: '"CaseBuddy" <info@casebuddy.co.in>',
        to: email,
        subject: 'Your OTP for Order Verification - CaseBuddy',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ff6b00 0%, #ff9500 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .otp-box { background: white; border: 2px dashed #ff6b00; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; }
              .otp-code { font-size: 32px; font-weight: bold; color: #ff6b00; letter-spacing: 8px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Email Verification</h1>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p>Thank you for shopping with CaseBuddy! To complete your order, please verify your email address using the OTP below:</p>
                
                <div class="otp-box">
                  <div class="otp-code">${otp}</div>
                </div>
                
                <p><strong>This OTP is valid for 10 minutes.</strong></p>
                <p>If you didn't request this OTP, please ignore this email.</p>
                
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

      return NextResponse.json({ success: true, message: 'OTP sent to email' });
    } else {
      // Mobile OTP
      if (!mobile) {
        return NextResponse.json(
          { error: 'Mobile number is required' },
          { status: 400 }
        );
      }

      // Store OTP
      otpStore.set(`mobile:${mobile}`, { otp, expires });

      // TODO: Integrate SMS gateway (Twilio, MSG91, etc.)
      // For now, we'll just log it (in production, send actual SMS)
      console.log(`Mobile OTP for ${mobile}: ${otp}`);

      // In development, send OTP via email as fallback
      if (process.env.NODE_ENV === 'development') {
        await transporter.sendMail({
          from: '"CaseBuddy" <info@casebuddy.co.in>',
          to: 'info@casebuddy.co.in',
          subject: `Mobile OTP for ${mobile}`,
          text: `OTP for mobile ${mobile}: ${otp}`
        });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'OTP sent to mobile',
        // In development, return OTP for testing
        ...(process.env.NODE_ENV === 'development' && { otp })
      });
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
