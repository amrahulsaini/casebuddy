'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ShoppingCart, Heart, Star, Truck, Shield, Package, ChevronLeft, ChevronRight, Plus, Minus, User, Menu, Zap, Instagram, Facebook, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { CartBadge, WishlistBadge } from '@/components/CartBadge';
import SearchBar from '@/components/SearchBar';
import { getShippingConfig } from '@/lib/shipping';
import styles from './product.module.css';
import homeStyles from '../../../home.module.css';

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
  design_addon_enabled?: boolean;
  images: ProductImage[];
  categories: Category[];
  customization: {
    phone_brands: PhoneBrand[];
    phone_models: PhoneModel[];
  };
}

// Function to format plain text description into HTML
function formatDescription(text: string): string {
  if (!text) return '';
  
  // If already contains HTML tags, return as is
  if (text.includes('<p>') || text.includes('<ul>') || text.includes('<li>')) {
    return text;
  }
  
  // Split into lines
  let lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  let html = '';
  let inList = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line is a heading (ends with colon or contains certain keywords)
    const isHeading = line.endsWith(':') && !line.match(/^[•\-\*]\s/) && 
                     /^(key features|perfect gift|order processing|delivery|made to order|processing time|delivery time)/i.test(line);
    
    // Check if line starts with bullet point or dash
    const isBulletPoint = /^[•\-\*]\s/.test(line);
    
    if (isHeading) {
      // Close list if open
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      // Add heading as strong tag in paragraph
      html += `<p><strong>${line}</strong></p>`;
    } else if (isBulletPoint) {
      // Start list if not already started
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      // Remove bullet character and add as list item
      const content = line.replace(/^[•\-\*]\s*/, '');
      // Check if content has a bold part (text before colon)
      if (content.includes(':')) {
        const colonIndex = content.indexOf(':');
        const beforeColon = content.substring(0, colonIndex);
        const afterColon = content.substring(colonIndex + 1);
        html += `<li><strong>${beforeColon}:</strong>${afterColon}</li>`;
      } else {
        html += `<li>${content}</li>`;
      }
    } else {
      // Close list if open
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      // Check if regular paragraph has text before colon to make bold
      if (line.includes(':') && !line.endsWith(':')) {
        const colonIndex = line.indexOf(':');
        const beforeColon = line.substring(0, colonIndex);
        const afterColon = line.substring(colonIndex + 1);
        html += `<p><strong>${beforeColon}:</strong>${afterColon}</p>`;
      } else {
        // Regular paragraph
        html += `<p>${line}</p>`;
      }
    }
  }
  
  // Close list if still open
  if (inList) {
    html += '</ul>';
  }
  
  return html;
}

export default function ProductDetailPage() {
  const { freeShippingThreshold } = getShippingConfig();
  const params = useParams();
  const router = useRouter();
  const categorySlug = params?.slug as string;
  const productSlug = params?.product as string;
  const { addToCart, toggleWishlist, isInWishlist } = useCart();

  const [scrollY, setScrollY] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [validationError, setValidationError] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Customization state
  const [phoneBrands, setPhoneBrands] = useState<PhoneBrand[]>([]);
  const [phoneModels, setPhoneModels] = useState<PhoneModel[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [customText, setCustomText] = useState('');
  const [selectedFont, setSelectedFont] = useState<string>('bold');
  const [selectedPlacement, setSelectedPlacement] = useState<string>('');
  const [selectedDesignPosition, setSelectedDesignPosition] = useState<string>(''); // New: right_design or left_design
  const [additionalNotes, setAdditionalNotes] = useState('');

  useEffect(() => {
    if (!productSlug || !categorySlug) return;
    
    fetch(`/api/products/${productSlug}?category=${categorySlug}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProduct(data.product);
          
          // Load phone brands and models from category-phones for THIS category only
          if (data.product.customization) {
            setPhoneBrands(data.product.customization.phone_brands || []);
            setPhoneModels(data.product.customization.phone_models || []);
          }
        }
        setLoading(false);
      })
      .catch(error => {
        setLoading(false);
      });
  }, [productSlug, categorySlug]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }

      setScrollY(currentScrollY);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  const handleBrandChange = (brandId: number) => {
    setSelectedBrand(brandId);
    setSelectedModel(null);
    setValidationError('');
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.stock_quantity || 999)) {
      setQuantity(newQuantity);
    }
  };

  const validateCustomization = (): boolean => {
    // Reset error
    setValidationError('');

    // Phone brand and model are required
    if (!selectedBrand || !selectedModel) {
      setValidationError('Please select your phone brand and model');
      return false;
    }

    // Design position is required when addon is enabled
    if (product?.design_addon_enabled && !selectedDesignPosition) {
      setValidationError('Please select a design position (Right or Left)');
      return false;
    }

    // If custom text is entered, font and placement are required
    if (customText.trim()) {
      if (!selectedFont) {
        setValidationError('Please select a font style for your custom text');
        return false;
      }
      if (!selectedPlacement) {
        setValidationError('Please select a placement for your custom text');
        return false;
      }
    }

    return true;
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Validate customization
    if (!validateCustomization()) {
      return;
    }

    // Get brand and model names
    const brandName = phoneBrands.find(b => b.id === selectedBrand)?.name || '';
    const modelName = phoneModels.find(m => m.id === selectedModel)?.model_name || '';

    // Add to cart with all customization data
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: 0, // Will be replaced with unique ID in context
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0]?.image_url || '',
        slug: product.slug,
        phoneBrand: brandName,
        phoneModel: modelName,
        customText: customText.trim() || undefined,
        font: customText.trim() ? selectedFont : undefined,
        placement: customText.trim() ? selectedPlacement : undefined,
        designPosition: selectedDesignPosition || undefined, // New: design position
        additionalNotes: additionalNotes.trim() || undefined,
      });
    }

    // Show success message
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    // Reset quantity
    setQuantity(1);
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    toggleWishlist(product.id);
  };

  const handleBuyNow = () => {
    if (!product) return;

    // Validate customization
    if (!validateCustomization()) {
      return;
    }

    // Get brand and model names
    const brandName = phoneBrands.find(b => b.id === selectedBrand)?.name || '';
    const modelName = phoneModels.find(m => m.id === selectedModel)?.model_name || '';

    // Build checkout URL with query params
    const checkoutParams = new URLSearchParams({
      productId: product.id.toString(),
      productName: product.name,
      phoneModel: `${brandName} ${modelName}`,
      price: product.price.toString(),
      quantity: quantity.toString(),
      image: product.images[0]?.image_url || '',
      ...(customText.trim() && { customText: customText.trim() }),
      ...(customText.trim() && selectedFont && { font: selectedFont }),
      ...(customText.trim() && selectedPlacement && { placement: selectedPlacement }),
      ...(selectedDesignPosition && { designPosition: selectedDesignPosition }), // New: design position
      ...(additionalNotes.trim() && { notes: additionalNotes.trim() }),
    });

    // Redirect to checkout
    router.push(`/checkout?${checkoutParams.toString()}`);
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
    <div className={styles.page}>
      {/* Announcement Banner */}
      <div className={`${homeStyles.announcementBar} ${!headerVisible ? homeStyles.hidden : ''}`}>
        <div className={homeStyles.marquee}>
          <div className={homeStyles.marqueeContent}>
            <span><Truck size={16} /> Free Shipping Above ₹{freeShippingThreshold}</span>
            <span><Package size={16} /> 7 Days Easy Return</span>
            <span><Zap size={16} /> Delivery in 7-10 Days</span>
            <span><Truck size={16} /> Free Shipping Above ₹{freeShippingThreshold}</span>
            <span><Package size={16} /> 7 Days Easy Return</span>
            <span><Zap size={16} /> Delivery in 7-10 Days</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className={`${homeStyles.header} ${scrollY > 50 ? homeStyles.scrolled : ''} ${!headerVisible ? homeStyles.hidden : ''}`}>
        <nav className={homeStyles.nav}>
          <Link href="/" className={homeStyles.logo}>
            <Image src="/casebuddy-logo.png" alt="CaseBuddy" width={180} height={50} className={homeStyles.logoImg} priority />
          </Link>
          <div className={homeStyles.navLinks}>
            <Link href="/" className={homeStyles.navLink}>Home</Link>
            <Link href="/shop" className={homeStyles.navLink}>Shop</Link>
            <Link href="/about" className={homeStyles.navLink}>About</Link>
            <Link href="/contact" className={homeStyles.navLink}>Contact</Link>
          </div>
          <div className={homeStyles.navActions}>
            <SearchBar />
            <Link href="/wishlist" className={homeStyles.iconButton}>
              <Heart size={22} />
              <WishlistBadge className={homeStyles.cartBadge} />
            </Link>
            <Link href="/cart" className={homeStyles.iconButton}>
              <ShoppingCart size={22} />
              <CartBadge className={homeStyles.cartBadge} />
            </Link>
            <Link href="/orders" className={homeStyles.iconButton}>
              <User size={22} />
            </Link>
            <button className={homeStyles.mobileMenu} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu size={24} />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className={homeStyles.mobileNav}>
          <Link href="/" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link href="/shop" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Shop</Link>
          <Link href="/about" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>About</Link>
          <Link href="/contact" className={homeStyles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Contact</Link>
        </div>
      )}

      <main className={styles.container}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href={`/shop/${categorySlug}`}>
          {product.categories.find(c => c.slug === categorySlug)?.name || 'Shop'}
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

          {/* Product Description under gallery */}
          {product.description && (
            <div className={styles.descriptionSection}>
              <h2>Product Description</h2>
              <div 
                className={styles.descriptionContent}
                dangerouslySetInnerHTML={{ __html: formatDescription(product.description) }}
              />
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

          {/* Customization Section - Always enabled for all products */}
          <div className={styles.customizationSection}>
            <h3 className={styles.customizationTitle}>🎨 Customize</h3>
            
            {/* Design Position Add-on (REQUIRED - shown at top before brand selection) */}
            {!!product.design_addon_enabled && (
              <div className={styles.customizationGroup}>
                <label className={styles.customizationLabel}>
                  Design Position *
                </label>
                <div className={styles.designPositionOptions}>
                  <button
                    type="button"
                    className={`${styles.designPositionOption} ${selectedDesignPosition === 'right_design' ? styles.selected : ''}`}
                    onClick={() => setSelectedDesignPosition('right_design')}
                  >
                    Right Design
                  </button>
                  <button
                    type="button"
                    className={`${styles.designPositionOption} ${selectedDesignPosition === 'left_design' ? styles.selected : ''}`}
                    onClick={() => setSelectedDesignPosition('left_design')}
                  >
                    Left Design
                  </button>
                </div>
              </div>
            )}

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
                  {phoneModels
                    .filter(model => model.brand_id === selectedBrand)
                    .map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.model_name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* WhatsApp Preorder Message */}
            <div className={styles.infoMessage}>
              <span className={styles.infoIcon}>💬</span>
              <p>If your model or preferred color isn't available, feel free to WhatsApp us — we'll be happy to preorder it for you!</p>
            </div>

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
            {customText && (
              <div className={styles.customizationGroup}>
                <label className={styles.customizationLabel}>Choose Font Style</label>
                <div className={styles.fontOptions}>
                  <button
                    type="button"
                    className={`${styles.fontOption} ${selectedFont === 'bold' ? styles.selected : ''}`}
                    onClick={() => setSelectedFont('bold')}
                  >
                    𝐁𝐨𝐥𝐝
                  </button>
                  <button
                    type="button"
                    className={`${styles.fontOption} ${selectedFont === 'cursive' ? styles.selected : ''}`}
                    onClick={() => setSelectedFont('cursive')}
                  >
                    𝒞𝓊𝓇𝓈𝒾𝓋𝑒
                  </button>
                </div>
              </div>
            )}

            {/* Placement Options */}
            {customText && (
              <div className={styles.customizationGroup}>
                <label className={styles.customizationLabel}>Choose Placement</label>
                <div className={styles.placementOptions}>
                  <button
                    type="button"
                    className={`${styles.placementOption} ${selectedPlacement === 'bottom_of_case' ? styles.selected : ''}`}
                    onClick={() => setSelectedPlacement('bottom_of_case')}
                  >
                    Bottom of Case
                  </button>
                  <button
                    type="button"
                    className={`${styles.placementOption} ${selectedPlacement === 'centre_of_case' ? styles.selected : ''}`}
                    onClick={() => setSelectedPlacement('centre_of_case')}
                  >
                    Centre of Case
                  </button>
                  <button
                    type="button"
                    className={`${styles.placementOption} ${selectedPlacement === 'name_on_phone_holder' ? styles.selected : ''}`}
                    onClick={() => setSelectedPlacement('name_on_phone_holder')}
                  >
                    Name on Phone Holder
                  </button>
                  <button
                    type="button"
                    className={`${styles.placementOption} ${selectedPlacement === 'right_vertical_with_strings' ? styles.selected : ''}`}
                    onClick={() => setSelectedPlacement('right_vertical_with_strings')}
                  >
                    Right Vertical Side with Strings (Cursive Lines)
                  </button>
                  <button
                    type="button"
                    className={`${styles.placementOption} ${selectedPlacement === 'right_vertical_with_heart' ? styles.selected : ''}`}
                    onClick={() => setSelectedPlacement('right_vertical_with_heart')}
                  >
                    Right Vertical Side with Heart
                  </button>
                  <button
                    type="button"
                    className={`${styles.placementOption} ${selectedPlacement === 'name_with_heart_at_bottom' ? styles.selected : ''}`}
                    onClick={() => setSelectedPlacement('name_with_heart_at_bottom')}
                  >
                    Name with a Heart at Bottom of the Case
                  </button>
                </div>
              </div>
            )}

            {/* Additional Notes */}
            <div className={styles.customizationGroup}>
              <label className={styles.customizationLabel}>
                Additional Notes for this Case
                <span className={styles.optionalLabel}>(Optional)</span>
              </label>
              <textarea
                className={styles.customizationTextarea}
                placeholder="Any special instructions or requirements..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={3}
                maxLength={200}
              />
              <span className={styles.charCount}>{additionalNotes.length}/200</span>
            </div>

            {/* Customization Summary */}
            {selectedBrand && selectedModel && (
              <div className={styles.customizationSummary}>
                <strong>Your Selection:</strong>
                <ul>
                  <li>Phone: {phoneBrands.find(b => b.id === selectedBrand)?.name} - {phoneModels.find(m => m.id === selectedModel)?.model_name}</li>
                  {customText && <li>Text: "{customText}" ({selectedFont || 'Bold'})</li>}
                  {customText && selectedPlacement && <li>Placement: {selectedPlacement.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>}
                  {selectedDesignPosition && <li>Design Position: {selectedDesignPosition === 'right_design' ? 'Right Design' : 'Left Design'}</li>}
                  {additionalNotes && <li>Notes: {additionalNotes}</li>}
                </ul>
              </div>
            )}
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className={styles.errorMessage}>
              ⚠️ {validationError}
            </div>
          )}

          {/* Success Message */}
          {showSuccess && (
            <div className={styles.successMessage}>
              ✓ Added to cart successfully!
            </div>
          )}

          <div className={styles.actions}>
            <button 
              className={styles.addToCartButton}
              onClick={handleAddToCart}
              disabled={!product || product.stock_quantity === 0}
            >
              <ShoppingCart size={20} />
              {product?.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button 
              className={styles.buyNowButton}
              onClick={handleBuyNow}
              disabled={!product || product.stock_quantity === 0}
            >
              Buy Now
            </button>
            <button 
              className={`${styles.wishlistButton} ${product && isInWishlist(product.id) ? styles.active : ''}`}
              onClick={handleToggleWishlist}
              title={product && isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={20} fill={product && isInWishlist(product.id) ? '#ff6b00' : 'none'} />
            </button>
          </div>

          <div className={styles.features}>
            <div className={styles.feature}>
              <Truck size={24} />
              <div>
                <h4>Free Delivery</h4>
                <p>On orders above ₹{freeShippingThreshold}</p>
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
                <p>7-day return policy</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      </main>

      {/* Footer */}
      <footer className={homeStyles.footer}>
        <div className={homeStyles.footerContent}>
          <div className={homeStyles.footerSection}>
            <div className={homeStyles.footerLogo}>
              <div className={homeStyles.footerLogoWrapper}>
                <Image src="/casebuddy-logo.png" alt="CaseBuddy" width={160} height={45} />
              </div>
            </div>
            <p className={homeStyles.footerDesc}>
              Your one-stop shop for premium custom phone cases. Protect your device with style.
            </p>
            <div className={homeStyles.socialLinks}>
              <a href="https://www.instagram.com/casebuddy6" target="_blank" rel="noopener noreferrer" className={homeStyles.socialIcon}>
                <Instagram size={24} />
              </a>
              <a href="https://www.facebook.com/casebuddy6" target="_blank" rel="noopener noreferrer" className={homeStyles.socialIcon}>
                <Facebook size={24} />
              </a>
              <a href="https://wa.me/918107624752" target="_blank" rel="noopener noreferrer" className={homeStyles.socialIcon}>
                <MessageCircle size={24} />
              </a>
            </div>
          </div>

          <div className={homeStyles.footerSection}>
            <h4 className={homeStyles.footerTitle}>Quick Links</h4>
            <ul className={homeStyles.footerLinks}>
              <li><Link href="/shop">Shop All</Link></li>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>

          <div className={homeStyles.footerSection}>
            <h4 className={homeStyles.footerTitle}>Customer Service</h4>
            <ul className={homeStyles.footerLinks}>
              <li><Link href="/shipping">Shipping Info</Link></li>
              <li><Link href="/returns">Returns & Exchanges</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>

          <div className={homeStyles.footerSection}>
            <h4 className={homeStyles.footerTitle}>Contact Us</h4>
            <ul className={homeStyles.footerContact}>
              <li>
                <Phone size={20} />
                <span>+918107624752</span>
              </li>
              <li>
                <Mail size={20} />
                <a href="mailto:info@casebuddy.co.in">info@casebuddy.co.in</a>
              </li>
              <li>
                <MapPin size={20} />
                <span>Rajgarh, Rajasthan 331023</span>
              </li>
            </ul>
          </div>
        </div>

        <div className={homeStyles.footerBottom}>
          <p className={homeStyles.footerText}>
            © 2025 CaseBuddy. All rights reserved.
          </p>
          <div className={homeStyles.paymentMethods}>
            <span>We Accept:</span>
            <div className={homeStyles.paymentIcons}>💳 UPI | Cards | Wallets</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
