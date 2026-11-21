/**
 * Configuration, from the discount's `$app.function-configuration` metafield
 * over the defaults below.
 *
 * The store is not on Shopify Plus, so no new discount can be activated on a
 * custom app's function; the one "Free Nhím Keycap Clicker" discount (made
 * before that rule) carries everything. Its everyday gift uses
 * `minimumByCurrency`. Adding `promo` to its metafield, plus the shipping
 * class on the discount, turns on the sale rules while the sale runs (or
 * for a preview cart): the gift on every order and free shipping per
 * currency. Outside that, the everyday gift is unchanged and there is no
 * shipping discount.
 *
 * The storefront mirrors these numbers in app/lib/keycapGift.ts and
 * app/lib/blackFriday.ts in the Hydrogen repo; change them together.
 */
const DEFAULT_CONFIG = {
  giftProductHandle: 'nhim-keycap-clicker',
  /** Qualifying subtotal needed, per cart currency. Any amount above zero elsewhere. */
  minimumByCurrency: {VND: 800000},
  promo: null,
};

/**
 * The sale window itself is in the input queries (`blackFriday:
 * dateTimeBetween(...)`, store timezone), since a function has no clock.
 */
const PROMO_DEFAULTS = {
  /** Gift minimum during the sale: none anywhere. */
  giftMinimumByCurrency: {},
  /** Free shipping threshold per cart currency; a missing currency gets none. */
  freeShippingMinimumByCurrency: {
    VND: 0,
    KRW: 100000,
    JPY: 10000,
    AUD: 100,
    USD: 100,
  },
  /**
   * Carts stamped with this `_bf_preview` attribute get the sale before it
   * starts. Kept only in the metafield: the repo is public.
   */
  previewToken: null,
};

export function readConfig(input) {
  const config = {
    ...DEFAULT_CONFIG,
    ...(input.discount.metafield?.jsonValue ?? {}),
  };
  if (config.promo) config.promo = {...PROMO_DEFAULTS, ...config.promo};
  return config;
}

export function promoActive(input, promo) {
  if (input.shop.localTime.blackFriday) return true;
  return Boolean(
    promo.previewToken && input.cart.bfPreview?.value === promo.previewToken,
  );
}

export function isGiftLine(line, config) {
  return (
    line.merchandise.__typename === 'ProductVariant' &&
    line.merchandise.product.handle === config.giftProductHandle
  );
}

/** Thresholds are measured on everything except the gift product. */
export function qualifyingAmount(lines, config) {
  return lines
    .filter((line) => !isGiftLine(line, config))
    .reduce((sum, line) => sum + Number(line.cost.subtotalAmount.amount), 0);
}
