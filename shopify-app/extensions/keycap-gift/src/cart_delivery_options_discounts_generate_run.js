import {DeliveryDiscountSelectionStrategy, DiscountClass} from '../generated/api';
import {isGiftLine, promoActive, qualifyingAmount, readConfig} from './config';

/**
 * Black Friday free shipping.
 *
 * Needs the shipping class on the discount and a `promo` config (see
 * ./config.js), and acts only during the sale (in the customer's local
 * time) or for a preview cart. It makes every delivery option free once
 * the subtotal reaches the threshold for the checkout currency. Thresholds
 * are in that currency, so they are exact per market (a native discount
 * minimum would be converted from the shop's USD).
 */

/**
 * @typedef {import("../generated/api").DeliveryInput} DeliveryInput
 * @typedef {import("../generated/api").CartDeliveryOptionsDiscountsGenerateRunResult} CartDeliveryOptionsDiscountsGenerateRunResult
 */

/**
 * @param {DeliveryInput} input
 * @returns {CartDeliveryOptionsDiscountsGenerateRunResult}
 */
export function cartDeliveryOptionsDiscountsGenerateRun(input) {
  if (!input.discount.discountClasses.includes(DiscountClass.Shipping)) {
    return {operations: []};
  }

  const config = readConfig(input);
  if (!config.promo || !promoActive(input, config.promo)) {
    return {operations: []};
  }

  const currency = input.cart.cost.subtotalAmount.currencyCode;
  const minimum = config.promo.freeShippingMinimumByCurrency[currency];
  if (minimum == null) return {operations: []};
  if (paidSubtotal(input, config, currency) < minimum) {
    return {operations: []};
  }

  const groups = input.cart.deliveryGroups;
  if (!groups.length) return {operations: []};

  return {
    operations: [
      {
        deliveryDiscountsAdd: {
          selectionStrategy: DeliveryDiscountSelectionStrategy.All,
          candidates: [
            {
              message: 'Free shipping',
              targets: groups.map((group) => ({
                deliveryGroup: {id: group.id},
              })),
              value: {percentage: {value: 100}},
            },
          ],
        },
      },
    ],
  };
}

/**
 * The subtotal the customer pays for: every line, keycaps they bought
 * included, minus the one keycap the gift makes free. Line costs here are
 * before discounts, so the gift is taken off by hand, by the same rule the
 * cart-lines target uses to give it.
 */
function paidSubtotal(input, config, currency) {
  const lines = input.cart.lines;
  const total = lines.reduce(
    (sum, line) => sum + Number(line.cost.subtotalAmount.amount),
    0,
  );
  const keycapLine = lines.find((line) => isGiftLine(line, config));
  const qualifying = qualifyingAmount(lines, config);
  const giftMinimum = config.promo.giftMinimumByCurrency[currency] ?? 0;
  if (!keycapLine || qualifying <= 0 || qualifying < giftMinimum) return total;
  const unitPrice =
    Number(keycapLine.cost.subtotalAmount.amount) / keycapLine.quantity;
  return total - unitPrice;
}
