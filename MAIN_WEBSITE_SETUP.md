# Main Website Setup Instructions

## Step 1: Create Database

```bash
# Connect to MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE IF NOT EXISTS case_main;
CREATE USER IF NOT EXISTS 'case_main'@'localhost' IDENTIFIED BY 'main';
GRANT ALL PRIVILEGES ON case_main.* TO 'case_main'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Step 2: Import Schema

```bash
mysql -u case_main -pmain case_main < database/case_main_schema.sql
```

## Step 3: Install Dependencies

```bash
npm install axios tsx
```

## Step 4: Seed Categories (Download Images & Insert to DB)

```bash
npm run seed:categories
```

This will:
- Download all 25 category images from ATCASA CDN
- Save them to `/public/cdn/categories/`
- Insert category data into `case_main` database

## Step 5: Test Homepage

```bash
npm run dev
```

Visit http://localhost:3000 to see the main website with all categories!

## Directory Structure After Seeding

```
public/
  cdn/
    categories/
      designer-slim-case.jpg
      black-bumper-case.jpg
      black-transparent-bumper-iphone-cases.png
      ... (all 25 category images)
```

## Database Tables Created

- `categories` - All product categories
- `products` - Individual products (to be added later)
- `product_categories` - Many-to-many relationship
- `product_images` - Product image gallery
- `product_variants` - Color/size variants
- `orders` - Customer orders
- `order_items` - Order line items
- `admin_users` - Admin panel users

## Next Steps

After categories are set up, you can:
1. Add products to each category
2. Build product detail pages
3. Create shopping cart
4. Add checkout flow
5. Build admin panel for product management

## Environment Variables

Already added to `.env.local`:
```
MAIN_DB_HOST=localhost
MAIN_DB_USER=case_main
MAIN_DB_PASSWORD=main
MAIN_DB_NAME=case_main
```

## Troubleshooting

**If seeding fails:**
1. Check database connection: `mysql -u case_main -pmain case_main`
2. Verify `/public/cdn/categories/` directory exists
3. Check internet connection for downloading images
4. Run seeding again: `npm run seed:categories`

**If images don't show:**
1. Check `next.config.ts` has `atcasa.co.in` in remotePatterns
2. Verify images exist in `/public/cdn/categories/`
3. Restart dev server: `npm run dev`
