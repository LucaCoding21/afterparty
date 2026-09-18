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
const OPTIMISTIC_GIFT_LINE_ID = 'optimistic-keycap-gift';

// Structural types so the loader cart, the optimistic cart and a mutation
// result all fit.
type CartLineLike = {
  id: string;
  quantity?: number;
  attributes?: Array<{key: string; value?: string | null}> | null;
  cost?: {totalAmount?: {amount?: string | null} | null} | null;
  merchandise?: {
    price?: {amount?: string | null} | null;
    product?: {handle?: string | null} | null;
  } | null;
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

/**
 * A line's cost. Optimistic lines (pending adds) have no `cost` yet, only
 * the variant's price, so fall back to price x quantity for them.
 */
function lineAmount(line: CartLineLike) {
  const cost = line.cost?.totalAmount?.amount;
  if (cost != null) return Number(cost);
  return Number(line.merchandise?.price?.amount ?? 0) * (line.quantity ?? 1);
}

/** What Shopify measures the discount against: the cart without keycaps. */
export function keycapQualifyingAmount(cart: KeycapCartLike) {
  return (cart.lines?.nodes ?? [])
    .filter((line) => !isKeycapLine(line))
    .reduce((sum, line) => sum + lineAmount(line), 0);
}

export function keycapGiftEarned(cart: KeycapCartLike) {
  const currency = cart.cost?.subtotalAmount?.currencyCode;
  const amount = keycapQualifyingAmount(cart);
  return currency === 'VND' ? amount >= KEYCAP_GIFT_THRESHOLD_VND : amount > 0;
}

/**
 * Add or remove the auto gift line so the cart matches what it has earned.
 * Mutations return the full cart fragment, so the result is the updated
 * cart with no extra read. Returns `current` when nothing changed.
 */
export async function syncKeycapGift(
  cart: HydrogenCart,
  current: CartReturn,
): Promise<CartReturn> {
  const lines = current.lines?.nodes ?? [];
  const earned = keycapGiftEarned(current);
  const giftLine = lines.find(isKeycapGiftLine);

  let result;
  if (earned && !lines.some(isKeycapLine)) {
    result = await cart.addLines([
      {
        merchandiseId: KEYCAP_VARIANT_ID,
        quantity: 1,
        attributes: [GIFT_ATTRIBUTE],
      },
    ]);
  } else if (!earned && giftLine) {
    result = await cart.removeLines([giftLine.id]);
  } else {
    return current;
  }
  if (result.userErrors?.length) {
    console.error('keycap gift sync failed', result.userErrors);
    return current;
  }
  return result.cart?.lines ? result.cart : ((await cart.get()) ?? current);
}

/** Keycap variant as loaded by the root loader, for the optimistic line. */
export type KeycapVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  image?: {
    id?: string | null;
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
  price: {amount: string; currencyCode: string};
  selectedOptions: Array<{name: string; value: string}>;
  product: {id: string; handle: string; title: string; vendor: string};
};

/**
 * Client-side counterpart of `syncKeycapGift` for the optimistic cart. While
 * a cart change is pending, show the gift line the server is about to add
 * (or hide the one it is about to remove) so the keycap appears together
 * with the item instead of a round trip later. Only applied while the cart
 * is optimistic; once the server answers, its state wins.
 */
export function withOptimisticKeycapGift<
  T extends
    | (KeycapCartLike & {isOptimistic?: boolean; totalQuantity?: number})
    | null
    | undefined,
>(cart: T, keycapVariant: KeycapVariant | null | undefined): T {
  if (!cart?.isOptimistic || !cart.lines) return cart;
  const lines = cart.lines.nodes;
  const earned = keycapGiftEarned(cart);
  const giftLine = lines.find(isKeycapGiftLine);

  if (earned && !lines.some(isKeycapLine) && keycapVariant?.availableForSale) {
    const currencyCode = cart.cost?.subtotalAmount?.currencyCode ?? 'USD';
    const gift = {
      id: OPTIMISTIC_GIFT_LINE_ID,
      quantity: 1,
      isOptimistic: true,
      attributes: [GIFT_ATTRIBUTE],
      cost: {
        totalAmount: {amount: '0.0', currencyCode},
        amountPerQuantity: {amount: '0.0', currencyCode},
      },
      merchandise: keycapVariant,
    } as unknown as CartLineLike;
    return {
      ...cart,
      lines: {...cart.lines, nodes: [...lines, gift]},
      totalQuantity: (cart.totalQuantity ?? 0) + 1,
    } as T;
  }
  if (!earned && giftLine) {
    return {
      ...cart,
      lines: {...cart.lines, nodes: lines.filter((l) => l !== giftLine)},
      totalQuantity: Math.max(0, (cart.totalQuantity ?? 0) - 1),
    } as T;
  }
  return cart;
}

export const KEYCAP_VARIANT_QUERY = `#graphql
  query KeycapVariant($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    product(handle: "nhim-keycap-clicker") {
      variants(first: 1) {
        nodes {
          id
          title
          availableForSale
          image { id url altText width height }
          price { amount currencyCode }
          selectedOptions { name value }
          product { id handle title vendor }
        }
      }
    }
  }
` as const;
