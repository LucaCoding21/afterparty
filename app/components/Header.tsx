import {Suspense, useState, useRef, useEffect} from 'react';
import {Await, NavLink, useAsyncValue} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {HeaderQuery, CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {SEARCH_ENDPOINT} from '~/components/SearchFormPredictive';

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
  return (
    <div className="header-wrapper">
      {/* Main nav row */}
      <header className="header">
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

        <nav className="header-nav-right">
          <HeaderSearch />
          <NavLink to="/pages/support" className="header-nav-link" prefetch="intent">
            Support <span aria-hidden="true">&rsaquo;</span>
          </NavLink>
          <CartToggle cart={cart} />
        </nav>

        {/* Mobile toggle */}
        <HeaderMenuMobileToggle />
      </header>

    </div>
  );
}

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
      <NavLink end onClick={close} prefetch="intent" className="header-mobile-item" to="/">
        Home
      </NavLink>
      <NavLink onClick={close} prefetch="intent" className="header-mobile-item" to="/collections/all">
        Shop All
      </NavLink>
      <NavLink onClick={close} prefetch="intent" className="header-mobile-item" to="/blogs">
        Lookbook
      </NavLink>
      <NavLink onClick={close} prefetch="intent" className="header-mobile-item" to="/pages/about">
        About Us
      </NavLink>
      <NavLink onClick={close} prefetch="intent" className="header-mobile-item" to="/search">
        Search
      </NavLink>
      {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
        if (!item.url) return null;
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;
        return (
          <NavLink
            className="header-mobile-item"
            end
            key={item.id}
            onClick={close}
            prefetch="intent"
            to={url}
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <button
      className="header-mobile-toggle reset"
      onClick={() => open('mobile')}
      aria-label="Menu"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="4" y1="7" x2="20" y2="7" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="17" x2="20" y2="17" />
      </svg>
    </button>
  );
}

function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  return (
    <div ref={containerRef} className="header-search-container">
      <button
        className="header-nav-link header-search-link reset"
        aria-label="Search"
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
      {open && (
        <form action={SEARCH_ENDPOINT} method="get" className="header-search-form">
          <input
            ref={inputRef}
            name="q"
            type="search"
            placeholder="search"
            className="header-search-input"
          />
        </form>
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
