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

    // Get product categories with customization info
    const [categories] = await pool.execute(
      `SELECT c.id, c.name, c.slug, c.customization_enabled, c.customization_options
       FROM categories c
       JOIN product_categories pc ON c.id = pc.category_id
       WHERE pc.product_id = ?`,
      [product.id]
    );

    // Determine effective customization settings
    let effectiveCustomization: {
      enabled: boolean;
      options: any;
      phone_brands: any[];
    } = {
      enabled: false,
      options: null,
      phone_brands: []
    };

    if (product.customization_override) {
      // Use product-level customization
      effectiveCustomization.enabled = Boolean(product.customization_enabled);
      effectiveCustomization.options = product.customization_options ? 
        (typeof product.customization_options === 'string' ? JSON.parse(product.customization_options) : product.customization_options) : 
        null;
      
      // Get product-specific phone brands
      const [productBrands] = await pool.execute(
        `SELECT pb.id, pb.name, pb.slug
         FROM phone_brands pb
         JOIN product_phone_brands ppb ON pb.id = ppb.phone_brand_id
         WHERE ppb.product_id = ?
         ORDER BY pb.name`,
        [product.id]
      );
      effectiveCustomization.phone_brands = productBrands as any[];
    } else {
      // Use category-level customization (from first category with customization enabled)
      const customCategory = (categories as any[]).find((cat: any) => cat.customization_enabled);
      if (customCategory) {
        effectiveCustomization.enabled = true;
        effectiveCustomization.options = customCategory.customization_options ? 
          (typeof customCategory.customization_options === 'string' ? JSON.parse(customCategory.customization_options) : customCategory.customization_options) : 
          null;
        
        // Get category phone brands
        const [categoryBrands] = await pool.execute(
          `SELECT pb.id, pb.name, pb.slug
           FROM phone_brands pb
           JOIN category_phone_brands cpb ON pb.id = cpb.brand_id
           WHERE cpb.category_id = ?
           ORDER BY pb.name`,
          [customCategory.id]
        );
        effectiveCustomization.phone_brands = categoryBrands as any[];
      }
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
      customization_override: Boolean(product.customization_override),
      images: Array.isArray(images) ? images.map((img: any) => ({
        ...img,
        sort_order: Number(img.sort_order),
        is_primary: Boolean(img.is_primary),
      })) : [],
      categories: Array.isArray(categories) ? categories.map((cat: any) => ({
        ...cat,
        id: Number(cat.id),
        customization_enabled: Boolean(cat.customization_enabled),
        customization_options: cat.customization_options ? JSON.parse(cat.customization_options) : null,
      })) : [],
      variants: Array.isArray(variants) ? variants.map((v: any) => ({
        ...v,
        id: Number(v.id),
        price: parseFloat(v.price),
        stock_quantity: Number(v.stock_quantity),
        is_active: Boolean(v.is_active),
      })) : [],
      // Add effective customization data
      customization: {
        enabled: effectiveCustomization.enabled,
        options: effectiveCustomization.options,
        phone_brands: effectiveCustomization.phone_brands,
        source: product.customization_override ? 'product' : 'category'
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
