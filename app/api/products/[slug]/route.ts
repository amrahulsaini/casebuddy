import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db-main';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get product details
    const [products]: any = await pool.execute(
      `SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.short_description,
        p.price,
        p.compare_price,
        p.sku,
        p.stock_quantity,
        p.is_featured,
        p.created_at
      FROM products p
      WHERE p.slug = ? AND p.is_active = TRUE`,
      [slug]
    );

    if (!products || products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const product = products[0];

    // Get product images
    const [images] = await pool.execute(
      `SELECT image_url, alt_text, sort_order, is_primary
       FROM product_images
       WHERE product_id = ?
       ORDER BY is_primary DESC, sort_order ASC`,
      [product.id]
    );

    // Get product categories
    const [categories] = await pool.execute(
      `SELECT c.id, c.name, c.slug
       FROM categories c
       JOIN product_categories pc ON c.id = pc.category_id
       WHERE pc.product_id = ?`,
      [product.id]
    );

    // Get phone brands and models from category-phones (customization is always enabled)
    const categoryIds = (categories as any[]).map(cat => cat.id);
    let phoneBrands: any[] = [];
    let phoneModels: any[] = [];

    if (categoryIds.length > 0) {
      const placeholders = categoryIds.map(() => '?').join(',');
      
      // Get all phone brands from all categories this product belongs to
      const [brands] = await pool.execute(
        `SELECT DISTINCT pb.id, pb.name, pb.slug
         FROM phone_brands pb
         JOIN category_phone_brands cpb ON pb.id = cpb.brand_id
         WHERE cpb.category_id IN (${placeholders})
         ORDER BY pb.name`,
        categoryIds
      );
      phoneBrands = brands as any[];

      // Get all phone models from all categories this product belongs to
      const [models] = await pool.execute(
        `SELECT DISTINCT pm.id, pm.model_name, pm.brand_id, pm.slug
         FROM phone_models pm
         JOIN category_phone_models cpm ON pm.id = cpm.phone_model_id
         WHERE cpm.category_id IN (${placeholders})
         ORDER BY pm.model_name`,
        categoryIds
      );
      phoneModels = models as any[];
    }

    // Get product variants
    const [variants]: any = await pool.execute(
      `SELECT id, name, sku, price, stock_quantity, image_url, is_active
       FROM product_variants
       WHERE product_id = ? AND is_active = TRUE`,
      [product.id]
    );

    // Sanitize numeric fields
    const sanitizedProduct = {
      ...product,
      id: Number(product.id),
      price: parseFloat(product.price),
      compare_price: product.compare_price ? parseFloat(product.compare_price) : null,
      stock_quantity: Number(product.stock_quantity),
      is_featured: Boolean(product.is_featured),
      images: Array.isArray(images) ? images.map((img: any) => ({
        ...img,
        sort_order: Number(img.sort_order),
        is_primary: Boolean(img.is_primary),
      })) : [],
      categories: Array.isArray(categories) ? categories.map((cat: any) => ({
        ...cat,
        id: Number(cat.id),
      })) : [],
      variants: Array.isArray(variants) ? variants.map((v: any) => ({
        ...v,
        id: Number(v.id),
        price: parseFloat(v.price),
        stock_quantity: Number(v.stock_quantity),
        is_active: Boolean(v.is_active),
      })) : [],
      // Customization is always enabled with phone brands/models from category-phones
      customization: {
        phone_brands: phoneBrands,
        phone_models: phoneModels,
      }
    };

    return NextResponse.json({
      success: true,
      product: sanitizedProduct,
    });
  } catch (error: any) {
    console.error('Product detail API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
