'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import styles from './SearchBar.module.css';

interface SearchResult {
  id: number;
  name: string;
  slug: string;
  type: 'category' | 'product';
  category_slug?: string;
}

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Search on query change
  useEffect(() => {
    if (query.trim().length > 0) {
      const timer = setTimeout(() => {
        performSearch(query);
      }, 300); // Debounce

      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'category') {
      router.push(`/shop?category=${result.slug}`);
    } else {
      // For products, use category_slug if available, otherwise go to shop
      if (result.category_slug) {
        router.push(`/shop/${result.category_slug}/${result.slug}`);
      } else {
        router.push(`/shop`);
      }
    }
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
  };

  return (
    <div className={styles.searchContainer} ref={searchRef}>
      {/* Search Icon Button */}
      <button
        className={styles.searchButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Search"
      >
        <Search size={20} />
      </button>

      {/* Search Overlay */}
      {isOpen && (
        <div className={styles.searchOverlay}>
          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} size={20} />
            <input
              type="text"
              placeholder="Search categories, products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={styles.searchInput}
              autoFocus
            />
            {query && (
              <button
                onClick={handleClear}
                className={styles.clearButton}
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className={styles.resultsContainer}>
              {results.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className={styles.resultItem}
                  onClick={() => handleResultClick(result)}
                >
                  <div className={styles.resultType}>
                    {result.type === 'category' ? '📁' : '📦'}
                  </div>
                  <div className={styles.resultInfo}>
                    <div className={styles.resultName}>{result.name}</div>
                    <div className={styles.resultSlug}>
                      {result.type === 'category' ? 'Category' : 'Product'} · {result.slug}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className={styles.loadingState}>Searching...</div>
          )}

          {/* No Results */}
          {!loading && query.trim().length > 0 && results.length === 0 && (
            <div className={styles.emptyState}>
              No results found for "{query}"
            </div>
          )}

          {/* Initial State */}
          {!loading && query.trim().length === 0 && (
            <div className={styles.emptyState}>
              Type to search categories and products
            </div>
          )}
        </div>
      )}
    </div>
  );
}
