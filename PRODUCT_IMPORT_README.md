# Product Import Instructions

This guide explains how to import products from the JSON file into the database.

## Prerequisites

1. Make sure the database schema is created (run `case_main_schema.sql`)
2. Have the `atcasa_data.json` file in the root directory
3. Configure database credentials in `.env`

## Database Configuration

Create a `.env` file with:

```env
DB_HOST=localhost
DB_USER=case_main
DB_PASSWORD=main
DB_NAME=case_main
```

## Running the Import

### Step 1: Install Dependencies

```bash
npm install mysql2
```

### Step 2: Run the Import Script

```bash
node scripts/import-products.js
```

## What the Script Does

1. **Creates Category**: Inserts "Designer Slim Case" category if it doesn't exist
2. **Downloads Images**: Fetches product images from URLs and saves to `/public/products/designer-slim-case/`
3. **Imports Products**: 
   - Creates slug from product title (handle)
   - Extracts price from title or uses default ₹299
   - Inserts product into `products` table
   - Links product to category via `product_categories`
   - Inserts images into `product_images` table

## Data Mapping

From JSON to Database:
- `title` → `products.name`
- `handle` → `products.slug` (auto-generated if missing)
- `images[0].src` → Downloaded to local, path saved in `product_images.image_url`
- `body_html` → `products.description`
- Price extracted from title → `products.price`
- `tags` → Used for categorization

## After Import

Access products at:
- Product listing: `http://localhost:3000/shop/designer-slim-case`
- Individual product: `http://localhost:3000/shop/designer-slim-case/[product-slug]`

## Troubleshooting

**Images not downloading:**
- Check internet connection
- Verify image URLs in JSON are valid
- Ensure `/public/products/designer-slim-case/` directory exists

**Database errors:**
- Verify database credentials in `.env`
- Ensure MySQL server is running
- Check that `case_main_schema.sql` was executed

**Duplicate products:**
- Script skips products with existing slugs
- Delete products from database if you want to reimport:
  ```sql
  DELETE FROM products WHERE slug LIKE 'your-slug%';
  ```

## API Endpoints

After import, these API endpoints are available:

- `GET /api/products?category=designer-slim-case` - List all products in category
- `GET /api/products/[slug]` - Get single product details

## File Structure

```
/public/products/designer-slim-case/  ← Product images saved here
/app/shop/[slug]/                     ← Category listing page
/app/shop/[slug]/[product]/           ← Product detail page
/app/api/products/                    ← Products API endpoints
/scripts/import-products.js           ← Import script
```
