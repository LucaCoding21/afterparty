import {Suspense, useState, useRef, useEffect, useMemo} from 'react';
import {Await, NavLink, useAsyncValue, useNavigate} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {SEARCH_ENDPOINT} from '~/components/SearchFormPredictive';
import {STATIC_PRODUCTS} from '~/lib/staticProducts';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';

export function Header({
  header,
  isLoggedIn,
  cart,
  publicStoreDomain,
}: HeaderProps) {
  const {shop, menu} = header;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchBtnRef = useRef<HTMLButtonElement>(null);

  const mobileSearchResults = useMemo(() => {
    if (!mobileSearchQuery.trim()) return [];
    const q = mobileSearchQuery.toLowerCase();
    return STATIC_PRODUCTS.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.replace(/-/g, ' ').toLowerCase().includes(q),
    ).slice(0, 6);
  }, [mobileSearchQuery]);

  function closeMobileSearch() {
    setMobileSearchOpen(false);
    setMobileSearchQuery('');
  }

  useEffect(() => {
    if (!mobileSearchOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(e.target as Node) &&
        mobileSearchBtnRef.current &&
        !mobileSearchBtnRef.current.contains(e.target as Node)
      ) {
        closeMobileSearch();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileSearchOpen]);

  function toggleMobileSearch() {
    if (mobileSearchOpen) {
      closeMobileSearch();
    } else {
      setMobileSearchOpen(true);
      setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
    }
  }

  // Lock body scroll when menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Close on ESC
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <div className="header-wrapper">
      <header className="header">
        {/* Desktop left nav */}
        <nav className="header-nav-left">
          <NavLink
            to="/collections/all"
            className={() => 'header-nav-link'}
            prefetch="intent"
          >
            Shop All
          </NavLink>
          <NavLink to="/blogs" className="header-nav-link" prefetch="intent">
            Lookbook
          </NavLink>
          <NavLink to="/pages/stockists" className="header-nav-link" prefetch="intent">
            Locations
          </NavLink>
          <NavLink to="/pages/about" className="header-nav-link" prefetch="intent">
            About Us
          </NavLink>
        </nav>

        <NavLink to="/" className="header-wordmark" prefetch="intent" end>
          <img src="/logo.png" alt="afterparty" className="header-logo-img" />
        </NavLink>

        {/* Desktop right nav */}
        <nav className="header-nav-right">
          <HeaderSearch />
          <NavLink to="/pages/support" className="header-nav-link" prefetch="intent">
            Support <span aria-hidden="true">&rsaquo;</span>
          </NavLink>
          <CartToggle cart={cart} />
        </nav>

        {/* Mobile right cluster: search + cart + hamburger */}
        <div className="header-mobile-right">
          <button
            ref={mobileSearchBtnRef}
            className="header-mobile-search-btn reset"
            aria-label="Open search"
            onClick={toggleMobileSearch}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <MobileCartToggle cart={cart} />
          <button
            className="header-mobile-hamburger reset"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <span className={`hamburger-icon${mobileOpen ? ' is-open' : ''}`}>
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </header>

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div ref={mobileSearchRef} className="mobile-search-overlay">
          <form action={SEARCH_ENDPOINT} method="get" className="mobile-search-form">
            <div className="mobile-search-input-wrap">
              <input
                ref={mobileSearchInputRef}
                name="q"
                type="search"
                placeholder="Search products..."
                className="mobile-search-input"
                value={mobileSearchQuery}
                onChange={(e) => setMobileSearchQuery(e.target.value)}
                autoComplete="off"
              />
              {mobileSearchQuery.length > 0 && (
                <button
                  type="button"
                  className="mobile-search-clear reset"
                  aria-label="Clear search"
                  onClick={() => {
                    setMobileSearchQuery('');
                    mobileSearchInputRef.current?.focus();
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </form>
          {mobileSearchQuery.trim().length > 0 && (
            <div className="mobile-search-results">
              {mobileSearchResults.length > 0 ? (
                <>
                  {mobileSearchResults.map((product) => (
                    <a
                      key={product.handle}
                      href={`/products/${product.handle}`}
                      className="mobile-search-result"
                      onClick={closeMobileSearch}
                    >
                      <img src={product.colors[0].image} alt={product.title} className="mobile-search-result-img" />
                      <div className="mobile-search-result-info">
                        <span className="mobile-search-result-title">{product.title}</span>
                        <span className="mobile-search-result-price">{product.price}</span>
                      </div>
                    </a>
                  ))}
                  <a
                    href={`${SEARCH_ENDPOINT}?q=${encodeURIComponent(mobileSearchQuery)}`}
                    className="mobile-search-view-all"
                    onClick={closeMobileSearch}
                  >
                    See all results for &ldquo;{mobileSearchQuery}&rdquo; &rarr;
                  </a>
                </>
              ) : (
                <div className="mobile-search-no-results">No products found for &ldquo;{mobileSearchQuery}&rdquo;</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mobile full-screen menu */}
      <div
        className={`mobile-menu-overlay${mobileOpen ? ' is-open' : ''}`}
        aria-hidden={!mobileOpen}
        aria-modal={mobileOpen}
        role="dialog"
      >
        {/* Menu header row */}
        <div className="mobile-menu-header">
          <NavLink to="/" className="mobile-menu-logo" onClick={closeMobile} prefetch="intent">
            <img src="/logo.png" alt="afterparty" />
          </NavLink>
          <button
            className="mobile-menu-close reset"
            onClick={closeMobile}
            aria-label="Close menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Menu body */}
        <nav className="mobile-menu-nav">
          <div className="mobile-menu-sections">
            {/* Shop */}
            <div className="mobile-menu-section">
              <p className="mobile-menu-section-label">Shop</p>
              <NavLink to="/collections/all" className={({isActive}) => `mobile-menu-link${isActive ? ' active' : ''}`} onClick={closeMobile} prefetch="intent">
                All Products
              </NavLink>
              <NavLink to="/collections/tops-shirts" className={({isActive}) => `mobile-menu-link${isActive ? ' active' : ''}`} onClick={closeMobile} prefetch="intent">
                Tops &amp; Shirts
              </NavLink>
              <NavLink to="/collections/outerwear" className={({isActive}) => `mobile-menu-link${isActive ? ' active' : ''}`} onClick={closeMobile} prefetch="intent">
                Outerwear
              </NavLink>
              <NavLink to="/collections/pants" className={({isActive}) => `mobile-menu-link${isActive ? ' active' : ''}`} onClick={closeMobile} prefetch="intent">
                Pants
              </NavLink>
              <NavLink to="/collections/accessories" className={({isActive}) => `mobile-menu-link${isActive ? ' active' : ''}`} onClick={closeMobile} prefetch="intent">
                Accessories
              </NavLink>
            </div>

            {/* Discover */}
            <div className="mobile-menu-section">
              <p className="mobile-menu-section-label">Discover</p>
              <NavLink to="/blogs" className={({isActive}) => `mobile-menu-link${isActive ? ' active' : ''}`} onClick={closeMobile} prefetch="intent">
                Lookbook
              </NavLink>
              <NavLink to="/pages/about" className={({isActive}) => `mobile-menu-link${isActive ? ' active' : ''}`} onClick={closeMobile} prefetch="intent">
                About Us
              </NavLink>
              <NavLink to="/pages/stockists" className={({isActive}) => `mobile-menu-link${isActive ? ' active' : ''}`} onClick={closeMobile} prefetch="intent">
                Locations
              </NavLink>
            </div>
          </div>

          {/* Footer links */}
          <div className="mobile-menu-bottom">
            <NavLink to="/pages/support" className="mobile-menu-footer-link" onClick={closeMobile} prefetch="intent">
              Support
            </NavLink>
            <NavLink to="/search" className="mobile-menu-footer-link" onClick={closeMobile} prefetch="intent">
              Search
            </NavLink>
          </div>
        </nav>
      </div>
    </div>
  );
}

// Kept for any external references but no longer used for mobile menu
export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
  viewport: Viewport;
  publicStoreDomain: HeaderProps['publicStoreDomain'];
}) {
  const {close} = useAside();
  return (
    <nav className="header-menu-mobile" role="navigation">
      <NavLink end onClick={close} prefetch="intent" className="header-mobile-item" to="/">Home</NavLink>
      <NavLink onClick={close} prefetch="intent" className="header-mobile-item" to="/collections/all">Shop All</NavLink>
      <NavLink onClick={close} prefetch="intent" className="header-mobile-item" to="/blogs">Lookbook</NavLink>
      <NavLink onClick={close} prefetch="intent" className="header-mobile-item" to="/pages/about">About Us</NavLink>
      <NavLink onClick={close} prefetch="intent" className="header-mobile-item" to="/search">Search</NavLink>
    </nav>
  );
}

function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return STATIC_PRODUCTS.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.replace(/-/g, ' ').toLowerCase().includes(q),
    ).slice(0, 6);
  }, [query]);

  const showDropdown = open && query.trim().length > 0;

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery('');
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      e.preventDefault();
      void navigate(`/products/${results[activeIndex].handle}`);
      setOpen(false);
      setQuery('');
    }
  }

  function close() {
    setOpen(false);
    setQuery('');
  }

  return (
    <div ref={containerRef} className="header-search-container">
      <button
        className="header-nav-link header-search-link reset"
        aria-label={open ? 'Close search' : 'Open search'}
        onClick={() => {
          if (open) {
            close();
          } else {
            setOpen(true);
          }
        }}
      >
        {open ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        )}
      </button>

      <div className={`header-search-panel${open ? ' open' : ''}`}>
        <form action={SEARCH_ENDPOINT} method="get" className="header-search-form">
          <input
            ref={inputRef}
            name="q"
            type="search"
            placeholder="Search products..."
            className="header-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            tabIndex={open ? 0 : -1}
          />
        </form>
      </div>

      {showDropdown && (
        <div className="header-search-dropdown" role="listbox">
          {results.length > 0 ? (
            <>
              {results.map((product, i) => (
                <a
                  key={product.handle}
                  href={`/products/${product.handle}`}
                  className={`header-search-result${i === activeIndex ? ' active' : ''}`}
                  onClick={close}
                  role="option"
                  aria-selected={i === activeIndex}
                >
                  <img
                    src={product.colors[0].image}
                    alt={product.title}
                    className="header-search-result-img"
                  />
                  <div className="header-search-result-info">
                    <span className="header-search-result-title">{product.title}</span>
                    <span className="header-search-result-price">{product.price}</span>
                  </div>
                </a>
              ))}
              <a
                href={`${SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}`}
                className="header-search-view-all"
                onClick={close}
              >
                See all results for &ldquo;{query}&rdquo; &rarr;
              </a>
            </>
          ) : (
            <div className="header-search-no-results">
              No products found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CartBadge({count}: {count: number | null}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <a
      href="/cart"
      className="header-nav-link"
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
    >
      Cart ({count ?? 0})
    </a>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={null} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

/* ── Mobile cart icon ── */
function MobileCartBadge({count}: {count: number | null}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <button
      className="header-mobile-cart-btn reset"
      aria-label={`Cart, ${count ?? 0} items`}
      onClick={() => {
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
      {count !== null && count > 0 && (
        <span className="header-mobile-cart-count">{count}</span>
      )}
    </button>
  );
}

function MobileCartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return <MobileCartBadge count={cart?.totalQuantity ?? 0} />;
}

function MobileCartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<MobileCartBadge count={null} />}>
      <Await resolve={cart}>
        <MobileCartBanner />
      </Await>
    </Suspense>
  );
}

export function ShopSubnav() {
  return (
    <nav className="header-subnav">
      <NavLink to="/collections/all" className={({isActive}) => `header-subnav-link ${isActive ? 'active' : ''}`} prefetch="intent" end>
        All Products
      </NavLink>
      <NavLink to="/collections/tops-shirts" className={({isActive}) => `header-subnav-link ${isActive ? 'active' : ''}`} prefetch="intent">
        Tops & Shirts
      </NavLink>
      <NavLink to="/collections/outerwear" className={({isActive}) => `header-subnav-link ${isActive ? 'active' : ''}`} prefetch="intent">
        Outerwear
      </NavLink>
      <NavLink to="/collections/pants" className={({isActive}) => `header-subnav-link ${isActive ? 'active' : ''}`} prefetch="intent">
        Pants
      </NavLink>
      <NavLink to="/collections/accessories" className={({isActive}) => `header-subnav-link ${isActive ? 'active' : ''}`} prefetch="intent">
        Accessories
      </NavLink>
    </nav>
  );
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
      items: [],
    },
  ],
};
