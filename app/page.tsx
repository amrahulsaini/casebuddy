import Link from 'next/link';
import Image from 'next/image';
import caseMainPool from '@/lib/db-main';

interface Category {
  id: number;
  name: string;
  slug: string;
  image_url: string;
  sort_order: number;
}

async function getCategories() {
  try {
    const [rows] = await caseMainPool.execute<any[]>(
      'SELECT id, name, slug, image_url, sort_order FROM categories WHERE is_active = TRUE ORDER BY sort_order ASC'
    );
    return rows as Category[];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default async function HomePage() {
  const allCategories = await getCategories();
  const customDesignedCases = allCategories.slice(0, 8);
  const ourCategories = allCategories.slice(8);

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Sora', sans-serif", background: '#fff' }}>
      {/* Header */}
      <header style={{ 
        background: '#000', 
        color: '#fff', 
        padding: '1rem 2rem',
        borderBottom: '3px solid #ff6b00',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <nav style={{ 
          maxWidth: '1400px', 
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ 
              margin: 0, 
              fontSize: '1.8rem',
              background: 'linear-gradient(135deg, #ff6b00 0%, #ff9500 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 700
            }}>
              CaseBuddy
            </h1>
          </Link>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Home</Link>
            <Link href="/shop" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Shop</Link>
            <Link 
              href="https://casetool.casebuddy.co.in" 
              style={{ 
                background: 'linear-gradient(135deg, #ff6b00 0%, #ff9500 100%)',
                color: '#fff',
                padding: '0.5rem 1.5rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              AI Tool
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)',
        color: '#fff',
        padding: '5rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '3.5rem', 
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #ff6b00 0%, #ff9500 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 700,
            lineHeight: 1.2
          }}>
            Premium Custom Phone Cases
          </h2>
          <p style={{ fontSize: '1.3rem', marginBottom: '2.5rem', color: '#ccc', lineHeight: 1.6 }}>
            Protect your phone with style. Browse our exclusive collection of designer cases.
          </p>
          <Link 
            href="/shop" 
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #ff6b00 0%, #ff9500 100%)',
              color: '#fff',
              padding: '1.2rem 3rem',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '1.2rem',
              boxShadow: '0 8px 24px rgba(255, 107, 0, 0.3)',
              transition: 'transform 0.2s'
            }}
          >
            Shop Now →
          </Link>
        </div>
      </section>

      {/* Section 1: Our Custom Designed Cases */}
      <section style={{ padding: '5rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <h3 style={{ 
          fontSize: '2.5rem', 
          textAlign: 'center', 
          marginBottom: '3rem',
          fontWeight: 700,
          color: '#000'
        }}>
          Our Custom Designed Cases
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '2rem'
        }}>
          {customDesignedCases.map((category) => (
            <Link 
              key={category.id}
              href={`/shop/${category.slug}`}
              style={{
                display: 'block',
                background: '#fff',
                borderRadius: '16px',
                overflow: 'hidden',
                textDecoration: 'none',
                color: '#000',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ position: 'relative', width: '100%', height: '280px', overflow: 'hidden' }}>
                <Image 
                  src={category.image_url} 
                  alt={category.name}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>{category.name}</h4>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Section 2: Our Categories */}
      <section style={{ padding: '5rem 2rem', maxWidth: '1400px', margin: '0 auto', background: '#f9f9f9' }}>
        <h3 style={{ 
          fontSize: '2.5rem', 
          textAlign: 'center', 
          marginBottom: '3rem',
          fontWeight: 700,
          color: '#000'
        }}>
          Our Categories
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '2rem'
        }}>
          {ourCategories.map((category) => (
            <Link 
              key={category.id}
              href={`/shop/${category.slug}`}
              style={{
                display: 'block',
                background: '#fff',
                borderRadius: '16px',
                overflow: 'hidden',
                textDecoration: 'none',
                color: '#000',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ position: 'relative', width: '100%', height: '280px', overflow: 'hidden' }}>
                <Image 
                  src={category.image_url} 
                  alt={category.name}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>{category.name}</h4>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* AI Tool CTA */}
      <section style={{
        background: 'linear-gradient(135deg, #ff6b00 0%, #ff9500 100%)',
        color: '#fff',
        padding: '4rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 700 }}>
            Need Custom Mockups?
          </h3>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.95 }}>
            Use our AI-powered tool to generate professional case mockups instantly
          </p>
          <Link 
            href="https://casetool.casebuddy.co.in"
            style={{
              display: 'inline-block',
              background: '#fff',
              color: '#ff6b00',
              padding: '1.2rem 3rem',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '1.2rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }}
          >
            Try AI Tool Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#000',
        color: '#fff',
        padding: '3rem 2rem',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0, color: '#aaa', fontSize: '1rem' }}>
          © 2025 CaseBuddy. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
