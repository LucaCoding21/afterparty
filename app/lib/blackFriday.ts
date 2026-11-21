/**
 * Black Friday 2026: free shipping at lower thresholds and the free Nhím
 * Keycap Clicker on every order, 27/11 00:00 to 30/11 23:59 in the
 * customer's local time.
 *
 * Checkout prices come from the "Free Nhím Keycap Clicker" discount in
 * Shopify admin, whose keycap-gift function (shopify-app/) has the same
 * windows and thresholds in its `promo` mode. Change both together.
 *
 * Before the sale starts, a preview link turns it on for one browser only
 * (see blackFriday.server.ts), so the cart and checkout can be checked
 * without the live site changing.
 */

type SaleWindow = {starts: number; ends: number};

function saleWindow(starts: string, ends: string): SaleWindow {
  return {starts: Date.parse(starts), ends: Date.parse(ends)};
}

/**
 * Sale window per country, as UTC instants. Checkout uses the shipping
 * country; the storefront only knows the visitor's country (from their IP),
 * which is the same for nearly everyone. Countries spanning several time
 * zones start at midnight in their easternmost zone and end at midnight in
 * their westernmost, so nobody loses sale hours. Mirrors WINDOW_BY_COUNTRY
 * in shopify-app/extensions/keycap-gift/src/config.js.
 */
const UTC7 = saleWindow('2026-11-26T17:00:00Z', '2026-11-30T17:00:00Z');
const UTC8 = saleWindow('2026-11-26T16:00:00Z', '2026-11-30T16:00:00Z');
const UTC9 = saleWindow('2026-11-26T15:00:00Z', '2026-11-30T15:00:00Z');
const INDONESIA = saleWindow('2026-11-26T15:00:00Z', '2026-11-30T17:00:00Z');
const AUSTRALIA = saleWindow('2026-11-26T13:00:00Z', '2026-11-30T16:00:00Z');
const NEW_ZEALAND = saleWindow('2026-11-26T11:00:00Z', '2026-11-30T11:00:00Z');
const CET = saleWindow('2026-11-26T23:00:00Z', '2026-11-30T23:00:00Z');
const UK = saleWindow('2026-11-27T00:00:00Z', '2026-12-01T00:00:00Z');
const CANADA = saleWindow('2026-11-27T03:30:00Z', '2026-12-01T08:00:00Z');
const UNITED_STATES = saleWindow('2026-11-27T05:00:00Z', '2026-12-01T10:00:00Z');

const WINDOW_BY_COUNTRY: Record<string, SaleWindow> = {
  VN: UTC7,
  TH: UTC7,
  SG: UTC8,
  MY: UTC8,
  HK: UTC8,
  TW: UTC8,
  PH: UTC8,
  KR: UTC9,
  JP: UTC9,
  ID: INDONESIA,
  AU: AUSTRALIA,
  NZ: NEW_ZEALAND,
  DE: CET,
  FR: CET,
  NL: CET,
  GB: UK,
  CA: CANADA,
  US: UNITED_STATES,
};

/** Vietnam time (the store's timezone) for anywhere not listed. */
export function blackFridayWindow(country?: string | null): SaleWindow {
  return WINDOW_BY_COUNTRY[(country ?? '').toUpperCase()] ?? UTC7;
}

/**
 * Free shipping threshold per cart currency during the sale, on the
 * subtotal the customer pays for (the free gift is 0). Vietnam ships free
 * on every order.
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
