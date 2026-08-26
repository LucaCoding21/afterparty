/**
 * Builds the standard set of head tags for a page: title, canonical, Open Graph,
 * and Twitter card. Each route's meta() spreads the result and appends
 * route-specific extras (preloads, JSON-LD, etc.).
 *
 * Descriptions are deliberately NOT emitted anywhere on the site. Share cards
 * are meant to read as brand name + image only, so no meta description,
 * og:description or twitter:description is set. Routes that still need
 * description text for structured data compute it locally and pass it to their
 * own JSON-LD.
 *
 * Pass `url` as a path (e.g. "/products/foo"); platforms accept relative
 * canonicals and og:urls, and we don't always have the absolute origin in meta.
 */

export const SITE_ORIGIN = 'https://www.afterparty.space';

/**
 * Fallback share image for pages with no image of their own.
 *
 * Absolute on purpose: crawlers resolve og:image independently of the page they
 * found it on, so a relative path (or a localhost origin in dev) produces a card
 * with no image.
 *
 * Served from Shopify's CDN rather than /public deliberately. Static images on
 * the Oxygen origin answer GET with 200 but HEAD with 404, because they route
 * through Oxygen's imagery layer, and unfurlers that probe with HEAD before
 * downloading skip the image entirely. cdn.shopify.com answers HEAD with 200.
 * Keep the ?v= cache key: the URL is unreliable without it.
 */
export const DEFAULT_OG_IMAGE =
  'https://cdn.shopify.com/s/files/1/0726/2247/3285/files/IMG_1420.png?v=1787729785';

export type SeoTagInput = {
  title: string;
  image?: string | null;
  url: string;
  type?: 'website' | 'product' | 'article';
};

export function seoTags({
  title,
  image,
  url,
  type = 'website',
}: SeoTagInput): any[] {
  const share = image || DEFAULT_OG_IMAGE;
  // og:url must be absolute: platforms treat it as the canonical identity of the
  // shared object and resolve it independently of the page they crawled, so a
  // path alone can cost the card. `canonical` stays relative on purpose, since
  // Google resolves those against the current origin and rewriting it would
  // touch a live SEO surface for no gain.
  const canonicalUrl = url.startsWith('http') ? url : `${SITE_ORIGIN}${url}`;
  return [
    {title},
    {tagName: 'link', rel: 'canonical', href: url},
    {property: 'og:title', content: title},
    {property: 'og:type', content: type},
    {property: 'og:url', content: canonicalUrl},
    {property: 'og:site_name', content: 'afterparty'},
    {property: 'og:image', content: share},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: title},
    {name: 'twitter:image', content: share},
  ];
}

/** Best-effort plain-text from HTML description, trimmed for meta tag length. */
export function stripHtml(html: string, max = 200): string {
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}
