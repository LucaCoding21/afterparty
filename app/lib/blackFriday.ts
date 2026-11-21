/**
 * Black Friday 2026: free shipping at lower thresholds and the free Nhím
 * Keycap Clicker on every order, 27/11 to 30/11 Vietnam time (the store's
 * timezone).
 *
 * Checkout prices come from the "Free Nhím Keycap Clicker" discount in
 * Shopify admin, whose keycap-gift function (shopify-app/) has the same
 * window and thresholds in its `promo` mode. Change both together.
 *
 * Before the sale starts, a preview link turns it on for one browser only
 * (see blackFriday.server.ts), so the cart and checkout can be checked
 * without the live site changing.
 */
export const BLACK_FRIDAY_STARTS = Date.parse('2026-11-27T00:00:00+07:00');
export const BLACK_FRIDAY_ENDS = Date.parse('2026-12-01T00:00:00+07:00');

/**
 * Free shipping threshold per cart currency during the sale, measured like
 * the keycap gift: on the cart without keycaps. Vietnam ships free on every
 * order.
 */
export const BLACK_FRIDAY_FREE_SHIPPING: Record<string, number> = {
  VND: 0,
  KRW: 100_000,
  JPY: 10_000,
  AUD: 100,
  USD: 100,
};

export type BlackFriday = {
  /** The sale rules apply to this visitor: the sale is live, or previewed. */
  on: boolean;
  /** On only because of a preview link, before the sale starts. */
  preview: boolean;
};
