import type {CartReturn, HydrogenCart} from '@shopify/hydrogen';

/**
 * Free Nhím Keycap Clicker gift.
 *
 * Pricing is handled by the "Free Nhím Keycap Clicker" automatic discount in
 * Shopify admin, backed by the discount function in `shopify-app/` (see
 * shopify-app/extensions/keycap-gift). It zeroes exactly one keycap unit
 * once the rest of the cart qualifies and never touches the other lines, so
 * cart lines keep their ids and are not split. (The Buy X get Y discount it
 * replaced allocated the "buy" units too, which split lines on every
 * quantity change.)
 *
 * Shopify only zeroes a keycap that is already in the cart, so this module
 * puts it there: when the cart earns the gift and has no keycap yet, one is
 * added with a hidden `_gift` attribute, and it is taken out again if the
 * cart drops below the threshold. A keycap the shopper added themselves is
 * left alone; the discount makes that one free instead.
 *
 * The threshold is measured on everything in the cart *except* keycaps,
 * exactly as the function does. `KEYCAP_GIFT_THRESHOLD_VND` mirrors the
 * function's default config; change both together.
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
  cost?: {
    totalAmount?: {amount?: string | null} | null;
    amountPerQuantity?: {amount?: string | null} | null;
  } | null;
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
 * A line's cost, as unit price x quantity. `cost.totalAmount` is not used
 * when a unit price is known because it goes stale in the optimistic cart:
 * `useOptimisticCart` changes `quantity` on a pending quantity update (and
 * on a repeat add of the same variant) but leaves `cost` as the server last
 * returned it. Only the VND rule compares an amount against a threshold, so
 * that stale total made the gift wait for the server round trip in Vietnam
 * while it appeared instantly elsewhere. Pending adds of a new variant have
 * no `cost` at all, only the variant's price.
 */
function lineAmount(line: CartLineLike) {
  const quantity = line.quantity ?? 1;
  const unit =
    line.cost?.amountPerQuantity?.amount ?? line.merchandise?.price?.amount;
  if (unit != null) return Number(unit) * quantity;
  return Number(line.cost?.totalAmount?.amount ?? 0);
}

/** What Shopify measures the discount against: the cart without keycaps. */
export function keycapQualifyingAmount(cart: KeycapCartLike) {
  return (cart.lines?.nodes ?? [])
    .filter((line) => !isKeycapLine(line))
    .reduce((sum, line) => sum + lineAmount(line), 0);
}

/**
 * `fallbackCurrency` is the visitor's market currency, used when the cart
 * has no cost yet. That is the case for the optimistic cart on the first
 * add to an empty cart: Hydrogen builds it from scratch with lines only.
 * Without it Vietnam fell through to the "any amount" rule and the gift
 * flashed on for one round trip before the real cart took it away.
 */
export function keycapGiftEarned(
  cart: KeycapCartLike,
  fallbackCurrency?: string | null,
) {
  const currency = cart.cost?.subtotalAmount?.currencyCode ?? fallbackCurrency;
  const amount = keycapQualifyingAmount(cart);
  return currency === 'VND' ? amount >= KEYCAP_GIFT_THRESHOLD_VND : amount > 0;
}

/**
 * Add or remove the auto gift line so the cart matches what it has earned,
 * and collapse duplicate gift lines back to one. Duplicates happen when two
 * requests sync the same cart at once (each sees "no keycap yet" and adds
 * one); nothing serialises requests across Oxygen workers, so the next sync
 * repairs it instead. Mutations return the full cart fragment, so the result
 * is the updated cart with no extra read. Returns `current` when nothing
 * changed.
 */
export async function syncKeycapGift(
  cart: HydrogenCart,
  current: CartReturn,
): Promise<CartReturn> {
  const lines = current.lines?.nodes ?? [];
  const earned = keycapGiftEarned(current);
  const giftLines = lines.filter(isKeycapGiftLine);
  const [giftLine, ...extraGiftLines] = giftLines;

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
    result = await cart.removeLines(giftLines.map((line) => line.id));
  } else if (extraGiftLines.length) {
    result = await cart.removeLines(extraGiftLines.map((line) => line.id));
  } else if (giftLine && (giftLine.quantity ?? 1) > 1) {
    result = await cart.updateLines([{id: giftLine.id, quantity: 1}]);
  } else {
    return current;
  }
  if (result.userErrors?.length) {
    console.error('keycap gift sync failed', result.userErrors);
    return current;
  }
  const next = result.cart?.lines
    ? result.cart
    : ((await cart.get()) ?? current);
  // A removal of extras may leave a gift line still above quantity 1.
  return extraGiftLines.length ? syncKeycapGift(cart, next) : next;
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
  // The keycap variant is loaded in the visitor's market, so its currency
  // stands in for the cart's until the cart has a cost of its own.
  const currencyCode =
    cart.cost?.subtotalAmount?.currencyCode ??
    keycapVariant?.price.currencyCode ??
    'USD';
  const earned = keycapGiftEarned(cart, currencyCode);
  const giftLine = lines.find(isKeycapGiftLine);

  if (earned && !lines.some(isKeycapLine) && keycapVariant?.availableForSale) {
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
