/**
 * Long pants fill almost the whole photo top to bottom, so the square
 * catalog card's default crop cuts off the waistband and hems and makes
 * them look bigger than the other bottoms. Their cards get
 * `product-item--full-length`, which shows the whole photo instead (see
 * app.css).
 *
 * Matched by product name, so a new pair of pants needs no code change:
 * anything called pants, jeans, trousers or joggers (sweatpants and track
 * pants included), unless it is shorts. A long-pants product named without
 * one of those words would still get the cropped card; add the word here.
 */
const FULL_LENGTH = /(pants|jeans|trousers|joggers)\b/i;
const NOT_FULL_LENGTH = /shorts/i;

export function isFullLengthBottom(title?: string | null) {
  return Boolean(
    title && FULL_LENGTH.test(title) && !NOT_FULL_LENGTH.test(title),
  );
}

/** Class name for a catalog card (`.product-item`). */
export function productItemClass(title?: string | null) {
  return isFullLengthBottom(title)
    ? 'product-item product-item--full-length'
    : 'product-item';
}
