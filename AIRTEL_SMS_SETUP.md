# Airtel SMS Integration Setup Guide

## 📋 Overview
This guide explains how to integrate Airtel SMS service for mobile OTP verification on your checkout page.

## 🔑 Your DLT IDs
- **Header DLT ID**: `1005625612238250845`
- **Template DLT ID**: `1007276267174781068`

---

## 🚀 What You Need to Do in Airtel

### 1. **Account Setup & Access**
- Log in to your Airtel Business Portal/Dashboard
- Navigate to the API section or SMS Gateway section
- Get your API credentials

### 2. **Get API Credentials**
You need to obtain the following from Airtel:
- **API Base URL** (e.g., `https://api.mvaayoo.com/api/v1` or Airtel's specific endpoint)
- **API Key / Auth Token**
- **Sender ID** (e.g., `CASEBD` or `CASEBUDDY`)

### 3. **Verify Your Template**
Your SMS template should already be registered with DLT ID `1007276267174781068`. The template format should be:

```
Your OTP for order verification is {#var#}. Valid for 10 minutes. - CaseBuddy
```

**Important**: 
- Make sure this template is **APPROVED** by Airtel
- The template must match exactly (including spaces, punctuation)
- `{#var#}` is the variable placeholder for the OTP

### 4. **Verify Header DLT ID**
- Ensure Header/Principal Entity DLT ID `1005625612238250845` is linked to your sender ID
- This header should be approved and active

### 5. **Test API Endpoint**
Contact Airtel support or check their documentation to confirm:
- The exact API endpoint URL
- Request format (JSON/Form data)
- Required headers
- Response format

### 6. **IP Whitelisting (if required)**
If Airtel requires IP whitelisting:
- Get your server's IP address
- Request Airtel to whitelist it

---

## 💻 What Has Been Updated in Your Code

### 1. **Environment Variables (.env.local)**
Added Airtel SMS configuration:
```env
# Airtel SMS Configuration
AIRTEL_API_URL=https://api.mvaayoo.com/api/v1
AIRTEL_API_KEY=your_airtel_api_key_here
AIRTEL_SENDER_ID=CASEBD
AIRTEL_HEADER_DLT_ID=1005625612238250845
AIRTEL_TEMPLATE_DLT_ID=1007276267174781068
```

**Action Required**: Replace `your_airtel_api_key_here` with your actual API key from Airtel.

### 2. **Checkout Page (app/checkout/page.tsx)**
Added mobile OTP functionality:
- Mobile OTP input fields
- Send/Resend OTP buttons with timer
- Verify OTP button
- Verification status display
- Mobile verification required before checkout

### 3. **Send OTP API (app/api/checkout/send-otp/route.ts)**
Integrated Airtel SMS API:
- Sends SMS via Airtel API
- Uses your DLT IDs
- Includes fallback for development mode
- Rate limiting (3 OTPs per 10 minutes)

### 4. **Verify OTP API (app/api/checkout/verify-otp/route.ts)**
No changes needed - already handles both email and mobile OTP verification.

---

## 🔧 Configuration Steps

### Step 1: Get Airtel API Credentials
Contact Airtel support or log in to your Airtel Business portal:
```
Email: business.support@airtel.com
Or check: https://www.airtel.in/business/
```

### Step 2: Update .env.local
Once you have the credentials, update your `.env.local` file:
```env
AIRTEL_API_URL=<actual_url_from_airtel>
AIRTEL_API_KEY=<your_actual_api_key>
AIRTEL_SENDER_ID=<your_sender_id>
```

### Step 3: Verify API Format
The current implementation assumes this API format:
```javascript
POST {AIRTEL_API_URL}/sms/send
Headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer {API_KEY}'
}
Body: {
  sender: "CASEBD",
  mobile: "9876543210",
  message: "Your OTP for order verification is 123456. Valid for 10 minutes. - CaseBuddy",
  template_id: "1007276267174781068",
  pe_id: "1005625612238250845"
}
```

**If Airtel uses a different format**, you may need to adjust the API call in `app/api/checkout/send-otp/route.ts`.

### Step 4: Test in Development
1. Start your development server:
   ```bash
   npm run dev
   ```

2. Go to checkout page
3. Enter a mobile number
4. Click "Send OTP"
5. Check console logs for the OTP (development mode)

### Step 5: Production Deployment
Before deploying:
- ✅ Verify Airtel API credentials work
- ✅ Test OTP sending and receiving
- ✅ Update environment variables on production server
- ✅ Ensure template is approved

---

## 📱 How It Works

### User Flow:
1. User enters mobile number on checkout page
2. Clicks "Send OTP"
3. System sends OTP via Airtel SMS
4. User receives SMS with 6-digit OTP
5. User enters OTP on checkout page
6. Clicks "Verify"
7. System verifies OTP
8. Checkout proceeds only if both email and mobile are verified

### Security Features:
- ✅ Rate limiting: Max 3 OTPs per 10 minutes
- ✅ OTP expires after 10 minutes
- ✅ OTP deleted after successful verification
- ✅ Input validation for mobile numbers
- ✅ 6-digit numeric OTP only

---

## 🐛 Troubleshooting

### Issue: "SMS service not configured"
**Solution**: Make sure `AIRTEL_API_URL` and `AIRTEL_API_KEY` are set in `.env.local`

### Issue: SMS not received
**Possible causes**:
- Airtel template not approved
- DLT IDs mismatch
- Mobile number not in correct format
- API credentials incorrect
- IP not whitelisted (if required)

**Solution**: Check Airtel portal logs and contact support

### Issue: "Failed to send SMS"
**Solution**: 
- Check API endpoint URL
- Verify API key
- Check Airtel dashboard for error logs
- Review request/response format

### Issue: OTP works in development but not production
**Solution**: 
- Verify production environment variables
- Check if production IP is whitelisted
- Test API credentials in production

---

## 📞 Support Contacts

### Airtel Business Support:
- Email: business.support@airtel.com
- Phone: Check Airtel Business portal

### Your Implementation:
For code-related issues, the SMS integration is in:
- Frontend: `app/checkout/page.tsx` (lines with mobile OTP)
- Backend: `app/api/checkout/send-otp/route.ts` (Airtel API call)
- Config: `.env.local` (Airtel credentials)

---

## ✅ Checklist Before Going Live

- [ ] Airtel account activated
- [ ] API credentials obtained
- [ ] Template DLT ID approved: `1007276267174781068`
- [ ] Header DLT ID verified: `1005625612238250845`
- [ ] API endpoint confirmed
- [ ] Environment variables updated
- [ ] Test OTP sending in development
- [ ] Test OTP receiving on real mobile
- [ ] Test rate limiting
- [ ] Test OTP expiration
- [ ] Test mobile verification flow
- [ ] Production deployment complete
- [ ] Production testing done

---

## 📝 Sample API Request/Response

### Request:
```json
POST https://api.mvaayoo.com/api/v1/sms/send
Authorization: Bearer your_api_key_here
Content-Type: application/json

{
  "sender": "CASEBD",
  "mobile": "9876543210",
  "message": "Your OTP for order verification is 123456. Valid for 10 minutes. - CaseBuddy",
  "template_id": "1007276267174781068",
  "pe_id": "1005625612238250845"
}
```

### Success Response:
```json
{
  "status": "success",
  "message_id": "abc123xyz",
  "mobile": "9876543210"
}
```

### Error Response:
```json
{
  "status": "error",
  "error_code": "E001",
  "message": "Template not approved"
}
```

---

## 🎯 Next Steps

1. **Contact Airtel** - Get API credentials and confirm endpoint
2. **Update .env.local** - Add your actual API key and details
3. **Test thoroughly** - Try sending OTPs in development
4. **Adjust API format** - If Airtel uses different format, update code
5. **Deploy** - Push to production after testing

---

**Note**: If Airtel's API format differs from what's implemented, provide me with their API documentation and I'll update the integration code accordingly.
