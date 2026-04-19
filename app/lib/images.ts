/**
 * Appends Shopify CDN transform params to an image URL. Shopify's CDN
 * serves a resized/re-encoded version on the fly, so a 6MB 3600px original
 * becomes a ~150KB WebP when requested at width=1200.
 *
 * Safe to pass non-Shopify URLs — they are returned unchanged.
 */
export function shopifyImg(
  url: string | undefined | null,
  opts: {width: number; format?: 'webp' | 'jpg' | 'png'} = {width: 1200},
): string {
  if (!url) return '';
  if (!url.includes('cdn.shopify.com')) return url;
  try {
    const u = new URL(url);
    u.searchParams.set('width', String(opts.width));
    if (opts.format) u.searchParams.set('format', opts.format);
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Kick off a background fetch so the browser+CDN cache the transformed version
 * before the UI needs to display it. Matches the params Hydrogen's <Image>
 * uses for the cart thumbnail (120x120 square, center-cropped).
 */
export function preloadCartThumbnail(url: string | undefined | null): void {
  if (!url || typeof window === 'undefined') return;
  if (!url.includes('cdn.shopify.com')) return;
  try {
    const u = new URL(url);
    u.searchParams.set('width', '120');
    u.searchParams.set('height', '120');
    u.searchParams.set('crop', 'center');
    const img = new window.Image();
    img.src = u.toString();
  } catch {
    // noop — preload is best-effort
  }
}
