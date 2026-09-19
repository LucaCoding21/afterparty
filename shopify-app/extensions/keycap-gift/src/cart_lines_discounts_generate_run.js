import {
  DiscountClass,
  ProductDiscountSelectionStrategy,
} from '../generated/api';

/**
 * Free Nhím Keycap Clicker.
 *
 * Makes exactly one keycap unit free once the rest of the cart qualifies.
 * The discount only ever targets the keycap line, never the items that earn
 * it, so Shopify has no "buy" side to allocate: cart lines are not split,
 * line ids stay stable and checkout shows no discount tag on the other
 * items. (The Buy X get Y discount this replaces did all three.)
 *
 * The storefront (app/lib/keycapGift.ts in the Hydrogen repo) adds the
 * keycap line to the cart with a hidden `_gift` attribute and mirrors the
 * same threshold in its cart note; keep the two in step.
 */

/** Overridable through the discount's `$app.function-configuration` metafield. */
const DEFAULT_CONFIG = {
  giftProductHandle: 'nhim-keycap-clicker',
  /** Qualifying subtotal needed, per cart currency. Any amount above zero elsewhere. */
  minimumByCurrency: {VND: 800000},
};

/**
 * @typedef {import("../generated/api").CartInput} RunInput
 * @typedef {import("../generated/api").CartLinesDiscountsGenerateRunResult} CartLinesDiscountsGenerateRunResult
 */

/**
 * @param {RunInput} input
 * @returns {CartLinesDiscountsGenerateRunResult}
 */
export function cartLinesDiscountsGenerateRun(input) {
  if (!input.discount.discountClasses.includes(DiscountClass.Product)) {
    return {operations: []};
  }

  const config = {
    ...DEFAULT_CONFIG,
    ...(input.discount.metafield?.jsonValue ?? {}),
  };

  const isKeycap = (line) =>
    line.merchandise.__typename === 'ProductVariant' &&
    line.merchandise.product.handle === config.giftProductHandle;

  const keycapLines = input.cart.lines.filter(isKeycap);
  if (!keycapLines.length) {
    return {operations: []};
  }

  // Shopify measures the gift against everything except the gift itself.
  const qualifying = input.cart.lines
    .filter((line) => !isKeycap(line))
    .reduce((sum, line) => sum + Number(line.cost.subtotalAmount.amount), 0);
  const currency = input.cart.cost.subtotalAmount.currencyCode;
  const minimum = config.minimumByCurrency[currency] ?? 0;
  if (qualifying <= 0 || qualifying < minimum) {
    return {operations: []};
  }

  // Prefer the line the storefront added as the gift; a keycap the shopper
  // added themselves gets the discount when there is no gift line.
  const target =
    keycapLines.find((line) => line.gift?.value === 'keycap') ?? keycapLines[0];

  return {
    operations: [
      {
        productDiscountsAdd: {
          selectionStrategy: ProductDiscountSelectionStrategy.First,
          candidates: [
            {
              message: 'Free Nhím Keycap Clicker',
              targets: [{cartLine: {id: target.id, quantity: 1}}],
              value: {percentage: {value: 100}},
            },
          ],
        },
      },
    ],
  };
}
