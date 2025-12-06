'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ShoppingCart, Heart, Star, Truck, Shield, Package, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';
import styles from './product.module.css';

interface ProductImage {
  image_url: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  customization_enabled?: boolean;
  customization_options?: {
    text_enabled: boolean;
    fonts: string[];
    placements: string[];
  };
}

interface PhoneBrand {
  id: number;
  name: string;
  slug: string;
}

interface PhoneModel {
  id: number;
  brand_id: number;
  model_name: string;
  slug: string;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  compare_price: number | null;
  sku: string;
  stock_quantity: number;
  is_featured: boolean;
  images: ProductImage[];
  categories: Category[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const categorySlug = params?.slug as string;
  const productSlug = params?.product as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Customization state
  const [phoneBrands, setPhoneBrands] = useState<PhoneBrand[]>([]);
  const [phoneModels, setPhoneModels] = useState<PhoneModel[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [customText, setCustomText] = useState('');
  const [selectedFont, setSelectedFont] = useState<string>('');
  const [selectedPlacement, setSelectedPlacement] = useState<string>('');

  useEffect(() => {
    if (!productSlug) return;
    
    fetch(`/api/products/${productSlug}`)
      .then(res => res.json())
      .then(data => {
        console.log('🔍 Product API Response:', data);
        if (data.success) {
          setProduct(data.product);
          console.log('📦 Product Data:', data.product);
          console.log('📂 Categories:', data.product.categories);
          
          // Find ANY category with customization enabled
          const customCategory = data.product.categories?.find((cat: Category) => cat.customization_enabled);
          console.log('✅ Customization Category Found?', customCategory);
          
          if (customCategory) {
            console.log('🔄 Fetching phone brands for category:', customCategory.id, customCategory.name);
            fetchPhoneBrands(customCategory.id);
          } else {
            console.log('❌ No category with customization enabled');
          }
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('❌ Error loading product:', error);
        setLoading(false);
      });
  }, [productSlug]);

  const fetchPhoneBrands = async (categoryId: number) => {
    try {
      console.log('📞 Fetching brands for category:', categoryId);
      const response = await fetch(`/api/phone-brands?category=${categoryId}`);
      const data = await response.json();
      console.log('📞 Phone Brands Response:', data);
      if (data.success) {
        setPhoneBrands(data.brands);
        console.log('✅ Phone brands loaded:', data.brands.length);
      } else {
        console.log('❌ Failed to load phone brands:', data.error);
      }
    } catch (error) {
      console.error('❌ Error fetching phone brands:', error);
    }
  };

  const fetchPhoneModels = async (brandId: number) => {
    try {
      const response = await fetch(`/api/phone-brands/${brandId}/models`);
      const data = await response.json();
      if (data.success) {
        setPhoneModels(data.models);
      }
    } catch (error) {
      console.error('Error fetching phone models:', error);
    }
  };

  const handleBrandChange = (brandId: number) => {
    setSelectedBrand(brandId);
    setSelectedModel(null);
    setPhoneModels([]);
    fetchPhoneModels(brandId);
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.stock_quantity || 999)) {
      setQuantity(newQuantity);
    }
  };

  const nextImage = () => {
    if (product && product.images.length > 0) {
      setSelectedImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product && product.images.length > 0) {
      setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h1>Product Not Found</h1>
          <Link href={`/shop/${categorySlug}`} className={styles.backButton}>
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const selectedImage = product.images[selectedImageIndex] || product.images[0];
  const discount = product.compare_price 
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.logo}>
            <Image src="/casebuddy-logo.png" alt="CaseBuddy" width={180} height={50} priority />
          </Link>
          <div className={styles.navLinks}>
            <Link href="/" className={styles.navLink}>Home</Link>
            <Link href="/shop" className={styles.navLink}>Shop</Link>
            <Link href="/templates" className={styles.navLink}>Templates</Link>
            <Link href="/contact" className={styles.navLink}>Contact</Link>
          </div>
          <div className={styles.navActions}>
            <button className={styles.iconButton}>
              <Heart size={22} />
            </button>
            <button className={styles.iconButton}>
              <ShoppingCart size={22} />
              <span className={styles.cartBadge}>0</span>
            </button>
          </div>
        </nav>
      </header>

      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href={`/shop/${categorySlug}`}>
          {product.categories[0]?.name || 'Shop'}
        </Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      {/* Product Content */}
      <div className={styles.productContainer}>
        {/* Image Gallery */}
        <div className={styles.gallery}>
          <div className={styles.mainImageWrapper}>
            {selectedImage && (
              <Image 
                src={selectedImage.image_url}
                alt={selectedImage.alt_text || product.name}
                width={600}
                height={800}
                className={styles.mainImage}
                priority
              />
            )}
            {discount > 0 && (
              <div className={styles.discountBadge}>{discount}% OFF</div>
            )}
            {product.images.length > 1 && (
              <>
                <button className={styles.galleryNav + ' ' + styles.prev} onClick={prevImage}>
                  <ChevronLeft size={28} />
                </button>
                <button className={styles.galleryNav + ' ' + styles.next} onClick={nextImage}>
                  <ChevronRight size={28} />
                </button>
              </>
            )}
          </div>
          
          {product.images.length > 1 && (
            <div className={styles.thumbnails}>
              {product.images.map((img, index) => (
                <button
                  key={index}
                  className={`${styles.thumbnail} ${index === selectedImageIndex ? styles.active : ''}`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <Image 
                    src={img.image_url}
                    alt={img.alt_text || product.name}
                    width={80}
                    height={100}
                    className={styles.thumbnailImage}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className={styles.productInfo}>
          <h1 className={styles.productTitle}>{product.name}</h1>
          
          <div className={styles.rating}>
            <div className={styles.stars}>
              <Star size={18} fill="#FFD700" color="#FFD700" />
              <Star size={18} fill="#FFD700" color="#FFD700" />
              <Star size={18} fill="#FFD700" color="#FFD700" />
              <Star size={18} fill="#FFD700" color="#FFD700" />
              <Star size={18} fill="#E0E0E0" color="#E0E0E0" />
            </div>
            <span className={styles.ratingText}>4.0 (120 reviews)</span>
          </div>

          <div className={styles.priceSection}>
            <div className={styles.priceWrapper}>
              <span className={styles.price}>₹{product.price.toFixed(2)}</span>
              {product.compare_price && product.compare_price > product.price && (
                <span className={styles.comparePrice}>₹{product.compare_price.toFixed(2)}</span>
              )}
            </div>
            {discount > 0 && (
              <span className={styles.savings}>You save ₹{(product.compare_price! - product.price).toFixed(2)}</span>
            )}
          </div>

          <p className={styles.description}>{product.short_description}</p>

          <div className={styles.quantitySection}>
            <label className={styles.label}>Quantity:</label>
            <div className={styles.quantityControl}>
              <button 
                className={styles.quantityButton}
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <Minus size={16} />
              </button>
              <span className={styles.quantityValue}>{quantity}</span>
              <button 
                className={styles.quantityButton}
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= product.stock_quantity}
              >
                <Plus size={16} />
              </button>
            </div>
            <span className={styles.stockInfo}>
              {product.stock_quantity > 10 ? 'In Stock' : `Only ${product.stock_quantity} left!`}
            </span>
          </div>

          {/* DEBUG INFO */}
          <div style={{
            margin: '20px 0',
            padding: '15px',
            background: '#fff3cd',
            border: '2px solid #ffc107',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'monospace'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>🔍 DEBUG INFO:</h4>
            <div><strong>Has Categories:</strong> {product.categories?.length > 0 ? 'Yes ✅' : 'No ❌'}</div>
            <div><strong>Total Categories:</strong> {product.categories?.length || 0}</div>
            {product.categories?.map((cat, idx) => {
              const customCategory = product.categories?.find((c: Category) => c.customization_enabled);
              return (
                <div key={idx} style={{ marginLeft: '10px', marginTop: '5px', borderLeft: cat.customization_enabled ? '3px solid green' : '3px solid red', paddingLeft: '10px' }}>
                  <div><strong>Category {idx}:</strong> {cat.name}</div>
                  <div><strong>Customization:</strong> {String(cat.customization_enabled)} {cat.customization_enabled ? '✅' : '❌'}</div>
                </div>
              );
            })}
            <div style={{ marginTop: '10px' }}><strong>Phone Brands Loaded:</strong> {phoneBrands.length} brands</div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
              Check browser console (F12) for detailed logs
            </div>
          </div>

          {/* Customization Section - Check ANY category has customization enabled */}
          {product.categories?.some((cat: Category) => cat.customization_enabled) && (() => {
            const customCategory = product.categories.find((cat: Category) => cat.customization_enabled);
            return (
            <div className={styles.customizationSection}>
              <h3 className={styles.customizationTitle}>🎨 Customize Your Case</h3>
              
              {/* Phone Brand Selection */}
              <div className={styles.customizationGroup}>
                <label className={styles.customizationLabel}>Select Phone Brand *</label>
                <select
                  className={styles.customizationSelect}
                  value={selectedBrand || ''}
                  onChange={(e) => handleBrandChange(Number(e.target.value))}
                  required
                >
                  <option value="">Choose your phone brand...</option>
                  {phoneBrands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone Model Selection */}
              {selectedBrand && (
                <div className={styles.customizationGroup}>
                  <label className={styles.customizationLabel}>Select Phone Model *</label>
                  <select
                    className={styles.customizationSelect}
                    value={selectedModel || ''}
                    onChange={(e) => setSelectedModel(Number(e.target.value))}
                    required
                  >
                    <option value="">Choose your phone model...</option>
                    {phoneModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.model_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom Text */}
              <div className={styles.customizationGroup}>
                <label className={styles.customizationLabel}>
                  Name / Text to be Customized
                  <span className={styles.optionalLabel}>(Optional)</span>
                </label>
                <input
                  type="text"
                  className={styles.customizationInput}
                  placeholder="Enter your custom text..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  maxLength={30}
                />
                <span className={styles.charCount}>{customText.length}/30</span>
              </div>

              {/* Font Style */}
              {customText && customCategory?.customization_options?.fonts && (
                <div className={styles.customizationGroup}>
                  <label className={styles.customizationLabel}>Choose Font Style</label>
                  <div className={styles.fontOptions}>
                    {customCategory.customization_options.fonts.map((font) => (
                      <button
                        key={font}
                        type="button"
                        className={`${styles.fontOption} ${selectedFont === font ? styles.selected : ''}`}
                        onClick={() => setSelectedFont(font)}
                      >
                        {font === 'bold' ? '𝐁𝐨𝐥𝐝' : '𝒞𝓊𝓇𝓈𝒾𝓋𝑒'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Placement Options */}
              {customText && customCategory?.customization_options?.placements && (
                <div className={styles.customizationGroup}>
                  <label className={styles.customizationLabel}>Choose Placement</label>
                  <div className={styles.placementOptions}>
                    {customCategory.customization_options.placements.map((placement) => (
                      <button
                        key={placement}
                        type="button"
                        className={`${styles.placementOption} ${selectedPlacement === placement ? styles.selected : ''}`}
                        onClick={() => setSelectedPlacement(placement)}
                      >
                        {placement.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Customization Summary */}
              {selectedBrand && selectedModel && (
                <div className={styles.customizationSummary}>
                  <strong>Your Selection:</strong>
                  <ul>
                    <li>Phone: {phoneBrands.find(b => b.id === selectedBrand)?.name} - {phoneModels.find(m => m.id === selectedModel)?.model_name}</li>
                    {customText && <li>Text: "{customText}" ({selectedFont || 'Default'})</li>}
                    {customText && selectedPlacement && <li>Placement: {selectedPlacement.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>}
                  </ul>
                </div>
              )}
            </div>
            );
          })()}

          <div className={styles.actions}>
            <button className={styles.addToCartButton}>
              <ShoppingCart size={20} />
              Add to Cart
            </button>
            <button className={styles.buyNowButton}>
              Buy Now
            </button>
            <button className={styles.wishlistButton}>
              <Heart size={20} />
            </button>
          </div>

          <div className={styles.features}>
            <div className={styles.feature}>
              <Truck size={24} />
              <div>
                <h4>Free Delivery</h4>
                <p>On orders above ₹499</p>
              </div>
            </div>
            <div className={styles.feature}>
              <Shield size={24} />
              <div>
                <h4>Secure Payment</h4>
                <p>100% secure payment</p>
              </div>
            </div>
            <div className={styles.feature}>
              <Package size={24} />
              <div>
                <h4>Easy Returns</h4>
                <p>30-day return policy</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Description */}
      {product.description && (
        <div className={styles.descriptionSection}>
          <h2>Product Description</h2>
          <div 
            className={styles.descriptionContent}
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2025 CaseBuddy. All rights reserved.</p>
      </footer>
    </div>
  );
}
