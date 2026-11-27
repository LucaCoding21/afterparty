/**
 * Long pants fill almost the whole photo top to bottom, so the square
 * catalog card on desktop crops off the waistband and hems and makes them
 * look bigger than everything else. Cards for long pants get
 * `product-item--full-length`, which shows the whole photo on desktop
 * (see app.css). Decided by name so new pants look right with no code or
 * Shopify admin change.
 */
// No leading \b so "Sweatpants" and "Trackpants" match too.
const FULL_LENGTH = /(pants|jeans|trousers|joggers)\b/i;
const SHORTS = /\bshorts\b/i;

export function isFullLengthPants(title: string | null | undefined): boolean {
  if (!title) return false;
  return FULL_LENGTH.test(title) && !SHORTS.test(title);
}

/** className for a catalog card (`.product-item`). */
export function productItemClass(title: string | null | undefined): string {
  return isFullLengthPants(title)
    ? 'product-item product-item--full-length'
    : 'product-item';
}
