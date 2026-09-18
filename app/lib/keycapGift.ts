import type {CartReturn, HydrogenCart} from '@shopify/hydrogen';

/**
 * Free Nhím Keycap Clicker gift.
 *
 * Pricing is handled by two "Free Nhím Keycap Clicker" Buy X get Y automatic
 * discounts in Shopify admin (one for Vietnam with a minimum, one for every
 * other market with none). Shopify only zeroes a keycap that is already in
 * the cart, so this module puts it there: when the cart earns the gift and
 * has no keycap yet, one is added with a hidden `_gift` attribute, and it is
 * taken out again if the cart drops below the threshold. A keycap the
 * shopper added themselves is left alone; Shopify makes that one free.
 *
 * Shopify never counts the gift towards its own "buy" requirement, so the
 * threshold is measured on everything in the cart *except* keycaps. The
 * Vietnam discount stores its minimum as USD 29.90, which Shopify converts
 * to roughly 800.000 VND; keep the two in step when changing either.
 */
export const KEYCAP_HANDLE = 'nhim-keycap-clicker';
export const KEYCAP_GIFT_THRESHOLD_VND = 800_000;
const KEYCAP_VARIANT_ID = 'gid://shopify/ProductVariant/45790312038469';
/** Underscore-prefixed attributes are hidden from the shopper at checkout. */
const GIFT_ATTRIBUTE = {key: '_gift', value: 'keycap'};

// Structural types so both the loader cart and the optimistic cart fit.
type CartLineLike = {
  id: string;
  attributes?: Array<{key: string; value?: string | null}> | null;
  cost?: {totalAmount?: {amount?: string | null} | null} | null;
  merchandise?: {product?: {handle?: string | null} | null} | null;
};
export type KeycapCartLike = {
  lines?: {nodes: CartLineLike[]} | null;
  cost?: {subtotalAmount?: {currencyCode?: string | null} | null} | null;
};

export function isKeycapLine(line: CartLineLike) {
  return line.merchandise?.product?.handle === KEYCAP_HANDLE;
}

export function isKeycapGiftLine(line: CartLineLike) {
  return (
    isKeycapLine(line) &&
    line.attributes?.some(
      (a) => a.key === GIFT_ATTRIBUTE.key && a.value === GIFT_ATTRIBUTE.value,
    )
  );
}

/** What Shopify measures the discount against: the cart without keycaps. */
export function keycapQualifyingAmount(cart: KeycapCartLike) {
  return (cart.lines?.nodes ?? [])
    .filter((line) => !isKeycapLine(line))
    .reduce(
      (sum, line) => sum + Number(line.cost?.totalAmount?.amount ?? 0),
      0,
    );
}

export function keycapGiftEarned(cart: KeycapCartLike) {
  const currency = cart.cost?.subtotalAmount?.currencyCode;
  const amount = keycapQualifyingAmount(cart);
  return currency === 'VND' ? amount >= KEYCAP_GIFT_THRESHOLD_VND : amount > 0;
}

/**
 * Add or remove the auto gift line so the cart matches what it has earned.
 * Returns the re-read cart when something changed, otherwise `current`.
 */
export async function syncKeycapGift(
  cart: HydrogenCart,
  current: CartReturn,
): Promise<CartReturn> {
  const lines = current.lines?.nodes ?? [];
  const earned = keycapGiftEarned(current);
  const giftLine = lines.find(isKeycapGiftLine);

  if (earned && !lines.some(isKeycapLine)) {
    const result = await cart.addLines([
      {
        merchandiseId: KEYCAP_VARIANT_ID,
        quantity: 1,
        attributes: [GIFT_ATTRIBUTE],
      },
    ]);
    if (result.userErrors?.length) {
      console.error('keycap gift add failed', result.userErrors);
      return current;
    }
  } else if (!earned && giftLine) {
    const result = await cart.removeLines([giftLine.id]);
    if (result.userErrors?.length) {
      console.error('keycap gift remove failed', result.userErrors);
      return current;
    }
  } else {
    return current;
  }
  // Mutations return the minimal cart fragment, so re-read the full cart.
  return (await cart.get()) ?? current;
}
