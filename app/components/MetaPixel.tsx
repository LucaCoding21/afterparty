import {useEffect} from 'react';
import {parseGid, useAnalytics} from '@shopify/hydrogen';
import {isKeycapGiftLine} from '~/lib/keycapGift';

const META_PIXEL_ID = '27001286839553531';

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: Fbq;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/**
 * Meta (Facebook/Instagram) pixel, fed by Hydrogen's analytics events instead
 * of Meta's usual inline snippet:
 *
 * - The storefront navigates client-side, so the snippet's single PageView
 *   would only count the first page. `page_viewed` fires on every navigation.
 * - Analytics.Provider only publishes once the Customer Privacy API says the
 *   visitor can be tracked, so the pixel follows Shopify's consent settings.
 *   fbevents.js isn't downloaded until the first event it's allowed to see.
 *
 * Checkout runs on Shopify's domain and never reaches this component, so
 * InitiateCheckout and Purchase have to come from Shopify admin (the Facebook &
 * Instagram app connected to this same pixel, or a custom pixel under
 * Settings > Customer events).
 *
 * The CSP in entry.server.tsx allows connect.facebook.net (the script) and
 * www.facebook.com (where events are sent).
 */
export function MetaPixel() {
  const {subscribe, register} = useAnalytics();
  const {ready} = register('Meta Pixel');

  useEffect(() => {
    subscribe('page_viewed', () => {
      track('PageView');
    });

    subscribe('product_viewed', ({products, shop}) => {
      const product = products[0];
      if (!product) return;
      track('ViewContent', {
        content_ids: [parseGid(product.variantId).id],
        content_name: product.title,
        content_type: 'product',
        value: Number(product.price),
        currency: shop?.currency,
      });
    });

    subscribe('product_added_to_cart', ({currentLine, prevLine}) => {
      // The free keycap is put in the cart by syncKeycapGift, not the shopper.
      if (!currentLine || isKeycapGiftLine(currentLine)) return;
      const quantity = currentLine.quantity - (prevLine?.quantity ?? 0);
      const {merchandise} = currentLine;
      const id = parseGid(merchandise.id).id;
      track('AddToCart', {
        content_ids: [id],
        content_name: merchandise.product.title,
        content_type: 'product',
        contents: [{id, quantity}],
        value: Number(merchandise.price.amount) * quantity,
        currency: merchandise.price.currencyCode,
      });
    });

    subscribe('search_viewed', ({searchTerm}) => {
      track('Search', {search_string: searchTerm});
    });

    ready();
  }, [ready, subscribe]);

  return null;
}

function track(event: string, params?: Record<string, unknown>) {
  (window.fbq ?? loadPixel())('track', event, params);
}

/** Meta's base snippet: queue calls until fbevents.js loads and drains them. */
function loadPixel() {
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq ??= fbq;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  fbq('init', META_PIXEL_ID);
  return fbq;
}
