# Product Sort Order Feature

## Overview
This feature allows you to control the display order of products within categories through the admin panel. Products with lower sort order values appear first in category listings.

## Database Changes

### Migration File
Location: `database/add-product-sort-order.sql`

**Changes:**
- Adds `sort_order` column to `products` table (INT, default 0)
- Adds index on `sort_order` for better query performance
- Initializes existing products with sort order based on creation date

### Running the Migration
```bash
# Run the SQL migration on your database
mysql -u [username] -p [database_name] < database/add-product-sort-order.sql
```

## Admin Panel Changes

### Add/Edit Product Forms
Both forms now include a "Sort Order" field:
- **Location**: Admin Dashboard > Products > Add/Edit
- **Field**: Number input (default: 0)
- **Description**: "Lower numbers appear first in category listings"

### Product Listing
The admin products table now displays:
- A new "Sort" column showing each product's sort order value
- Easy visibility of how products are ordered

## Frontend Changes

### Category Pages
**Location**: `/shop/[categorySlug]`

Products are now sorted by:
1. Primary: `sort_order` (ascending - lowest first)
2. Secondary: `created_at` (descending - newest first)

This ensures:
- Products with explicit sort orders appear in the desired sequence
- Products with the same sort order are ordered by creation date
- New products (sort_order = 0) appear after explicitly ordered products

## API Changes

### Products API (`/api/products`)
Updated to sort products by: `ORDER BY p.sort_order ASC, p.created_at DESC`

### Admin Products API
**Create Product** (`POST /api/admin/products`):
- Now accepts `sort_order` in request body
- Defaults to 0 if not provided

**Update Product** (`PUT /api/admin/products/[id]`):
- Now accepts and updates `sort_order` field

## Usage Guide

### Setting Product Order

1. **Navigate to Admin Panel**
   - Go to Admin Dashboard > Products

2. **Edit Product**
   - Click "Edit" on any product or create a new one

3. **Set Sort Order**
   - Find the "Sort Order" field in the "Pricing & Inventory" section
   - Enter a number (0 or higher)
   - Lower numbers = higher priority in listings

4. **Save Changes**
   - Click "Save Changes"
   - Product will now appear in the specified order on category pages

### Best Practices

1. **Use Increments of 10**
   - Example: 10, 20, 30, 40
   - This allows inserting products between existing ones without renumbering everything

2. **Featured Products**
   - Consider using sort_order 1-99 for featured/priority products
   - Use 100+ for standard products

3. **Seasonal/Promotional Items**
   - Temporarily set low sort_order values (e.g., 1-10) for promotional products
   - Reset to higher values when promotion ends

### Example Ordering

| Product Name | Sort Order | Display Position |
|--------------|-----------|------------------|
| New Arrival Special | 1 | 1st |
| Featured Case A | 10 | 2nd |
| Featured Case B | 10 | 3rd (by date) |
| Standard Case 1 | 100 | 4th |
| Standard Case 2 | 100 | 5th (by date) |
| Old Case | 500 | Last |

## Files Modified

### Database
- `database/add-product-sort-order.sql` (new)

### Admin Frontend
- `app/admin/dashboard/products/page.tsx` - Added sort_order display
- `app/admin/dashboard/products/new/page.tsx` - Added sort_order field
- `app/admin/dashboard/products/[id]/page.tsx` - Added sort_order field

### API Routes
- `app/api/admin/products/route.ts` - Added sort_order to INSERT
- `app/api/admin/products/[id]/route.ts` - Added sort_order to UPDATE
- `app/api/products/route.ts` - Updated ORDER BY clause

## Testing Checklist

- [ ] Run database migration successfully
- [ ] Create new product with sort_order = 5
- [ ] Create new product with sort_order = 1
- [ ] Create new product with sort_order = 10
- [ ] Verify products appear in order 1, 5, 10 on category page
- [ ] Edit existing product and change sort_order
- [ ] Verify category page updates correctly
- [ ] Test with products that have same sort_order (should sort by date)
- [ ] Verify admin panel shows sort_order column

## Troubleshooting

### Products Not Sorting Correctly
- Check if migration ran successfully
- Verify sort_order values are set correctly in database
- Clear browser cache
- Check API response includes sort_order field

### Migration Fails
- Ensure you have ALTER TABLE permissions
- Check if column already exists: `SHOW COLUMNS FROM products;`
- If column exists, skip ALTER statements and just run UPDATE

### Admin Panel Not Showing Field
- Clear browser cache
- Check console for JavaScript errors
- Verify files were saved correctly

## Future Enhancements

Potential improvements:
1. Drag-and-drop reordering in admin panel
2. Bulk sort order assignment
3. Category-specific sort orders
4. Auto-increment sort_order for new products
5. Sort order presets (featured, new, popular, etc.)
