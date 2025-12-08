# Checkout System Documentation

## Overview
Complete checkout system with email/mobile verification, address collection, and order management.

## Features

### 1. Contact Verification
- **Email OTP Verification**: 6-digit OTP sent via email
- **Mobile OTP Verification**: 6-digit OTP (SMS in production, logged in development)
- Real-time validation and verification status

### 2. Address Collection
- Full shipping address form
- Indian states dropdown
- Pincode validation (6 digits)
- Optional delivery notes

### 3. Order Summary
- Product details display
- Real-time price calculation
- Shipping cost logic:
  - FREE shipping on orders ≥ ₹499
  - ₹80 shipping on orders < ₹499
- Total amount calculation

### 4. Order Creation
- Order number generation (format: CB{timestamp}{random})
- Database storage with full order details
- Email confirmation to customer
- Order status tracking

## Email Configuration

Add these to your `.env.local` file:

```env
# Email Configuration (for OTP and Order Confirmations)
EMAIL_HOST=mail.casebuddy.co.in
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=info@casebuddy.co.in
EMAIL_PASSWORD=info@123
```

## Database Schema

Run the migration to create the orders table:

```bash
mysql -u root -p case_main < database/add-orders-table.sql
```

### Orders Table Structure

```sql
- id: Auto-increment primary key
- order_number: Unique order identifier
- customer_email: Verified email address
- customer_mobile: Verified mobile number
- customer_name: Full name
- shipping_address_line1: Primary address
- shipping_address_line2: Secondary address (optional)
- shipping_city: City name
- shipping_state: Indian state
- shipping_pincode: 6-digit pincode
- product_id: Product reference
- product_name: Product name
- phone_model: Selected phone model
- design_name: Selected design (optional)
- quantity: Order quantity
- unit_price: Product price
- subtotal: Quantity × Price
- shipping_cost: Calculated shipping fee
- total_amount: Subtotal + Shipping
- notes: Customer notes (optional)
- order_status: pending/processing/shipped/delivered/cancelled
- payment_status: pending/completed/failed/refunded
- payment_id: Payment gateway transaction ID
- payment_method: Payment method used
- tracking_number: Courier tracking number
- tracking_url: Tracking URL
- created_at: Order creation timestamp
- updated_at: Last update timestamp
- shipped_at: Shipping timestamp
- delivered_at: Delivery timestamp
```

## User Flow

### 1. Product Selection
User clicks "Buy Now" on product page with selected:
- Phone brand and model (required)
- Custom text (optional)
- Font style (if custom text entered)
- Placement (if custom text entered)
- Additional notes (optional)

### 2. Checkout Page
User is redirected to `/checkout` with URL parameters containing:
- `productId`: Product ID
- `productName`: Product name
- `phoneModel`: Selected phone model
- `price`: Product price
- `image`: Product image URL
- `customText`: Custom text (if any)
- `font`: Selected font (if custom text)
- `placement`: Text placement (if custom text)
- `notes`: Additional notes (if any)

### 3. Contact Verification

**Email Verification:**
1. User enters email address
2. Clicks "Send OTP"
3. Receives 6-digit OTP via email
4. Enters OTP
5. Clicks "Verify"
6. Email marked as verified ✓

**Mobile Verification:**
1. User enters mobile number (10 digits, starts with 6-9)
2. Clicks "Send OTP"
3. Receives 6-digit OTP via SMS (in development, OTP is logged)
4. Enters OTP
5. Clicks "Verify"
6. Mobile marked as verified ✓

### 4. Address Entry
User fills in:
- Full Name (required, min 3 characters)
- Address Line 1 (required, min 10 characters)
- Address Line 2 (optional)
- City (required)
- State (required, dropdown)
- Pincode (required, 6 digits)

### 5. Order Notes
User can optionally add delivery instructions or special requests

### 6. Order Review
Right sidebar shows:
- Product image and details
- Selected customization
- Subtotal
- Shipping cost (FREE if ≥ ₹499, else ₹80)
- Total amount

### 7. Checkout
User clicks "Proceed to Payment":
- Form validation runs
- Checks email and mobile verification
- Creates order in database
- Sends confirmation email
- Redirects to payment gateway (TODO: Cashfree integration)

## API Endpoints

### POST `/api/checkout/send-otp`
Send OTP for verification

**Request Body:**
```json
{
  "email": "user@example.com",  // For email OTP
  "mobile": "9876543210",       // For mobile OTP
  "type": "email" | "mobile"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to email",
  "otp": "123456"  // Only in development mode
}
```

**OTP Storage:**
- Stored in memory (Map) with 10-minute expiry
- In production, use Redis or database
- Format: `email:{email}` or `mobile:{mobile}`

### POST `/api/checkout/verify-otp`
Verify entered OTP

**Request Body:**
```json
{
  "email": "user@example.com",  // For email verification
  "mobile": "9876543210",       // For mobile verification
  "otp": "123456",
  "type": "email" | "mobile"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification successful"
}
```

**Errors:**
- `OTP not found or expired`: OTP was never sent or has expired
- `OTP has expired`: OTP > 10 minutes old
- `Invalid OTP`: OTP doesn't match

### POST `/api/checkout/create-order`
Create order in database

**Request Body:**
```json
{
  "email": "user@example.com",
  "mobile": "9876543210",
  "fullName": "John Doe",
  "addressLine1": "123 Main Street",
  "addressLine2": "Near Park",
  "city": "Jaipur",
  "state": "Rajasthan",
  "pincode": "302001",
  "notes": "Please call before delivery",
  "orderItem": {
    "productId": 1,
    "productName": "Custom Phone Case",
    "phoneModel": "iPhone 14 Pro",
    "designName": "Floral Design",
    "price": 599,
    "quantity": 1,
    "image": "/products/case.jpg"
  },
  "subtotal": 599,
  "shipping": 0,
  "total": 599,
  "emailVerified": true,
  "mobileVerified": true
}
```

**Response:**
```json
{
  "success": true,
  "orderId": 123,
  "orderNumber": "CB17025438901234",
  "message": "Order created successfully"
}
```

**Order Confirmation Email:**
Automatically sent to customer with:
- Order number
- Product details
- Shipping address
- Price breakdown
- Contact information

## Email Templates

### OTP Email
- Subject: "Your OTP for Order Verification - CaseBuddy"
- Contains: 6-digit OTP in styled box
- Validity: 10 minutes
- Brand colors: Orange gradient (#ff6b00 to #ff9500)

### Order Confirmation Email
- Subject: "Order Confirmation - {ORDER_NUMBER}"
- Contains:
  - Order number
  - Product details with image placeholder
  - Quantity and price
  - Subtotal, shipping, and total
  - Shipping address
  - Contact information
  - Company details footer

## Form Validation

### Email
- Required field
- Must match email regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Must be verified with OTP

### Mobile
- Required field
- Must be 10 digits
- Must start with 6, 7, 8, or 9
- Must be verified with OTP

### Full Name
- Required field
- Minimum 3 characters

### Address Line 1
- Required field
- Minimum 10 characters

### City
- Required field

### State
- Required field
- Must be from Indian states dropdown

### Pincode
- Required field
- Must be exactly 6 digits

## OTP System

### Generation
- 6-digit random number (100000 to 999999)
- New OTP generated on each request
- Previous OTP invalidated

### Storage
- In-memory Map (development/small scale)
- Redis recommended for production
- Key format: `{type}:{identifier}`
- Value: `{ otp: string, expires: timestamp }`

### Expiry
- 10 minutes from generation
- Checked on verification
- Automatically cleaned up after verification

### Security
- OTP only returned in development mode
- Production uses actual email/SMS sending
- Rate limiting recommended (not implemented)
- IP-based throttling recommended (not implemented)

## Testing

### Development Mode
1. Email OTPs are sent to configured email
2. Mobile OTPs are logged to console
3. Mobile OTPs also sent to `info@casebuddy.co.in` as backup
4. OTP included in API response for easy testing

### Test Flow
```bash
# 1. Start dev server
npm run dev

# 2. Go to any product page
http://localhost:3000/shop/phone-cases/custom-case

# 3. Select phone model and click "Buy Now"

# 4. On checkout page:
#    - Enter email and click "Send OTP"
#    - Check email or console for OTP
#    - Enter OTP and verify
#    - Enter mobile and click "Send OTP"
#    - Check console for mobile OTP
#    - Enter OTP and verify

# 5. Fill address details

# 6. Click "Proceed to Payment"

# 7. Check database for order:
mysql -u root -p case_main -e "SELECT * FROM orders ORDER BY id DESC LIMIT 1;"

# 8. Check email for confirmation
```

## Next Steps (TODO)

### 1. Payment Gateway Integration
- Integrate Cashfree payment gateway
- Add payment initiation after order creation
- Handle payment callbacks
- Update order payment status
- Redirect to success/failure pages

### 2. SMS Gateway Integration
- Integrate MSG91, Twilio, or similar
- Send mobile OTPs via SMS
- Send order status SMS notifications

### 3. Order Management
- Admin panel for order management
- Order status updates
- Tracking number updates
- Email notifications on status changes

### 4. Security Enhancements
- Rate limiting on OTP requests
- IP-based throttling
- CAPTCHA for bot protection
- Redis for OTP storage

### 5. User Experience
- Progress indicator
- Estimated delivery date
- Order tracking page
- Email preferences

## Styling

The checkout page uses:
- Dark theme with orange accents
- Glassmorphism effects
- Responsive grid layout
- Mobile-optimized forms
- Sticky order summary on desktop
- Smooth transitions and animations
- Loading states
- Error messages
- Success indicators

### Breakpoints
- Desktop: 1024px+
- Tablet: 768px - 1023px
- Mobile: < 768px

### Color Scheme
- Background: Dark gradient (#1a1a1a to #2d2d2d)
- Primary: Orange (#ff6b00 to #ff9500)
- Success: Green (#4ade80)
- Error: Red (#ff4444)
- Text: White with varying opacity

## Error Handling

### Client-Side
- Real-time form validation
- Visual error messages
- Disabled states for invalid forms
- Clear error recovery instructions

### Server-Side
- Try-catch on all API routes
- Detailed error logging
- User-friendly error messages
- Database connection handling
- Email sending error handling

### Common Errors
1. **"Email and mobile must be verified"**: Click verify buttons
2. **"All required fields must be filled"**: Check form for red errors
3. **"OTP not found or expired"**: Request new OTP
4. **"Invalid OTP"**: Check OTP and try again
5. **"Failed to send OTP"**: Check email configuration
6. **"Failed to create order"**: Check database connection

## Production Deployment

### Environment Variables
```env
EMAIL_HOST=mail.casebuddy.co.in
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=info@casebuddy.co.in
EMAIL_PASSWORD=info@123
NODE_ENV=production
```

### Database
- Ensure orders table exists
- Set up indexes for performance
- Configure backups
- Monitor disk space

### Email
- Verify SMTP credentials
- Check firewall allows port 587
- Test email delivery
- Set up SPF/DKIM records

### Monitoring
- Log all orders
- Monitor failed emails
- Track OTP verification rates
- Alert on errors
