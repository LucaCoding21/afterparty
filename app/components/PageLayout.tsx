import {Await, useLocation} from 'react-router';
import {Suspense} from 'react';
import type {
  CartApiQueryFragment,
  HeaderQuery,
} from 'storefrontapi.generated';
import {Aside} from '~/components/Aside';
import {Footer} from '~/components/Footer';
import {Header, ShopSubnav} from '~/components/Header';
import {CartMain} from '~/components/CartMain';

type SearchCatalogItem = {handle: string; title: string; image: string; price?: {amount: string; currencyCode: string}};

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  footer?: unknown;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  searchCatalog?: SearchCatalogItem[];
  children?: React.ReactNode;
}

export function PageLayout({
  cart,
  children = null,
  header,
  isLoggedIn,
  publicStoreDomain,
  searchCatalog = [],
}: PageLayoutProps) {
  const location = useLocation();
  const isCollectionPage = location.pathname.startsWith('/collections');

  return (
    <Aside.Provider>
      <CartAside cart={cart} />
      {header && (
        <Header
          header={header}
          cart={cart}
          isLoggedIn={isLoggedIn}
          publicStoreDomain={publicStoreDomain}
          searchCatalog={searchCatalog}
        />
      )}
      {isCollectionPage && <ShopSubnav />}
      <main>{children}</main>
      <Footer />
    </Aside.Provider>
  );
}

function CartAside({cart}: {cart: PageLayoutProps['cart']}) {
  return (
    <Aside type="cart" heading="CART">
      <Suspense fallback={<p>Loading cart ...</p>}>
        <Await resolve={cart}>
          {(cart) => {
            return <CartMain cart={cart} layout="aside" />;
          }}
        </Await>
      </Suspense>
    </Aside>
  );
}

