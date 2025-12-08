'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Heart, Zap, Award, Users, Globe, Package, Sparkles } from 'lucide-react';
import styles from './about.module.css';

export default function AboutPage() {
  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Welcome to CaseBuddy</h1>
          <p className={styles.heroSubtitle}>
            Your trusted partner for premium phone cases and personalized protection
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className={styles.section}>
        <div className={styles.contentWrapper}>
          <div className={styles.textContent}>
            <h2 className={styles.sectionTitle}>Our Story</h2>
            <p className={styles.paragraph}>
              CaseBuddy was born from a simple idea: everyone deserves a phone case that's as unique as they are. 
              We started our journey in 2024 with a mission to revolutionize the way people protect and personalize their phones.
            </p>
            <p className={styles.paragraph}>
              Based in the heart of Rajasthan, we've grown from a small startup to a trusted name in phone accessories. 
              Our passion for quality, design, and customer satisfaction drives everything we do.
            </p>
            <p className={styles.paragraph}>
              Today, CaseBuddy serves thousands of happy customers across India, offering an extensive collection of 
              phone cases for all major brands including iPhone, Samsung, OnePlus, Xiaomi, Vivo, Oppo, Realme, and more.
            </p>
          </div>
          <div className={styles.imageContent}>
            <div className={styles.imageGrid}>
              <div className={styles.gridItem}></div>
              <div className={styles.gridItem}></div>
              <div className={styles.gridItem}></div>
              <div className={styles.gridItem}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className={styles.missionSection}>
        <div className={styles.missionGrid}>
          <div className={styles.missionCard}>
            <Heart className={styles.missionIcon} size={48} />
            <h3 className={styles.missionTitle}>Our Mission</h3>
            <p className={styles.missionText}>
              To provide high-quality, stylish phone cases that combine protection with personality. 
              We believe your phone case should be an extension of your style, not just an accessory.
            </p>
          </div>
          <div className={styles.missionCard}>
            <Sparkles className={styles.missionIcon} size={48} />
            <h3 className={styles.missionTitle}>Our Vision</h3>
            <p className={styles.missionText}>
              To become India's most loved phone case brand by offering unmatched variety, 
              quality, and customization options that help everyone express their unique personality.
            </p>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What We Offer</h2>
        <div className={styles.offerGrid}>
          <div className={styles.offerCard}>
            <Package className={styles.offerIcon} size={40} />
            <h3 className={styles.offerTitle}>Extensive Collection</h3>
            <p className={styles.offerText}>
              From trendy designs to classic styles, we have phone cases for every taste and occasion. 
              Browse hundreds of unique designs curated just for you.
            </p>
          </div>
          <div className={styles.offerCard}>
            <Globe className={styles.offerIcon} size={40} />
            <h3 className={styles.offerTitle}>All Brands Supported</h3>
            <p className={styles.offerText}>
              iPhone, Samsung, OnePlus, Xiaomi, Vivo, Oppo, Realme, and more. 
              Find the perfect case for your exact phone model.
            </p>
          </div>
          <div className={styles.offerCard}>
            <Sparkles className={styles.offerIcon} size={40} />
            <h3 className={styles.offerTitle}>Custom Designs</h3>
            <p className={styles.offerText}>
              Make it truly yours! Customize phone cases with your own photos, text, and designs. 
              Create something unique that tells your story.
            </p>
          </div>
          <div className={styles.offerCard}>
            <ShieldCheck className={styles.offerIcon} size={40} />
            <h3 className={styles.offerTitle}>Premium Quality</h3>
            <p className={styles.offerText}>
              Every case is made with high-quality materials that provide excellent protection 
              against drops, scratches, and daily wear and tear.
            </p>
          </div>
          <div className={styles.offerCard}>
            <Zap className={styles.offerIcon} size={40} />
            <h3 className={styles.offerTitle}>Fast Delivery</h3>
            <p className={styles.offerText}>
              Get your orders delivered within 7-10 days anywhere in India. 
              We ensure quick processing and secure packaging.
            </p>
          </div>
          <div className={styles.offerCard}>
            <Award className={styles.offerIcon} size={40} />
            <h3 className={styles.offerTitle}>7-Day Returns</h3>
            <p className={styles.offerText}>
              Not satisfied? No problem! Easy 7-day return policy ensures you get 
              exactly what you want, risk-free.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className={styles.whySection}>
        <h2 className={styles.sectionTitle}>Why Choose CaseBuddy?</h2>
        <div className={styles.whyGrid}>
          <div className={styles.whyCard}>
            <div className={styles.whyNumber}>01</div>
            <h3 className={styles.whyTitle}>Unmatched Variety</h3>
            <p className={styles.whyText}>
              Thousands of designs across multiple categories - from minimalist to quirky, 
              from professional to playful. There's something for everyone.
            </p>
          </div>
          <div className={styles.whyCard}>
            <div className={styles.whyNumber}>02</div>
            <h3 className={styles.whyTitle}>Quality Guaranteed</h3>
            <p className={styles.whyText}>
              We source only the finest materials and use advanced printing technology 
              to ensure your case looks great and lasts long.
            </p>
          </div>
          <div className={styles.whyCard}>
            <div className={styles.whyNumber}>03</div>
            <h3 className={styles.whyTitle}>Affordable Pricing</h3>
            <p className={styles.whyText}>
              Premium quality doesn't mean premium prices. We offer competitive pricing 
              and regular discounts to make style accessible to all.
            </p>
          </div>
          <div className={styles.whyCard}>
            <div className={styles.whyNumber}>04</div>
            <h3 className={styles.whyTitle}>Customer First</h3>
            <p className={styles.whyText}>
              Your satisfaction is our priority. From browsing to delivery, we ensure 
              a smooth, hassle-free shopping experience every time.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <Users className={styles.statIcon} size={48} />
            <div className={styles.statNumber}>10,000+</div>
            <div className={styles.statLabel}>Happy Customers</div>
          </div>
          <div className={styles.statCard}>
            <Package className={styles.statIcon} size={48} />
            <div className={styles.statNumber}>500+</div>
            <div className={styles.statLabel}>Unique Designs</div>
          </div>
          <div className={styles.statCard}>
            <Globe className={styles.statIcon} size={48} />
            <div className={styles.statNumber}>15+</div>
            <div className={styles.statLabel}>Phone Brands</div>
          </div>
          <div className={styles.statCard}>
            <Award className={styles.statIcon} size={48} />
            <div className={styles.statNumber}>4.8/5</div>
            <div className={styles.statLabel}>Customer Rating</div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Our Core Values</h2>
        <div className={styles.valuesGrid}>
          <div className={styles.valueCard}>
            <h3 className={styles.valueTitle}>Quality First</h3>
            <p className={styles.valueText}>
              We never compromise on quality. Every product goes through rigorous quality checks 
              before reaching you.
            </p>
          </div>
          <div className={styles.valueCard}>
            <h3 className={styles.valueTitle}>Innovation</h3>
            <p className={styles.valueText}>
              We constantly explore new designs, materials, and technologies to bring you 
              the latest and greatest in phone protection.
            </p>
          </div>
          <div className={styles.valueCard}>
            <h3 className={styles.valueTitle}>Sustainability</h3>
            <p className={styles.valueText}>
              We care about the environment. Our packaging is eco-friendly and we're constantly 
              working to reduce our carbon footprint.
            </p>
          </div>
          <div className={styles.valueCard}>
            <h3 className={styles.valueTitle}>Customer Delight</h3>
            <p className={styles.valueText}>
              Going beyond satisfaction, we aim to delight every customer with exceptional 
              products and service.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>Ready to Find Your Perfect Case?</h2>
        <p className={styles.ctaText}>
          Explore our collection and discover phone cases that match your style and personality
        </p>
        <div className={styles.ctaButtons}>
          <Link href="/shop" className={styles.ctaButton}>
            Shop Now
          </Link>
          <Link href="/contact" className={styles.ctaButtonOutline}>
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}
