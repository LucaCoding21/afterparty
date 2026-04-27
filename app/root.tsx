import {Analytics, getShopAnalytics, useNonce} from '@shopify/hydrogen';
import {useEffect} from 'react';
import {
  Outlet,
  useRouteError,
  isRouteErrorResponse,
  type ShouldRevalidateFunction,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
  useLocation,
} from 'react-router';
import type {Route} from './+types/root';
import {FOOTER_QUERY, HEADER_QUERY} from '~/lib/fragments';
import resetStyles from '~/styles/reset.css?url';
import appStyles from '~/styles/app.css?url';
import {PageLayout} from './components/PageLayout';

export type RootLoader = typeof loader;

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') return true;

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) return true;

  // Defaulting to no revalidation for root loader data to improve performance.
  // When using this feature, you risk your UI getting out of sync with your server.
  // Use with caution. If you are uncomfortable with this optimization, update the
  // line below to `return defaultShouldRevalidate` instead.
  // For more details see: https://remix.run/docs/en/main/route/should-revalidate
  return false;
};

export const meta: Route.MetaFunction = ({data}) => {
  const origin = (data as {origin?: string} | undefined)?.origin ?? 'https://afterparty.space';
  const image = `${origin}/AboutUs-Afterparty.jpg`;
  const title = 'afterparty';
  const description =
    'afterparty, streetwear from Ho Chi Minh City (Saigon), Vietnam. Limited drops and signature graphics.';
  return [
    {title},
    {name: 'description', content: description},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:image', content: image},
    {property: 'og:type', content: 'website'},
    {property: 'og:site_name', content: 'afterparty'},
    {property: 'og:locale', content: 'en_US'},
    {property: 'og:url', content: origin},
    {tagName: 'link', rel: 'canonical', href: origin},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: title},
    {name: 'twitter:description', content: description},
    {name: 'twitter:image', content: image},
    // Organization schema — anchors the brand to Ho Chi Minh City for Google's
    // entity graph and powers any future Knowledge Panel.
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'afterparty',
        alternateName: 'afterparty.space',
        url: origin,
        logo: `${origin}/logo.png`,
        image,
        description,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Ho Chi Minh City',
          addressCountry: 'VN',
        },
        sameAs: [
          'https://www.instagram.com/afterparty.space/',
          'https://www.facebook.com/afterparty.space/',
        ],
      },
    },
    // WebSite + SearchAction — declares the site's search endpoint to AI
    // agents and Google so they can deep-link queries (e.g. ChatGPT can
    // suggest "search afterparty.space for X" with a working URL).
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'afterparty',
        url: origin,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${origin}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    },
  ];
};

/**
 * The main and reset stylesheets are added in the Layout component
 * to prevent a bug in development HMR updates.
 *
 * This avoids the "failed to execute 'insertBefore' on 'Node'" error
 * that occurs after editing and navigating to another page.
 *
 * It's a temporary fix until the issue is resolved.
 * https://github.com/remix-run/remix/issues/9242
 */
export function links() {
  return [
    {
      rel: 'preconnect',
      href: 'https://rsms.me',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'stylesheet',
      href: 'https://rsms.me/inter/inter.css',
    },
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
    {
      rel: 'preload',
      as: 'image',
      href: '/Mobile_sprite_a.webp',
      type: 'image/webp',
      media: '(max-width: 48em)',
      fetchPriority: 'high',
    },
    {
      rel: 'preload',
      as: 'image',
      href: '/Mobile_sprite_b.webp',
      type: 'image/webp',
      media: '(max-width: 48em)',
      fetchPriority: 'low',
    },
    {rel: 'icon', type: 'image/x-icon', href: '/favicon.ico'},
    {rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png'},
    {rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png'},
    {rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png'},
    {rel: 'manifest', href: '/site.webmanifest'},
  ];
}

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  const {storefront, env} = args.context;

  return {
    ...deferredData,
    ...criticalData,
    publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
    shop: getShopAnalytics({
      storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    }),
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: false,
      // localize the privacy banner
      country: args.context.storefront.i18n.country,
      language: args.context.storefront.i18n.language,
    },
  };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const {storefront} = context;
  const origin = new URL(request.url).origin;

  const [header, {products}] = await Promise.all([
    storefront.query(HEADER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {
        headerMenuHandle: 'main-menu',
      },
    }),
    storefront.query(SEARCH_CATALOG_QUERY, {
      cache: storefront.CacheLong(),
    }),
  ]);

  // Lightweight product index for instant client-side search
  const searchCatalog = products.nodes.map((p: any) => ({
    handle: p.handle,
    title: p.title,
    image: p.variants?.nodes?.[0]?.image?.url || p.featuredImage?.url || '',
    price: p.variants?.nodes?.[0]?.price,
  }));

  return {header, searchCatalog, origin};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  const {storefront, customerAccount, cart} = context;

  // defer the footer query (below the fold)
  const footer = storefront
    .query(FOOTER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {
        footerMenuHandle: 'footer', // Adjust to your footer menu handle
      },
    })
    .catch((error: Error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });
  return {
    cart: cart.get(),
    isLoggedIn: customerAccount.isLoggedIn(),
    footer,
  };
}

export function Layout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href={resetStyles}></link>
        <link rel="stylesheet" href={appStyles}></link>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  const data = useRouteLoaderData<RootLoader>('root');
  const location = useLocation();
  const isHome = location.pathname === '/';

  // Mark the document as hydrated so CSS transitions become active. This
  // is gated in app.css (body.hydrated) to prevent first-paint transition
  // flashes on slow devices (iOS Low Power Mode in particular): without
  // this, elements like the mobile menu overlay can briefly render at
  // their pre-CSS default before the transform rule applies, then visibly
  // animate to their hidden position when the rule catches up.
  useEffect(() => {
    document.body.classList.add('hydrated');
  }, []);

  if (!data) {
    return <Outlet />;
  }

  return (
    <Analytics.Provider
      cart={data.cart}
      shop={data.shop}
      consent={data.consent}
    >
      <PageLayout {...data}>
        <Outlet />
      </PageLayout>
    </Analytics.Provider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let errorMessage = 'Unknown error';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error?.data?.message ?? error.data;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="route-error">
      <h1>Oops</h1>
      <h2>{errorStatus}</h2>
      {errorMessage && (
        <fieldset>
          <pre>{errorMessage}</pre>
        </fieldset>
      )}
    </div>
  );
}

const SEARCH_CATALOG_QUERY = `#graphql
  query SearchCatalog($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 50) {
      nodes {
        handle
        title
        featuredImage { url }
        variants(first: 1) {
          nodes {
            image { url }
            price { amount currencyCode }
          }
        }
      }
    }
  }
` as const;
