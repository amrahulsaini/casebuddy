# Design Position Add-on Feature

## Overview
The Design Position Add-on allows admin to enable a "Right Design / Left Design" option for specific products. When enabled, customers can select their preferred design position during customization.

## Database Setup

Run the migration to add the new column:

```bash
mysql -u case_main -p case_main < database/add-design-addon.sql
```

Or manually run:
```sql
ALTER TABLE products 
ADD COLUMN design_addon_enabled BOOLEAN DEFAULT FALSE COMMENT 'Enable design position addon (Right/Left)';
```

## Admin Configuration

1. Go to **Admin Dashboard → Products**
2. Edit any product or create a new one
3. In the **Settings** section, check: **"Enable Design Position Add-on (Right Design / Left Design)"**
4. Save the product

## Customer Experience

When the addon is enabled for a product:

1. Customer visits the product page (e.g., `/shop/3d-cartoon-pop-holder-cases/stitch-pooh-cartoon-cute-custom-slim-soft-case-with-pop-holder`)
2. In the **"🎨 Customize Your Case"** section, they will see a new **"Design Position"** field
3. Two options are available:
   - **Right Design**
   - **Left Design**
4. The selection appears in:
   - Customization summary on product page
   - Cart page
   - Checkout page (order review)
   - Order confirmation emails (customer & admin)
   - Admin order details

## What Gets Saved

The design position selection is saved as:
- `designPosition: 'right_design'` or `'left_design'`
- Stored in `orders.customization_data` JSON field
- Included in all email notifications
- Visible in admin dashboard order details

## Display Labels

- `right_design` → "Right Design"
- `left_design` → "Left Design"

## Files Modified

### Backend
- `database/add-design-addon.sql` - New migration
- `app/api/products/[slug]/route.ts` - Return design_addon_enabled
- `app/api/admin/products/route.ts` - Save design_addon_enabled
- `app/api/admin/products/[id]/route.ts` - Update design_addon_enabled
- `app/api/checkout/payment-confirmation/route.ts` - Include in emails

### Admin
- `app/admin/dashboard/products/[id]/page.tsx` - Edit form
- `app/admin/dashboard/products/new/page.tsx` - Create form
- `app/admin/dashboard/orders/[id]/page.tsx` - Display in order details

### Frontend
- `app/shop/[slug]/[product]/page.tsx` - Design selector UI
- `app/shop/[slug]/[product]/product.module.css` - Styles
- `app/cart/page.tsx` - Display in cart
- `app/checkout/page.tsx` - Display in checkout

### Context & Utils
- `contexts/CartContext.tsx` - CartItem interface updated
- `lib/order-email-utils.ts` - Email item type updated

## Testing

1. **Enable the feature:**
   - Edit a product and enable "Design Position Add-on"

2. **Test customer flow:**
   - Visit the product page
   - Select phone brand & model
   - Choose "Right Design" or "Left Design"
   - Add to cart → view in cart
   - Proceed to checkout → verify it shows in order summary
   - Complete order → check confirmation email

3. **Test admin view:**
   - Go to Admin → Orders
   - View the order details
   - Verify design position is displayed under customization

## Notes

- The design position field is **optional** (no validation)
- Only shows when admin enables it for that product
- Works with all existing customization options (text, font, placement)
- Fully integrated with email notifications
- Backward compatible (products without this enabled work as before)
